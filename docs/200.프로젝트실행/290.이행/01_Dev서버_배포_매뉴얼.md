# J-Brain Dev 서버 배포 매뉴얼

## 1. 목적

이 문서는 로컬 개발 환경에서 GitHub에 반영된 J-Brain 소스를 Dev 서버에 배포하는 절차를 정의한다.

배포 스크립트는 코드 반영과 서비스 재기동만 수행한다. DB seed, DB migration, 데이터 정리 작업은 배포 전에 별도 작업으로 완료한다.

## 2. 배포 원칙

- 로컬 환경과 Dev 서버는 동일한 DB 서버를 사용한다.
- 메뉴/권한 seed 같은 DB 작업은 배포 작업과 분리한다.
- DB 작업이 필요한 변경은 배포 전에 로컬 또는 지정된 운영 절차로 먼저 반영한다.
- Dev 배포는 GitHub에 push된 브랜치를 Dev 서버에서 pull 후 재기동하는 방식으로 수행한다.
- 배포 스크립트는 DB seed 명령을 실행하지 않는다.

## 3. 사전 조건

로컬 프로젝트 루트로 이동한다.

```bash
cd /Users/jwpios/antigravity/J-Brain
```

작업 브랜치를 확인한다.

```bash
git branch --show-current
```

작업 상태를 확인한다.

```bash
git status --short
```

배포 대상 변경만 커밋 대상에 포함한다. 다음과 같은 실행 부산물은 배포 커밋에 포함하지 않는다.

```text
backend/app_data/
logs/
*.pid
```

## 4. DB 선행 작업

DB 변경이 필요한 작업은 배포 전에 별도로 수행한다.

예를 들어 메뉴/권한 seed 변경이 있는 경우 아래 명령을 먼저 실행한다.

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
venv/bin/python seed_intent_factory_menus.py
```

정상 예시는 아래와 같다.

```text
{'menus': 22, 'role_menus': 22}
```

DB 선행 작업이 완료된 뒤 코드 배포를 진행한다.

## 5. GitHub 반영

변경 파일을 스테이징한다.

```bash
git add <배포할 파일 경로>
```

커밋한다.

```bash
git commit -m "커밋 메시지"
```

현재 브랜치를 GitHub에 push한다.

```bash
git push origin "$(git branch --show-current)"
```

## 6. Dev 서버 배포

기본 배포 명령은 아래와 같다.

```bash
./deploy/deploy_dev.sh
```

스크립트는 현재 로컬 브랜치를 자동 감지한다.

특정 브랜치를 지정하려면 아래처럼 실행한다.

```bash
./deploy/deploy_dev.sh --branch codex/jbrain-planning-docs
```

헬스 체크를 생략해야 하는 경우에는 아래처럼 실행한다.

```bash
./deploy/deploy_dev.sh --skip-health
```

## 7. 배포 스크립트 수행 내용

`deploy/deploy_dev.sh`는 아래 작업을 수행한다.

1. 현재 로컬 브랜치와 HEAD commit을 확인한다.
2. `origin/<branch>`가 로컬 HEAD와 동일한지 확인한다.
3. Dev 서버에 SSH로 접속한다.
4. Dev 서버의 `/app/j-brain`에서 `deploy/deploy.sh`를 실행한다.
5. Dev 서버 내부 배포 스크립트가 GitHub에서 지정 브랜치를 pull한다.
6. 백엔드 의존성을 확인한다.
7. 프론트엔드 의존성을 확인한다.
8. 기존 프로세스를 중지하고 서비스를 재기동한다.
9. 외부 Frontend URL 헬스 체크를 수행한다.

## 8. Dev 서버 내부 작업

Dev 서버에서는 기존 `deploy/deploy.sh`가 실행된다.

주요 작업은 아래와 같다.

```text
/app/j-brain
  git fetch origin
  git pull origin <branch>

/app/j-brain/backend
  pip install -r requirements.txt

/app/j-brain/frontend
  npm install

/app/j-brain
  ./stop.sh
  ./start_dev.sh
```

## 9. 정상 완료 기준

정상 완료 시 로컬 터미널에 아래 메시지가 출력된다.

```text
Dev deployment succeeded
```

Frontend 헬스 체크는 기본적으로 아래 URL을 확인한다.

```text
http://dev.jwinpartners.com:8080
```

Backend는 Dev 서버 내부에서 아래 URL로 확인할 수 있다.

```bash
curl -I http://127.0.0.1:8088/docs
```

## 10. 자주 발생하는 문제

### 원격 브랜치가 최신이 아닌 경우

아래 메시지가 출력될 수 있다.

```text
ERROR: Local HEAD is not pushed to origin/<branch>.
```

이 경우 먼저 GitHub에 push한다.

```bash
git push origin "$(git branch --show-current)"
```

### SSH 인증 실패

Dev 서버 SSH 인증이 실패하면 배포가 중단된다.

```text
Permission denied
```

SSH key 또는 비밀번호 정책을 확인한다.

접속 정보는 기본적으로 아래 값을 사용한다.

```text
SERVER=appuser@dev.jwinpartners.com
PORT=2222
PROJECT_DIR=/app/j-brain
```

필요 시 환경 변수로 변경할 수 있다.

```bash
SERVER=appuser@dev.jwinpartners.com PORT=2222 ./deploy/deploy_dev.sh
```

### Frontend 헬스 체크 실패

Frontend 외부 URL 접근이 제한된 경우 `--skip-health`로 배포만 수행한 뒤, 서버 내부에서 직접 확인한다.

```bash
./deploy/deploy_dev.sh --skip-health
```

## 11. 배포 후 확인 화면

브라우저에서 아래 화면을 확인한다.

```text
http://dev.jwinpartners.com:8080
```

확인 항목은 아래와 같다.

- 로그인 또는 관리자 화면 진입 여부
- 좌측 메뉴 노출 여부
- 최근 배포 기능 화면 진입 여부
- Runtime/Pack 관련 주요 화면 오류 여부
- 브라우저 콘솔의 치명 오류 여부

## 12. 운영 주의사항

- DB seed는 배포 스크립트에서 실행하지 않는다.
- DB 변경은 반드시 배포 전 선행 작업으로 별도 기록한다.
- 실행 부산물과 테스트 데이터는 커밋하지 않는다.
- 배포 전 `git status --short`로 커밋 범위를 확인한다.
- 배포 후 문제가 발생하면 직전 commit hash와 배포 시각을 기준으로 원인을 추적한다.
