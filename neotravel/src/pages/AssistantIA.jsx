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

const initialConsents = {
  dataUsage: false, // Consentement pour utiliser les données
  terms: false, // Conditions d'utilisation
  privacy: false, // Politique de confidentialité
  marketing: false, // Communications marketing
};

const initialMessages = [
  {
    from: "ai",
    text: "Bonjour ! Pour préparer votre devis, décrivez-moi votre voyage en quelques mots : ville de départ, destination, date(s) et nombre de voyageurs. Je m'occupe du reste.",
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
  const [consents, setConsents] = useState(initialConsents);
  const [inputValue, setInputValue] = useState("");
  const [missingFields, setMissingFields] = useState(getFallbackMissingFields(initialAnswers));
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [showConsentsModal, setShowConsentsModal] = useState(true);

  const visibleSummaryItems = useMemo(
    () => summaryItems.filter((item) => item.key !== "date_retour" || isRoundTrip(answers.type_trajet)),
    [answers.type_trajet]
  );

  const consentsComplete = consents.dataUsage && consents.terms && consents.privacy;

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
      const conversationHistory = messages.map((message) => ({
        role: message.from === "ai" ? "assistant" : "user",
        content: message.text,
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: value,
          answers,
          history: conversationHistory,
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

  const handleAcceptConsents = () => {
    const updatedConsents = {
      ...consents,
      dataUsage: true,
      terms: true,
      privacy: true,
    };
    setConsents(updatedConsents);
    setShowConsentsModal(false);
  };

  const handleGenerateQuote = async () => {
    if (!isComplete || !consentsComplete || isGenerating) {
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
          consents: consents,
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
        {showConsentsModal ? (
          <section className="consents-modal-overlay">
            <div className="consents-modal">
              <div className="consents-modal-header">
                <h1>Bienvenue sur NeoTravel</h1>
                <p>Avant de commencer, veuillez accepter les conditions essentielles</p>
              </div>

              <section className="rgpd-consent-section">
                <div className="consent-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={consents.dataUsage}
                      onChange={(e) => setConsents({ ...consents, dataUsage: e.target.checked })}
                    />
                    <span>
                      <strong>Utilisation de vos données</strong> - Acceptez que vos données personnelles soient utilisées pour créer votre devis de transport.
                    </span>
                  </label>
                </div>

                <div className="consent-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={consents.terms}
                      onChange={(e) => setConsents({ ...consents, terms: e.target.checked })}
                    />
                    <span>
                      <strong>Conditions d'utilisation</strong> - Je reconnais avoir lu et accepté les <a href="#terms" target="_blank" rel="noopener noreferrer">conditions d'utilisation</a> de NeoTravel.
                    </span>
                  </label>
                </div>

                <div className="consent-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={consents.privacy}
                      onChange={(e) => setConsents({ ...consents, privacy: e.target.checked })}
                    />
                    <span>
                      <strong>Politique de confidentialité</strong> - Je reconnais avoir lu et accepté la <a href="#privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a> et le traitement de mes données.
                    </span>
                  </label>
                </div>

                <div className="consent-item optional">
                  <label>
                    <input
                      type="checkbox"
                      checked={consents.marketing}
                      onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
                    />
                    <span>
                      <strong>(Optionnel)</strong> Recevoir les offres et actualités de NeoTravel par email.
                    </span>
                  </label>
                </div>
              </section>

              <button 
                className="consents-accept-button" 
                disabled={!consents.dataUsage || !consents.terms || !consents.privacy}
                onClick={handleAcceptConsents}
                type="button"
              >
                Accepter et continuer →
              </button>
            </div>
          </section>
        ) : (
          <>
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
                <p className="assistant-bubble">{message.text}</p>
              </div>
            ))}
          </div>

          <form className="assistant-input-area" onSubmit={handleSubmit}>
            <div className="assistant-input-shell phrase-input-shell">
              <textarea
                aria-label="Message utilisateur"
                disabled={isExtracting}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitFreeText(inputValue);
                  }
                }}
                placeholder="Décrivez votre voyage : ville de départ, destination, date(s), nombre de passagers, type de trajet..."
                rows={3}
                value={inputValue}
              />
              <div className="input-bottom-bar">
                <span className="input-hint">
                  {isExtracting ? "Analyse en cours..." : "Entrée pour envoyer · Maj+Entrée pour aller à la ligne"}
                </span>
                <button aria-label="Envoyer le message" disabled={!inputValue.trim() || isExtracting} type="submit">
                  {isExtracting ? "..." : "Envoyer →"}
                </button>
              </div>
            </div>

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
              <h1>Résumé de votre demande</h1>
              <span className="summary-badge">{visibleSummaryItems.length - missingFields.length}/{visibleSummaryItems.length}</span>
            </div>

            <div className="summary-progress-track">
              <div
                className="summary-progress-fill"
                style={{ width: `${Math.round(((visibleSummaryItems.length - missingFields.length) / visibleSummaryItems.length) * 100)}%` }}
              />
            </div>

            <div className="summary-list">
              {visibleSummaryItems.map((item) => {
                const value = item.key === "type_trajet" ? formatTripType(answers[item.key]) : answers[item.key];
                const isFilled = Boolean(value);

                return (
                  <div className={`summary-row ${isFilled ? "summary-row--filled" : "summary-row--empty"}`} key={item.key}>
                    <span className="summary-status-dot" aria-hidden="true">
                      {isFilled ? "✓" : ""}
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

          <button className="generate-quote-button" disabled={!isComplete || !consentsComplete || isGenerating} onClick={handleGenerateQuote} type="button">
            {isGenerating ? "Génération en cours..." : "Générer mon devis"} <span aria-hidden="true">→</span>
          </button>

          {quoteError && <p className="quote-error" role="alert">{quoteError}</p>}

          <div className="help-card">
            <strong>Besoin d&apos;aide ?</strong>
            <p>Nos conseillers sont disponibles du lundi au vendredi de 9h à 18h au 01 23 45 67 89.</p>
          </div>
        </aside>
          </>
        )}
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
