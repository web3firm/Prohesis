#!/usr/bin/env bash
# Push required secrets to GitHub Actions using the GitHub CLI (`gh`).
# Must be run by a user with repo admin permissions and `gh auth login` completed.

set -euo pipefail

OWNER_AND_REPO="$(git rev-parse --show-toplevel | xargs basename)"
REPO_FULL=$(git remote get-url origin 2>/dev/null || echo "")

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install and authenticate first: https://cli.github.com/"
  exit 1
fi

read -p "Enter repository (owner/repo) [default: current remote]: " REPO_IN
REPO_IN=${REPO_IN:-$REPO_FULL}
if [[ -z "$REPO_IN" ]]; then
  echo "Unable to determine repo. Provide owner/repo explicitly." >&2
  exit 1
fi

echo "Using repo: $REPO_IN"

declare -A SECRETS
SECRETS[NEXTAUTH_SECRET]="$(openssl rand -hex 32)"
SECRETS[SYNC_TOKEN]="$(openssl rand -hex 32)"
SECRETS[ADMIN_PASS]="$(openssl rand -base64 24)"

for k in "NEXTAUTH_SECRET" "DATABASE_URL" "SEPOLIA_RPC_URL" "NEXT_PUBLIC_FACTORY_CONTRACT" "SYNC_TOKEN" "ADMIN_USER" "ADMIN_PASS"; do
  if [[ "$k" == "DATABASE_URL" || "$k" == "SEPOLIA_RPC_URL" || "$k" == "NEXT_PUBLIC_FACTORY_CONTRACT" || "$k" == "ADMIN_USER" ]]; then
    echo "
Please paste value for $k (press Enter to skip and set later):"
    read -r v
    if [[ -z "$v" ]]; then
      echo "Skipping $k (set later in repo settings or via gh secret set)."
      continue
    fi
  else
    v=${SECRETS[$k]}
  fi
  echo "Setting secret $k..."
  echo -n "$v" | gh secret set "$k" --body - --repo "$REPO_IN"
done

echo "Done. Verify secrets in GitHub repo settings (Settings → Secrets and variables → Actions)."
