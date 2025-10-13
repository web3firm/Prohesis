# Prohesis — Backend & API Bundle

This bundle contains the missing backend files for your Prohesis prediction market:
- Prisma client singleton
- API routes for markets, bets, payouts, users, leaderboard
- Onchain provider utilities (viem/wagmi-compatible helpers)
- Read/Write onchain function helpers
- Sample `.env.example`
- Prisma schema

## Usage

1) Copy these files into your repo (preserving paths).
2) Create and fill `.env` based on `.env.example`.
3) Install deps:
```bash
npm install @prisma/client prisma zod @tanstack/react-query
```
4) Generate Prisma client & migrate:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
5) Run dev:
```bash
npm run dev
```

## API Routes

All routes live under `/api/*` and return JSON.

- `GET /api/markets` — list markets (with pagination & filters)
- `POST /api/markets` — create market (off-chain record)
- `GET /api/bets?marketId=...` — list bets for a market
- `POST /api/bets` — add a bet record (after on-chain tx succeed)
- `POST /api/payouts` — add payout record
- `GET /api/leaderboard` — top users by total_staked

