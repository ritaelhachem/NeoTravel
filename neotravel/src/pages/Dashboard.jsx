import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "Sur devis";
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0)) + " €";
}

function normalizeStatus(status) {
  return String(status || "brouillon")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function buildRows(devis = []) {
  return devis.map((item) => {
    const client = item.clients || {};
    const tripType = client.type_trajet === "aller-retour" ? "Aller-retour" : "Aller simple";

    return {
      id: item.id,
      client: client.nom || "Client inconnu",
      ref: item.id ? `NT-${String(item.id).slice(0, 8).toUpperCase()}` : "NT-PROVISOIRE",
      trip: `${client.ville_depart || "Départ"} → ${client.ville_arrivee || "Arrivée"} (${tripType})`,
      passengers: client.nombre_passagers || "-",
      price: formatCurrency(item.prix),
      status: item.statut || "Brouillon",
      priority: item.statut === "En validation" ? "Validation humaine" : "Normale",
      createdAt: item.date_creation,
    };
  });
}

function Dashboard() {
  const [devis, setDevis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDevis() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/devis`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Impossible de charger les devis.");
        }

        if (isMounted) {
          setDevis(result.devis || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Impossible de charger les devis.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDevis();

    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => buildRows(devis), [devis]);
  const validationCount = rows.filter((row) => row.priority === "Validation humaine").length;
  const sentCount = rows.filter((row) => row.status === "Envoyé").length;
  const pendingCount = rows.filter((row) => row.status === "En validation" || row.status === "Brouillon").length;

  const stats = [
    { label: "Nombre de leads", value: rows.length, trend: "", color: "blue" },
    { label: "Devis envoyés", value: sentCount, trend: "", color: "green" },
    { label: "Demandes en attente", value: pendingCount, trend: "", color: "orange" },
    { label: "Validation humaine", value: validationCount, trend: "", color: "red" },
  ];

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
              <Link className="dark-action" to="/assistant">Nouvelle demande</Link>
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

            {error && <p className="dashboard-alert error">{error}</p>}
            {isLoading && <p className="dashboard-alert">Chargement des devis...</p>}

            {!isLoading && !error && (
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
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan="7">Aucun devis enregistré pour le moment.</td>
                      </tr>
                    ) : (
                      rows.map((request) => (
                        <tr key={request.id || request.ref}>
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
                            <span className={`status-pill status-${normalizeStatus(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <span className={`priority-dot priority-${normalizeStatus(request.priority)}`} />
                            {request.priority}
                          </td>
                          <td>⋮</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="requests-bottom">
              <span>Affichage de {rows.length} devis</span>
              <div>
                <button type="button" disabled>Précédent</button>
                <button className="active" type="button">1</button>
                <button type="button" disabled>Suivant</button>
              </div>
            </div>
          </section>

          <div className="dashboard-bottom-grid">
            <article className="advice-card">
              <strong>Conseil du jour</strong>
              <p>
                Les demandes avec une "Validation humaine" nécessitent une vérification de la marge et de la capacité.
                Traitez-les en priorité pour maintenir votre taux de conversion.
              </p>
            </article>
            <article className="performance-card">
              <strong>Performance Commerciale</strong>
              <div>
                <span />
              </div>
              <b>{rows.length ? "Données à jour" : "En attente de données"}</b>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
