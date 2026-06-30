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
  let city = cleanValue(value)
    .replace(/\s+(?:aller[-\s]?retour|aller\s+simple|retour|simple).*$/i, "")
    .replace(/\s+(?:demain|aujourd'hui|aujourdhui|apres-demain|apres demain|après-demain|après demain).*$/i, "")
    .replace(/\s+(?:le|la|pour|avec|en|aller|retour)$/i, "");

  let previous;
  do {
    previous = city;
    city = city.replace(/^(?:salut|bonjour|je\s+veux|je\s+voudrais|j'aimerais|aller|trajet|un|une|de|depuis)\s+/i, "");
  } while (city !== previous);

  return capitalizeWords(city);
}

function currentYear() {
  return new Date().getFullYear();
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

  // Date avec année explicite : "15 juillet 2026"
  const monthWithYear = text.match(
    /\b(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})\b/
  );
  if (monthWithYear) {
    return `${monthWithYear[3]}-${MONTHS[monthWithYear[2]].padStart(2, "0")}-${monthWithYear[1].padStart(2, "0")}`;
  }

  // Date sans année : "15 juillet" → on utilise l'année courante
  const monthNoYear = text.match(
    /\b(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\b/
  );
  if (monthNoYear) {
    return `${currentYear()}-${MONTHS[monthNoYear[2]].padStart(2, "0")}-${monthNoYear[1].padStart(2, "0")}`;
  }

  return "";
}

const MONTH_PATTERN = "janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre";

function extractDates(message) {
  const dates = [];

  const relativeDate = normalizeDate(message);
  if (relativeDate) {
    dates.push(relativeDate);
  }

  const patterns = [
    /\b20\d{2}-\d{1,2}-\d{1,2}\b/g,
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-]20\d{2}\b/g,
    new RegExp(`\\b\\d{1,2}\\s+(?:${MONTH_PATTERN})\\s+20\\d{2}\\b`, "gi"),
    // Sans année : "15 juillet", "20 août"
    new RegExp(`\\b\\d{1,2}\\s+(?:${MONTH_PATTERN})\\b`, "gi"),
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

// Extrait la date de retour depuis un pattern "retour le N" quand le mois est connu via d'autres dates du message
function extractReturnDayOnly(message, departureDates) {
  const returnDayMatch = message.match(/(?:retour|retourne|reviens?)\s+(?:le\s+)?(\d{1,2})\b(?!\s*(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre))/i);
  if (!returnDayMatch || !departureDates.length) return "";

  const day = parseInt(returnDayMatch[1], 10);
  if (day < 1 || day > 31) return "";

  // Infère le mois depuis la première date de départ trouvée
  const refDate = departureDates[0];
  const [year, month] = refDate.split("-");
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function extractCities(message) {
  const STOP = "\\s+(?:le|du|pour|avec|en|aller|retour|simple|demain|aujourd’hui|aujourdhui|apres|après|\\d|$)|[.,;!?]|$";
  const patterns = [
    // "à Paris depuis Nantes", "vers Lyon de Paris", "je vais à Bordeaux depuis Lyon"
    // group1 = arrivée, group2 = départ (swap=true)
    // Lookbehind car "à" est un caractère accentué non reconnu comme \w par JS
    {
      re: new RegExp(`(?<=\\s|^|,)(?:à|a|vers)\\s+([a-zà-ÿ’ -]{2,}?)\\s+(?:depuis|de|en\\s+partant\\s+de)\\s+([a-zà-ÿ’ -]{2,}?)(?=${STOP})`, "i"),
      swap: true,
    },
    // "depuis Nantes à Paris", "de Paris vers Lyon"
    {
      re: /\b(?:de|depuis|depart\s+de|départ\s+de)\s+([a-zà-ÿ’ -]{2,}?)\s+(?:a|à|vers|pour|destination|jusqu(?:’|’)?a|jusqu(?:’|’)?à)\s+([a-zà-ÿ’ -]{2,}?)(?=\s+(?:le|du|pour|avec|en|aller|retour|simple|demain|aujourd’hui|aujourdhui|apres|après|\d|$)|[.,;!?]|$)/i,
      swap: false,
    },
    // "Nantes à Paris" (fallback générique, en dernier)
    {
      re: /\b([a-zà-ÿ’ -]{2,}?)\s+(?:vers|a|à)\s+([a-zà-ÿ’ -]{2,}?)(?=\s+(?:le|du|pour|avec|en|aller|retour|simple|demain|aujourd’hui|aujourdhui|apres|après|\d|$)|[.,;!?]|$)/i,
      swap: false,
    },
  ];

  for (const { re, swap } of patterns) {
    const match = message.match(re);
    if (match) {
      return {
        ville_depart: cleanCityName(swap ? match[2] : match[1]),
        ville_arrivee: cleanCityName(swap ? match[1] : match[2]),
      };
    }
  }

  return {};
}

const LEGAL_FORMS = "SA|SARL|SAS|SASU|EURL|SNC|SCOP|GIE|SCI|LLC|Ltd|GmbH|Inc\\.?|NV|BV";

function extractName(message) {
  // 1. Nom de personne : "je m'appelle X", "mon nom est X"
  const personMatch = message.match(
    /\b(?:je m['']appelle|je m appelle|mon nom est|nom\s*:)\s+([a-zà-ÿ' -]{2,})(?=[,;.]|\s+(?:email|mail|t[eé]l|t[eé]l[eé]phone|de|depuis|je veux|pour|$))/i
  );
  if (personMatch) return cleanValue(personMatch[1]);

  // 2. "je travaille chez X", "je suis chez X", "chez X"
  const chezMatch = message.match(
    /\b(?:je\s+(?:travaille|bosse|travaillons|bossons|suis)\s+(?:chez|pour)|chez)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 &.'-]{1,40}?)(?=[,;.!?\n]|\s+(?:et|ou|mais|je|pour|depuis|le|la|les|un|une|avec)|$)/i
  );
  if (chezMatch) return cleanValue(chezMatch[1]);

  // 3. Nom précédé de "pour la société / l'entreprise / au nom de" etc.
  // Capture le texte APRÈS le mot-clé jusqu'à la virgule ou fin
  const forMatch = message.match(
    /\b(?:(?:au nom|pour le compte)\s+d[eu']|(?:c['']est\s+)?pour\s+(?:l['']entreprise|la\s+soci[eé]t[eé]|le\s+cabinet|l['']association|la\s+mairie|l[''][eé]cole)|(?:entreprise|soci[eé]t[eé]|cabinet|association)\s*:?)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 &.'-]{1,50}?)(?=[,;.!?\n]|$)/i
  );
  if (forMatch) return cleanValue(forMatch[1]);

  // 3. Nom d'entreprise autonome avec forme juridique (mots en majuscule uniquement)
  // Ex : "Dupont & Fils SARL", "NeoTech SAS" — exclut les phrases banales en minuscule
  const legalFormMatch = message.match(
    new RegExp(`\\b([A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9]*(?:\\s+(?:[A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9]*|&|et))*)\\s+(?:${LEGAL_FORMS})\\b`)
  );
  if (legalFormMatch) return cleanValue(legalFormMatch[0]);

  return "";
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

  // Nom : message court sans chiffres, sans verbes de déplacement → probablement un nom
  if (
    firstMissing === "nom" &&
    value.length <= 60 &&
    /^[a-zà-ÿ' &.-]{2,}$/i.test(value) &&
    !/\b(?:je|je\s+vais|je\s+veux|je\s+cherche|depuis|aller|pour|avec|le|la|les|un|une|nous|bonjour)\b/i.test(value)
  ) {
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
  if (dates[1]) {
    extracted.date_retour = dates[1];
  } else {
    // Tente d'extraire "retour le 20" quand le mois est inférable depuis la date de départ
    const returnDay = extractReturnDayOnly(message, dates);
    if (returnDay) extracted.date_retour = returnDay;
  }

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
