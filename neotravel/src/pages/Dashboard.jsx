import { Link } from "react-router-dom";
import "../App.css";

const stats = [
  { label: "Nombre de leads", value: "1,284", trend: "+12%", color: "blue" },
  { label: "Devis envoyés", value: "856", trend: "+5%", color: "green" },
  { label: "Demandes en attente", value: "42", trend: "-2%", color: "orange" },
  { label: "Validation humaine", value: "12", trend: "", color: "red" },
];

const requests = [
  {
    client: "Association Sportive Lyon",
    ref: "NT-2024-001",
    trip: "Lyon → Paris (Aller-Retour)",
    passengers: 52,
    price: "1 240,00 €",
    status: "En attente",
    priority: "Normale",
  },
  {
    client: "École Primaire Jules Ferry",
    ref: "NT-2024-002",
    trip: "Bordeaux → Arcachon",
    passengers: 45,
    price: "890,00 €",
    status: "Envoyé",
    priority: "Urgente",
  },
  {
    client: "BTP Solutions France",
    ref: "NT-2024-003",
    trip: "Nantes → Rennes",
    passengers: 12,
    price: "450,00 €",
    status: "Brouillon",
    priority: "Validation humaine",
  },
  {
    client: "Club des Seniors Marseille",
    ref: "NT-2024-004",
    trip: "Marseille → Nice",
    passengers: 30,
    price: "720,00 €",
    status: "En attente",
    priority: "Normale",
  },
  {
    client: "Agence Voyage Prestige",
    ref: "NT-2024-005",
    trip: "Paris → Chamonix",
    passengers: 18,
    price: "2 100,00 €",
    status: "Validé",
    priority: "Urgente",
  },
];

function Dashboard() {
  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <nav aria-label="Navigation commerciale">
          <Link className="active" to="/dashboard">Dashboard</Link>
          <a href="#demandes">Demandes</a>
          <a href="#devis">Devis</a>
          <a href="#relances">Relances</a>
          <a href="#parametres">Paramètres</a>
        </nav>
        <div className="sales-profile">
          <span className="avatar">JD</span>
          <div>
            <strong>Jean Dupont</strong>
            <small>Commercial Senior</small>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <Link className="brand" to="/" aria-label="NeoTravel accueil">
            <span className="brand-icon">bus</span>
            <span>NeoTravel</span>
          </Link>
          <label className="dashboard-search">
            <span>⌕</span>
            <input placeholder="Rechercher..." />
          </label>
          <span className="avatar">JD</span>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <h1>Tableau de bord NeoTravel</h1>
              <p>Bienvenue, voici un aperçu de vos demandes aujourd&apos;hui.</p>
            </div>
            <div className="dashboard-actions">
              <button type="button">Derniers 30 jours</button>
              <button className="dark-action" type="button">Nouvelle demande</button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div>
                  <span className={`stat-icon ${stat.color}`}>{stat.color.slice(0, 2)}</span>
                  {stat.trend && <small className={stat.trend.startsWith("-") ? "negative" : ""}>↗ {stat.trend}</small>}
                </div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>

          <section className="requests-card" id="demandes">
            <div className="requests-top">
              <h2>Demandes récentes</h2>
              <div>
                <button type="button" aria-label="Filtrer">⌄</button>
                <button type="button">Exporter</button>
              </div>
            </div>

            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Nom du client</th>
                    <th>Trajet</th>
                    <th>Passagers</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.ref}>
                      <td>
                        <strong>{request.client}</strong>
                        <small>{request.ref}</small>
                      </td>
                      <td>{request.trip}</td>
                      <td>{request.passengers}</td>
                      <td>
                        <b>{request.price}</b>
                      </td>
                      <td>
                        <span className={`status-pill status-${request.status.toLowerCase().replace("é", "e").replace(" ", "-")}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-dot priority-${request.priority.toLowerCase().replace(" ", "-")}`} />
                        {request.priority}
                      </td>
                      <td>⋮</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="requests-bottom">
              <span>Affichage de 5 sur 1 284 leads</span>
              <div>
                <button type="button" disabled>Précédent</button>
                <button className="active" type="button">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button">Suivant</button>
              </div>
            </div>
          </section>

          <div className="dashboard-bottom-grid">
            <article className="advice-card">
              <strong>Conseil du jour</strong>
              <p>
                Les demandes avec une "Validation humaine" nécessitent une vérification de la marge saisonnière.
                Traitez-les en priorité pour maintenir votre taux de conversion.
              </p>
            </article>
            <article className="performance-card">
              <strong>Performance Commerciale</strong>
              <div>
                <span />
              </div>
              <b>78% de l&apos;objectif</b>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
