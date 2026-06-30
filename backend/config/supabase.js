const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const supabaseUrl = (process.env.SUPABASE_URL || "")
  .trim()
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");

const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env."
  );
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        realtime: {
          transport: WebSocket,
        },
      })
    : null;

module.exports = supabase;