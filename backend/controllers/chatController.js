const supabase = require("../config/supabase");
const { generateChatReply } = require("../services/vercelAIService");
const { extractQuoteInfo } = require("../services/messageParser");

async function persistChatMessage({ message, result, context }) {
  if (!supabase || typeof supabase.from !== "function") {
    return;
  }

  try {
    const { error } = await supabase.from("chat_messages").insert({
      user_message: message,
      ai_response: result.reply,
      extracted_data: result.answers,
      context,
    });

    if (error) {
      const isMissingTable = /does not exist|schema cache|PGRST205/i.test(error.message || "");
      if (!isMissingTable) {
        console.warn("Supabase chat storage unavailable:", error.message);
      }
    }
  } catch (storageError) {
    const isMissingTable = /does not exist|schema cache|PGRST205/i.test(storageError.message || "");
    if (!isMissingTable) {
      console.warn("Supabase chat storage unavailable:", storageError.message);
    }
  }
}

async function sendMessage(req, res, next) {
  try {
    const { message, context = {}, answers = {}, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        error: "Le champ message est obligatoire.",
      });
    }

    const result = await generateChatReply({
      message: String(message).trim(),
      context,
      answers,
      history,
    });

    await persistChatMessage({
      message: String(message).trim(),
      result,
      context,
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function extractMessage(req, res, next) {
  try {
    const { message, answers = {} } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        error: "Le champ message est obligatoire.",
      });
    }

    const result = extractQuoteInfo(String(message).trim(), answers);

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
  extractMessage,
};
