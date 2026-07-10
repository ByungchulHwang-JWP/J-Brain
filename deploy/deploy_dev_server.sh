#!/usr/bin/env bash
# =============================================================================
# 로컬(Mac)에서 Dev 서버 배포를 트리거하는 스크립트
# 사용법:
#   ./deploy/deploy_dev_server.sh
#   BRANCH=main ./deploy/deploy_dev_server.sh
# =============================================================================
set -euo pipefail

SERVER="${SERVER:-appuser@dev.jwinpartners.com}"
PORT="${PORT:-2222}"
PROJECT_DIR="${PROJECT_DIR:-/app/j-brain}"
BRANCH="${BRANCH:-codex/jbrain-planning-docs}"

echo "==========================================="
echo "  Dev 서버 배포 트리거"
echo "==========================================="
echo "서버: $SERVER"
echo "포트: $PORT"
echo "프로젝트 경로: $PROJECT_DIR"
echo "브랜치: $BRANCH"
echo ""

ssh -p "$PORT" "$SERVER" "set -euo pipefail; cd '$PROJECT_DIR'; git fetch origin; git pull origin '$BRANCH'; BRANCH='$BRANCH' PROJECT_DIR='$PROJECT_DIR' bash deploy/deploy.sh"

echo ""
echo "==========================================="
echo "  Dev 서버 배포 트리거 완료"
echo "==========================================="
