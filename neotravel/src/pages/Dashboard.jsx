import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api";
import { signOutAdmin } from "../services/adminAuth";
import "../App.css";

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "Sur devis";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeStatus(status) {
  return String(status || "brouillon")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
      rawPrice: Number(item.prix || 0),
      status: item.statut || "Brouillon",
      priority: item.statut === "En validation" ? "Validation humaine" : "Normale",
      createdAt: item.date_creation,
      travelDate: client.date_depart,
    };
  });
}

function buildMonthlyRevenue(rows) {
  const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatter.format(date).replace(".", ""),
      total: 0,
    };
  });

  rows.forEach((row) => {
    const date = row.createdAt ? new Date(row.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = months.find((item) => item.key === key);
    if (month) {
      month.total += row.rawPrice;
    }
  });

  const max = Math.max(...months.map((month) => month.total), 1);

  return months.map((month) => ({
    ...month,
    height: Math.max(8, Math.round((month.total / max) * 100)),
  }));
}

function Dashboard() {
  const navigate = useNavigate();
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
  const monthlyRevenue = useMemo(() => buildMonthlyRevenue(rows), [rows]);
  const validationCount = rows.filter((row) => row.priority === "Validation humaine").length;
  const sentCount = rows.filter((row) => row.status === "Envoyé").length;
  const pendingCount = rows.filter((row) => row.status === "En validation" || row.status === "Brouillon").length;
  const totalRevenue = rows.reduce((sum, row) => sum + row.rawPrice, 0);
  const averageQuote = rows.length ? Math.round(totalRevenue / rows.length) : 0;
  const conversionRate = rows.length ? Math.round((sentCount / rows.length) * 100) : 0;
  const requestsToHandle = pendingCount + validationCount;
  const handledRequests = sentCount;
  const recentRows = rows.slice(0, 5);

  const stats = [
    { label: "Chiffre d'affaires devisé", value: formatCurrency(totalRevenue), helper: "Total des devis générés" },
    { label: "Devis moyen", value: formatCurrency(averageQuote), helper: "Panier moyen estimé" },
    { label: "Devis envoyés", value: sentCount, helper: "Dossiers transmis aux clients" },
    { label: "Taux d'envoi", value: `${conversionRate}%`, helper: "Part des devis envoyés" },
  ];

  const statusTotal = Math.max(rows.length, 1);
  const statusSegments = [
    { label: "Envoyés", value: sentCount, color: "#28d46f" },
    { label: "En attente", value: pendingCount, color: "#ff7a1a" },
    { label: "Validation", value: validationCount, color: "#ef4444" },
  ];

  const handleSignOut = () => {
    signOutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <nav aria-label="Navigation commerciale">
          <Link className="active" to="/dashboard">Dashboard</Link>
          <a href="#demandes">Demandes</a>
          <a href="#revenus">Revenus</a>
          <a href="#devis">Devis</a>
          <a href="#parametres">Paramètres</a>
        </nav>
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
        </header>

        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <h1>Pilotage commercial</h1>
              <p>Vue claire des demandes, revenus devisés et dossiers à traiter.</p>
            </div>
            <div className="dashboard-actions">
              <button type="button">Derniers 6 mois</button>
              <Link className="dark-action" to="/assistant">Nouvelle demande</Link>
              <button type="button" onClick={handleSignOut}>Déconnexion</button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.helper}</small>
              </article>
            ))}
          </div>

          <section className="requests-focus-card" id="demandes">
            <div className="requests-focus-top">
              <div>
                <h2>Demandes commerciales</h2>
                <p>Les dossiers à traiter et les demandes déjà traitées sont séparés du pilotage financier.</p>
              </div>
              <Link to="/assistant">Créer une demande</Link>
            </div>

            <div className="demand-summary-grid">
              <article className="demand-summary-card is-pending">
                <span>À traiter</span>
                <strong>{requestsToHandle}</strong>
                <small>{validationCount} validation humaine · {pendingCount} en attente</small>
              </article>
              <article className="demand-summary-card is-treated">
                <span>Traitées</span>
                <strong>{handledRequests}</strong>
                <small>Devis envoyés aux clients</small>
              </article>
            </div>

            {isLoading && <p className="dashboard-alert">Chargement des devis...</p>}
            {error && <p className="dashboard-alert error">{error}</p>}

            {!isLoading && !error && (
              <div className="request-preview-list">
                {recentRows.length === 0 ? (
                  <p className="dashboard-alert">Aucune demande enregistrée pour le moment.</p>
                ) : (
                  recentRows.map((request) => (
                    <article key={request.id}>
                      <div>
                        <strong>{request.client}</strong>
                        <span>{request.trip}</span>
                      </div>
                      <div>
                        <b>{request.price}</b>
                        <small>{formatDate(request.travelDate)}</small>
                      </div>
                      <span className={`status-pill status-${normalizeStatus(request.status)}`}>{request.status}</span>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="dashboard-analytics-grid" id="revenus">
            <article className="analytics-card revenue-card">
              <div className="analytics-card-top">
                <div>
                  <h2>Revenus par mois</h2>
                  <p>Total des devis générés sur les 6 derniers mois.</p>
                </div>
                <strong>{formatCurrency(totalRevenue)}</strong>
              </div>
              <div className="revenue-chart" aria-label="Graphique des revenus mensuels">
                {monthlyRevenue.map((month) => (
                  <div className="revenue-bar-item" key={month.key}>
                    <span>{formatCurrency(month.total)}</span>
                    <div>
                      <i style={{ height: `${month.height}%` }} />
                    </div>
                    <small>{month.label}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="analytics-card status-card">
              <div className="analytics-card-top">
                <div>
                  <h2>Qualité du pipeline</h2>
                  <p>Répartition actuelle des dossiers commerciaux.</p>
                </div>
              </div>
              <div className="status-meter">
                <strong>{conversionRate}%</strong>
                <span>envoyés</span>
              </div>
              <div className="status-bars">
                {statusSegments.map((segment) => (
                  <div key={segment.label}>
                    <span>
                      <i style={{ background: segment.color }} />
                      {segment.label}
                    </span>
                    <b>{segment.value}</b>
                    <em style={{ width: `${(segment.value / statusTotal) * 100}%`, background: segment.color }} />
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="requests-card" id="devis">
            <div className="requests-top">
              <h2>Historique des devis</h2>
              <div>
                <button type="button" aria-label="Filtrer">⌄</button>
                <button type="button">Exporter</button>
              </div>
            </div>

            {error && <p className="dashboard-alert error">{error}</p>}

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
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
