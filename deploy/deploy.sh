#!/bin/bash
# =============================================================================
# 사내 지식 챗봇 플랫폼 - 자동 배포 및 재구동 스크립트
# 위치: J-Brain/deploy/deploy.sh
# 실행 환경: dev.jwinpartners.com 서버 내부 (/app/j-brain)
# =============================================================================

PROJECT_DIR="/app/j-brain"

echo "==========================================="
echo "  🚀 J-Brain Dev 서버 배포 시작"
echo "==========================================="

# 1. 소스 코드 동기화
echo ""
echo "[1/4] 최신 소스 코드 가져오기 (git pull)..."
cd $PROJECT_DIR
git fetch origin
git pull origin codex/jbrain-planning-docs

# 2. 백엔드 패키지 업데이트
echo ""
echo "[2/4] 백엔드(Python) 의존성 업데이트..."
cd $PROJECT_DIR/backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
else
    echo "⚠️ Python 가상환경(venv)을 찾을 수 없습니다."
fi

# 3. 프론트엔드 패키지 업데이트
echo ""
echo "[3/4] 프론트엔드(Node.js) 의존성 업데이트..."
cd $PROJECT_DIR/frontend
npm install

# 4. 서버 재구동
echo ""
echo "[4/4] 서버 기존 프로세스 중지 및 재기동..."
cd $PROJECT_DIR
./stop.sh
./start_dev.sh

echo ""
echo "==========================================="
echo "  ✅ 배포 및 재구동 스크립트 실행 완료!"
echo "==========================================="
