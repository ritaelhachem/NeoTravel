const supabase = require("../config/supabase");
const calculerDevis = require("../services/calculerDevis");

async function createDevis(req, res, next) {
  try {
    const devis = calculerDevis(req.body);

    if (!supabase) {
      return res.status(201).json({
        devis,
        saved: false,
        message: "Devis calcule, mais Supabase n'est pas configure.",
      });
    }

    const { data, error } = await supabase
      .from("devis")
      .insert({
        departure: devis.departure,
        destination: devis.destination,
        passengers: devis.passengers,
        trip_type: devis.tripType,
        travel_date: devis.date,
        distance_km: devis.distanceKm,
        estimated_price: devis.estimatedPrice,
        currency: devis.currency,
        details: devis,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      devis: data,
      saved: true,
    });
  } catch (error) {
    return next(error);
  }
}

async function listDevis(req, res, next) {
  try {
    if (!supabase) {
      return res.json({
        devis: [],
        message: "Supabase n'est pas configure.",
      });
    }

    const { data, error } = await supabase
      .from("devis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return res.json({ devis: data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDevis,
  listDevis,
};
