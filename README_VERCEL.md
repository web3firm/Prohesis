# Deploying Prohesis to Vercel

This guide explains the recommended steps to deploy Prohesis (Next.js + Prisma + Hardhat) to Vercel.

Prerequisites
- GitHub repo with this project.
- Vercel account and project created (you can import from GitHub).
- A Postgres database (managed) accessible from Vercel (or use Prisma Data Proxy).
- Secrets: store them in Vercel Project Settings -> Environment Variables (do NOT commit .env).

Essential environment variables (set these in Vercel for both Preview and Production):

- DATABASE_URL: postgresql://user:pass@host:5432/dbname
- NEXTAUTH_URL: https://<your-vercel-domain>
- NEXTAUTH_SECRET: <long_random_string>
- NEXT_PUBLIC_BASE_URL: https://<your-vercel-domain>
- NEXT_PUBLIC_SEPOLIA_RPC_URL or SEPOLIA_RPC_URL: https://... (Infura/Alchemy)
- PRIVATE_KEY: 0x... (server signer for create/resolve)
- NEXT_PUBLIC_FACTORY_CONTRACT: 0x... (set after deploying factory)
- ETHERSCAN_API_KEY: (optional)
- NEXT_PUBLIC_CHAIN_ID: 11155111
- ADMIN_USER, ADMIN_PASS (optional)

Prisma and serverless notes
- Use Prisma Data Proxy OR a connection pooler (pgbouncer) to avoid exhausting connections from serverless functions.
- In Vercel, set `DATABASE_URL` to your production DB and consider `PRISMA_DATA_PROXY_URL` if using Data Proxy.

Deployment steps (quick)
1. Push this repo to GitHub.
2. Import the project into Vercel (https://vercel.com/new).
3. Configure the environment variables listed above in Project Settings -> Environment Variables.
4. Set the Build Command to: `npm run build` (default)
5. Set Output Directory: `.next` (default)
6. Deploy.

Run migrations
- After deployment, run migrations on the production DB:
  - Locally (recommended):
    ```bash
    npx prisma migrate deploy --schema=prisma/schema.prisma
    ```
  - Or via GitHub Actions (we provide a workflow that runs `prisma migrate deploy` on push to main).

Deploy contracts
- You can deploy contracts locally (using your `.env`) or via GitHub Actions:
  - To deploy locally:
    ```bash
    export PRIVATE_KEY="0x..."
    export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/..."
    npx hardhat run src/scripts/deployFactoryAndMarket.cjs --network sepolia
    ```
  - If you deploy in CI, add `PRIVATE_KEY` and `SEPOLIA_RPC_URL` as GitHub Secrets and configure the `migrate-and-deploy.yml` workflow.
- After deploying factory, set `NEXT_PUBLIC_FACTORY_CONTRACT` in Vercel.

Background sync / cron
- Vercel doesn’t run long-running daemons. Use one of these:
  - GitHub Actions scheduled workflow (we added one): call `https://<your-domain>/api/cron` every 5 minutes.
  - Vercel Cron Jobs (if available in your plan).
  - External scheduler (cron, CircleCI, etc.) to call `/api/cron`.

Optional: auto-update Vercel envs from CI
- We added a `migrate-and-deploy.yml` workflow to run migrations and optionally deploy contracts.
- If you want the CI to update Vercel envs automatically with deployed addresses, add `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` and I can add the updater workflow.

Validation (once deployed)
- Visit `https://<your-vercel-domain>/user` — market cards should render quickly (we use server render + client-side SWR updates).
- Run the sync once: `npm run sync:pools` (or call `/api/cron`).

Troubleshooting
- If pages are slow: ensure `syncPools` is not called on every request; use cached DB fields instead (we already handle this).
- If Prisma connection errors happen in production: configure Data Proxy or pgbouncer.

If you want, I can:
- Add a GitHub Action that automatically updates `NEXT_PUBLIC_FACTORY_CONTRACT` in Vercel after a CI deploy (requires `VERCEL_TOKEN` and `VERCEL_PROJECT_ID`).
- Add a short Playwright smoke test to the workflow to verify the deployed site renders market cards.

Tell me which optional automation you'd like next.

Rotate Vercel token (recommended)
--------------------------------
- In Vercel: Settings → Tokens → Create Token. Give it a short expiry and the minimal scopes needed (project: read/write environment variables).
- In GitHub: Settings → Secrets → Actions → New repository secret. Add `VERCEL_TOKEN` with the token value and ensure `VERCEL_PROJECT_ID` is also present.
- Update the secret in GitHub if you rotate the token; then run `npm run upsert-vercel` locally or let CI run on next deploy.

