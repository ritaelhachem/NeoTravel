import { Link, useLocation } from "react-router-dom";
import "../App.css";

function formatCurrency(value, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function normalizeQuote(state) {
  const rawQuote = state?.devis?.details || state?.devis || null;

  if (!rawQuote) {
    return null;
  }

  return {
    id: state?.record?.id || state?.devis?.id || rawQuote.id,
    departure: rawQuote.departure || "Non renseigné",
    destination: rawQuote.destination || "Non renseigné",
    passengers: rawQuote.passengers || 1,
    date: rawQuote.date || rawQuote.travel_date || "Non renseignée",
    tripType: rawQuote.tripType || rawQuote.trip_type || "Aller simple",
    distanceKm: rawQuote.distanceKm || rawQuote.distance_km || 120,
    estimatedPrice: rawQuote.estimatedPrice || rawQuote.estimated_price || 0,
    currency: rawQuote.currency || "EUR",
    breakdown: rawQuote.breakdown || {},
    saved: Boolean(state?.saved),
  };
}

function QuoteResult() {
  const { state } = useLocation();
  const quote = normalizeQuote(state);

  if (!quote) {
    return (
      <div className="quote-page">
        <header className="quote-header">
          <Link className="brand" to="/" aria-label="NeoTravel accueil">
            <span className="brand-icon">bus</span>
            <span>NeoTravel</span>
          </Link>
        </header>

        <main className="quote-shell">
          <article className="quote-card missing-quote-card">
            <h1>Aucun devis à afficher</h1>
            <p>Revenez à l'assistant pour générer un devis à partir de vos informations de trajet.</p>
            <Link className="button button-dark" to="/assistant">Créer un devis</Link>
          </article>
        </main>
      </div>
    );
  }

  const quoteDetails = [
    { label: "Départ", value: quote.departure, icon: "pin" },
    { label: "Destination", value: quote.destination, icon: "map" },
    { label: "Date", value: quote.date, icon: "cal" },
    { label: "Passagers", value: `${quote.passengers} personne${Number(quote.passengers) > 1 ? "s" : ""}`, icon: "grp" },
  ];

  const calculationRows = [
    {
      title: "Distance totale",
      subtitle: `${quote.distanceKm} km à ${formatCurrency(quote.breakdown.pricePerKm, quote.currency)}/km`,
      value: formatCurrency(Number(quote.distanceKm) * Number(quote.breakdown.pricePerKm || 0), quote.currency),
    },
    {
      title: "Passagers",
      subtitle: `${quote.passengers} x ${formatCurrency(quote.breakdown.pricePerPassenger, quote.currency)}`,
      value: formatCurrency(Number(quote.passengers) * Number(quote.breakdown.pricePerPassenger || 0), quote.currency),
    },
    {
      title: "Type de trajet",
      subtitle: quote.tripType,
      value: quote.breakdown.roundTripMultiplier > 1 ? `x ${quote.breakdown.roundTripMultiplier}` : "Inclus",
    },
    {
      title: "Forfait de base",
      subtitle: "Prise en charge et préparation",
      value: formatCurrency(quote.breakdown.basePrice, quote.currency),
    },
  ];

  const reference = quote.id ? `#NT-${String(quote.id).slice(0, 8).toUpperCase()}` : "#NT-PROVISOIRE";
  const generatedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const vat = Math.round((Number(quote.estimatedPrice) / 1.1) * 0.1);

  return (
    <div className="quote-page">
      <header className="quote-header">
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

      <main className="quote-shell">
        <div className="quote-title-row">
          <div>
            <Link className="back-link" to="/assistant">
              ← Retour à l&apos;assistant
            </Link>
            <h1>Votre devis est prêt</h1>
          </div>
          <span className="quote-generated">Généré le {generatedDate} · {reference}</span>
        </div>

        <div className="quote-layout">
          <section className="quote-main">
            <article className="quote-card quote-summary">
              <div className="quote-card-top">
                <strong>Calcul réalisé automatiquement</strong>
                <span>Devis Provisoire</span>
              </div>

              <div className="quote-info-grid">
                {quoteDetails.map((detail) => (
                  <div className="quote-info" key={detail.label}>
                    <span className="round-icon">{detail.icon}</span>
                    <div>
                      <small>{detail.label}</small>
                      <strong>{detail.value}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quote-service-row">
                <div>
                  <em>Type de prestation</em>
                  <h2>Autocar Grand Tourisme</h2>
                  <p>{quote.tripType}. Incluant chauffeur, carburant et assurances obligatoires.</p>
                </div>
                <div className="price-box">
                  <span>Prix estimé TTC</span>
                  <strong>{formatCurrency(quote.estimatedPrice, quote.currency)}</strong>
                  <small>TVA 10% incluse ({formatCurrency(vat, quote.currency)})</small>
                </div>
              </div>
            </article>

            <article className="quote-card calculation-card">
              <h2>
                <span className="round-icon">zap</span>
                Détail du calcul
              </h2>

              <div className="calculation-list">
                {calculationRows.map((row) => (
                  <div className="calculation-row" key={row.title}>
                    <div>
                      <strong>{row.title}</strong>
                      <span>{row.subtitle}</span>
                    </div>
                    <b className={row.danger ? "danger-text" : ""}>{row.value}</b>
                  </div>
                ))}
              </div>

              <div className="total-row">
                <p>Les prix peuvent varier selon la disponibilité réelle des transporteurs au moment de la validation.</p>
                <div>
                  <span>Total final</span>
                  <strong>{formatCurrency(quote.estimatedPrice, quote.currency)}</strong>
                </div>
              </div>
            </article>

            <article className="quote-card extra-info">
              <h2>Informations complémentaires</h2>
              <div>
                <section>
                  <h3>Conditions d&apos;annulation</h3>
                  <p>
                    Annulation gratuite jusqu&apos;à 15 jours avant le départ. Entre 14 et 7 jours, 50% de frais
                    s&apos;appliquent. Moins de 7 jours, le montant total est dû.
                  </p>
                </section>
                <section>
                  <h3>Services inclus</h3>
                  <p>WiFi gratuit à bord<br />Prises USB individuelles<br />Climatisation tri-zone</p>
                </section>
              </div>
            </article>
          </section>

          <aside className="quote-sidebar">
            <article className="quote-card action-card">
              <h2>Actions prioritaires</h2>
              <button type="button">Télécharger le PDF <span>›</span></button>
              <button type="button">Recevoir par e-mail <span>›</span></button>
              <button className="dark-action" type="button">Demander une modification</button>
              <dl>
                <div>
                  <dt>Référence</dt>
                  <dd>{reference}</dd>
                </div>
                <div>
                  <dt>Statut</dt>
                  <dd>{quote.saved ? "Sauvegardé" : "Provisoire"}</dd>
                </div>
              </dl>
            </article>

            <article className="next-step">
              <h2>Étape suivante</h2>
              <p>Une fois votre devis validé, vous recevrez un lien de paiement sécurisé pour bloquer l&apos;autocar.</p>
              <Link to="/dashboard">Voir mes autres demandes</Link>
            </article>
          </aside>
        </div>
      </main>

      <footer className="quote-footer">
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

export default QuoteResult;
