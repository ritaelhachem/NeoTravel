import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const steps = [
  {
    key: "departure",
    question: "Pour commencer, quelle est votre ville de départ ?",
    placeholder: "Écrivez votre réponse ici...",
  },
  {
    key: "destination",
    question: "Quelle est votre destination ?",
    placeholder: "Exemple : Lyon",
  },
  {
    key: "passengers",
    question: "Combien de passagers voyagent avec vous ?",
    placeholder: "Exemple : 48",
  },
  {
    key: "date",
    question: "Quelle est la date du trajet ?",
    placeholder: "Exemple : 15 juillet 2026",
  },
  {
    key: "tripType",
    question: "Quel type de voyage organisez-vous ?",
    placeholder: "Exemple : Aller-retour, sortie scolaire...",
  },
];

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
    text: steps[0].question,
  },
];

const summaryItems = [
  { key: "departure", label: "Départ", icon: "pin" },
  { key: "destination", label: "Destination", icon: "go" },
  { key: "date", label: "Date du trajet", icon: "cal" },
  { key: "passengers", label: "Passagers", icon: "grp" },
  { key: "tripType", label: "Type de voyage", icon: "rt" },
];

function AssistantIA() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [answers, setAnswers] = useState({
    departure: "",
    destination: "",
    passengers: "",
    date: "",
    tripType: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const isComplete = useMemo(
    () => steps.every((step) => String(answers[step.key]).trim().length > 0),
    [answers]
  );

  const progressLabel = isComplete
    ? "Conversation complétée, votre devis peut être généré."
    : "Complétez la conversation pour générer le devis";

  const handleSubmit = (event) => {
    event.preventDefault();

    const value = inputValue.trim();
    if (!value || currentStep >= steps.length) {
      return;
    }

    const activeStep = steps[currentStep];
    const nextStepIndex = currentStep + 1;
    const nextMessages = [...messages, { from: "user", text: value }];

    if (nextStepIndex < steps.length) {
      nextMessages.push({ from: "ai", text: steps[nextStepIndex].question });
    } else {
      nextMessages.push({
        from: "ai",
        text: "Parfait, j'ai toutes les informations nécessaires pour générer votre devis.",
      });
    }

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [activeStep.key]: value,
    }));
    setMessages(nextMessages);
    setCurrentStep(nextStepIndex);
    setInputValue("");
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
        body: JSON.stringify(answers),
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
              <input
                aria-label="Réponse utilisateur"
                disabled={currentStep >= steps.length}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={currentStep < steps.length ? steps[currentStep].placeholder : "Toutes les réponses sont complètes"}
                value={inputValue}
              />
              <button aria-label="Envoyer la réponse" disabled={!inputValue.trim() || currentStep >= steps.length} type="submit">
                →
              </button>
            </div>
            <small>Appuyez sur Entrée pour envoyer votre message</small>
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
              {summaryItems.map((item) => (
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
