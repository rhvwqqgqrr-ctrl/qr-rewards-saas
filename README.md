# QR Rewards SaaS

Plateforme SaaS multi-tenant de fidélisation par QR code pour restaurants. Les clients scannent un QR code, jouent à une roulette digitale, et gagnent des récompenses validables par le staff via un QR unique de redemption.

## Vision produit

QR Rewards est un produit SaaS commercialisable auprès de plusieurs restaurants. Chaque restaurant dispose de son propre espace isolé (multi-tenant) avec campagnes, lots, coupons, staff et analytics.

Le premier restaurant de démonstration est **Le Pare Faim** à Communay.

## Architecture

### Multi-tenant

Chaque restaurant est un tenant isolé. Toutes les entités (campagnes, coupons, staff, analytics) sont scopées par `restaurantId`. L'isolation est logique via filtrage systématique dans les services et API.

### Distinction QR public / QR de redemption

C'est le concept central :

**QR public d'entrée** : toujours identique pour une campagne donnée. Imprimable sur table, ticket, chevalet. Ne décide jamais du résultat — il ne fait qu'ouvrir une session de jeu.

**QR de redemption** : généré uniquement après un gain, unique par coupon, signé par JWT, lié à un token hashé en base. Scannable par le staff pour vérifier et valider le gain. Non falsifiable, non réutilisable après redemption.

### Niveaux de données

```
Platform → Restaurant → Campaign → PublicQr
                                 → Prize
                                 → PlaySession → Spin → Coupon → RedemptionToken
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, TypeScript |
| Base de données | PostgreSQL, Prisma ORM |
| Cache / Locks | Redis (ioredis) |
| Validation | Zod |
| Auth | JWT (jsonwebtoken), bcryptjs |
| QR | qrcode |
| Tests | Jest, ts-jest |

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd qr-rewards-saas

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Seeder la base
npm run db:seed

# Lancer en développement
npm run dev
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (ex: `postgresql://user:pass@localhost:5432/qr_rewards_saas`) |
| `REDIS_URL` | URL Redis (ex: `redis://localhost:6379`) |
| `APP_URL` | URL publique de l'app (ex: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Secret pour les tokens staff/admin (min 32 chars) |
| `QR_SIGNING_SECRET` | Secret pour signer les spins |
| `REDEMPTION_SIGNING_SECRET` | Secret pour signer les tokens de redemption |
| `SESSION_SIGNING_SECRET` | Secret pour signer les sessions de jeu |
| `RATE_LIMIT_SECRET` | Secret pour le rate limiting |
| `NODE_ENV` | `development` ou `production` |

## Migrations et Seed

```bash
# Créer une migration
npm run db:migrate

# Pousser le schéma sans migration
npm run db:push

# Exécuter le seed
npm run db:seed

# Ouvrir Prisma Studio
npm run db:studio
```

### Données de seed

Le seed crée :

- 1 platform super admin : `admin@qrrewards.io` / `admin123456`
- 1 restaurant : Le Pare Faim (Communay)
- 1 manager : `manager@leparefaim.fr` / `manager123`
- 1 staff : `staff@leparefaim.fr` / `staff12345`
- 1 campagne active : "Bienvenue 2026"
- 5 lots : café (20%), soft (15%), remise 5% (10%), remise 10% (5%), aucun gain (50%)
- 1 QR public d'entrée

## Rôles

| Rôle | Accès |
|------|-------|
| `SUPER_ADMIN` | Back-office plateforme, tous les restaurants |
| `OWNER` / `MANAGER` | Back-office du restaurant (campagnes, lots, coupons, staff, analytics) |
| `STAFF` | Interface mobile de scan et validation des coupons |
| Client | Webapp publique (jeu, roulette, coupon) |

## Logique de spin

1. Le client scanne le QR public → session créée
2. Le client lance le spin → le backend tire un lot selon les poids configurés
3. Le moteur charge les lots actifs, exclut ceux épuisés (stock global/journalier), recalcule les poids
4. Le tirage est aléatoire pondéré, signé, et idempotent (un seul spin par session)
5. Un verrou Redis empêche le double appel

## Logique de validité J+1 / 10 jours

Le gain est calculé en timezone `Europe/Paris` :

- **Activation** : lendemain à 00:00 Europe/Paris
- **Expiration** : 10 jours calendaires après le jour du gain à 23:59:59

Exemple : gain le 4 avril 2026 à 21:30 → actif du 5 avril au 14 avril 23:59:59.

Le statut du coupon est automatiquement mis à jour (`ISSUED` → `ACTIVE` → `EXPIRED`).

## Logique de redemption

1. Le staff scanne le QR unique du client
2. Le backend résout le token JWT, vérifie le hash en base
3. Affiche lot, statut, dates de validité
4. Le staff clique "Valider le gain"
5. Redemption atomique : transaction Prisma + verrou Redis
6. Le coupon passe en `REDEEMED`, le token est désactivé
7. Double redemption impossible

## Sécurité et anti-abus

- Logique de tirage côté serveur uniquement
- Sessions signées par JWT
- Tokens de redemption signés et hashés
- Rate limiting par IP et par device (Redis)
- Verrou Redis pour anti double-spin et double-redemption
- Validation Zod sur tous les payloads
- Audit trail de tous les événements critiques
- Rôles et permissions sur toutes les API

## API

### Publique

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/public/restaurants/:slug/campaigns/:slug` | Info campagne |
| POST | `/api/public/session/start` | Démarrer une session |
| POST | `/api/public/review/click` | Tracker clic avis Google |
| POST | `/api/public/review/return` | Tracker retour après avis |
| POST | `/api/public/spin` | Lancer le tirage |
| GET | `/api/public/coupon/:humanCode` | Détails d'un coupon |
| GET | `/api/public/redeem/:token` | Résoudre un token de redemption |

### Staff

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/staff/auth/login` | Connexion staff |
| POST | `/api/staff/redeem/scan` | Scanner un QR de redemption |
| POST | `/api/staff/redeem/confirm` | Valider un gain |
| POST | `/api/staff/coupon/lookup` | Rechercher un coupon par code |

### Admin restaurant

CRUD campagnes, lots, QR publics, coupons (liste + export CSV), staff, analytics, paramètres restaurant.

### Admin plateforme

CRUD restaurants, analytics globales, audit log, gestion des comptes.

## Tests

```bash
# Lancer les tests
npm test

# Mode watch
npm run test:watch
```

Tests couverts :
- Calcul de validité des coupons (timezone, J+1, 10 jours)
- Moteur de tirage pondéré (distribution, stock, désactivation)
- Génération de codes humains
- Signature des spins
- Classes d'erreur

## Structure du projet

```
qr-rewards-saas/
├── prisma/
│   ├── schema.prisma          # Schéma de données complet
│   └── seed.ts                # Données initiales
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── public/        # API publique (session, spin, coupon)
│   │   │   ├── staff/         # API staff (auth, scan, confirm)
│   │   │   ├── admin/         # API admin restaurant
│   │   │   └── platform/      # API admin plateforme
│   │   ├── play/              # Pages publiques (jeu client)
│   │   ├── redeem/            # Page coupon/QR
│   │   ├── staff/             # Interface staff mobile
│   │   ├── admin/             # Back-office restaurant
│   │   └── platform/          # Back-office plateforme
│   ├── components/
│   │   ├── ui/                # Composants réutilisables
│   │   └── roulette/          # Roue de la fortune
│   ├── lib/                   # Utilitaires (prisma, redis, tokens, dates, errors)
│   ├── services/              # Services métier
│   └── __tests__/             # Tests unitaires
├── .env.example
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Déploiement

Architecture compatible avec :
- **Vercel** pour le frontend/backend Next.js
- **Neon / Supabase / Railway** pour PostgreSQL managé
- **Upstash / Railway** pour Redis managé

## Pistes d'évolution SaaS

- Branding avancé par restaurant (logo, couleurs, polices, landing custom)
- URL custom par tenant (`restaurant.qrrewards.io`)
- Système de facturation (Stripe)
- Notifications push / email
- Campagnes programmées
- Analytics avancées avec graphiques temporels
- Export PDF des rapports
- Intégration caisse (POS)
- Multi-langue
- PWA pour l'interface staff
