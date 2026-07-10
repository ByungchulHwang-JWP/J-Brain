#!/usr/bin/env bash
# =============================================================================
# GitHub push 후 Dev 서버 배포까지 한 번에 실행하는 스크립트
# 사용법:
#   ./deploy/deploy_all.sh "커밋 메시지"
#   ./deploy/deploy_all.sh --all "커밋 메시지"
#   ./deploy/deploy_all.sh --paths "커밋 메시지" frontend/src/index.css
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

"$SCRIPT_DIR/push_to_github.sh" "$@"
"$SCRIPT_DIR/deploy_dev_server.sh"
