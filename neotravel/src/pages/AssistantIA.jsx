import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const baseSteps = [
  {
    key: "nom",
    question: "Quel est votre nom ?",
    placeholder: "Exemple : Rita El Hachem",
  },
  {
    key: "email",
    question: "Quelle est votre adresse e-mail ?",
    placeholder: "Exemple : rita@email.com",
  },
  {
    key: "telephone",
    question: "Quel est votre numéro de téléphone ?",
    placeholder: "Exemple : 06 00 00 00 00",
  },
  {
    key: "ville_depart",
    question: "Pour commencer, quelle est votre ville de départ ?",
    placeholder: "Écrivez votre réponse ici...",
  },
  {
    key: "ville_arrivee",
    question: "Quelle est votre destination ?",
    placeholder: "Exemple : Lyon",
  },
  {
    key: "nombre_passagers",
    question: "Combien de passagers voyagent avec vous ?",
    placeholder: "Exemple : 48",
  },
  {
    key: "date_depart",
    question: "Quelle est la date du trajet ?",
    placeholder: "Exemple : 2026-07-15",
  },
  {
    key: "type_trajet",
    question: "Quel type de voyage organisez-vous ?",
    placeholder: "",
  },
];

const returnDateStep = {
  key: "date_retour",
  question: "Quelle est la date de retour ?",
  placeholder: "Exemple : 2026-07-20",
};

function isRoundTrip(value) {
  return String(value || "").toLowerCase().includes("retour");
}

function getSteps(answers) {
  return isRoundTrip(answers.type_trajet) ? [...baseSteps, returnDateStep] : baseSteps;
}

const initialMessages = [
  {
    from: "ai",
    text: "Bonjour ! Je suis l'assistant NeoTravel.",
  },
  {
    from: "ai",
    text: "Je vais vous aider à préparer votre devis de transport de groupe en quelques secondes.",
  },
  {
    from: "ai",
    text: baseSteps[0].question,
  },
];

const baseSummaryItems = [
  { key: "ville_depart", label: "Départ", icon: "pin" },
  { key: "ville_arrivee", label: "Destination", icon: "go" },
  { key: "date_depart", label: "Date du trajet", icon: "cal" },
  { key: "nombre_passagers", label: "Passagers", icon: "grp" },
  { key: "type_trajet", label: "Type de voyage", icon: "rt" },
];

const returnSummaryItem = { key: "date_retour", label: "Date de retour", icon: "cal" };

function AssistantIA() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [answers, setAnswers] = useState({
    nom: "",
    email: "",
    telephone: "",
    ville_depart: "",
    ville_arrivee: "",
    nombre_passagers: "",
    date_depart: "",
    type_trajet: "",
    date_retour: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const visibleSteps = useMemo(() => getSteps(answers), [answers]);
  const visibleSummaryItems = useMemo(
    () => (isRoundTrip(answers.type_trajet) ? [...baseSummaryItems, returnSummaryItem] : baseSummaryItems),
    [answers]
  );
  const activeStep = visibleSteps[currentStep];

  const isComplete = useMemo(
    () => visibleSteps.every((step) => String(answers[step.key]).trim().length > 0),
    [answers, visibleSteps]
  );

  const progressLabel = isComplete
    ? "Conversation complétée, votre devis peut être généré."
    : "Complétez la conversation pour générer le devis";

  const getInputType = () => {
    if (activeStep?.key === "date_depart" || activeStep?.key === "date_retour") {
      return "date";
    }

    if (activeStep?.key === "nombre_passagers") {
      return "number";
    }

    return "text";
  };

  const submitStepValue = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value || !activeStep || currentStep >= visibleSteps.length) {
      return;
    }

    if (activeStep.key === "date_retour" && answers.date_depart && value <= answers.date_depart) {
      setQuoteError("La date de retour doit être après la date de départ.");
      return;
    }

    setQuoteError("");
    const nextAnswers = {
      ...answers,
      [activeStep.key]: value,
    };

    if (activeStep.key === "type_trajet" && !isRoundTrip(value)) {
      nextAnswers.date_retour = "";
    }

    const nextSteps = getSteps(nextAnswers);
    const nextStepIndex = currentStep + 1;
    const nextMessages = [...messages, { from: "user", text: value }];

    if (nextStepIndex < nextSteps.length) {
      nextMessages.push({ from: "ai", text: nextSteps[nextStepIndex].question });
    } else {
      nextMessages.push({
        from: "ai",
        text: "Parfait, j'ai toutes les informations nécessaires pour générer votre devis.",
      });
    }

    setAnswers(nextAnswers);
    setMessages(nextMessages);
    setCurrentStep(nextStepIndex);
    setInputValue("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitStepValue(inputValue);
  };

  const handleGenerateQuote = async () => {
    if (!isComplete || isGenerating) {
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
          type_trajet: String(answers.type_trajet).toLowerCase().includes("retour") ? "aller-retour" : "aller-simple",
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
            <span className="mode-pill">Mode automatique</span>
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
            <div className="assistant-input-shell">
              {activeStep?.key === "type_trajet" ? (
                <div className="trip-choice-group" role="group" aria-label="Type de trajet">
                  <button onClick={() => submitStepValue("aller-simple")} type="button">
                    Aller simple
                  </button>
                  <button onClick={() => submitStepValue("aller-retour")} type="button">
                    Aller-retour
                  </button>
                </div>
              ) : (
                <>
                  <input
                    aria-label="Réponse utilisateur"
                    disabled={currentStep >= visibleSteps.length}
                    min={activeStep?.key === "date_retour" ? answers.date_depart : activeStep?.key === "nombre_passagers" ? "1" : undefined}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder={currentStep < visibleSteps.length ? activeStep.placeholder : "Toutes les réponses sont complètes"}
                    type={getInputType()}
                    value={inputValue}
                  />
                  <button aria-label="Envoyer la réponse" disabled={!inputValue.trim() || currentStep >= visibleSteps.length} type="submit">
                    →
                  </button>
                </>
              )}
            </div>
            <small>{activeStep?.key === "type_trajet" ? "Choisissez une option pour continuer" : "Appuyez sur Entrée pour envoyer votre message"}</small>
          </form>
        </section>

        <aside className="assistant-summary-column" aria-label="Résumé dynamique du trajet">
          <section className="trip-summary-card">
            <div className="summary-title">
              <span className="summary-clock" aria-hidden="true" />
              <h1>Résumé de votre trajet</h1>
            </div>
            <p>Les informations se mettent à jour en temps réel selon vos réponses à l&apos;assistant.</p>

            <div className="summary-list">
              {visibleSummaryItems.map((item) => (
                <div className="summary-row" key={item.key}>
                  <span className="summary-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{answers[item.key] || "En attente..."}</span>
                  </div>
                </div>
              ))}
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
