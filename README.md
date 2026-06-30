# NeoTravel

Assistant IA de génération de devis pour le transport de groupe en autocar.

L'utilisateur décrit son voyage en langage naturel, l'IA extrait automatiquement toutes les informations, le panneau de résumé se met à jour en temps réel, et un devis PDF est généré et envoyé par e-mail.

---

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | React 19, React Router v6 |
| Backend | Node.js, Express |
| IA | Claude 3.5 Haiku via Vercel AI Gateway |
| Base de données | Supabase (PostgreSQL) |
| Distance | OpenRouteService API |
| Péages | TollGuru API |
| PDF | PDFKit |
| E-mail | Nodemailer (SMTP Gmail) |

---

## Structure

```
NeoTravel/
├── backend/
│   ├── server.js
│   ├── routes/          # chat.js, devis.js
│   ├── controllers/     # chatController.js, devisController.js
│   ├── services/
│   │   ├── vercelAIService.js   # extraction IA + réponse
│   │   ├── calculerDevis.js     # tarification (distance, saison, péages)
│   │   ├── distanceService.js   # OpenRouteService
│   │   ├── tollService.js       # TollGuru
│   │   ├── pdfService.js        # génération PDF
│   │   └── mailService.js       # envoi e-mail
│   └── .env
└── neotravel/
    └── src/
        └── pages/
            ├── LandingPage.jsx
            ├── AssistantIA.jsx   # chat + panneau de résumé
            ├── QuoteResult.jsx   # affichage du devis
            ├── Dashboard.jsx
            └── AdminLogin.jsx
```

---

## Installation

### Prérequis

- Node.js ≥ 18
- Un compte [Vercel](https://vercel.com) avec une clé AI Gateway (`vck_...`)
- Un compte [Supabase](https://supabase.com) avec le schéma initialisé (`backend/supabase/schema.sql`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # puis renseigner les variables
npm start              # http://localhost:5000
```

### 2. Frontend

```bash
cd neotravel
npm install
npm start              # http://localhost:3000
```

---

## Variables d'environnement (`backend/.env`)

```env
PORT=5000
CLIENT_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://<project>.supabase.co/rest/v1/
SUPABASE_SERVICE_ROLE_KEY=...

# IA — Vercel AI Gateway
VERCEL_AI_API_KEY=vck_...
VERCEL_AI_MODEL=anthropic/claude-3-5-haiku-20241022

# Distances
ORS_API_KEY=...

# Péages
TOLLGURU_API_KEY=...

# E-mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=NeoTravel <...>
```

> Pour utiliser Gemini à la place de Claude, renseigner `GEMINI_API_KEY`, `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` et `AI_MODEL=gemini-2.0-flash`.

---

## Fonctionnement de l'IA

L'assistant repose sur un unique appel à Claude 3.5 Haiku par message utilisateur.

**Entrée** : message en langage naturel + historique de la conversation + champs déjà collectés.

**Sortie** : JSON `{ "reply": "...", "answers": { ...champs extraits... } }`.

Claude extrait simultanément les champs du devis et génère la question suivante. Seuls l'e-mail et le téléphone sont en plus vérifiés par regex (patterns à 100 % fiables).

Champs collectés : `nom`, `email`, `telephone`, `ville_depart`, `ville_arrivee`, `nombre_passagers`, `date_depart`, `type_trajet`, `date_retour`.

---

## API

### `POST /api/chat`

Traite un message utilisateur, extrait les données, retourne une réponse IA.

**Body**
```json
{
  "message": "je pars de Nantes vers Paris le 19 octobre, nous serons 32",
  "answers": {},
  "history": []
}
```

**Réponse**
```json
{
  "reply": "Pour finaliser, j'ai besoin de votre e-mail et téléphone.",
  "answers": {
    "ville_depart": "Nantes",
    "ville_arrivee": "Paris",
    "date_depart": "2026-10-19",
    "nombre_passagers": "32"
  },
  "missingFields": ["nom", "email", "telephone", "type_trajet"]
}
```

### `POST /api/devis`

Génère le devis (calcul de prix, PDF, e-mail).

**Body** : tous les champs du devis remplis.

**Réponse** : données du devis (distance, prix HT/TTC, PDF en base64).

---

## Base de données (Supabase)

Schéma dans `backend/supabase/schema.sql`. Migrations dans `backend/supabase/`.

Tables principales : `devis`, `chat_messages`.

---

## Modèles IA disponibles via Vercel AI Gateway

| Modèle | Identifiant |
|--------|-------------|
| Claude 3.5 Haiku (recommandé) | `anthropic/claude-3-5-haiku-20241022` |
| GPT-4o | `openai/gpt-4o` |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` |
