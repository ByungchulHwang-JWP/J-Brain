#!/bin/bash
# =============================================================================
# 사내 지식 챗봇 플랫폼 - 서비스 중지 스크립트
# =============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

echo "==========================================="
echo "  사내 지식 챗봇 플랫폼 서비스 중지"
echo "==========================================="

# --- 1. 백엔드 API 서버 종료 ---
echo ""
echo "[1/2] 백엔드 API 서버 종료 중... (포트 8083)"

if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "  → PID $BACKEND_PID 종료 완료"
    else
        echo "  → 이미 종료된 프로세스입니다."
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    echo "  → PID 파일 없음. 포트 기반으로 강제 종료 시도..."
fi

# 포트 기반으로 추가 정리
EXISTING=$(lsof -ti:8083)
if [ -n "$EXISTING" ]; then
    kill -9 $EXISTING 2>/dev/null
    echo "  → 포트 8083 잔여 프로세스 (PID: $EXISTING) 강제 종료"
fi
echo "  ✅ 백엔드 서버 종료 완료"

# --- 2. 프론트엔드 서버 종료 ---
echo ""
echo "[2/2] 프론트엔드(FO) 서버 종료 중... (포트 5176)"

if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "  → PID $FRONTEND_PID 종료 완료"
    else
        echo "  → 이미 종료된 프로세스입니다."
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    echo "  → PID 파일 없음. 포트 기반으로 강제 종료 시도..."
fi

# 포트 기반으로 추가 정리
EXISTING=$(lsof -ti:5176)
if [ -n "$EXISTING" ]; then
    kill -9 $EXISTING 2>/dev/null
    echo "  → 포트 5176 잔여 프로세스 (PID: $EXISTING) 강제 종료"
fi
echo "  ✅ 프론트엔드 서버 종료 완료"

# --- 완료 ---
echo ""
echo "==========================================="
echo "  모든 서비스 정상 종료 완료"
echo "==========================================="
