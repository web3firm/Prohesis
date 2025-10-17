#!/usr/bin/env bash
# Non-interactive push of secrets to GitHub using gh CLI.
# Sources .env.local and sets available secrets for the remote repository.

set -euo pipefail

ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "${ENV_FILE} not found. Run ./scripts/generate-env.sh first or create it manually." >&2
  exit 1
fi

# load env (without exporting sensitive vars to the environment of this process unnecessarily)
set -a
source "$ENV_FILE"
set +a

# Determine repo (owner/repo) from git remote
REPO=$(git remote get-url origin 2>/dev/null || true)
if [[ -z "$REPO" ]]; then
  echo "Could not determine git remote 'origin'. Set REPO environment variable to owner/repo and re-run." >&2
  exit 1
fi
# convert SSH or HTTPS remote URL to owner/repo
if [[ "$REPO" =~ ^git@github.com:(.+)\.git$ ]]; then
  REPO_FULL="${BASH_REMATCH[1]}"
elif [[ "$REPO" =~ ^https://github.com/(.+)\.git$ ]]; then
  REPO_FULL="${BASH_REMATCH[1]}"
else
  # try to strip suffix
  REPO_FULL=$(basename -s .git "$REPO" | sed -n '1p')
fi

echo "Using GitHub repository: $REPO_FULL"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install it and run 'gh auth login' before using this script." >&2
  exit 1
fi

set -o pipefail

declare -a KEYS=(NEXTAUTH_SECRET DATABASE_URL SEPOLIA_RPC_URL NEXT_PUBLIC_FACTORY_CONTRACT SYNC_TOKEN ADMIN_USER ADMIN_PASS)

for key in "${KEYS[@]}"; do
  val=""
  # only set if present in environment
  if [[ -n "${!key-}" ]]; then
    val="${!key}"
  fi
  if [[ -z "$val" ]]; then
    echo "Skipping $key (not set in ${ENV_FILE})."
    continue
  fi
  echo -n "Setting secret $key... "
  # use gh secret set with input from pipe to avoid exposing value in command line
  if echo -n "$val" | gh secret set "$key" --body - --repo "$REPO_FULL" >/dev/null 2>&1; then
    echo "OK"
  else
    echo "FAILED (check gh auth and repo permissions)"
  fi
done

echo "Finished pushing available secrets to $REPO_FULL. Verify in GitHub repo settings." 
