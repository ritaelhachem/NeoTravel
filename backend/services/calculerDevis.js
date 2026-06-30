function getBasePrice(distanceKm) {
  const grille = [
    { max: 10, price: 250 },
    { max: 20, price: 250 },
    { max: 30, price: 250 },
    { max: 40, price: 320 },
    { max: 50, price: 350 },
    { max: 60, price: 390 },
    { max: 70, price: 430 },
    { max: 80, price: 500 },
    { max: 90, price: 540 },
    { max: 100, price: 580 },
    { max: 110, price: 620 },
    { max: 120, price: 660 },
    { max: 130, price: 700 },
    { max: 140, price: 740 },
    { max: 150, price: 780 },
    { max: 160, price: 820 },
    { max: 170, price: 860 },
    { max: 180, price: 900 },
  ];

  if (distanceKm <= 180) {
    return grille.find((row) => distanceKm <= row.max).price;
  }

  return distanceKm * 2 * 2.5;
}

function getSeasonCoeff(month) {
  if ([11, 1, 2, 8].includes(month)) return -0.07;
  if ([12, 10, 9].includes(month)) return 0;
  if ([3, 4, 7].includes(month)) return 0.10;
  if ([5, 6].includes(month)) return 0.15;
  return 0;
}

function getCapacityCoeff(passengers) {
  if (passengers <= 19) return -0.05;
  if (passengers <= 53) return 0;
  if (passengers <= 63) return 0.15;
  if (passengers <= 67) return 0.20;
  if (passengers <= 85) return 0.40;
  return null; // cas commercial
}

function getUrgencyCoeff(dateDepart) {
  const today = new Date();
  const departure = new Date(dateDepart);

  const diffDays = Math.ceil((departure - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 0.10;       // prioritaire
  if (diffDays <= 30) return 0.05;      // urgent
  if (diffDays <= 90) return -0.05;     // normal
  return -0.10;                         // 3 mois et plus
}

function calculerDevis(data) {
  const {
    ville_depart,
    ville_arrivee,
    distance_km,
    nombre_passagers,
    type_trajet,
    date_depart,
    date_retour,
    peage = 0,
    details_peage = null,
  } = data;

  const distance = Number(distance_km);
  const passengers = Number(nombre_passagers);
  const tollCost = Math.max(0, Number(peage || 0));

  const capacityCoeff = getCapacityCoeff(passengers);

  if (capacityCoeff === null) {
    return {
      ville_depart,
      ville_arrivee,
      distance_km: distance,
      nombre_passagers: passengers,
      type_trajet,
      date_depart,
      date_retour,
      base_price: null,
      cout_transport_hors_peage: null,
      peage: tollCost,
      details_peage,
      marge: 0.15,
      coefficient_saison: null,
      coefficient_urgence: null,
      coefficient_capacite: null,
      est_complexe: true,
      motif_complexite: "Plus de 85 passagers : validation commerciale nécessaire",
      prix: null,
    };
  }

  let transportPrice = getBasePrice(distance);

  if (type_trajet === "aller-retour") {
    transportPrice = transportPrice * 2;
  }

  const basePrice = transportPrice + tollCost;

  const marginCoeff = 0.15;
  const month = new Date(date_depart).getMonth() + 1;
  const seasonCoeff = getSeasonCoeff(month);
  const urgencyCoeff = getUrgencyCoeff(date_depart);

  const finalPrice =
    basePrice *
    (1 + marginCoeff) *
    (1 + seasonCoeff) *
    (1 + urgencyCoeff) *
    (1 + capacityCoeff);

  return {
    ville_depart,
    ville_arrivee,
    distance_km: distance,
    nombre_passagers: passengers,
    type_trajet,
    date_depart,
    date_retour,

    base_price: Math.round(basePrice),
    cout_transport_hors_peage: Math.round(transportPrice),
    peage: Math.round(tollCost),
    details_peage,
    marge: 0.15,
    coefficient_saison: seasonCoeff,
    coefficient_urgence: urgencyCoeff,
    coefficient_capacite: capacityCoeff,

    prix: Math.round(finalPrice),
    est_complexe: false,
    motif_complexite: null,
  };
}

module.exports = calculerDevis;
