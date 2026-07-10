# J-Brain GitHub 및 Dev 서버 수동 배포 가이드

이 문서는 로컬 Mac에서 변경한 소스를 GitHub에 올리고, Dev 서버(`dev.jwinpartners.com`)에 반영하는 절차를 정리합니다.

## 1. 사전 확인

프로젝트 루트에서 실행합니다.

```bash
cd /Users/jwpios/antigravity/J-Brain
git status -sb
```

현재 기본 배포 브랜치는 `codex/jbrain-planning-docs`입니다.

## 2. GitHub에 소스 업데이트

추적 중인 파일 수정만 커밋/푸시할 때:

```bash
./deploy/push_to_github.sh "커밋 메시지"
```

새 파일까지 모두 포함해야 할 때:

```bash
./deploy/push_to_github.sh --all "커밋 메시지"
```

특정 파일만 포함하고 싶을 때:

```bash
./deploy/push_to_github.sh --paths "커밋 메시지" frontend/src/index.css frontend/src/components/Layout/AdminLayout.jsx
```

`--all`은 미추적 파일까지 포함하므로, 실행 전 `git status -s` 목록을 반드시 확인하세요.

## 3. Dev 서버에 배포

GitHub push 후 Dev 서버에서 pull 및 재기동을 실행합니다.

```bash
./deploy/deploy_dev_server.sh
```

다른 브랜치를 배포해야 하면:

```bash
BRANCH=main ./deploy/deploy_dev_server.sh
```

스크립트는 SSH로 `appuser@dev.jwinpartners.com:2222`에 접속합니다. 비밀번호나 SSH key는 로컬/운영 정책에 맞게 별도로 관리하세요.

## 4. GitHub push와 Dev 배포를 한 번에 실행

```bash
./deploy/deploy_all.sh "커밋 메시지"
```

새 파일까지 포함:

```bash
./deploy/deploy_all.sh --all "커밋 메시지"
```

특정 파일만 포함:

```bash
./deploy/deploy_all.sh --paths "커밋 메시지" frontend/src/index.css
```

## 5. 서버에서 실행되는 작업

Dev 서버 내부에서는 `deploy/deploy.sh`가 아래 작업을 수행합니다.

1. `/app/j-brain`에서 `git fetch origin`
2. 지정 브랜치 `git pull`
3. `backend/requirements.txt` 기준 Python 의존성 확인
4. `frontend`에서 `npm install`
5. `./stop.sh` 후 `./start_dev.sh`로 서버 재기동

## 6. 배포 후 확인

Dev 서버 내부 기준 포트:

```bash
curl -I http://127.0.0.1:8080
curl -I http://127.0.0.1:8088/docs
```

정상이라면 HTTP `200` 응답을 확인할 수 있습니다.

## 7. 주의사항

- `deploy/*.exp` 파일은 비밀번호가 들어갈 수 있으므로 Git 추적 대상에서 제외합니다.
- 데이터 파일, 로그, pack export 등 운영 중 생성 파일은 커밋 전에 반드시 제외 여부를 확인하세요.
- 전체 lint는 기존 코드베이스의 `prop-types`/unused import 이슈로 실패할 수 있습니다. 프론트엔드 변경 전후 최소 `npm run build`를 확인하세요.
