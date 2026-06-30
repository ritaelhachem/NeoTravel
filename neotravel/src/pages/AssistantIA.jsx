import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import API_BASE_URL from "../config/api";
import "../App.css";

const initialAnswers = {
  nom: "",
  email: "",
  telephone: "",
  ville_depart: "",
  ville_arrivee: "",
  nombre_passagers: "",
  date_depart: "",
  type_trajet: "",
  date_retour: "",
};

const initialMessages = [
  {
    from: "ai",
    text: "Bonjour ! Décrivez votre trajet en une phrase, je récupère automatiquement les informations utiles.",
  },
  {
    from: "ai",
    text: "Exemple : Je m'appelle Rita, mon mail est rita@test.com, je veux un Paris vers Lyon le 15/07/2026 pour 50 personnes en aller-retour le 20/07/2026.",
  },
];

const summaryItems = [
  { key: "nom", label: "Nom", icon: "id" },
  { key: "email", label: "E-mail", icon: "@" },
  { key: "telephone", label: "Téléphone", icon: "tel" },
  { key: "ville_depart", label: "Départ", icon: "pin" },
  { key: "ville_arrivee", label: "Destination", icon: "go" },
  { key: "date_depart", label: "Date aller", icon: "cal" },
  { key: "date_retour", label: "Date retour", icon: "cal" },
  { key: "nombre_passagers", label: "Passagers", icon: "grp" },
  { key: "type_trajet", label: "Type de voyage", icon: "rt" },
];

const missingLabels = {
  nom: "nom",
  email: "e-mail",
  telephone: "téléphone",
  ville_depart: "ville de départ",
  ville_arrivee: "ville d'arrivée",
  nombre_passagers: "nombre de passagers",
  date_depart: "date aller",
  type_trajet: "type de trajet",
  date_retour: "date retour",
};

function isRoundTrip(value) {
  return String(value || "").toLowerCase().includes("retour");
}

function getFallbackMissingFields(answers) {
  const fields = [
    "nom",
    "email",
    "telephone",
    "ville_depart",
    "ville_arrivee",
    "nombre_passagers",
    "date_depart",
    "type_trajet",
  ];

  if (isRoundTrip(answers.type_trajet)) {
    fields.push("date_retour");
  }

  return fields.filter((field) => !String(answers[field] || "").trim());
}

function formatTripType(value) {
  if (!value) {
    return "";
  }

  return isRoundTrip(value) ? "Aller-retour" : "Aller simple";
}

function AssistantIA() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [answers, setAnswers] = useState(initialAnswers);
  const [inputValue, setInputValue] = useState("");
  const [missingFields, setMissingFields] = useState(getFallbackMissingFields(initialAnswers));
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const visibleSummaryItems = useMemo(
    () => summaryItems.filter((item) => item.key !== "date_retour" || isRoundTrip(answers.type_trajet)),
    [answers.type_trajet]
  );

  const isComplete = missingFields.length === 0;
  const progressLabel = isComplete
    ? "Toutes les informations sont complètes, votre devis peut être généré."
    : `Informations manquantes : ${missingFields.map((field) => missingLabels[field] || field).join(", ")}`;

  const applyExtraction = (result, userText) => {
    const nextAnswers = {
      ...answers,
      ...(result.answers || {}),
    };
    const nextMissingFields = result.missingFields || getFallbackMissingFields(nextAnswers);

    setAnswers(nextAnswers);
    setMissingFields(nextMissingFields);
    setMessages((currentMessages) => [
      ...currentMessages,
      { from: "user", text: userText },
      { from: "ai", text: result.reply || "J'ai mis à jour votre demande." },
    ]);
  };

  const submitFreeText = async (rawValue) => {
    const value = String(rawValue || "").trim();

    if (!value || isExtracting) {
      return;
    }

    setIsExtracting(true);
    setQuoteError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: value,
          answers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Impossible d'analyser votre message.");
      }

      applyExtraction(result, value);
      setInputValue("");
    } catch (error) {
      setQuoteError(error.message || "Impossible d'analyser votre message.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitFreeText(inputValue);
  };

  const handleTripChoice = (typeTrajet) => {
    submitFreeText(typeTrajet === "aller-retour" ? "C'est un aller-retour." : "C'est un aller simple.");
  };

  const handleGenerateQuote = async () => {
    if (!isComplete || isGenerating) {
      return;
    }

    if (isRoundTrip(answers.type_trajet) && answers.date_retour <= answers.date_depart) {
      setQuoteError("La date de retour doit être après la date de départ.");
      return;
    }

    setIsGenerating(true);
    setQuoteError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/devis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...answers,
          nombre_passagers: Number(answers.nombre_passagers),
          type_trajet: isRoundTrip(answers.type_trajet) ? "aller-retour" : "aller-simple",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Impossible de générer le devis.");
      }

      navigate("/devis", {
        state: result,
      });
    } catch (error) {
      setQuoteError(error.message || "Impossible de générer le devis.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="assistant-page">
      <header className="assistant-header">
        <Link className="brand" to="/" aria-label="NeoTravel accueil">
          <span className="brand-icon">bus</span>
          <span>NeoTravel</span>
        </Link>

        <nav className="main-nav" aria-label="Navigation principale">
          <Link to="/">Découvrir</Link>
          <Link to="/#features">Fonctionnalités</Link>
          <Link to="/#pricing">Tarifs</Link>
        </nav>

        <Link className="commercial-access" to="/dashboard">
          Accès commercial
        </Link>
      </header>

      <main className="assistant-workspace">
        <section className="assistant-chat-panel" aria-label="Conversation assistant IA">
          <div className="assistant-panel-top">
            <div className="assistant-status">
              <span className="status-dot" aria-hidden="true" />
              <span>Assistant IA actif</span>
            </div>
            <span className="mode-pill">Phrase libre</span>
          </div>

          <div className="assistant-thread">
            {messages.map((message, index) => (
              <div className={`assistant-message-row ${message.from}`} key={`${message.from}-${index}`}>
                {message.from === "ai" && <span className="assistant-avatar" aria-hidden="true" />}
                <div>
                  <p className="assistant-bubble">{message.text}</p>
                  <time>09:31 AM</time>
                </div>
              </div>
            ))}
          </div>

          <form className="assistant-input-area" onSubmit={handleSubmit}>
            <div className="assistant-input-shell phrase-input-shell">
              <input
                aria-label="Message utilisateur"
                disabled={isExtracting}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Écrivez une phrase complète ou ajoutez seulement l'information manquante..."
                type="text"
                value={inputValue}
              />
              <button aria-label="Envoyer le message" disabled={!inputValue.trim() || isExtracting} type="submit">
                →
              </button>
            </div>
            <small>
              {isExtracting
                ? "Analyse du message..."
                : "Vous pouvez tout écrire en une phrase. L'assistant demandera seulement ce qui manque."}
            </small>

            {!answers.type_trajet && (
              <div className="trip-choice-group inline-trip-choice" role="group" aria-label="Type de trajet">
                <button onClick={() => handleTripChoice("aller-simple")} type="button">
                  Aller simple
                </button>
                <button onClick={() => handleTripChoice("aller-retour")} type="button">
                  Aller-retour
                </button>
              </div>
            )}
          </form>
        </section>

        <aside className="assistant-summary-column" aria-label="Résumé dynamique du trajet">
          <section className="trip-summary-card">
            <div className="summary-title">
              <span className="summary-clock" aria-hidden="true" />
              <h1>Résumé de votre demande</h1>
            </div>
            <p>Les informations détectées se mettent à jour automatiquement à partir de vos phrases.</p>

            <div className="summary-list">
              {visibleSummaryItems.map((item) => {
                const value = item.key === "type_trajet" ? formatTripType(answers[item.key]) : answers[item.key];

                return (
                  <div className="summary-row" key={item.key}>
                    <span className="summary-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{value || "En attente..."}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className={`completion-note ${isComplete ? "ready" : ""}`}>{progressLabel}</div>

          <button className="generate-quote-button" disabled={!isComplete || isGenerating} onClick={handleGenerateQuote} type="button">
            {isGenerating ? "Génération en cours..." : "Générer mon devis"} <span aria-hidden="true">→</span>
          </button>

          {quoteError && <p className="quote-error" role="alert">{quoteError}</p>}

          <p className="quote-terms">
            En générant ce devis, vous acceptez nos conditions générales d&apos;utilisation et de service.
          </p>

          <div className="help-card">
            <strong>Besoin d&apos;aide ?</strong>
            <p>Nos conseillers sont disponibles du lundi au vendredi de 9h à 18h au 01 23 45 67 89.</p>
          </div>
        </aside>
      </main>

      <footer className="assistant-footer">
        <p>© 2024 NeoTravel. Tous droits réservés.</p>
        <div>
          <a href="#conditions">Conditions</a>
          <a href="#privacy">Confidentialité</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default AssistantIA;
