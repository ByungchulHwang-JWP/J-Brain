#!/usr/bin/env bash
# =============================================================================
# 사내 지식 챗봇 플랫폼 - 자동 배포 및 재구동 스크립트
# 위치: J-Brain/deploy/deploy.sh
# 실행 환경: dev.jwinpartners.com 서버 내부 (/app/j-brain)
# =============================================================================
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/app/j-brain}"
BRANCH="${BRANCH:-codex/jbrain-planning-docs}"

echo "==========================================="
echo "  J-Brain Dev 서버 배포 시작"
echo "==========================================="
echo "프로젝트 경로: $PROJECT_DIR"
echo "브랜치: $BRANCH"

echo ""
echo "[1/4] 최신 소스 코드 가져오기 (git pull)..."
cd "$PROJECT_DIR"
git fetch origin
git pull origin "$BRANCH"

echo ""
echo "[2/4] 백엔드(Python) 의존성 업데이트..."
cd "$PROJECT_DIR/backend"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
else
    echo "⚠️ Python 가상환경(venv)을 찾을 수 없습니다."
fi

echo ""
echo "[3/4] 프론트엔드(Node.js) 의존성 업데이트..."
cd "$PROJECT_DIR/frontend"
npm install

echo ""
echo "[4/4] 서버 기존 프로세스 중지 및 재기동..."
cd "$PROJECT_DIR"
./stop.sh
./start_dev.sh

echo ""
echo "==========================================="
echo "  배포 및 재구동 스크립트 실행 완료"
echo "==========================================="
