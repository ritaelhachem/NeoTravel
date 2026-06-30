# NeoTravel — Backend

API Node.js/Express pour la génération automatisée de devis de transport de groupe en autocar.

---

## Stack

- **Node.js / Express** — serveur HTTP
- **Supabase** (PostgreSQL) — stockage clients, devis, relances
- **Claude 3.5 Haiku** (Vercel AI Gateway) — extraction NLP + réponse conversationnelle
- **OpenRouteService** — calcul de distance routière
- **TollGuru** — calcul des coûts de péage
- **PDFKit** — génération du PDF de devis
- **Nodemailer** — envoi du devis par e-mail (SMTP Gmail)

---

## Installation

```bash
cd backend
npm install
cp .env.example .env   # renseigner toutes les variables
npm start              # écoute sur http://localhost:5000
```

Mode dev avec hot-reload :

```bash
npm run dev
```

---

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut : `5000`) |
| `CLIENT_URL` | URL autorisée par CORS (ex. `http://localhost:3000`) |
| `SUPABASE_URL` | URL REST de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (accès total) |
| `VERCEL_AI_API_KEY` | Clé Vercel AI Gateway (`vck_...`) |
| `VERCEL_AI_MODEL` | Modèle IA (défaut : `anthropic/claude-3-5-haiku-20241022`) |
| `ORS_API_KEY` | Clé OpenRouteService (calcul distance) |
| `TOLLGURU_API_KEY` | Clé TollGuru (calcul péages) |
| `SMTP_HOST` | Serveur SMTP (ex. `smtp.gmail.com`) |
| `SMTP_PORT` | Port SMTP (`587`) |
| `SMTP_SECURE` | TLS direct (`false` pour STARTTLS) |
| `SMTP_USER` | Adresse e-mail expéditeur |
| `SMTP_PASS` | Mot de passe applicatif Gmail |
| `SMTP_FROM` | Libellé expéditeur (ex. `NeoTravel <adresse@...>`) |

> **Changer de modèle IA** : ajouter `GEMINI_API_KEY`, `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, `AI_MODEL=gemini-2.0-flash` pour passer sur Gemini.

---

## API

### Chat IA

#### `POST /api/chat`

Traite un message utilisateur, extrait les champs du devis via Claude, retourne une réponse conversationnelle.

**Body**
```json
{
  "message": "je pars de Nantes vers Paris le 19 octobre, retour le 29, nous serons 32, pour l'entreprise Apple",
  "answers": { "nom": "Apple" },
  "history": [
    { "role": "assistant", "content": "Bonjour ! Décrivez votre voyage..." },
    { "role": "user", "content": "..." }
  ]
}
```

**Réponse**
```json
{
  "reply": "J'ai besoin de votre e-mail et numéro de téléphone pour finaliser.",
  "answers": {
    "ville_depart": "Nantes",
    "ville_arrivee": "Paris",
    "date_depart": "2026-10-19",
    "date_retour": "2026-10-29",
    "nombre_passagers": "32",
    "type_trajet": "aller-retour",
    "nom": "Apple"
  },
  "missingFields": ["email", "telephone"]
}
```

#### `POST /api/chat/extract`

Extraction regex seule (sans appel IA). Utile pour tests unitaires.

---

### Devis

#### `POST /api/devis`

Crée un devis : calcule la distance, les péages, le prix, insère en base, génère le PDF et envoie l'e-mail.

**Body** — tous les champs obligatoires :
```json
{
  "nom": "Apple",
  "email": "contact@apple.com",
  "telephone": "06 12 34 56 78",
  "ville_depart": "Nantes",
  "ville_arrivee": "Paris",
  "nombre_passagers": 32,
  "date_depart": "2026-10-19",
  "type_trajet": "aller-retour",
  "date_retour": "2026-10-29"
}
```

**Réponse**
```json
{
  "saved": true,
  "client": { "id": "uuid", "nom": "Apple", ... },
  "devis":  { "id": "uuid", "prix": 2340, "peage": 87, ... },
  "calcul": {
    "distance_km": 385,
    "base_price": 1925,
    "cout_transport_hors_peage": 1700,
    "peage": 87,
    "marge": 0.15,
    "coefficient_saison": 0.10,
    "coefficient_urgence": -0.05,
    "coefficient_capacite": 0,
    "prix": 2340,
    "est_complexe": false
  }
}
```

#### `GET /api/devis`

Liste les 50 derniers devis avec leurs clients associés.

#### `POST /api/devis/email`

Renvoie le devis par e-mail à partir d'un `devis_id` ou des données brutes.

#### `POST /api/devis/pdf`

Télécharge le PDF du devis (`Content-Type: application/pdf`).

---

## Base de données (Supabase)

Schéma complet : `supabase/schema.sql`. Migrations : `supabase/`.

### Table `clients`

Stocke les informations de chaque demande de devis.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique généré automatiquement |
| `nom` | text | Nom du client ou de l'entreprise |
| `email` | text | Adresse e-mail de contact |
| `telephone` | text | Numéro de téléphone (optionnel) |
| `ville_depart` | text | Ville de départ du trajet |
| `ville_arrivee` | text | Ville d'arrivée |
| `date_depart` | date | Date de départ |
| `date_retour` | date | Date de retour (null si aller simple) |
| `nombre_passagers` | integer | Nombre total de passagers |
| `type_trajet` | text | `"aller-simple"` ou `"aller-retour"` |
| `distance_km` | integer | Distance calculée via OpenRouteService |
| `statut` | text | `"Devis généré"` / `"Validation humaine"` |
| `date_creation` | timestamptz | Horodatage de création |

### Table `devis`

Stocke le résultat financier et le PDF associé à chaque client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `client_id` | uuid (FK → clients) | Référence au client |
| `prix` | integer | Prix final TTC en euros |
| `peage` | decimal | Coût total des péages (€) |
| `details_peage` | jsonb | Détail des péages par tronçon (TollGuru) |
| `pdf` | text | PDF encodé en base64 (nullable) |
| `statut` | text | `"Envoyé"` / `"En validation"` |
| `date_creation` | timestamptz | Horodatage de création |

### Table `relances`

Gère les relances automatiques des clients n'ayant pas donné suite.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `client_id` | uuid (FK → clients) | Client concerné |
| `devis_id` | uuid (FK → devis) | Devis associé |
| `statut` | text | `"programmée"` / `"envoyée"` / `"annulée"` |
| `canal` | text | Canal de relance (`"email"`) |
| `date_relance` | timestamptz | Date prévue pour la relance |
| `date_creation` | timestamptz | Horodatage de création |

---

## Calcul du prix

Le prix final est calculé par `services/calculerDevis.js` selon la formule :

```
Prix = (base_transport + péage) × (1 + marge) × (1 + saison) × (1 + urgence) × (1 + capacité)
```

**Base transport** — grille tarifaire au km (aller simple) :

| Distance | Prix de base |
|----------|-------------|
| ≤ 30 km | 250 € |
| ≤ 50 km | 350 € |
| ≤ 100 km | 580 € |
| ≤ 150 km | 780 € |
| ≤ 180 km | 900 € |
| > 180 km | distance × 2 × 2,5 € |

Aller-retour : base × 2.

**Marge fixe** : +15 %

**Coefficient saisonnalité** :

| Mois | Coefficient |
|------|-------------|
| Nov, Jan, Fév, Aoû | −7 % |
| Sep, Oct, Déc | 0 % |
| Mar, Avr, Jul | +10 % |
| Mai, Jun | +15 % |

**Coefficient urgence** (délai avant départ) :

| Délai | Coefficient |
|-------|-------------|
| ≤ 7 jours | +10 % |
| ≤ 30 jours | +5 % |
| ≤ 90 jours | −5 % |
| > 90 jours | −10 % |

**Coefficient capacité** :

| Passagers | Coefficient |
|-----------|-------------|
| ≤ 19 | −5 % |
| 20–53 | 0 % |
| 54–63 | +15 % |
| 64–67 | +20 % |
| 68–85 | +40 % |
| > 85 | Validation commerciale (prix non calculé automatiquement) |

---

## Service IA

`services/vercelAIService.js` — un seul appel à Claude 3.5 Haiku par message.

**Entrée** : message utilisateur + historique + champs déjà collectés.

**Sortie** attendue du modèle :
```json
{ "reply": "...", "answers": { "champ": "valeur" } }
```

Claude extrait simultanément tous les champs et génère la prochaine question. L'email et le téléphone sont en plus vérifiés par regex. Les `missingFields` sont calculés côté serveur à partir de l'état fusionné.

Champs gérés : `nom`, `email`, `telephone`, `ville_depart`, `ville_arrivee`, `nombre_passagers`, `date_depart`, `type_trajet`, `date_retour`.

Règles strictes injectées dans le prompt système : pas de validation ("c'est bien ça ?"), pas de récapitulatif, une seule question groupée, transport toujours en autocar, année par défaut 2026.

---

## Structure des fichiers

```
backend/
├── server.js
├── .env
├── config/
│   └── supabase.js
├── routes/
│   ├── chat.js
│   └── devis.js
├── controllers/
│   ├── chatController.js
│   └── devisController.js
├── middlewares/
│   ├── errorHandler.js
│   └── notFound.js
├── services/
│   ├── vercelAIService.js   # IA : extraction + réponse
│   ├── messageParser.js     # parsing regex (email, téléphone)
│   ├── calculerDevis.js     # tarification
│   ├── distanceService.js   # OpenRouteService
│   ├── tollService.js       # TollGuru
│   ├── pdfService.js        # génération PDF
│   └── mailService.js       # envoi e-mail
└── supabase/
    ├── schema.sql
    └── *.sql                # migrations
```
