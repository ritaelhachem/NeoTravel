const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

async function generateChatReply({ message, context, answers = {}, history = [] }) {
  const apiKey = (process.env.VERCEL_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_API_KEY || "").trim();

  if (!apiKey) {
    return {
      reply: "Je peux vous aider à préparer votre demande de transport. Pour activer les réponses IA, ajoutez VERCEL_AI_API_KEY dans backend/.env.",
      answers: {},
      missingFields: [],
    };
  }

  const requiredFields = ["nom", "email", "telephone", "ville_depart", "ville_arrivee", "nombre_passagers", "date_depart", "type_trajet"];
  const isRoundTrip = String(answers.type_trajet || "").toLowerCase().includes("retour");
  if (isRoundTrip) {
    requiredFields.push("date_retour");
  }

  const collectedInfo = requiredFields
    .filter((field) => answers[field])
    .map((field) => `- ${field}: ${answers[field]}`)
    .join("\n");

  const conversationHistory = Array.isArray(history)
    ? history
        .filter((entry) => entry && typeof entry.content === "string")
        .map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: entry.content,
        }))
    : [];

  const systemPrompt = `Tu es l'assistant commercial NeoTravel, expert en devis de transport de groupe.

OBJECTIF: aider le client à préparer son devis de manière naturelle, fluide et humaine.

RÈGLES DE CONVERSATION :
1. Réponds toujours en français, de façon naturelle, chaleureuse, professionnelle et concise.
2. Fais une vraie conversation : ne réponds pas comme un formulaire, mais comme un conseiller humain attentif.
3. Si le client donne plusieurs informations d'un coup, traite-les ensemble et confirme ce que tu as compris avec une phrase fluide.
4. Si le client divague ou parle de quelque chose de hors sujet, réponds brièvement puis recentre doucement la discussion sur le devis.
5. Utilise les informations déjà collectées pour éviter de demander deux fois la même chose.
6. Extrait les informations utiles depuis la réponse libre du client.
7. Si les informations sont incomplètes, demande seulement ce qu'il manque, sans surcharger la conversation.
8. Adapte ton ton à la personne : plus chaleureux si la demande est simple, plus direct si le client est pressé.
9. Fais preuve d'empathie, de précision, d'enthousiasme maîtrisé et de professionnalisme.

INFORMATIONS DÉJÀ COLLECTÉES :
${collectedInfo || "Aucune information collectée pour le moment"}

HISTORIQUE DE LA CONVERSATION :
${conversationHistory.length > 0 ? conversationHistory.map((entry) => `${entry.role === "assistant" ? "Assistant" : "Client"}: ${entry.content}`).join("\n") : "Aucune conversation précédente."}

Tu dois toujours retourner un JSON valide au format suivant :
{
  "reply": "Votre réponse conversationnelle",
  "answers": { "champ": "valeur" },
  "missingFields": ["liste", "des", "champs", "manquants"]
}`;

  try {
    const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: (process.env.VERCEL_AI_MODEL || process.env.AI_GATEWAY_MODEL || "openai/gpt-4o-mini").trim(),
        stream: false,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...conversationHistory,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim() || "{}";

    try {
      const parsed = JSON.parse(responseText);
      return {
        reply: parsed.reply || "J'ai reçu votre message.",
        answers: parsed.answers || {},
        missingFields: parsed.missingFields || requiredFields,
      };
    } catch (error) {
      return {
        reply: responseText,
        answers: {},
        missingFields: requiredFields,
      };
    }
  } catch (error) {
    console.error("Vercel AI Service Error:", error.message);
    throw error;
  }
}

module.exports = {
  generateChatReply,
};
