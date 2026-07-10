#!/usr/bin/env bash
# =============================================================================
# 로컬(Mac) 소스 코드를 GitHub에 안전하게 업로드하는 스크립트
# 위치: J-Brain/deploy/push_to_github.sh
# 사용법:
#   ./deploy/push_to_github.sh "커밋 메시지"
#   ./deploy/push_to_github.sh --all "커밋 메시지"
#   ./deploy/push_to_github.sh --paths "커밋 메시지" frontend/src/index.css frontend/src/App.jsx
# =============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

MODE="tracked"
COMMIT_MSG=""

case "${1:-}" in
  --all)
    MODE="all"
    shift
    ;;
  --paths)
    MODE="paths"
    shift
    ;;
esac

if [ $# -gt 0 ]; then
  COMMIT_MSG="$1"
  shift
fi

echo "==========================================="
echo "  GitHub 소스 업로드 시작"
echo "==========================================="
echo "브랜치: $(git branch --show-current)"

if [ -z "$(git status --porcelain)" ]; then
    echo "커밋할 변경 사항이 없습니다."
    exit 0
fi

echo "[현재 변경된 파일 목록]"
git status -s
echo "-------------------------------------------"

if [ -z "$COMMIT_MSG" ]; then
    read -r -p "커밋 메시지를 입력하세요: " COMMIT_MSG
fi

if [ -z "$COMMIT_MSG" ]; then
    echo "커밋 메시지가 비어 있어 중단합니다."
    exit 1
fi

case "$MODE" in
  tracked)
    echo "추적 중인 변경 파일만 stage 합니다. 새 파일은 --all 또는 --paths 모드를 사용하세요."
    git add -u
    ;;
  all)
    read -r -p "미추적 파일까지 모두 stage 합니다. 계속할까요? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "중단했습니다."
      exit 1
    fi
    git add -A
    ;;
  paths)
    if [ $# -eq 0 ]; then
      echo "--paths 모드는 커밋 메시지 뒤에 파일 경로가 필요합니다."
      exit 1
    fi
    git add "$@"
    ;;
esac

if git diff --cached --quiet; then
    echo "stage 된 변경 사항이 없습니다."
    exit 0
fi

echo ""
echo "[커밋 대상]"
git diff --cached --stat
echo ""
git commit -m "$COMMIT_MSG"

echo ""
echo "git push 진행 중..."
git push

echo ""
echo "==========================================="
echo "  GitHub 업로드 완료"
echo "==========================================="
