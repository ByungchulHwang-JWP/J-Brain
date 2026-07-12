#!/usr/bin/env bash
# =============================================================================
# J-Brain Dev server deployment trigger
#
# This script is intended to be run from the local workstation.
# It deploys code only. Database seed/migration work must be handled separately.
# =============================================================================
set -euo pipefail

SERVER="${SERVER:-appuser@dev.jwinpartners.com}"
PORT="${PORT:-2222}"
PROJECT_DIR="${PROJECT_DIR:-/app/j-brain}"
FRONTEND_HEALTH_URL="${FRONTEND_HEALTH_URL:-http://dev.jwinpartners.com:8080}"

BRANCH=""
SKIP_HEALTH=0

usage() {
    cat <<'EOF'
Usage:
  ./deploy/deploy_dev.sh [--branch BRANCH] [--skip-health]

Environment overrides:
  SERVER=appuser@dev.jwinpartners.com
  PORT=2222
  PROJECT_DIR=/app/j-brain
  FRONTEND_HEALTH_URL=http://dev.jwinpartners.com:8080

Examples:
  ./deploy/deploy_dev.sh
  ./deploy/deploy_dev.sh --branch codex/jbrain-planning-docs
  SERVER=appuser@dev.jwinpartners.com PORT=2222 ./deploy/deploy_dev.sh

Notes:
  - This script does not run DB seed or DB migration commands.
  - Run DB work before deployment when menu/permission seed changes are required.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --branch)
            if [[ $# -lt 2 || -z "${2:-}" ]]; then
                echo "ERROR: --branch requires a branch name." >&2
                exit 2
            fi
            BRANCH="$2"
            shift 2
            ;;
        --skip-health)
            SKIP_HEALTH=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "ERROR: Unknown argument: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

if [[ -z "$BRANCH" ]]; then
    BRANCH="$(git branch --show-current)"
fi

if [[ -z "$BRANCH" ]]; then
    echo "ERROR: Could not detect the current git branch. Use --branch BRANCH." >&2
    exit 2
fi

LOCAL_HEAD="$(git rev-parse HEAD)"

echo "==========================================="
echo "  J-Brain Dev Deployment"
echo "==========================================="
echo "Server       : $SERVER"
echo "Port         : $PORT"
echo "Project dir  : $PROJECT_DIR"
echo "Branch       : $BRANCH"
echo "Local HEAD   : $LOCAL_HEAD"
echo "DB seed      : skipped by design"
echo ""

echo "[1/4] Checking remote branch..."
git fetch origin "$BRANCH" --quiet
REMOTE_HEAD="$(git rev-parse "origin/$BRANCH")"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
    echo "ERROR: Local HEAD is not pushed to origin/$BRANCH." >&2
    echo "Local : $LOCAL_HEAD" >&2
    echo "Remote: $REMOTE_HEAD" >&2
    echo "" >&2
    echo "Run the following first:" >&2
    echo "  git push origin $BRANCH" >&2
    exit 1
fi

echo "  OK: origin/$BRANCH is up to date."
echo ""

echo "[2/4] Running remote deployment..."
ssh -p "$PORT" "$SERVER" \
    "set -euo pipefail; cd '$PROJECT_DIR'; BRANCH='$BRANCH' PROJECT_DIR='$PROJECT_DIR' bash deploy/deploy.sh"

echo ""
echo "[3/4] Checking frontend health..."
if [[ "$SKIP_HEALTH" -eq 1 ]]; then
    echo "  Skipped by --skip-health."
else
    curl -fsSI --max-time 15 "$FRONTEND_HEALTH_URL" >/dev/null
    echo "  OK: $FRONTEND_HEALTH_URL"
fi

echo ""
echo "[4/4] Deployment completed."
echo "==========================================="
echo "  Dev deployment succeeded"
echo "==========================================="
