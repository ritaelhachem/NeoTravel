const supabase = require("../config/supabase");
const { generateChatReply } = require("../services/openaiService");

async function sendMessage(req, res, next) {
  try {
    const { message, context = {} } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        error: "Le champ message est obligatoire.",
      });
    }

    const reply = await generateChatReply({
      message: String(message).trim(),
      context,
    });

    if (supabase) {
      const { error } = await supabase.from("chat_messages").insert({
        user_message: message,
        ai_response: reply,
        context,
      });

      if (error) {
        throw error;
      }
    }

    return res.json({ reply });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
};
