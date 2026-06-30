# NeoTravel — Frontend

Interface React pour l'assistant IA de devis de transport en autocar.

---

## Stack

- **React 19** — UI
- **React Router v6** — navigation
- **Create React App** — toolchain

---

## Installation

```bash
cd neotravel
npm install
npm start    # http://localhost:3000
```

Build de production :

```bash
npm run build
```

---

## Pages

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `LandingPage.jsx` | Page d'accueil avec présentation du service |
| `/assistant` | `AssistantIA.jsx` | Chat IA + panneau de résumé en temps réel |
| `/devis` | `QuoteResult.jsx` | Affichage du devis généré, téléchargement PDF, envoi e-mail |
| `/dashboard` | `Dashboard.jsx` | Liste des devis (accès commercial) |
| `/admin` | `AdminLogin.jsx` | Connexion espace commercial |

---

## Page principale — Assistant IA

`AssistantIA.jsx` comporte deux zones :

**Chat (gauche)** — l'utilisateur décrit son voyage en langage naturel. Chaque message est envoyé à `POST /api/chat`. La réponse de Claude est affichée dans le fil de conversation.

**Résumé (droite)** — panneau mis à jour automatiquement à chaque message. Affiche les champs extraits : nom, e-mail, téléphone, ville de départ, destination, date aller, date retour, nombre de passagers, type de trajet.

Le bouton **Générer mon devis** s'active quand tous les champs sont remplis et les consentements RGPD acceptés. Il appelle `POST /api/devis` et redirige vers `/devis`.

**Consentements RGPD** — une modale s'affiche à l'ouverture pour recueillir l'accord sur l'utilisation des données, les CGU et la politique de confidentialité. Un consentement marketing optionnel est aussi proposé.

---

## Configuration

L'URL du backend est définie dans `src/config/api.js`.

Par défaut :
- Développement → `http://localhost:5000`
- Production → variable d'environnement `REACT_APP_API_URL`

---

## Structure des fichiers

```
neotravel/src/
├── App.jsx
├── App.css
├── index.js
├── index.css
├── config/
│   └── api.js           # URL du backend
├── services/
│   ├── adminAuth.js     # authentification dashboard
│   └── (autres)
└── pages/
    ├── LandingPage.jsx
    ├── AssistantIA.jsx
    ├── QuoteResult.jsx
    ├── Dashboard.jsx
    └── AdminLogin.jsx
```
