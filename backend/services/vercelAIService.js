const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const AI_BASE_URL = (process.env.AI_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/+$/, "");

const REQUIRED_FIELDS = [
  "nom", "email",
  "ville_depart", "ville_arrivee",
  "nombre_passagers", "date_depart", "type_trajet",
];

const FIELD_LABELS = {
  nom: "nom ou entreprise",
  email: "adresse e-mail",
  telephone: "numéro de téléphone",
  ville_depart: "ville de départ",
  ville_arrivee: "ville d'arrivée",
  nombre_passagers: "nombre de passagers",
  date_depart: "date de départ",
  type_trajet: "type de trajet (aller-simple ou aller-retour)",
  date_retour: "date de retour",
};

const VALID_FIELDS = new Set([...REQUIRED_FIELDS, "date_retour", "telephone"]);

// Aliases pour corriger les noms de champs que l'IA donne parfois
const FIELD_ALIASES = {
  depart: "ville_depart",
  arrivee: "ville_arrivee",
  destination: "ville_arrivee",
  ville_destination: "ville_arrivee",
  passagers: "nombre_passagers",
  nb_passagers: "nombre_passagers",
  nombre_de_passagers: "nombre_passagers",
  voyageurs: "nombre_passagers",
  date: "date_depart",
  date_aller: "date_depart",
  trajet: "type_trajet",
  name: "nom",
  tel: "telephone",
  phone: "telephone",
};

function normalizeAnswers(raw) {
  if (!raw || typeof raw !== "object") return {};
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = key.toLowerCase().trim().replace(/\s+/g, "_");
    const canonical = VALID_FIELDS.has(k) ? k : (FIELD_ALIASES[k] || null);
    if (canonical && value !== undefined && value !== null && String(value).trim() !== "") {
      result[canonical] = String(value).trim();
    }
  }
  return result;
}

function computeMissingFields(answers) {
  const fields = [...REQUIRED_FIELDS];
  if (String(answers.type_trajet || "").toLowerCase().includes("retour")) {
    fields.push("date_retour");
  }
  return fields.filter((f) => !String(answers[f] || "").trim());
}

function describeCollected(answers) {
  return REQUIRED_FIELDS.concat(["date_retour", "telephone"])
    .filter((f) => String(answers[f] || "").trim())
    .map((f) => `${FIELD_LABELS[f]}: ${answers[f]}`)
    .join(", ") || "aucune";
}

function describeMissing(fields) {
  return fields.map((f) => FIELD_LABELS[f] || f).join(", ") || "aucun";
}

// Détection double devis par regex — avant appel IA
const DOUBLE_DEVIS_PATTERNS = [
  /\b2\s+devis\b/i,
  /\bdeux\s+devis\b/i,
  /\bdouble\s+devis\b/i,
  /\bplusieurs\s+devis\b/i,
  /\bun\s+(autre|deuxi[eè]me|second)\s+devis\b/i,
  /\bun\s+devis\b.{0,80}\bun\s+(autre|deuxi[eè]me|second)\b/i,
];

function detectDoubleDevis(message) {
  return DOUBLE_DEVIS_PATTERNS.some((p) => p.test(message));
}

// Liste de villes étrangères connues — fallback si l'IA ne flag pas
const FOREIGN_CITIES = new Set([
  "london", "londres", "madrid", "bruxelles", "brussels", "berlin", "rome",
  "roma", "amsterdam", "geneve", "genève", "zurich", "zürich", "vienne",
  "wien", "prague", "varsovie", "warsaw", "moscou", "moscow", "lisbonne",
  "lisbon", "barcelone", "barcelona", "milan", "milano", "budapest",
  "bucarest", "bucharest", "athenes", "athènes", "athens", "stockholm",
  "copenhague", "copenhagen", "oslo", "helsinki", "dublin", "edinburgh",
  "edimbourg", "manchester", "birmingham", "new york", "los angeles",
  "toronto", "montréal", "montreal", "dubai", "doha", "singapour",
  "singapore", "tokyo", "pékin", "pekin", "beijing", "shanghai",
  "hong kong", "sydney", "melbourne", "tunis", "alger", "algiers",
  "casablanca", "marrakech", "le caire", "cairo", "lagos", "nairobi",
]);

function hasForeignCity(answers) {
  return [answers.ville_depart, answers.ville_arrivee]
    .filter(Boolean)
    .some((city) => FOREIGN_CITIES.has(city.toLowerCase().trim()));
}

// Extrait email et téléphone par regex (patterns fiables à 100%)
function extractEmailPhone(message) {
  const result = {};
  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0].trim();
  const phoneMatch = message.match(/\+?[\d][\d\s.\-()]{7,}\d/);
  if (phoneMatch) result.telephone = phoneMatch[0].replace(/\s+/g, " ").trim();
  return result;
}

async function generateChatReply({ message, context, answers = {}, history = [] }) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VERCEL_AI_API_KEY || process.env.OPENAI_API_KEY || "").trim();

  if (!apiKey) {
    return {
      reply: "Pour activer l'assistant, ajoutez VERCEL_AI_API_KEY dans backend/.env.",
      answers: {},
      missingFields: computeMissingFields(answers),
    };
  }

  // Détection fiable du double devis — court-circuit avant l'IA
  if (detectDoubleDevis(message)) {
    return {
      reply: "Pour des demandes multiples, nos conseillers peuvent vous accompagner directement.",
      answers: {},
      missingFields: computeMissingFields(answers),
      needsCommercial: true,
      citiesNotInFrance: false,
    };
  }

  const missingFields = computeMissingFields(answers);
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayISO = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const tomorrowISO = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
  const dayAfterISO = new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0];

  const conversationHistory = Array.isArray(history)
    ? history
        .filter((e) => e && typeof e.content === "string")
        .map((e) => ({ role: e.role === "assistant" ? "assistant" : "user", content: e.content }))
    : [];

  const systemPrompt = `Tu es l'assistant NeoTravel, service de transport de groupe en autocar.

MISSION : extraire TOUTES les informations du message client et générer une réponse qui demande uniquement ce qui manque encore.

INFORMATIONS DÉJÀ CONNUES : ${describeCollected(answers)}
INFORMATIONS MANQUANTES : ${describeMissing(missingFields)}

EXTRACTION — noms de champs EXACTS à utiliser dans "answers" :
  "nom"              → prénom/nom du client OU nom de l'entreprise/organisation
  "email"            → adresse e-mail
  "telephone"        → numéro de téléphone (FACULTATIF — ne pas le demander si non mentionné)
  "ville_depart"     → ville ou lieu de départ
  "ville_arrivee"    → ville ou lieu d'arrivée
  "nombre_passagers" → nombre total de passagers (entier, en chiffres)
  "date_depart"      → date de départ au format YYYY-MM-DD
  "type_trajet"      → exactement "aller-simple" ou "aller-retour"
  "date_retour"      → date de retour YYYY-MM-DD (si aller-retour)

DATE D'AUJOURD'HUI : ${todayISO}
- "demain" → ${tomorrowISO}
- "après-demain" → ${dayAfterISO}
- "dans N jours" → calcule la date à partir d'aujourd'hui
- Pas d'année précisée → utilise ${currentYear}

RÈGLES D'EXTRACTION :
- Extrais TOUT ce qui est mentionné dans le message, même implicitement.
- "nous serons 32", "groupe de 15", "30 au total" → nombre_passagers
- "retour le 5", "je reviens le 20" → date_retour (déduis le mois depuis la date de départ si non précisé)
- "chez Apple", "pour l'entreprise Renault", "je travaille chez X" → nom = X
- "avec retour", "aller-retour", "on revient le..." → type_trajet = "aller-retour"
- "aller simple", "sans retour" → type_trajet = "aller-simple"
- Ne mets dans "answers" QUE les champs que tu as vraiment extraits du message.

RÈGLES DE RÉPONSE — ABSOLUES :
- JAMAIS de validation : interdit de demander "c'est bien ça ?", "c'est correct ?", "vous confirmez ?", "j'ai bien compris ?"
- Ne récapitule pas ce que le client vient de dire — il le voit dans le résumé à droite.
- Pose UNE SEULE question ouverte qui regroupe tout ce qui manque encore.
- Transport TOUJOURS en autocar. Jamais d'autre service.
- Français direct et naturel. Pas de "Parfait !", "Super !", "Excellent !".

VILLES HORS FRANCE : Dès qu'une ville est extraite pour ville_depart ou ville_arrivee, vérifie si elle est bien en France (métropole ou outre-mer). Si l'une d'elles est à l'étranger, ajoute "cities_not_in_france":true et explique dans "reply" qu'un conseiller accompagne les trajets internationaux.

DOUBLE DEVIS : Si le client demande 2 devis distincts simultanément (ex: "un devis pour Paris et un autre pour Lyon", "je veux deux devis", "deux trajets différents"), ajoute "needs_commercial":true et explique dans "reply" qu'un conseiller peut gérer les demandes multiples.

EXEMPLES :
Client : "je pars de Nantes vers Paris le 19 octobre, retour le 29, nous serons 32, pour l'entreprise Apple"
→ {"reply":"Pour finaliser votre devis, j'aurais besoin de votre adresse e-mail.","answers":{"ville_depart":"Nantes","ville_arrivee":"Paris","date_depart":"${currentYear}-10-19","date_retour":"${currentYear}-10-29","nombre_passagers":"32","type_trajet":"aller-retour","nom":"Apple"}}

Client : "je veux partir demain de Lyon vers Marseille"
→ {"reply":"Combien de passagers et quel type de trajet (aller simple ou aller-retour) ?","answers":{"ville_depart":"Lyon","ville_arrivee":"Marseille","date_depart":"${tomorrowISO}"}}

Client : "je veux partir de Paris vers Londres le 10 juillet avec 25 personnes"
→ {"reply":"Ce trajet est à l'international. Nos conseillers peuvent vous proposer une solution adaptée.","answers":{"ville_depart":"Paris","ville_arrivee":"Londres","date_depart":"${currentYear}-07-10","nombre_passagers":"25"},"cities_not_in_france":true}

FORMAT DE SORTIE : JSON pur, sans balises markdown.
{"reply":"...","answers":{...}}
Avec villes étrangères : {"reply":"...","answers":{...},"cities_not_in_france":true}`;

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: (process.env.AI_MODEL || process.env.VERCEL_AI_MODEL || "anthropic/claude-3-5-haiku-20241022").trim(),
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway ${response.status}:`, errorText);
      throw new Error(`Erreur IA (${response.status}) — vérifiez la clé dans backend/.env`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    if (!rawContent) throw new Error("L'IA n'a retourné aucun contenu.");

    // Extraire le JSON de la réponse (au cas où l'IA ajoute du texte autour)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : null;

    let reply = rawContent;
    let aiAnswers = {};
    let needsCommercial = false;
    let citiesNotInFrance = false;

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.reply) reply = parsed.reply;
        aiAnswers = parsed.answers || {};
        if (parsed.needs_commercial === true) needsCommercial = true;
        if (parsed.cities_not_in_france === true) citiesNotInFrance = true;
      } catch {
        // JSON invalide : on garde le texte brut comme reply
      }
    }

    // Normaliser les noms de champs de l'IA
    const normalizedAI = normalizeAnswers(aiAnswers);

    // Regex fiable pour email/téléphone — complète ce que l'IA a extrait
    const regexSupplement = extractEmailPhone(message);

    // Fusion : regex en priorité pour email/tel (100% fiable), IA pour tout le reste
    const newAnswers = { ...normalizedAI, ...regexSupplement };

    // Calcul des champs manquants depuis l'état fusionné réel
    const mergedAnswers = { ...answers, ...newAnswers };
    const finalMissing = computeMissingFields(mergedAnswers);

    // Fallback : vérification des villes étrangères même si l'IA n'a pas flaggé
    if (!citiesNotInFrance && hasForeignCity(mergedAnswers)) {
      citiesNotInFrance = true;
    }

    return { reply, answers: newAnswers, missingFields: finalMissing, needsCommercial, citiesNotInFrance };
  } catch (error) {
    console.error("Vercel AI Service Error:", error.message);
    throw error;
  }
}

module.exports = { generateChatReply };
