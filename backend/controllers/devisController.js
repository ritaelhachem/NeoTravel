const supabase = require("../config/supabase");
const calculerDevis = require("../services/calculerDevis");
const calculateDistanceKm = require("../services/distanceService");
const { sendQuoteEmail } = require("../services/mailService");
const { createQuotePdfBuffer, getReference } = require("../services/pdfService");

function buildSavedCalcul(devis = {}, fallbackCalcul = {}) {
  const client = devis.clients || {};
  const input = {
    ville_depart: client.ville_depart,
    ville_arrivee: client.ville_arrivee,
    date_depart: client.date_depart,
    date_retour: client.date_retour,
    nombre_passagers: client.nombre_passagers,
    type_trajet: client.type_trajet,
    distance_km: client.distance_km,
  };

  const computedCalcul =
    input.ville_depart &&
    input.ville_arrivee &&
    input.date_depart &&
    input.nombre_passagers &&
    input.type_trajet &&
    input.distance_km
      ? calculerDevis(input)
      : {};

  return {
    ...fallbackCalcul,
    ...computedCalcul,
    prix: devis.prix ?? computedCalcul.prix ?? fallbackCalcul?.prix ?? null,
    est_complexe: devis.statut === "En validation" || Boolean(computedCalcul.est_complexe || fallbackCalcul?.est_complexe),
    motif_complexite:
      computedCalcul.motif_complexite ||
      fallbackCalcul?.motif_complexite ||
      (devis.statut === "En validation" ? "Validation commerciale nécessaire" : null),
  };
}

async function createDevis(req, res, next) {
  try {
    const input = req.body;

    if (String(input.type_trajet || "").includes("retour")) {
      if (!input.date_retour) {
        return res.status(400).json({
          error: "La date de retour est obligatoire pour un aller-retour.",
        });
      }

      if (input.date_depart && input.date_retour <= input.date_depart) {
        return res.status(400).json({
          error: "La date de retour doit être après la date de départ.",
        });
      }
    }

    if (!input.distance_km) {
      input.distance_km = await calculateDistanceKm(input.ville_depart, input.ville_arrivee);
    }

    const calcul = calculerDevis(input);

    if (!supabase) {
      return res.status(201).json({
        calcul,
        client: {
          nom: input.nom || "Client test",
          email: input.email || "client@test.com",
          telephone: input.telephone || null,
        },
        devis: null,
        saved: false,
        message: "Devis calculé, mais Supabase n'est pas configuré.",
      });
    }

    const clientPayload = {
      nom: input.nom || "Client test",
      email: input.email || "client@test.com",
      telephone: input.telephone || null,
      ville_depart: input.ville_depart,
      ville_arrivee: input.ville_arrivee,
      date_depart: input.date_depart,
      nombre_passagers: input.nombre_passagers,
      type_trajet: input.type_trajet,
      distance_km: input.distance_km,
      statut: calcul.est_complexe ? "Validation humaine" : "Devis généré",
    };

    if (input.date_retour) {
      clientPayload.date_retour = input.date_retour;
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert(clientPayload)
      .select()
      .single();

    if (clientError) throw clientError;

    const { data: devis, error: devisError } = await supabase
      .from("devis")
      .insert({
        client_id: client.id,
        prix: calcul.prix,
        pdf: null,
        statut: calcul.est_complexe ? "En validation" : "Envoyé",
      })
      .select()
      .single();

    if (devisError) throw devisError;

    return res.status(201).json({
      saved: true,
      client,
      devis,
      calcul,
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
        message: "Supabase n'est pas configuré.",
      });
    }

    const { data, error } = await supabase
      .from("devis")
      .select(`
        *,
        clients (*)
      `)
      .order("date_creation", { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({ devis: data });
  } catch (error) {
    return next(error);
  }
}

async function sendDevisEmail(req, res, next) {
  try {
    const { devis_id, email, client: requestClient, calcul: requestCalcul, devis: requestDevis } = req.body;
    let client = requestClient;
    let calcul = requestCalcul;
    let devis = requestDevis;

    if (devis_id && supabase) {
      const { data, error } = await supabase
        .from("devis")
        .select(`
          *,
          clients (*)
        `)
        .eq("id", devis_id)
        .single();

      if (error) throw error;

      devis = data;
      client = data.clients;
      calcul = buildSavedCalcul(data, requestCalcul);
    }

    const to = email || client?.email;
    const result = await sendQuoteEmail({
      to,
      client,
      calcul,
      devis,
    });

    return res.json({
      sent: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

async function downloadDevisPdf(req, res, next) {
  try {
    const { devis_id, client: requestClient, calcul: requestCalcul, devis: requestDevis } = req.body;
    let client = requestClient || {};
    let calcul = requestCalcul;
    let devis = requestDevis || {};

    if (devis_id && supabase) {
      const { data, error } = await supabase
        .from("devis")
        .select(`
          *,
          clients (*)
        `)
        .eq("id", devis_id)
        .single();

      if (error) throw error;

      devis = data;
      client = data.clients || {};
      calcul = buildSavedCalcul(data, requestCalcul);
    }

    if (!calcul) {
      return res.status(400).json({
        error: "Données de devis manquantes pour générer le PDF.",
      });
    }

    const pdfBuffer = await createQuotePdfBuffer({ client, calcul, devis });
    const reference = getReference(devis, client).toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="devis-${reference}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDevis,
  listDevis,
  sendDevisEmail,
  downloadDevisPdf,
};
