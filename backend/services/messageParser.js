const REQUIRED_FIELDS = [
  "nom",
  "email",
  "telephone",
  "ville_depart",
  "ville_arrivee",
  "nombre_passagers",
  "date_depart",
  "type_trajet",
];

const FIELD_LABELS = {
  nom: "votre nom",
  email: "votre adresse e-mail",
  telephone: "votre numero de telephone",
  ville_depart: "la ville de depart",
  ville_arrivee: "la ville d'arrivee",
  nombre_passagers: "le nombre de passagers",
  date_depart: "la date du trajet",
  type_trajet: "le type de trajet",
  date_retour: "la date de retour",
};

const MONTHS = {
  janvier: "01",
  fevrier: "02",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  aout: "08",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  decembre: "12",
  décembre: "12",
};

function cleanValue(value) {
  return String(value || "")
    .trim()
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function capitalizeWords(value) {
  return cleanValue(value)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function cleanCityName(value) {
  return capitalizeWords(
    cleanValue(value)
      .replace(/^(?:salut|bonjour|je\s+veux|je\s+voudrais|j'aimerais|aller|trajet|un|une|de|depuis)\s+/i, "")
      .replace(/\s+(?:aller[-\s]?retour|aller\s+simple|retour|simple).*$/i, "")
      .replace(/\s+(?:demain|aujourd'hui|aujourdhui|apres-demain|apres demain|après-demain|après demain).*$/i, "")
      .replace(/\s+(?:le|la|pour|avec|en|aller|retour)$/i, "")
  );
}

function normalizeDate(value) {
  const text = cleanValue(value).toLowerCase();

  if (/\b(apres|après)[-\s]demain\b/.test(text)) {
    return addDays(2);
  }

  if (/\bdemain\b/.test(text)) {
    return addDays(1);
  }

  if (/\baujourd'hui\b|\baujourdhui\b/.test(text)) {
    return addDays(0);
  }

  const isoMatch = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const slashMatch = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  }

  const monthMatch = text.match(
    /\b(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})\b/
  );
  if (monthMatch) {
    return `${monthMatch[3]}-${MONTHS[monthMatch[2]].padStart(2, "0")}-${monthMatch[1].padStart(2, "0")}`;
  }

  return "";
}

function extractDates(message) {
  const dates = [];

  const relativeDate = normalizeDate(message);
  if (relativeDate) {
    dates.push(relativeDate);
  }

  const patterns = [
    /\b20\d{2}-\d{1,2}-\d{1,2}\b/g,
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-]20\d{2}\b/g,
    /\b\d{1,2}\s+(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+20\d{2}\b/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = message.match(pattern) || [];
    matches.forEach((match) => {
      const normalized = normalizeDate(match);
      if (normalized && !dates.includes(normalized)) {
        dates.push(normalized);
      }
    });
  });

  return dates;
}

function extractCities(message) {
  const patterns = [
    /\b(?:de|depuis|depart\s+de|départ\s+de)\s+([a-zà-ÿ' -]{2,}?)\s+(?:a|à|vers|pour|destination|jusqu(?:'|’)?a|jusqu(?:'|’)?à)\s+([a-zà-ÿ' -]{2,}?)(?=\s+(?:le|du|pour|avec|en|aller|retour|simple|demain|aujourd'hui|aujourdhui|apres|après|\d|$)|[.,;!?]|$)/i,
    /\b([a-zà-ÿ' -]{2,}?)\s+(?:vers|a|à)\s+([a-zà-ÿ' -]{2,}?)(?=\s+(?:le|du|pour|avec|en|aller|retour|simple|demain|aujourd'hui|aujourdhui|apres|après|\d|$)|[.,;!?]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        ville_depart: cleanCityName(match[1]),
        ville_arrivee: cleanCityName(match[2]),
      };
    }
  }

  return {};
}

function extractName(message) {
  const match = message.match(
    /\b(?:je m'appelle|je m appelle|je suis|mon nom est|nom\s*:)\s+([a-zà-ÿ' -]{2,})(?=,|\.|;|\s+(?:email|mail|tel|tél|telephone|téléphone|de|depuis|je veux|pour|$))/i
  );
  return match ? cleanValue(match[1]) : "";
}

function extractPhone(message) {
  const match = message.match(/(?:\+?\d[\d\s.-]{7,}\d)/);
  return match ? cleanValue(match[0]) : "";
}

function extractPassengerCount(message) {
  const match =
    message.match(/\b(\d{1,3})\s*(?:personnes?|passagers?|voyageurs?|places?)\b/i) ||
    message.match(/\b(?:pour|avec)\s+(\d{1,3})\b/i);

  return match ? Number(match[1]) : "";
}

function extractTripType(message) {
  const text = message.toLowerCase();
  if (text.includes("aller-retour") || text.includes("aller retour") || text.includes("retour")) {
    return "aller-retour";
  }

  if (text.includes("aller simple") || text.includes("simple")) {
    return "aller-simple";
  }

  return "";
}

function getMissingFields(answers) {
  const fields = [...REQUIRED_FIELDS];

  if (answers.type_trajet === "aller-retour") {
    fields.push("date_retour");
  }

  return fields.filter((field) => !String(answers[field] || "").trim());
}

function inferCurrentMissingAnswer(message, currentAnswers = {}) {
  const missingFields = getMissingFields(currentAnswers);
  const firstMissing = missingFields[0];
  const value = cleanValue(message);

  if (!firstMissing || !value) {
    return {};
  }

  if (firstMissing === "nom" && /^[a-zà-ÿ' -]{2,}$/i.test(value)) {
    return { nom: capitalizeWords(value) };
  }

  if (firstMissing === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { email: value };
  }

  if (firstMissing === "telephone" && /^\+?\d[\d\s.-]{7,}\d$/.test(value)) {
    return { telephone: value };
  }

  if ((firstMissing === "date_depart" || firstMissing === "date_retour") && normalizeDate(value)) {
    return { [firstMissing]: normalizeDate(value) };
  }

  if (firstMissing === "nombre_passagers" && /^\d{1,3}$/.test(value)) {
    return { nombre_passagers: Number(value) };
  }

  if (firstMissing === "type_trajet" && extractTripType(value)) {
    return { type_trajet: extractTripType(value) };
  }

  if ((firstMissing === "ville_depart" || firstMissing === "ville_arrivee") && /^[a-zà-ÿ' -]{2,}$/i.test(value)) {
    return { [firstMissing]: cleanCityName(value) };
  }

  return {};
}

function buildNextQuestion(missingFields) {
  if (!missingFields.length) {
    return "Parfait, j'ai toutes les informations necessaires pour generer votre devis.";
  }

  const firstMissing = missingFields[0];

  if (missingFields.length === 1) {
    return `Il me manque seulement ${FIELD_LABELS[firstMissing]}. Pouvez-vous me l'indiquer ?`;
  }

  return `J'ai deja recupere plusieurs informations. Il me manque encore ${FIELD_LABELS[firstMissing]}.`;
}

function extractQuoteInfo(message, currentAnswers = {}) {
  const extracted = {};
  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const dates = extractDates(message);
  const cities = extractCities(message);
  const name = extractName(message);
  const phone = extractPhone(message);
  const passengerCount = extractPassengerCount(message);
  const tripType = extractTripType(message);
  const contextualAnswer = inferCurrentMissingAnswer(message, currentAnswers);

  if (name) extracted.nom = name;
  if (emailMatch) extracted.email = emailMatch[0];
  if (phone) extracted.telephone = phone;
  if (cities.ville_depart) extracted.ville_depart = cities.ville_depart;
  if (cities.ville_arrivee) extracted.ville_arrivee = cities.ville_arrivee;
  if (passengerCount) extracted.nombre_passagers = passengerCount;
  if (tripType) extracted.type_trajet = tripType;
  if (dates[0]) extracted.date_depart = dates[0];
  if (dates[1]) extracted.date_retour = dates[1];

  const answers = {
    ...currentAnswers,
    ...contextualAnswer,
    ...extracted,
  };

  if (answers.type_trajet !== "aller-retour") {
    answers.date_retour = "";
  }

  const missingFields = getMissingFields(answers);

  return {
    extracted: {
      ...contextualAnswer,
      ...extracted,
    },
    answers,
    missingFields,
    complete: missingFields.length === 0,
    reply: buildNextQuestion(missingFields),
  };
}

module.exports = {
  extractQuoteInfo,
  getMissingFields,
};
