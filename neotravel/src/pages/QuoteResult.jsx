import { Link } from "react-router-dom";
import "../App.css";

const quoteDetails = [
  { label: "Départ", value: "Paris, Gare de Lyon", icon: "pin" },
  { label: "Destination", value: "Lyon, Place Bellecour", icon: "map" },
  { label: "Date & heure", value: "15 Juillet 2024 à 08:30", icon: "cal" },
  { label: "Passagers", value: "48 Personnes", icon: "grp" },
];

const calculationRows = [
  { title: "Distance Totale", subtitle: "465 km à 1.85€/km", value: "860,25 €" },
  { title: "Type de Trajet", subtitle: "Aller simple", value: "Inclus" },
  { title: "Coefficient Saison", subtitle: "Haute saison (Juillet)", value: "+ 15%", danger: true },
  { title: "Coefficient Urgence", subtitle: "Réservation > 30 jours", value: "0%" },
  { title: "Capacité & Logistique", subtitle: "Optimisation 50 places", value: "- 5%" },
  { title: "Marge Commerciale", subtitle: "Frais de service NeoTravel", value: "85,00 €", danger: true },
];

function QuoteResult() {
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
          <span className="quote-generated">Généré le 15 Juin 2024 · ID: 88291-A</span>
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
                  <p>Incluant chauffeur, carburant et assurances obligatoires.</p>
                </div>
                <div className="price-box">
                  <span>Prix estimé TTC</span>
                  <strong>1 245,00 €</strong>
                  <small>TVA 10% incluse (113,18 €)</small>
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
                  <strong>1 245,00 €</strong>
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
                  <dd>#NT-2024-089</dd>
                </div>
                <div>
                  <dt>Validité</dt>
                  <dd>7 jours (22/06/2024)</dd>
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
