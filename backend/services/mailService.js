const nodemailer = require("nodemailer");
const dns = require("dns");
const axios = require("axios");
const { createQuotePdfBuffer, getReference } = require("./pdfService");

dns.setDefaultResultOrder("ipv4first");

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

async function resolveSmtpHost(hostname) {
  if (!hostname) {
    return null;
  }

  try {
    const addresses = await dns.promises.resolve4(hostname);
    return addresses[0] || hostname;
  } catch (error) {
    console.error("SMTP DNS IPV4 ERROR:", {
      host: hostname,
      message: error.message,
    });
    return hostname;
  }
}

async function createTransporter() {
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
  const smtpHost = process.env.SMTP_HOST;
  const resolvedHost = await resolveSmtpHost(smtpHost);
  console.log("SMTP RESOLVED HOST:", {
    host: smtpHost,
    resolvedHost,
  });

  return nodemailer.createTransport({
    host: resolvedHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    lookup(hostname, options, callback) {
      return dns.lookup(hostname, { ...options, family: 4 }, callback);
    },
    auth,
    requireTLS: process.env.SMTP_SECURE !== "true",
    tls: {
      servername: smtpHost,
    },
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

function buildQuoteHtml({ client = {}, calcul = {}, devis = {} }) {
  devis = devis || {};
  const reference = devis.id ? `NT-${String(devis.id).slice(0, 8).toUpperCase()}` : "NT-PROVISOIRE";

  return `
    <div style="font-family: Arial, sans-serif; color: #191b22; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Votre devis NeoTravel est prêt</h2>
      <p>Bonjour ${client.nom || ""},</p>
      <p>Vous trouverez votre devis NeoTravel en pièce jointe.</p>
      <ul>
        <li><strong>Trajet :</strong> ${calcul.ville_depart || "-"} → ${calcul.ville_arrivee || "-"}</li>
        <li><strong>Date aller :</strong> ${calcul.date_depart || "-"}</li>
        ${calcul.date_retour ? `<li><strong>Date retour :</strong> ${calcul.date_retour}</li>` : ""}
        <li><strong>Passagers :</strong> ${calcul.nombre_passagers || "-"}</li>
        <li><strong>Prix estimé TTC :</strong> ${formatCurrency(calcul.prix)}</li>
        <li><strong>Référence :</strong> ${reference}</li>
      </ul>
      <p>Ce devis reste provisoire jusqu'à validation de la disponibilité transporteur.</p>
      <p>NeoTravel</p>
    </div>
  `;
}

async function sendQuoteEmailWithBrevo({ to, client, calcul, devis, text, pdfBuffer, reference }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return null;
  }

  const senderEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const senderName = process.env.BREVO_FROM_NAME || "NeoTravel";

  if (!senderEmail) {
    const error = new Error("BREVO_FROM_EMAIL manquante.");
    error.status = 500;
    throw error;
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
            name: client?.nom || undefined,
          },
        ],
        subject: calcul?.est_complexe ? "Votre demande NeoTravel est en validation" : "Votre devis NeoTravel",
        textContent: text,
        htmlContent: buildQuoteHtml({ client, calcul, devis }),
        attachment: [
          {
            name: `devis-${reference}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: Number(process.env.BREVO_TIMEOUT || 15000),
      }
    );

    return {
      messageId: response.data?.messageId || response.data?.messageIds?.[0] || null,
      provider: "brevo",
      simulated: false,
      attachment: `devis-${reference}.pdf`,
    };
  } catch (error) {
    console.error("BREVO ERROR:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const brevoError = new Error(
      `Envoi e-mail Brevo impossible (${error.response?.status || error.code || "API"}): ${
        error.response?.data?.message || error.message
      }`
    );
    brevoError.status = error.response?.status || 502;
    throw brevoError;
  }
}

async function sendQuoteEmail({ to, client, calcul, devis }) {
  if (!to) {
    const error = new Error("Adresse e-mail destinataire manquante.");
    error.status = 400;
    throw error;
  }

  const transporter = await createTransporter();
  const text = buildQuoteText({ client, calcul, devis });
  const pdfBuffer = await createQuotePdfBuffer({ client, calcul, devis });
  const reference = getReference(devis, client).toLowerCase();

  const brevoResult = await sendQuoteEmailWithBrevo({
    to,
    client,
    calcul,
    devis,
    text,
    pdfBuffer,
    reference,
  });

  if (brevoResult) {
    return brevoResult;
  }

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
