const axios = require("axios");

const TOLLGURU_URL = "https://apis.tollguru.com/toll/v2/origin-destination-waypoints";

function getNumericCost(costs = {}) {
  const candidates = [
    costs.tag,
    costs.cash,
    costs.licensePlate,
    costs.prepaidCard,
    costs.minimumTollCost,
    costs.maximumTollCost,
  ];

  const value = candidates.find(
    (candidate) => candidate !== null && candidate !== undefined && candidate !== "" && Number.isFinite(Number(candidate))
  );

  return value === undefined ? 0 : Number(value);
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

  console.log("TOLLGURU RESPONSE:", JSON.stringify(response.data, null, 2));

  const route = response.data?.routes?.[0] || response.data?.route || {};
  const amount = getNumericCost(route.costs || response.data?.costs);

  return {
    amount,
    currency: response.data?.currency || route.currency || "EUR",
    provider: "TollGuru",
    vehicle_type: vehicleType,
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
