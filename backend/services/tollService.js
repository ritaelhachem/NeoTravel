const axios = require("axios");

const TOLLGURU_URL = "https://apis.tollguru.com/toll/v2/origin-destination-waypoints";

function getNumericCost(costs = {}) {
  const candidates = [
    costs.tagAndCash,
    costs.tag,
    costs.cash,
    costs.prepaidCard,
    costs.minimumTollCost,
    costs.maximumTollCost,
    costs.licensePlate,
  ];

  const value = candidates.find(
    (candidate) => candidate !== null && candidate !== undefined && candidate !== "" && Number.isFinite(Number(candidate))
  );

  return value === undefined ? 0 : Number(value);
}

function summarizeTolls(tolls = []) {
  if (!Array.isArray(tolls)) {
    return [];
  }

  return tolls.map((toll) => ({
    type: toll.type || null,
    amount: getNumericCost({
      tagAndCash: toll.tagAndCash,
      tag: toll.tagCost,
      cash: toll.cashCost,
      prepaidCard: toll.prepaidCardCost,
      licensePlate: toll.licensePlateCost,
    }),
    currency: toll.currency || "EUR",
    start: toll.start
      ? {
          name: toll.start.name || null,
          road: toll.start.road || null,
          state: toll.start.state || null,
        }
      : null,
    end: toll.end
      ? {
          name: toll.end.name || null,
          road: toll.end.road || null,
          state: toll.end.state || null,
        }
      : null,
  }));
}

function estimateToll(distanceKm, typeTrajet) {
  const oneWay = Math.round(Number(distanceKm || 0) * 0.16);
  return typeTrajet === "aller-retour" ? oneWay * 2 : oneWay;
}

async function requestTollGuru({ villeDepart, villeArrivee, vehicleType }) {
  const response = await axios.post(
    TOLLGURU_URL,
    {
      from: {
        address: villeDepart,
      },
      to: {
        address: villeArrivee,
      },
      vehicle: {
        type: vehicleType,
      },
    },
    {
      headers: {
        "x-api-key": process.env.TOLLGURU_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 12000,
    }
  );

  const route = response.data?.routes?.[0] || response.data?.route || {};
  const costs = route.costs || response.data?.costs || {};
  const amount = getNumericCost(costs);

  return {
    amount,
    currency: costs.currency || response.data?.currency || route.currency || "EUR",
    provider: "TollGuru",
    vehicle_type: vehicleType,
    fuel: Number(costs.fuel || 0),
    toll_count: Array.isArray(route.tolls) ? route.tolls.length : 0,
    tolls: summarizeTolls(route.tolls),
    route: {
      name: route.summary?.name || route.name || null,
      url: route.summary?.url || route.url || null,
      distance_km: Math.round(Number(route.summary?.distance?.value || route.distance?.value || 0) / 1000) || null,
      duration_seconds: route.summary?.duration?.value || route.duration?.value || null,
    },
    raw_status: response.data?.status || "ok",
  };
}

async function calculateTollCost({ villeDepart, villeArrivee, typeTrajet, distanceKm }) {
  if (!process.env.TOLLGURU_API_KEY) {
    const estimatedAmount = estimateToll(distanceKm, typeTrajet);

    return {
      amount: estimatedAmount,
      currency: "EUR",
      provider: "TollGuru",
      status: "estimated_fallback",
      message: "TOLLGURU_API_KEY manquante, peage estime a partir de la distance.",
    };
  }

  try {
    let result;

    try {
      result = await requestTollGuru({
        villeDepart,
        villeArrivee,
        vehicleType: "2AxlesAuto",
      });
    } catch (error) {
      result = await requestTollGuru({
        villeDepart,
        villeArrivee,
        vehicleType: "Bus",
      });
    }

    const multiplier = typeTrajet === "aller-retour" ? 2 : 1;

    return {
      ...result,
      amount: Math.round(result.amount * multiplier),
      one_way_amount: Math.round(result.amount),
      multiplier,
      status: "calculated",
    };
  } catch (error) {
    if (error.response?.data) {
      console.error("TOLLGURU ERROR RESPONSE:", JSON.stringify(error.response.data, null, 2));
    }

    const estimatedAmount = estimateToll(distanceKm, typeTrajet);

    return {
      amount: estimatedAmount,
      currency: "EUR",
      provider: "TollGuru",
      status: "estimated_fallback",
      original_status: "failed",
      original_message: error.response?.data?.message || error.message || "Peage impossible a calculer.",
      message: "Quota TollGuru depasse ou API indisponible, peage estime a partir de la distance.",
    };
  }
}

module.exports = calculateTollCost;
module.exports.estimateToll = estimateToll;
