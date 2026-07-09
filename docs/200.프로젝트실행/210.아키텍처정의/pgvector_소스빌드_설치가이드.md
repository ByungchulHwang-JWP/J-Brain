# pgvector 소스 빌드 설치 가이드

## 환경 정보

| 항목 | 내용 |
| --- | --- |
| OS | Red Hat Enterprise Linux 8.x (또는 CentOS 8) |
| PostgreSQL | 15.10 (x86_64, GCC 64-bit) |
| 대상 서버 | dev.jwinpartners.com |
| DB명 | kap |
| 설치 방식 | 소스 빌드 (Source Build) |

> [!IMPORTANT]
> 아래 모든 명령어는 **서버 SSH 접속 후** 실행합니다.
> `sudo` 또는 `root` 권한이 필요한 단계가 포함되어 있습니다.

---

## STEP 1. 사전 준비: 빌드 도구 설치

pgvector는 C 확장이므로 GCC, make, PostgreSQL 개발 헤더(devel)가 필요합니다.

```bash
# root 또는 sudo 권한으로 실행
sudo dnf install -y gcc make git

# PostgreSQL 15 개발 헤더 설치 (pg_config 경로 확인 포함)
sudo dnf install -y postgresql15-devel

# pg_config 위치 확인 (설치 경로 파악용)
pg_config --version
# 출력 예시: PostgreSQL 15.10
```

> [!NOTE]
> `postgresql15-devel`이 없을 경우 아래 방법으로 PGDG 레포지토리를 먼저 등록합니다.
> ```bash
> sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
> sudo dnf -qy module disable postgresql
> sudo dnf install -y postgresql15-devel
> ```

---

## STEP 2. pgvector 소스 다운로드

```bash
# 홈 디렉터리로 이동
cd ~

# GitHub에서 pgvector 소스 클론
git clone https://github.com/pgvector/pgvector.git

# 디렉터리 진입
cd pgvector

# 최신 안정 버전 태그로 체크아웃 (PostgreSQL 15 지원 확인된 버전)
git checkout v0.8.0
```

---

## STEP 3. 소스 빌드 및 설치

```bash
# pgvector 소스 빌드
make

# 설치 (PostgreSQL의 extension 디렉터리에 복사됨)
sudo make install
```

> [!NOTE]
> `pg_config`가 PATH에 없을 경우 아래와 같이 명시적으로 지정합니다.
> ```bash
> make PG_CONFIG=/usr/pgsql-15/bin/pg_config
> sudo make install PG_CONFIG=/usr/pgsql-15/bin/pg_config
> ```

설치 완료 확인:

```bash
# PostgreSQL extension 디렉터리에 vector.so 파일이 생성되었는지 확인
ls $(pg_config --pkglibdir)/vector*
# 예상 출력: /usr/pgsql-15/lib/vector.so

ls $(pg_config --sharedir)/extension/vector*
# 예상 출력: vector.control, vector--0.8.0.sql 등
```

---

## STEP 4. PostgreSQL DB에 Extension 활성화

빌드 설치가 완료되면, 사용할 데이터베이스에서 Extension을 활성화합니다.

```bash
# PostgreSQL 접속 (postgres 슈퍼유저로)
psql -U postgres -d kap
```

psql 프롬프트에서:

```sql
-- pgvector Extension 설치
CREATE EXTENSION IF NOT EXISTS vector;

-- 설치 확인
SELECT name, installed_version FROM pg_extension WHERE extname = 'vector';
-- 출력 예시:
--  name  | installed_version
-- -------+------------------
--  vector | 0.8.0

-- 간단한 동작 테스트 (3차원 벡터 연산)
SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector AS cosine_distance;
```

> [!IMPORTANT]
> `CREATE EXTENSION`은 **슈퍼유저(postgres)** 또는 Extension 생성 권한을 가진 계정으로만 실행 가능합니다.
> `kapsvc` 계정에 권한이 없을 경우 postgres 계정으로 먼저 실행 후 kapsvc에 사용 권한을 부여합니다.

---

## STEP 5. kapsvc 계정 권한 확인 및 부여

```sql
-- postgres 계정으로 접속 후 실행
-- kapsvc가 vector 타입과 함수를 사용할 수 있도록 권한 부여
GRANT USAGE ON SCHEMA public TO kapsvc;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kapsvc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kapsvc;
```

---

## STEP 6. 설치 최종 검증

아래 명령어를 `kapsvc` 계정으로 실행하여 정상 동작을 확인합니다.

```bash
PGPASSWORD='kapdata12#' psql -h dev.jwinpartners.com -p 5432 -U kapsvc -d kap -c "
SELECT name, installed_version FROM pg_extension WHERE extname = 'vector';
SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector AS distance;
"
```

예상 출력:
```
  name  | installed_version
--------+------------------
 vector | 0.8.0
(1 row)

     distance
------------------
 5.196152422706632
(1 row)
```

---

## 문제 해결 (Troubleshooting)

| 오류 메시지 | 원인 | 해결 방법 |
| --- | --- | --- |
| `pg_config: command not found` | PostgreSQL devel 패키지 미설치 | `dnf install postgresql15-devel` |
| `ERROR: could not open extension control file` | `make install` 미실행 또는 실패 | `sudo make install` 재실행 확인 |
| `ERROR: permission denied to create extension` | kapsvc 계정 권한 부족 | postgres 계정으로 `CREATE EXTENSION` 실행 |
| `fatal error: postgres.h: No such file or directory` | PostgreSQL 헤더 파일 없음 | `pg_config --includedir-server` 경로 확인 및 devel 재설치 |
| `make: cc: Command not found` | GCC 미설치 | `dnf install gcc` |

---

## 설치 완료 후 다음 단계

pgvector 설치가 완료되면 아래 작업을 진행합니다.

1. **pgvector 설치 완료 확인** → 위 STEP 6 검증 결과를 공유해 주세요.
2. **GraphRAG 테이블 DDL 생성** → `kap` DB에 챗봇 지식 저장을 위한 스키마(테이블) 생성을 진행합니다.
3. **환경 변수 설정** → `.env` 파일에 DB 접속 정보 등록 및 연동 테스트를 수행합니다.
