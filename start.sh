#!/bin/bash
# =============================================================================
# 사내 지식 챗봇 플랫폼 - 서비스 시작 스크립트
# Backend (FastAPI/8083) + Frontend (React/5176) 동시 기동
# =============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="$PROJECT_DIR/logs"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

echo "==========================================="
echo "  사내 지식 챗봇 플랫폼 기동 시작"
echo "==========================================="

# --- 1. 백엔드 API 서버 기동 ---
echo ""
echo "[1/2] 백엔드 API 서버 기동 중... (포트 8083)"

# 기존 프로세스 정리
EXISTING=$(lsof -ti:8083)
if [ -n "$EXISTING" ]; then
    echo "  → 포트 8083 기존 프로세스 종료 (PID: $EXISTING)"
    kill -9 $EXISTING 2>/dev/null
    sleep 1
fi

cd "$BACKEND_DIR"
source venv/bin/activate

nohup python3 -m uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8083 \
    > "$LOG_DIR/backend.log" 2>&1 &

BACKEND_PID=$!
echo "  → 백엔드 PID: $BACKEND_PID"
echo $BACKEND_PID > "$LOG_DIR/backend.pid"

# 서버 기동 대기
sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "  ✅ 백엔드 서버 정상 기동: http://127.0.0.1:8083"
    echo "     API 문서: http://127.0.0.1:8083/docs"
else
    echo "  ❌ 백엔드 서버 기동 실패! 로그 확인: $LOG_DIR/backend.log"
    exit 1
fi

# --- 2. 프론트엔드(FO) 서버 기동 ---
echo ""
echo "[2/2] 프론트엔드(FO) 서버 기동 중... (포트 5176)"

# 기존 프로세스 정리
EXISTING=$(lsof -ti:5176)
if [ -n "$EXISTING" ]; then
    echo "  → 포트 5176 기존 프로세스 종료 (PID: $EXISTING)"
    kill -9 $EXISTING 2>/dev/null
    sleep 1
fi

cd "$FRONTEND_DIR"

nohup npm run dev \
    > "$LOG_DIR/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo "  → 프론트엔드 PID: $FRONTEND_PID"
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

# 서버 기동 대기
sleep 3
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "  ✅ 프론트엔드 서버 정상 기동: http://localhost:5176"
else
    echo "  ❌ 프론트엔드 서버 기동 실패! 로그 확인: $LOG_DIR/frontend.log"
    exit 1
fi

# --- 완료 ---
echo ""
echo "==========================================="
echo "  모든 서비스 기동 완료!"
echo "==========================================="
echo "  🌐 관리자(BO) UI : http://localhost:5176"
echo "  🔌 API 서버      : http://127.0.0.1:8083"
echo "  📄 API 문서      : http://127.0.0.1:8083/docs"
echo "  📂 로그 디렉토리 : $LOG_DIR"
echo ""
echo "  서비스 중지: ./stop.sh"
echo "==========================================="
