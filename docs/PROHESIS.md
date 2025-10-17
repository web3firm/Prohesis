# Prohesis — Web3 Prediction Market

## 1. Overview

Prohesis is a decentralized prediction market platform that lets users create, bet on, and resolve outcome-based markets using blockchain technology. It combines on-chain smart contracts (for secure bets and payouts) with an off-chain backend (for analytics, leaderboards, and user management).

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15+ (App Router) | Server + client rendering |
| Styling | Tailwind CSS + shadcn/ui | Modern component styling |
| State/Web3 | Wagmi + Viem | Wallet connect + contract reads/writes |
| Backend ORM | Prisma ORM | Database abstraction |
| Database | PostgreSQL | Off-chain data storage |
| Auth | NextAuth.js (optional) | User login/session handling |
| API Routes | Next.js Route Handlers (app/api/) | REST/JSON endpoints |
| Blockchain | Ethereum / Sepolia Testnet | Smart contracts |
| Hosting | Vercel (frontend) + Supabase/Neon/Postgres (DB) | Free-tier hosting |
| Dev Tools | ESLint, Prettier, Husky | Code quality |

## 3. Architecture Overview

### Off-Chain (Server)

Responsible for:

- User profiles, wallets, and admin roles
- Market metadata (titles, descriptions)
- Caching and syncing blockchain data (Markets, Pools, Bets)
- Leaderboards and analytics
- Background pool refresh jobs

### On-Chain (Smart Contract)

Responsible for:

- Market creation
- Bet placement
- Market resolution
- Payout claiming
- Event emissions (MarketCreated, BetPlaced, etc.)

## 4. Folder Structure (Canonical)

Use this project as the canonical layout. Important directories:

- `src/app/` — Next.js app routes and pages
- `src/components/` — Reusable React components (UI, admin, market list)
- `src/lib/` — On-chain helpers, ABI files, utils
- `scripts/` — Utility scripts for syncing, seeding, and testing
- `prisma/` — Prisma schema and migrations
- `public/` — Static assets

## UI & Design Guidelines

| Aspect | Recommendation |
|---|---|
| Theme | Dark + Glassmorphic |
| Primary Color | `#00FFA3` or `#00BFFF` |
| Fonts | Inter, Satoshi, or Outfit |
| Components | Use shadcn/ui cards, modals, badges |
| Layout | Card-based grid (Markets), sidebar for navigation |
| Animations | framer-motion (fade-in, hover-scale) |

## Future Add-ons

- Market categories (Sports, Politics, Crypto)
- Notifications via Email / Wallet
- GraphQL API
- Market resolution automation via Oracles
- Governance + DAO integration
