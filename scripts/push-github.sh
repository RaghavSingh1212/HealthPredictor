#!/usr/bin/env bash
# Force-push HealthPredictor to GitHub (requires auth once).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Prefer system git; fall back to portable git (no Xcode license needed)
if git --version >/dev/null 2>&1; then
  GIT_BIN="git"
else
  PORTABLE="/tmp/git-push-helper"
  if [[ ! -x "$PORTABLE/node_modules/dugite/git/bin/git" ]]; then
    echo "Installing portable git..."
    mkdir -p "$PORTABLE" && cd "$PORTABLE"
    npm init -y >/dev/null 2>&1
    npm install dugite --silent
    cd "$ROOT"
  fi
  export PATH="$PORTABLE/node_modules/dugite/git/bin:$PATH"
  export GIT_EXEC_PATH="$PORTABLE/node_modules/dugite/git/libexec/git-core"
  GIT_BIN="git"
fi

cd "$ROOT"

if [[ ! -d .git ]]; then
  $GIT_BIN init
  $GIT_BIN branch -M main
fi

$GIT_BIN add -A
if ! $GIT_BIN diff --cached --quiet; then
  $GIT_BIN commit -m "Update HealthPredictor medical triage system"
fi

$GIT_BIN remote remove origin 2>/dev/null || true
$GIT_BIN remote add origin https://github.com/RaghavSingh1212/HealthPredictor.git

# Auth: use GITHUB_TOKEN env var, or gh CLI, or interactive login
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  $GIT_BIN remote set-url origin "https://${GITHUB_TOKEN}@github.com/RaghavSingh1212/HealthPredictor.git"
elif command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  TOKEN="$(gh auth token)"
  $GIT_BIN remote set-url origin "https://${TOKEN}@github.com/RaghavSingh1212/HealthPredictor.git"
else
  echo "No GitHub auth found. Run ONE of:"
  echo "  export GITHUB_TOKEN=ghp_your_token"
  echo "  gh auth login"
  echo "Then re-run: ./scripts/push-github.sh"
  exit 1
fi

echo "Force pushing to main..."
$GIT_BIN push --force origin main
$GIT_BIN remote set-url origin https://github.com/RaghavSingh1212/HealthPredictor.git

echo "Done: https://github.com/RaghavSingh1212/HealthPredictor"
