import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatCurrency(value, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function normalizeQuote(state) {
  const rawQuote = state?.calcul || state?.devis?.details || state?.devis || null;

  if (!rawQuote) {
    return null;
  }

  return {
    id: state?.record?.id || state?.devis?.id || state?.client?.id || rawQuote.id,
    departure: rawQuote.ville_depart || rawQuote.departure || "Non renseigné",
    destination: rawQuote.ville_arrivee || rawQuote.destination || "Non renseigné",
    passengers: rawQuote.nombre_passagers || rawQuote.passengers || 1,
    date: rawQuote.date_depart || rawQuote.date || rawQuote.travel_date || "Non renseignée",
    returnDate: rawQuote.date_retour || "",
    tripType: rawQuote.type_trajet || rawQuote.tripType || rawQuote.trip_type || "aller-simple",
    distanceKm: rawQuote.distance_km || rawQuote.distanceKm || 120,
    estimatedPrice: rawQuote.prix || rawQuote.estimatedPrice || rawQuote.estimated_price || 0,
    basePrice: rawQuote.base_price || rawQuote.breakdown?.basePrice || 0,
    transportPrice: rawQuote.cout_transport_hors_peage || rawQuote.breakdown?.transportPrice || rawQuote.base_price || 0,
    tollCost: rawQuote.peage || 0,
    tollDetails: rawQuote.details_peage || null,
    margin: rawQuote.marge ?? "15%",
    seasonCoeff: rawQuote.coefficient_saison || 0,
    urgencyCoeff: rawQuote.coefficient_urgence || 0,
    capacityCoeff: rawQuote.coefficient_capacite || 0,
    isComplex: Boolean(rawQuote.est_complexe),
    complexityReason: rawQuote.motif_complexite,
    currency: rawQuote.currency || "EUR",
    breakdown: rawQuote.breakdown || {},
    saved: Boolean(state?.saved),
  };
}

function formatCoeff(value) {
  return `${Number(value || 0) > 0 ? "+" : ""}${Math.round(Number(value || 0) * 100)}%`;
}

function formatMargin(value) {
  return typeof value === "number" ? formatCoeff(value) : value;
}

function QuoteResult() {
  const { state } = useLocation();
  const [emailStatus, setEmailStatus] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
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
    { label: quote.returnDate ? "Date aller" : "Date", value: quote.date, icon: "cal" },
    { label: "Passagers", value: `${quote.passengers} personne${Number(quote.passengers) > 1 ? "s" : ""}`, icon: "grp" },
  ];

  if (quote.returnDate) {
    quoteDetails.splice(3, 0, { label: "Date retour", value: quote.returnDate, icon: "cal" });
  }

  const calculationRows = quote.isComplex
    ? []
    : [
        {
          title: "Transport hors péage",
          subtitle: `${quote.distanceKm} km · ${quote.tripType}`,
          value: formatCurrency(quote.transportPrice, quote.currency),
        },
        {
          title: "Péages",
          subtitle:
            quote.tollDetails?.status === "calculated"
              ? "Calcul TollGuru"
              : quote.tollDetails?.status === "estimated_fallback"
                ? "Estimation distance - TollGuru indisponible"
                : "Estimation non disponible",
          value: formatCurrency(quote.tollCost, quote.currency),
        },
        {
          title: "Base commerciale",
          subtitle: "Transport + péages",
          value: formatCurrency(quote.basePrice, quote.currency),
        },
        {
          title: "Marge commerciale",
          subtitle: "Frais de service NeoTravel",
          value: formatMargin(quote.margin),
          danger: true,
        },
        {
          title: "Coefficient saison",
          subtitle: "Selon le mois du départ",
          value: formatCoeff(quote.seasonCoeff),
          danger: Number(quote.seasonCoeff) > 0,
        },
        {
          title: "Coefficient urgence",
          subtitle: "Selon le délai avant départ",
          value: formatCoeff(quote.urgencyCoeff),
          danger: Number(quote.urgencyCoeff) > 0,
        },
        {
          title: "Coefficient capacité",
          subtitle: `${quote.passengers} passagers`,
          value: formatCoeff(quote.capacityCoeff),
          danger: Number(quote.capacityCoeff) > 0,
        },
      ];

  const reference = quote.id ? `#NT-${String(quote.id).slice(0, 8).toUpperCase()}` : "#NT-PROVISOIRE";
  const generatedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const vat = quote.isComplex ? 0 : Math.round((Number(quote.estimatedPrice) / 1.1) * 0.1);
  const client = state?.client || {};
  const calculForEmail = state?.calcul || {
    ville_depart: quote.departure,
    ville_arrivee: quote.destination,
    date_depart: quote.date,
    date_retour: quote.returnDate,
    nombre_passagers: quote.passengers,
    type_trajet: quote.tripType,
    distance_km: quote.distanceKm,
    cout_transport_hors_peage: quote.transportPrice,
    peage: quote.tollCost,
    details_peage: quote.tollDetails,
    prix: quote.estimatedPrice,
    est_complexe: quote.isComplex,
    motif_complexite: quote.complexityReason,
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);
    setDownloadStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/devis/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devis_id: state?.devis?.id,
          client,
          devis: state?.devis,
          calcul: calculForEmail,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Impossible de télécharger le PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reference.replace("#", "").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadStatus({
        type: "success",
        text: "PDF téléchargé.",
      });
    } catch (error) {
      setDownloadStatus({
        type: "error",
        text: error.message || "Impossible de télécharger le PDF.",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (isSendingEmail) {
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/devis/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devis_id: state?.devis?.id,
          email: client.email,
          client,
          devis: state?.devis,
          calcul: calculForEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Impossible d'envoyer le devis par e-mail.");
      }

      setEmailStatus({
        type: "success",
        text: result.simulated
          ? "E-mail préparé en mode test. Configurez SMTP pour un vrai envoi."
          : "Devis envoyé par e-mail.",
      });
    } catch (error) {
      setEmailStatus({
        type: "error",
        text: error.message || "Impossible d'envoyer le devis par e-mail.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

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
                  <p>
                    {quote.isComplex
                      ? quote.complexityReason
                      : `${quote.tripType}. Incluant chauffeur, carburant et assurances obligatoires.`}
                  </p>
                </div>
                <div className="price-box">
                  <span>{quote.isComplex ? "Validation requise" : "Prix estimé TTC"}</span>
                  <strong>{quote.isComplex ? "Sur devis" : formatCurrency(quote.estimatedPrice, quote.currency)}</strong>
                  {!quote.isComplex && <small>TVA 10% incluse ({formatCurrency(vat, quote.currency)})</small>}
                </div>
              </div>
            </article>

            {!quote.isComplex && (
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
            )}

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
              <button disabled={isDownloadingPdf} onClick={handleDownloadPdf} type="button">
                {isDownloadingPdf ? "Téléchargement..." : "Télécharger le PDF"} <span>›</span>
              </button>
              {downloadStatus && (
                <p className={`quote-action-status ${downloadStatus.type}`} role="status">
                  {downloadStatus.text}
                </p>
              )}
              <button disabled={isSendingEmail} onClick={handleSendEmail} type="button">
                {isSendingEmail ? "Envoi en cours..." : "Recevoir par e-mail"} <span>›</span>
              </button>
              {emailStatus && (
                <p className={`quote-action-status ${emailStatus.type}`} role="status">
                  {emailStatus.text}
                </p>
              )}
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
