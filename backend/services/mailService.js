const nodemailer = require("nodemailer");
const dns = require("dns");
const { createQuotePdfBuffer, getReference } = require("./pdfService");

dns.setDefaultResultOrder("ipv4first");

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
    family: 4,
    lookup(hostname, options, callback) {
      return dns.lookup(hostname, { ...options, family: 4 }, callback);
    },
    auth,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 15000),
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

  let info;

  try {
    console.log("SMTP CONFIG:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      family: 4,
    });

    info = await transporter.sendMail({
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
  } catch (error) {
    console.error("SMTP ERROR:", {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
      stack: error.stack,
    });

    const mailError = new Error(
      `Envoi e-mail impossible (${error.code || error.responseCode || "SMTP"}): ${error.message}`
    );
    mailError.status = 502;
    throw mailError;
  }

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
