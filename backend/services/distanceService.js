const axios = require("axios");

function cleanCityName(city) {
  return String(city || "").trim();
}

function getApiKey() {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    throw new Error("ORS_API_KEY manquante dans le fichier .env");
  }

  return apiKey;
}

async function getCoordinates(city) {
  const apiKey = getApiKey();

  const response = await axios.get("https://api.openrouteservice.org/geocode/search", {
    params: {
      api_key: apiKey,
      text: cleanCityName(city),
      size: 1,
    },
  });

  const feature = response.data.features?.[0];

  if (!feature) {
    throw new Error(`Ville introuvable : ${city}`);
  }

  return feature.geometry.coordinates; // [longitude, latitude]
}

async function getRouteDistanceKm(apiKey, profile, start, end) {
  const response = await axios.post(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      coordinates: [start, end],
    },
    {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const meters = response.data.routes?.[0]?.summary?.distance;

  if (!meters) {
    throw new Error("Distance impossible à calculer.");
  }

  return Math.round(meters / 1000);
}

async function calculateDistanceKm(villeDepart, villeArrivee) {
  const apiKey = getApiKey();
  const start = await getCoordinates(villeDepart);
  const end = await getCoordinates(villeArrivee);

  try {
    return await getRouteDistanceKm(apiKey, "driving-hgv", start, end);
  } catch (error) {
    return getRouteDistanceKm(apiKey, "driving-car", start, end);
  }
}

module.exports = calculateDistanceKm;
