function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function calculerDevis(payload = {}) {
  const passengers = Math.max(1, toNumber(payload.passengers, 1));
  const distanceKm = Math.max(20, toNumber(payload.distanceKm, 120));
  const basePrice = 250;
  const pricePerKm = 2.2;
  const pricePerPassenger = 7;
  const roundTripMultiplier =
    String(payload.tripType || "").toLowerCase().includes("retour") ? 1.8 : 1;

  const estimatedPrice = Math.round(
    (basePrice + distanceKm * pricePerKm + passengers * pricePerPassenger) *
      roundTripMultiplier
  );

  return {
    departure: payload.departure || payload.depart || "",
    destination: payload.destination || "",
    passengers,
    date: payload.date || payload.travelDate || null,
    tripType: payload.tripType || "Aller simple",
    distanceKm,
    estimatedPrice,
    currency: "EUR",
    breakdown: {
      basePrice,
      pricePerKm,
      pricePerPassenger,
      roundTripMultiplier,
    },
  };
}

module.exports = calculerDevis;
