async function generateChatReply({ message, context }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return "Je peux vous aider a preparer votre demande de transport. Pour activer les reponses IA, ajoutez OPENAI_API_KEY dans backend/.env.";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es l'assistant commercial de NeoTravel. Aide les clients a preparer un devis de transport de groupe. Reponds en francais, de facon concise et professionnelle.",
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
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Je n'ai pas pu generer de reponse.";
}

module.exports = {
  generateChatReply,
};
