const STORAGE_KEY = "neotravel_admin_session";

function getSupabaseUrl() {
  return (process.env.REACT_APP_SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

function getSupabaseAnonKey() {
  return (process.env.REACT_APP_SUPABASE_ANON_KEY || "").trim();
}

function getAuthConfig() {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Error("Configuration Supabase Auth manquante.");
  }

  return { supabaseUrl, anonKey };
}

export function getStoredAdminSession() {
  try {
    const rawSession = window.localStorage.getItem(STORAGE_KEY);
    const session = rawSession ? JSON.parse(rawSession) : null;

    if (!session?.access_token || !session?.expires_at) {
      return null;
    }

    if (Date.now() >= Number(session.expires_at) * 1000) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function isAdminAuthenticated() {
  return Boolean(getStoredAdminSession());
}

export async function signInAdmin({ email, password }) {
  const { supabaseUrl, anonKey } = getAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error_description || result.msg || result.error || "Identifiants invalides.");
  }

  const session = {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    expires_at: result.expires_at || Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600),
    user: result.user,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function signOutAdmin() {
  window.localStorage.removeItem(STORAGE_KEY);
}
