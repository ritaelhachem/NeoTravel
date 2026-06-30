import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInAdmin } from "../services/adminAuth";
import "../App.css";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signInAdmin({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <header className="assistant-header">
        <Link className="brand" to="/" aria-label="NeoTravel accueil">
          <span className="brand-icon">bus</span>
          <span>NeoTravel</span>
        </Link>
        <Link className="commercial-access" to="/assistant">
          Créer un devis
        </Link>
      </header>

      <main className="admin-login-shell">
        <section className="admin-login-card">
          <span className="mode-pill">Accès commercial</span>
          <h1>Connexion administrateur</h1>
          <p>Connectez-vous avec le compte commercial créé dans Supabase.</p>

          <form onSubmit={handleSubmit}>
            <label>
              E-mail
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="commercial@neotravel.fr"
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              Mot de passe
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                required
                type="password"
                value={password}
              />
            </label>

            {error && <p className="quote-error" role="alert">{error}</p>}

            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AdminLogin;
