const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

async function generateChatReply({ message, context }) {
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_API_KEY;

  if (!apiKey) {
    return "Je peux vous aider à préparer votre demande de transport. Pour activer les réponses IA, ajoutez AI_GATEWAY_API_KEY dans backend/.env.";
  }

  const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_GATEWAY_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es l'assistant commercial de NeoTravel. Aide les clients à préparer un devis de transport de groupe. Réponds en français, de façon concise et professionnelle.",
        },
        {
          role: "user",
          content: JSON.stringify({
            message,
            context,
          }),
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vercel AI Gateway error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Je n'ai pas pu générer de réponse.";
}

module.exports = {
  generateChatReply,
};
