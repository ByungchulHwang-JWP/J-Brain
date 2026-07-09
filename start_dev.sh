#!/bin/bash
# =============================================================================
# 사내 지식 챗봇 플랫폼 - 개발(Dev) 서버 서비스 시작 스크립트
# Backend (FastAPI) + Frontend (React) 동시 기동 (환경 변수 파일 적용)
# =============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="$PROJECT_DIR/logs"
ENV_FILE="$PROJECT_DIR/.env.dev"

# 환경변수 로드
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    echo "✅ 개발 환경 설정 파일($ENV_FILE)을 로드했습니다."
else
    echo "⚠️ 개발 환경 설정 파일($ENV_FILE)이 없습니다. 기본 설정으로 기동합니다."
fi

# 포트 기본값 설정 (환경변수가 없을 경우)
FRONTEND_PORT=${VITE_PORT:-5174}
BACKEND_PORT=${BACKEND_PORT:-8080}
BACKEND_HOST=${BACKEND_HOST:-127.0.0.1}

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

echo "==========================================="
echo "  사내 지식 챗봇 플랫폼 (Dev) 기동 시작"
echo "  프론트엔드 포트 : $FRONTEND_PORT"
echo "  백엔드 포트     : $BACKEND_PORT"
echo "==========================================="

# --- 1. 백엔드 API 서버 기동 ---
echo ""
echo "[1/2] 백엔드 API 서버 기동 중... (포트 $BACKEND_PORT)"

# 기존 프로세스 정리
EXISTING=$(lsof -ti:$BACKEND_PORT)
if [ -n "$EXISTING" ]; then
    echo "  → 포트 $BACKEND_PORT 기존 프로세스 종료 (PID: $EXISTING)"
    kill -9 $EXISTING 2>/dev/null
    sleep 1
fi

cd "$BACKEND_DIR"
# 가상환경이 있을 경우 활성화 (로컬용 venv인지 확인)
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

nohup python3 -m uvicorn app.main:app \
    --host $BACKEND_HOST \
    --port $BACKEND_PORT \
    > "$LOG_DIR/backend_dev.log" 2>&1 &

BACKEND_PID=$!
echo "  → 백엔드 PID: $BACKEND_PID"
echo $BACKEND_PID > "$LOG_DIR/backend_dev.pid"

# 서버 기동 대기
sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "  ✅ 백엔드 서버 정상 기동: http://$BACKEND_HOST:$BACKEND_PORT"
else
    echo "  ❌ 백엔드 서버 기동 실패! 로그 확인: $LOG_DIR/backend_dev.log"
    exit 1
fi

# --- 2. 프론트엔드(FO) 서버 기동 ---
echo ""
echo "[2/2] 프론트엔드(FO) 서버 기동 중... (포트 $FRONTEND_PORT)"

# 기존 프로세스 정리
EXISTING=$(lsof -ti:$FRONTEND_PORT)
if [ -n "$EXISTING" ]; then
    echo "  → 포트 $FRONTEND_PORT 기존 프로세스 종료 (PID: $EXISTING)"
    kill -9 $EXISTING 2>/dev/null
    sleep 1
fi

cd "$FRONTEND_DIR"

nohup npm run dev \
    > "$LOG_DIR/frontend_dev.log" 2>&1 &

FRONTEND_PID=$!
echo "  → 프론트엔드 PID: $FRONTEND_PID"
echo $FRONTEND_PID > "$LOG_DIR/frontend_dev.pid"

# 서버 기동 대기
sleep 3
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "  ✅ 프론트엔드 서버 정상 기동: http://localhost:$FRONTEND_PORT"
else
    echo "  ❌ 프론트엔드 서버 기동 실패! 로그 확인: $LOG_DIR/frontend_dev.log"
    exit 1
fi

# --- 완료 ---
echo ""
echo "==========================================="
echo "  모든 서비스 기동 완료 (Dev 환경)"
echo "==========================================="
echo "  🌐 관리자(BO) UI : http://localhost:$FRONTEND_PORT"
echo "  🔌 API 서버      : http://$BACKEND_HOST:$BACKEND_PORT"
echo "  📂 로그 디렉토리 : $LOG_DIR"
echo "==========================================="
