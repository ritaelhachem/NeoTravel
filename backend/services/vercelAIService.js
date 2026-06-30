const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const AI_BASE_URL = (process.env.AI_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/+$/, "");

const REQUIRED_FIELDS = [
  "nom", "email", "telephone",
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

const VALID_FIELDS = new Set([...REQUIRED_FIELDS, "date_retour"]);

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
  return REQUIRED_FIELDS.concat(["date_retour"])
    .filter((f) => String(answers[f] || "").trim())
    .map((f) => `${FIELD_LABELS[f]}: ${answers[f]}`)
    .join(", ") || "aucune";
}

function describeMissing(fields) {
  return fields.map((f) => FIELD_LABELS[f] || f).join(", ") || "aucun";
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

  const missingFields = computeMissingFields(answers);
  const currentYear = new Date().getFullYear();

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
  "telephone"        → numéro de téléphone
  "ville_depart"     → ville ou lieu de départ
  "ville_arrivee"    → ville ou lieu d'arrivée
  "nombre_passagers" → nombre total de passagers (entier, en chiffres)
  "date_depart"      → date de départ au format YYYY-MM-DD
  "type_trajet"      → exactement "aller-simple" ou "aller-retour"
  "date_retour"      → date de retour YYYY-MM-DD (si aller-retour)

RÈGLES D'EXTRACTION :
- Extrais TOUT ce qui est mentionné dans le message, même implicitement.
- "nous serons 32", "groupe de 15", "30 au total" → nombre_passagers
- "retour le 5", "je reviens le 20" → date_retour (déduis le mois depuis la date de départ si non précisé)
- "chez Apple", "pour l'entreprise Renault", "je travaille chez X" → nom = X
- Pas d'année → utilise ${currentYear}
- "avec retour", "aller-retour", "on revient le..." → type_trajet = "aller-retour"
- "aller simple", "sans retour" → type_trajet = "aller-simple"
- Ne mets dans "answers" QUE les champs que tu as vraiment extraits du message.

RÈGLES DE RÉPONSE — ABSOLUES :
- JAMAIS de validation : interdit de demander "c'est bien ça ?", "c'est correct ?", "vous confirmez ?", "j'ai bien compris ?"
- Ne récapitule pas ce que le client vient de dire — il le voit dans le résumé à droite.
- Pose UNE SEULE question ouverte qui regroupe tout ce qui manque encore.
- Transport TOUJOURS en autocar. Jamais d'autre service.
- Français direct et naturel. Pas de "Parfait !", "Super !", "Excellent !".

EXEMPLE :
Client : "je pars de Nantes vers Paris le 19 octobre, retour le 29, nous serons 32, pour l'entreprise Apple"
Réponse attendue :
{"reply":"Pour finaliser votre devis, j'aurais besoin de votre adresse e-mail et d'un numéro de téléphone.","answers":{"ville_depart":"Nantes","ville_arrivee":"Paris","date_depart":"${currentYear}-10-19","date_retour":"${currentYear}-10-29","nombre_passagers":"32","type_trajet":"aller-retour","nom":"Apple"}}

FORMAT DE SORTIE : JSON pur, sans balises markdown.
{"reply":"ta réponse","answers":{"champ":"valeur"}}`;

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

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.reply) reply = parsed.reply;
        aiAnswers = parsed.answers || {};
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

    return { reply, answers: newAnswers, missingFields: finalMissing };
  } catch (error) {
    console.error("Vercel AI Service Error:", error.message);
    throw error;
  }
}

module.exports = { generateChatReply };
