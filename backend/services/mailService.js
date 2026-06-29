const nodemailer = require("nodemailer");
const { createQuotePdfBuffer, getReference } = require("./pdfService");

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  const auth =
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth,
  });
}

function buildQuoteText({ client = {}, calcul = {}, devis = {} }) {
  devis = devis || {};
  const reference = devis.id ? `NT-${String(devis.id).slice(0, 8).toUpperCase()}` : "NT-PROVISOIRE";

  if (calcul.est_complexe) {
    return [
      `Bonjour ${client.nom || ""},`,
      "",
      "Votre demande NeoTravel nécessite une validation commerciale.",
      `Motif : ${calcul.motif_complexite}`,
      "",
      `Trajet : ${calcul.ville_depart} -> ${calcul.ville_arrivee}`,
      `Date aller : ${calcul.date_depart}`,
      calcul.date_retour ? `Date retour : ${calcul.date_retour}` : null,
      `Passagers : ${calcul.nombre_passagers}`,
      `Référence : ${reference}`,
      "",
      "Un conseiller vous recontactera rapidement.",
      "",
      "NeoTravel",
    ].filter(Boolean).join("\n");
  }

  return [
    `Bonjour ${client.nom || ""},`,
    "",
    "Votre devis NeoTravel est prêt.",
    "",
    `Trajet : ${calcul.ville_depart} -> ${calcul.ville_arrivee}`,
    `Date aller : ${calcul.date_depart}`,
    calcul.date_retour ? `Date retour : ${calcul.date_retour}` : null,
    `Distance : ${calcul.distance_km} km`,
    `Passagers : ${calcul.nombre_passagers}`,
    `Type de trajet : ${calcul.type_trajet}`,
    `Prix estimé TTC : ${formatCurrency(calcul.prix)}`,
    `Référence : ${reference}`,
    "",
    "Ce devis reste provisoire jusqu'à validation de la disponibilité transporteur.",
    "",
    "NeoTravel",
  ].filter(Boolean).join("\n");
}

async function sendQuoteEmail({ to, client, calcul, devis }) {
  if (!to) {
    const error = new Error("Adresse e-mail destinataire manquante.");
    error.status = 400;
    throw error;
  }

  const transporter = createTransporter();
  const text = buildQuoteText({ client, calcul, devis });
  const pdfBuffer = await createQuotePdfBuffer({ client, calcul, devis });
  const reference = getReference(devis, client).toLowerCase();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "NeoTravel <no-reply@neotravel.local>",
    to,
    subject: calcul?.est_complexe ? "Votre demande NeoTravel est en validation" : "Votre devis NeoTravel",
    text,
    attachments: [
      {
        filename: `devis-${reference}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    messageId: info.messageId,
    simulated: !process.env.SMTP_HOST,
    attachment: `devis-${reference}.pdf`,
  };
}

module.exports = {
  buildQuoteText,
  sendQuoteEmail,
};
