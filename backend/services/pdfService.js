const PDFDocument = require("pdfkit");

const colors = {
  ink: "#171a22",
  muted: "#667085",
  line: "#d9dee8",
  soft: "#f5f7fb",
  dark: "#111111",
  success: "#247b45",
  danger: "#b42318",
};

function formatPrice(value) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(Number(value || 0))
    .replace(/[\u00a0\u202f]/g, " ");

  return `${formatted} EUR`;
}

function formatCoeff(value) {
  return `${Number(value || 0) > 0 ? "+" : ""}${Math.round(Number(value || 0) * 100)}%`;
}

function formatDate(value) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getTollLabel(details = {}) {
  if (details?.status === "calculated") {
    return "TollGuru";
  }

  if (details?.status === "estimated_fallback") {
    return "Estimation distance";
  }

  return "Estimation non disponible";
}

function getReference(devis = {}, client = {}) {
  const id = devis?.id || client?.id;
  return id ? `NT-${String(id).slice(0, 8).toUpperCase()}` : "NT-PROVISOIRE";
}

function text(doc, value, options = {}) {
  const normalizedValue = String(value ?? "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[·•]/g, "-");

  doc
    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(options.size || 10)
    .fillColor(options.color || colors.ink)
    .text(normalizedValue, options.x, options.y, options);
}

function labelValue(doc, label, value, x, y, width) {
  text(doc, label.toUpperCase(), {
    x,
    y,
    width,
    size: 7,
    color: colors.muted,
    characterSpacing: 0.4,
  });
  text(doc, value || "Non renseigné", {
    x,
    y: y + 12,
    width,
    size: 10.5,
    bold: true,
  });
}

function drawCard(doc, x, y, width, height, title) {
  doc
    .roundedRect(x, y, width, height, 8)
    .fillAndStroke("#ffffff", colors.line);

  text(doc, title, {
    x: x + 18,
    y: y + 16,
    width: width - 36,
    size: 12,
    bold: true,
  });
}

function drawTableRow(doc, y, label, detail, value, isLast = false, danger = false) {
  const x = 66;
  const width = 462;

  text(doc, label, { x, y, width: 190, size: 10.5, bold: true });
  text(doc, detail, { x: x + 190, y, width: 170, size: 9.5, color: colors.muted });
  text(doc, value, {
    x: x + 360,
    y,
    width: 102,
    size: 10.5,
    bold: true,
    align: "right",
    color: danger ? colors.danger : colors.ink,
  });

  if (!isLast) {
    doc
      .moveTo(x, y + 25)
      .lineTo(x + width, y + 25)
      .strokeColor(colors.line)
      .lineWidth(0.6)
      .stroke();
  }
}

function drawHeader(doc, reference, generatedAt, isComplex) {
  doc.rect(0, 0, 595.28, 138).fill(colors.dark);

  text(doc, "NeoTravel", {
    x: 48,
    y: 36,
    width: 180,
    size: 24,
    bold: true,
    color: "#ffffff",
  });
  text(doc, "Devis de transport de groupe", {
    x: 48,
    y: 70,
    width: 260,
    size: 12,
    color: "#d7dae0",
  });

  doc
    .roundedRect(372, 34, 155, 32, 16)
    .fill(isComplex ? "#fff1f1" : "#eef8f2");
  text(doc, isComplex ? "VALIDATION REQUISE" : "DEVIS PROVISOIRE", {
    x: 386,
    y: 44,
    width: 127,
    size: 8.5,
    bold: true,
    align: "center",
    color: isComplex ? colors.danger : colors.success,
  });

  text(doc, `Référence ${reference}`, {
    x: 340,
    y: 84,
    width: 187,
    size: 10,
    bold: true,
    color: "#ffffff",
    align: "right",
  });
  text(doc, `Généré le ${generatedAt}`, {
    x: 340,
    y: 101,
    width: 187,
    size: 9,
    color: "#d7dae0",
    align: "right",
  });
}

function createQuotePdfBuffer({ client = {}, calcul = {}, devis = {} }) {
  return new Promise((resolve, reject) => {
    devis = devis || {};
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const reference = getReference(devis, client);
    const generatedAt = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());

    drawHeader(doc, reference, generatedAt, Boolean(calcul.est_complexe));

    drawCard(doc, 48, 168, 235, 130, "Client");
    labelValue(doc, "Nom", client.nom || "Client test", 66, 204, 190);
    labelValue(doc, "E-mail", client.email || "client@test.com", 66, 244, 190);

    drawCard(doc, 312, 168, 235, 130, "Trajet");
    labelValue(doc, "Départ", calcul.ville_depart, 330, 204, 90);
    labelValue(doc, "Arrivée", calcul.ville_arrivee, 436, 204, 90);
    labelValue(doc, "Date aller", formatDate(calcul.date_depart), 330, 244, 90);
    labelValue(doc, "Date retour", calcul.date_retour ? formatDate(calcul.date_retour) : "Non applicable", 436, 244, 90);

    doc
      .roundedRect(48, 322, 499, 72, 8)
      .fillAndStroke(colors.soft, colors.line);
    labelValue(doc, "Distance calculée", calcul.distance_km ? `${calcul.distance_km} km` : "Non renseignée", 66, 344, 100);
    labelValue(doc, "Type de trajet", calcul.type_trajet, 186, 344, 100);
    labelValue(doc, "Passagers", calcul.nombre_passagers, 306, 344, 80);
    labelValue(
      doc,
      "Statut",
      calcul.est_complexe ? "Validation commerciale" : "Calcul automatique",
      406,
      344,
      120
    );

    doc
      .roundedRect(48, 426, 499, calcul.est_complexe ? 118 : 370, 8)
      .fillAndStroke("#ffffff", colors.line);

    text(doc, "Calcul commercial détaillé", {
      x: 66,
      y: 448,
      width: 240,
      size: 13,
      bold: true,
    });

    if (calcul.est_complexe) {
      text(doc, "Validation commerciale requise", {
        x: 66,
        y: 482,
        width: 430,
        size: 14,
        bold: true,
        color: colors.danger,
      });
      text(doc, calcul.motif_complexite || "Demande complexe.", {
        x: 66,
        y: 508,
        width: 430,
        size: 10,
        color: colors.muted,
      });
    } else {
      text(doc, "Base x marge x saison x urgence x capacité", {
        x: 66,
        y: 468,
        width: 430,
        size: 9,
        color: colors.muted,
      });

      drawTableRow(doc, 504, "Transport hors péage", `${calcul.distance_km} km · ${calcul.type_trajet}`, formatPrice(calcul.cout_transport_hors_peage ?? calcul.base_price));
      drawTableRow(doc, 538, "Péages", getTollLabel(calcul.details_peage), formatPrice(calcul.peage));
      drawTableRow(doc, 572, "Base commerciale", "Transport + péages", formatPrice(calcul.base_price));
      drawTableRow(doc, 606, "Marge commerciale", "Frais de service NeoTravel", formatCoeff(calcul.marge), false, true);
      drawTableRow(doc, 640, "Coefficient saison", "Selon le mois du départ", formatCoeff(calcul.coefficient_saison), false, Number(calcul.coefficient_saison) > 0);
      drawTableRow(doc, 674, "Coefficient urgence", "Selon le délai avant départ", formatCoeff(calcul.coefficient_urgence), false, Number(calcul.coefficient_urgence) > 0);
      drawTableRow(doc, 708, "Coefficient capacité", `${calcul.nombre_passagers} passagers`, formatCoeff(calcul.coefficient_capacite), true, Number(calcul.coefficient_capacite) > 0);

      doc
        .roundedRect(320, 730, 209, 52, 8)
        .fillAndStroke(colors.dark, colors.dark);
      text(doc, "Total estimé TTC", {
        x: 338,
        y: 742,
        width: 173,
        size: 9,
        color: "#d7dae0",
        align: "right",
      });
      text(doc, formatPrice(calcul.prix), {
        x: 338,
        y: 758,
        width: 173,
        size: 18,
        bold: true,
        color: "#ffffff",
        align: "right",
      });

      text(
        doc,
        "Les prix peuvent varier selon la disponibilité réelle des transporteurs au moment de la validation.",
        {
          x: 66,
          y: 744,
          width: 225,
          size: 8.5,
          color: colors.muted,
        }
      );
    }

    text(
      doc,
      "Ce devis est provisoire et reste soumis à la disponibilité réelle des transporteurs au moment de la validation. Les services inclus comprennent chauffeur, carburant et assurances obligatoires.",
      {
        x: 48,
        y: 806,
        width: 499,
        size: 8.5,
        color: colors.muted,
        align: "center",
      }
    );

    doc.end();
  });
}

module.exports = {
  createQuotePdfBuffer,
  getReference,
};
