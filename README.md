# Discord Gaming Plus - Hackathon 48h

## 🎯 Objectif

Projet MVP du hackathon Discord Gaming Plus avec stack : Vue 3 + Tailwind + Node.js + Express + Socket.io + MySQL et Docker.

## 📁 Architecture du projet

- `backend/`
  - `server.js` : API + Socket.io + connexion MySQL
  - `package.json` : dépendances et script `npm run dev`
  - `Dockerfile` : build container backend
- `frontend/`
  - `index.html` + `src/main.js` + `src/App.vue` : app Vue + UI Discord-like + chat + quiz
  - `package.json` : dépendances et scripts Vite (`dev`, `build`, `serve`)
  - `Dockerfile` : build container frontend
- `docker-compose.yml` : orchestration MySQL + backend + frontend
- `.gitignore`
- `README.md` (vous êtes ici)

## 🧩 Fonctionnalités implémentées

### Backend

- Endpoint `GET /` : test de health
- Endpoint `GET /api/messages` : récupération des 100 derniers messages chat
- Endpoint `GET /api/leaderboard` : top 10 des meilleurs scores quiz
- Socket.io
  - `chat:message` : stocke en DB et diffuse à tous
  - `quiz:answer` : calcule bonne réponse, score 0/1, stocke, diffuse `quiz:result`
- Base MySQL (Automatique) : tables `messages` et `quiz_scores`

### Frontend

- UI Discord-like (layout sidebar + chat + quiz + leaderboard)
- Auth pseudo simple (stocké localStorage)
- Chat en temps réel via Socket.io
- Quiz local dans frontend, résultats reçus du backend
- leaderboard rafraîchi après chaque interaction quiz

## 🚀 Lancement local

1. Lancer les services :
   - `docker compose up --build` ou
   - `docker compose up --build -d`
2. Vérifier :
   - API : `http://localhost:3000/`
   - Frontend : `http://localhost:5173/`
3. Stopper : `docker compose down`

## 🔧 Configuration Docker

`docker-compose.yml` expose :

- MySQL : `3306`
- Backend : `3000`
- Frontend : `5173`

Variables d’environnement (dans `docker-compose.yml`) :

- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- `MYSQL_HOST` pour backend (`db` service)

## 🧹 Préparer le projet (première fois)

```bash
cd discord-gaming-plus
cd backend && npm install && cd ../frontend && npm install
cd ..
docker compose up --build
```

## 🔐 Sécurité à renforcer (à venir)

- validation côté backend de `author`, `content`, `player`
- gestion d’authentification/token
- prévention injection SQL (ORM + prepared statements déjà en partie via `?`)

## 🛠 Plan d’action pour les 4 rôles (A/B/C/D)

- **A (Front)**
  - renommer en multi-canaux, vrai composants Vue, Tailwind complet, design Discord (navbar, salon/chat/avatar)
  - pagination, fail-safe, accessibilité
- **B (Back)**
  - JWT / auth, endpoints CRUD utiles, namespace Socket.io, rooms, messages privés
  - tests unitaires + e2e
- **C (DevOps)**
  - ajouter `.gitlab-ci.yml` – pipeline lint/test/build/deploy
  - automatiser `docker compose` + déploiement k8s (service + ingress)
- **D (Data/Jeu)**
  - schéma relationnel (users, channels, scores, quiz, questions)
  - logique quiz mode
