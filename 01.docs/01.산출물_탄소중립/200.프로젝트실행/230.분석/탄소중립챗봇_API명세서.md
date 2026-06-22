# 탄소 중립플랫폼 챗봇 API 명세서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 문서명 | 탄소 중립플랫폼 챗봇 API 명세서 |
| 버전 | v0.2 |
| 작성일 | 2026-06-22 |
| 작성자 | 분석/설계 담당자 |
| 설명 | FO 챗봇 질의응답 및 BO 관리자 기능 전체 REST API 규격 정의 |
| 변경 이력 | v0.2: 화면 프로토타입 기반 BO 계정관리, 메뉴권한, 대시보드 통계, 프롬프트 버전, 인덱싱 진행률 API 추가 |

---

## 2. API 목록 (Overview)

### 2.1 공통 인증 (Authentication)
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-AUTH-001` | GET | `/api/v1/auth/google` | Google OAuth2 로그인 리다이렉트 |
| `API-AUTH-002` | GET | `/api/v1/auth/google/callback` | Google OAuth2 콜백 처리 → JWT 발급 |
| `API-AUTH-003` | POST | `/api/v1/auth/logout` | 로그아웃 (토큰 무효화) |
| `API-AUTH-004` | GET | `/api/v1/auth/me` | 로그인된 사용자 정보 조회 (권한, 메뉴 목록 포함) |

### 2.2 Front-Office (사용자 챗봇)
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-FO-001` | POST | `/api/v1/chat` | 챗봇 질의응답 (GraphRAG 파이프라인) |
| `API-FO-002` | GET | `/api/v1/chat/history/{session_id}` | 세션 대화 이력 조회 |
| `API-FO-003` | DELETE | `/api/v1/chat/history/{session_id}` | 대화 이력 초기화 (새 대화 버튼) `v0.2 추가` |

### 2.3 Back-Office: 대시보드
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-BO-DASH-001` | GET | `/api/v1/admin/stats/summary` | KPI 요약 (오늘 질문 수, 활성 사용자, 문서 수, 응답시간) `v0.2 추가` |
| `API-BO-DASH-002` | GET | `/api/v1/admin/stats/daily` | 일별 질문 수 추이 데이터 `v0.2 추가` |
| `API-BO-DASH-003` | GET | `/api/v1/admin/stats/keywords` | 인기 키워드 목록 `v0.2 추가` |
| `API-BO-DASH-004` | GET | `/api/v1/admin/system/events` | 시스템 이벤트 로그 목록 `v0.2 추가` |

### 2.4 Back-Office: 지식 관리
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-BO-SRC-001` | POST | `/api/v1/admin/sources` | 지식 소스(문서) 파일 업로드 및 등록 |
| `API-BO-SRC-002` | GET | `/api/v1/admin/sources` | 등록된 지식 소스 목록 조회 (필터/검색/페이징) |
| `API-BO-SRC-003` | DELETE | `/api/v1/admin/sources/{source_id}` | 지식 소스 삭제 |
| `API-BO-SRC-004` | POST | `/api/v1/admin/sources/{source_id}/index` | 인덱싱 실행 (비동기 백그라운드) |
| `API-BO-SRC-005` | GET | `/api/v1/admin/sources/{source_id}/job-status` | 인덱싱 진행률(%) 조회 (폴링용) `v0.2 추가` |

### 2.5 Back-Office: 프롬프트 관리
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-BO-PRM-001` | GET | `/api/v1/admin/prompt` | 현재 활성화된 시스템 프롬프트 조회 |
| `API-BO-PRM-002` | GET | `/api/v1/admin/prompt/history` | 프롬프트 버전 목록 조회 `v0.2 추가` |
| `API-BO-PRM-003` | GET | `/api/v1/admin/prompt/{version}` | 특정 버전 프롬프트 내용 조회 `v0.2 추가` |
| `API-BO-PRM-004` | POST | `/api/v1/admin/prompt` | 프롬프트 저장 및 즉시 적용 (신규 버전 생성) |
| `API-BO-PRM-005` | PUT | `/api/v1/admin/prompt/{version}/restore` | 이전 버전으로 복원 `v0.2 추가` |

### 2.6 Back-Office: 권한 및 메뉴 관리 `v0.2 추가`
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-BO-USR-001` | GET | `/api/v1/admin/users` | 계정 목록 조회 (역할/이메일 필터, 페이징) |
| `API-BO-USR-002` | PUT | `/api/v1/admin/users/{user_id}/role` | 특정 계정의 역할(Role) 변경 |
| `API-BO-USR-003` | PUT | `/api/v1/admin/users/{user_id}/approval` | 미승인 계정 승인 또는 거절 |
| `API-BO-USR-004` | POST | `/api/v1/admin/users` | 계정 수동 등록 |
| `API-BO-MNU-001` | GET | `/api/v1/admin/menus/permissions/{role_id}` | 특정 역할의 메뉴별 권한 조회 |
| `API-BO-MNU-002` | PUT | `/api/v1/admin/menus/permissions/{role_id}` | 특정 역할의 메뉴 권한 일괄 저장 |

### 2.7 Back-Office: 사용 로그 조회 `v0.2 추가`
| API ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| `API-BO-LOG-001` | GET | `/api/v1/admin/chat-logs` | 챗봇 사용 로그 목록 (기간/상태 필터, 페이징) |
| `API-BO-LOG-002` | GET | `/api/v1/admin/chat-logs/{log_id}` | 특정 로그 상세 (질문, 답변, 출처 청크 포함) |

---

## 3. Front-Office API 상세

### 3.1 `API-FO-001`: 챗봇 질의응답 요청
사용자가 입력한 질문을 분석하여 GraphRAG 파이프라인을 거쳐 근거(Evidence) 기반의 답변을 반환합니다.

- **Method**: `POST`
- **Endpoint**: `/api/v1/chat`
- **Content-Type**: `application/json`
- **인증**: Bearer JWT (선택. 비로그인 사용자도 호출 가능하나 대화 이력 미저장)

#### Request Body
```json
{
  "session_id": "string (optional, 없으면 신규 UUID 생성)",
  "query": "string (사용자 질문, 필수)",
  "stream": "boolean (기본값: false. true 시 SSE 스트리밍 응답)"
}
```

#### Response Body (성공, stream=false)
```json
{
  "status": "success",
  "data": {
    "session_id": "uuid-1234-5678",
    "answer": "배출권거래제(K-ETS)는 온실가스를 배출하는 사업장... (LLM 답변)",
    "evidences": [
      {
        "source_name": "배출권거래제_운영지침_2026.pdf",
        "chunk_text": "제1조(목적) 이 지침은 온실가스 배출권의 할당 및...",
        "relevance_score": 0.95
      }
    ],
    "processing_time_ms": 1820
  }
}
```

---

### 3.2 `API-FO-002`: 대화 이력 조회
```http
GET /api/v1/chat/history/{session_id}
```
#### Response Body
```json
{
  "status": "success",
  "data": [
    { "role": "user", "content": "KOC가 무엇인가요?", "created_at": "2026-06-22T10:00:00Z" },
    { "role": "assistant", "content": "KOC는 외부사업 감축실적을 의미합니다.", "created_at": "2026-06-22T10:00:05Z" }
  ]
}
```

---

### 3.3 `API-FO-003`: 대화 이력 초기화 `v0.2 추가`
FO 챗봇 위젯의 "새 대화(🔄)" 버튼과 연동됩니다.
```http
DELETE /api/v1/chat/history/{session_id}
```
#### Response Body
```json
{ "status": "success", "message": "대화 이력이 초기화되었습니다." }
```

---

## 4. Back-Office API 상세

### 4.1 `API-BO-DASH-001`: KPI 요약 조회 `v0.2 추가`
BO 대시보드 상단 KPI 카드 4개(오늘 질문 수, 활성 사용자, 인덱싱 완료 문서, 평균 응답시간)에 대응합니다.
```http
GET /api/v1/admin/stats/summary
Authorization: Bearer {admin_jwt}
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "today_query_count": 1284,
    "today_query_change_pct": 12.3,
    "active_users_today": 342,
    "active_users_change_pct": 8.1,
    "indexed_source_count": 87,
    "avg_response_time_sec": 1.82
  }
}
```

---

### 4.2 `API-BO-DASH-002`: 일별 질문 수 추이 `v0.2 추가`
BO 대시보드 바 차트 데이터에 대응합니다.
```http
GET /api/v1/admin/stats/daily?days=7
Authorization: Bearer {admin_jwt}
```
#### Response Body
```json
{
  "status": "success",
  "data": [
    { "date": "2026-06-16", "query_count": 980 },
    { "date": "2026-06-17", "query_count": 1150 }
  ]
}
```

---

### 4.3 `API-BO-SRC-001`: 지식 소스 등록
관리자가 PDF, DOCX, TXT 등의 문서를 업로드하여 지식 소스로 등록합니다.

- **Method**: `POST`
- **Endpoint**: `/api/v1/admin/sources`
- **Content-Type**: `multipart/form-data`
- **인증**: Bearer JWT (ROLE_ADMIN 필요)

#### Request Data
- `file`: `File` (업로드 문서 파일, 필수)
- `category`: `string` (법령/제도, 가이드라인, 사내규정, 보고서)
- `description`: `string` (선택)

#### Response Body
```json
{
  "status": "success",
  "data": {
    "source_id": "uuid-src-9999",
    "file_name": "배출권거래제_운영지침_2026.pdf",
    "file_size_bytes": 2516582,
    "category": "법령/제도",
    "status": "UPLOADED"
  }
}
```

---

### 4.4 `API-BO-SRC-002`: 지식 소스 목록 조회
BO 지식관리 목록 화면의 검색 필터 및 페이지네이션에 대응합니다.
```http
GET /api/v1/admin/sources?status=COMPLETED&category=법령/제도&q=배출권&page=1&size=10
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "total": 87,
    "page": 1,
    "size": 10,
    "items": [
      {
        "source_id": "uuid-src-0086",
        "file_name": "탄소중립기본법_해설서_v3.pdf",
        "category": "법령/제도",
        "file_size_bytes": 5349734,
        "status": "COMPLETED",
        "progress_pct": 100.0,
        "uploaded_by_name": "홍길동",
        "created_at": "2026-06-21T13:55:00Z"
      }
    ]
  }
}
```

---

### 4.5 `API-BO-SRC-005`: 인덱싱 진행률 조회 `v0.2 추가`
BO 지식관리 목록의 **진행률 바(Progress Bar)** UI를 위한 폴링 API입니다.
```http
GET /api/v1/admin/sources/{source_id}/job-status
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "job_id": "job-abc-123",
    "source_id": "uuid-src-9999",
    "status": "PROCESSING",
    "total_chunks": 142,
    "processed_chunks": 88,
    "progress_pct": 61.97,
    "error_message": null
  }
}
```

---

### 4.6 `API-BO-PRM-001`: 현재 프롬프트 조회
```http
GET /api/v1/admin/prompt
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "version": 3,
    "prompt_content": "당신은 탄소중립 전문 AI 어시스턴트입니다...",
    "is_active": true,
    "created_by_name": "홍길동",
    "updated_at": "2026-06-20T14:30:22Z"
  }
}
```

---

### 4.7 `API-BO-PRM-002`: 프롬프트 버전 목록 `v0.2 추가`
BO 프롬프트 편집기 상단의 버전 탭 목록에 대응합니다.
```http
GET /api/v1/admin/prompt/history
```
#### Response Body
```json
{
  "status": "success",
  "data": [
    { "version": 3, "is_active": true, "created_by_name": "홍길동", "updated_at": "2026-06-20T14:30:00Z" },
    { "version": 2, "is_active": false, "created_by_name": "홍길동", "updated_at": "2026-06-15T10:00:00Z" },
    { "version": 1, "is_active": false, "created_by_name": "김철수", "updated_at": "2026-05-30T09:00:00Z" }
  ]
}
```

---

### 4.8 `API-BO-PRM-004`: 프롬프트 저장 및 즉시 적용
```http
POST /api/v1/admin/prompt
Content-Type: application/json
```
#### Request Body
```json
{
  "prompt_content": "당신은 탄소중립 전문 AI 어시스턴트입니다. ..."
}
```
#### Response Body
```json
{
  "status": "success",
  "message": "프롬프트 v4가 저장되어 즉시 적용되었습니다.",
  "data": { "version": 4, "is_active": true }
}
```

---

### 4.9 `API-BO-USR-001`: 계정 목록 조회 `v0.2 추가`
BO 권한관리 > 계정 목록 화면에 대응합니다.
```http
GET /api/v1/admin/users?role=ROLE_EMPLOYEE&q=홍&page=1&size=10
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "total": 4,
    "items": [
      {
        "user_id": "uuid-usr-001",
        "name": "홍길동",
        "email": "hong@kicox.or.kr",
        "department": "탄소중립팀",
        "role_id": "ROLE_ADMIN",
        "role_name": "관리자",
        "approval_status": "APPROVED",
        "last_login_at": "2026-06-22T14:20:00Z",
        "created_at": "2026-05-10T09:00:00Z"
      }
    ]
  }
}
```

---

### 4.10 `API-BO-USR-002`: 계정 역할 변경 `v0.2 추가`
BO 계정 목록의 역할(Role) 드롭다운 저장 버튼에 대응합니다.
```http
PUT /api/v1/admin/users/{user_id}/role
Content-Type: application/json
```
#### Request Body
```json
{ "role_id": "ROLE_EMPLOYEE" }
```
#### Response Body
```json
{ "status": "success", "message": "역할이 변경되었습니다." }
```

---

### 4.11 `API-BO-USR-003`: 미승인 계정 승인/거절 `v0.2 추가`
BO 계정 목록의 "승인" / "거절" 버튼에 대응합니다.
```http
PUT /api/v1/admin/users/{user_id}/approval
Content-Type: application/json
```
#### Request Body
```json
{ "action": "APPROVE", "role_id": "ROLE_EMPLOYEE" }
```
```json
{ "action": "REJECT" }
```
#### Response Body
```json
{ "status": "success", "message": "계정이 승인되었습니다." }
```

---

### 4.12 `API-BO-MNU-001`: 역할별 메뉴 권한 조회 `v0.2 추가`
BO 메뉴-권한 매핑 화면에서 역할 클릭 시 체크박스 상태를 로드합니다.
```http
GET /api/v1/admin/menus/permissions/ROLE_EMPLOYEE
```
#### Response Body
```json
{
  "status": "success",
  "data": {
    "role_id": "ROLE_EMPLOYEE",
    "permissions": [
      { "menu_id": 1, "menu_name": "운영 현황", "menu_code": "MENU_DASH_VIEW", "can_read": true, "can_write": false },
      { "menu_id": 3, "menu_name": "문서 목록", "menu_code": "MENU_SRC_LIST", "can_read": true, "can_write": false },
      { "menu_id": 7, "menu_name": "계정 목록", "menu_code": "MENU_USR_LIST", "can_read": false, "can_write": false }
    ]
  }
}
```

---

### 4.13 `API-BO-MNU-002`: 역할별 메뉴 권한 일괄 저장 `v0.2 추가`
BO 메뉴-권한 매핑 화면의 "권한 저장" 버튼에 대응합니다.
```http
PUT /api/v1/admin/menus/permissions/ROLE_EMPLOYEE
Content-Type: application/json
```
#### Request Body
```json
{
  "permissions": [
    { "menu_id": 1, "can_read": true, "can_write": false },
    { "menu_id": 3, "can_read": true, "can_write": false },
    { "menu_id": 7, "can_read": false, "can_write": false }
  ]
}
```
#### Response Body
```json
{ "status": "success", "message": "ROLE_EMPLOYEE의 메뉴 권한이 저장되었습니다." }
```

---

## 5. 공통 오류(Error) 규격

API 호출 중 에러 발생 시 아래와 같은 표준 포맷으로 응답합니다.
```json
{
  "status": "error",
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "필수 파라미터가 누락되었습니다. (query)"
  }
}
```

| HTTP 상태 코드 | 에러 코드 예시 | 의미 |
| --- | --- | --- |
| `200 OK` | - | 정상 처리 |
| `400 Bad Request` | `ERR_VALIDATION_FAILED` | 파라미터 누락, 유효성 검사 실패 |
| `401 Unauthorized` | `ERR_UNAUTHORIZED` | 인증 토큰 누락 또는 만료 |
| `403 Forbidden` | `ERR_FORBIDDEN` | 권한 부족 (예: 직원이 관리자 API 호출) `v0.2 추가` |
| `404 Not Found` | `ERR_NOT_FOUND` | 리소스(세션, 소스 파일 등)를 찾을 수 없음 |
| `409 Conflict` | `ERR_ALREADY_PROCESSING` | 이미 인덱싱 진행 중인 소스 재요청 `v0.2 추가` |
| `500 Internal Server Error` | `ERR_INTERNAL` | 백엔드 서버 처리 중 예외 발생 |

---

## 6. 인증 및 권한 정책

### 6.1 JWT 토큰 구조
Google OAuth2 콜백 이후 서버에서 발급하는 JWT에는 아래 Claim이 포함됩니다.
```json
{
  "sub": "google_user_id",
  "email": "hong@kicox.or.kr",
  "name": "홍길동",
  "role": "ROLE_ADMIN",
  "allowed_menus": ["MENU_DASH_VIEW", "MENU_SRC_LIST", "MENU_USR_LIST"],
  "exp": 1719072000
}
```

### 6.2 API 접근 권한 요약
| API 그룹 | 비로그인(Guest) | 직원(ROLE_EMPLOYEE) | 관리자(ROLE_ADMIN) |
| --- | --- | --- | --- |
| FO 챗봇 (`/chat`) | ✅ (이력 미저장) | ✅ | ✅ |
| BO 대시보드 (`/admin/stats`) | ❌ | ✅ (조회만) | ✅ |
| BO 지식관리 (`/admin/sources`) | ❌ | ✅ (조회만) | ✅ (전체) |
| BO 프롬프트 (`/admin/prompt`) | ❌ | ✅ (조회만) | ✅ (전체) |
| BO 계정/권한 (`/admin/users`, `/admin/menus`) | ❌ | ❌ | ✅ |
