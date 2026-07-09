# 06. API 명세서

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | 멀티 프로젝트 챗봇 플랫폼 API 명세서 |
| 작성일 | 2026-06-22 |
| 버전 | v2.0 (Multi-Tenant 확장판) |
| 설계 원칙 | - 모든 리소스 접근은 `workspace_id` 파라미터를 기반으로 격리 검증을 수행합니다.<br>- 권한(Role)에 따라 허용 가능한 API Endpoint가 제한됩니다. |

---

## 2. 공통 인증 및 플랫폼 통합 API (System Level)

### 2.1 공통 인증 (SSO & Token)
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-AUTH-001` | GET | `/api/v1/auth/google` | Google OAuth2 로그인 리다이렉트 (사내 계정) | Public |
| `API-AUTH-002` | GET | `/api/v1/auth/google/callback` | OAuth2 콜백 → 멀티 테넌시 대응 JWT 발급 | Public |
| `API-AUTH-003` | GET | `/api/v1/auth/me` | 로그인 사용자 정보 및 허용된 Workspace 목록 반환 | Any Auth |
| `API-AUTH-004` | POST | `/api/v1/auth/logout` | 토큰 무효화 | Any Auth |

### 2.2 플랫폼 전체 관리 (System Admin 전용)
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-SYS-001` | GET | `/api/v1/system/workspaces` | 플랫폼 전체 생성된 Workspace 목록 조회 | System Admin |
| `API-SYS-002` | POST | `/api/v1/system/workspaces` | 신규 프로젝트 Workspace 셋업 (생성) | System Admin |
| `API-SYS-003` | GET | `/api/v1/system/stats` | 전체 플랫폼 일일 사용량(Token 등) 총합 대시보드 통계 | System Admin |

---

## 3. 사용자 사이트 API (Front-Office 챗봇)
*FO에서 호출하는 모든 API는 어느 프로젝트 위젯에서 호출했는지 판단하기 위해 URL Path에 `workspace_id`를 포함합니다.*

| API ID | Method | Endpoint | 설명 |
|---|---|---|---|
| `API-FO-CHAT-01` | POST | `/api/v1/workspaces/{workspace_id}/chat` | 질의 전송 및 스트리밍(SSE) 답변 응답 (GraphRAG 수행) |
| `API-FO-CHAT-02` | GET | `/api/v1/workspaces/{workspace_id}/chat/history/{session_id}` | 기존 대화 이력 세션 복원 |
| `API-FO-CHAT-03` | GET | `/api/v1/workspaces/{workspace_id}/chat/suggested` | 해당 프로젝트에 설정된 초기 추천 질문 3~5개 조회 |
| `API-FO-CHAT-04` | POST | `/api/v1/workspaces/{workspace_id}/chat/{log_id}/feedback` | 특정 답변에 대한 좋아요/싫어요 평가 및 의견 제출 |

**[API-FO-CHAT-01 Request 예시]**
```json
{
  "session_id": "uuid-optional",
  "query": "탄소중립 배출권 할당 방식은?",
  "stream": true
}
```

---

## 4. 관리자 사이트 API (Back-Office Workspace 레벨)
*BO에서 로그인 후 특정 Workspace를 선택하여 관리할 때 호출되는 API들입니다. (인가된 사용자만 접근 가능)*

### 4.1 챗봇 설정 및 프롬프트
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-BO-CFG-01` | GET | `/api/v1/workspaces/{ws_id}/settings` | 챗봇 테마, 인사말 설정 조회 | W-Admin, K-Mgr |
| `API-BO-CFG-02` | PUT | `/api/v1/workspaces/{ws_id}/settings` | 챗봇 설정 저장 | W-Admin |
| `API-BO-PRM-01` | GET | `/api/v1/workspaces/{ws_id}/prompts/active` | 현재 적용 중인 시스템 프롬프트 조회 | W-Admin, K-Mgr |
| `API-BO-PRM-02` | POST | `/api/v1/workspaces/{ws_id}/prompts` | 신규 프롬프트 버전 저장 및 활성화 적용 | W-Admin |

### 4.2 지식 파이프라인 (문서/FAQ/인덱싱)
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-BO-FAQ-01` | POST | `/api/v1/workspaces/{ws_id}/faqs` | 수동 단답형 FAQ 등록 | K-Mgr |
| `API-BO-SRC-01` | POST | `/api/v1/workspaces/{ws_id}/sources` | 지식 근거용 문서 파일(PDF 등) 업로드 (multipart) | K-Mgr |
| `API-BO-SRC-02` | GET | `/api/v1/workspaces/{ws_id}/sources` | 해당 프로젝트 내 업로드 문서 목록 조회 | K-Mgr, Op |
| `API-BO-IDX-01` | POST | `/api/v1/workspaces/{ws_id}/index-jobs` | 선택한 문서들의 GraphRAG 인덱싱 비동기 실행 요청 | K-Mgr |
| `API-BO-IDX-02` | GET | `/api/v1/workspaces/{ws_id}/index-jobs/{job_id}/status` | 인덱싱 작업 진행률(Progress %) 폴링 | K-Mgr |
| `API-BO-PRV-01` | GET | `/api/v1/workspaces/{ws_id}/preview/chunks` | 추출 완료된 Chunk / Entity / Relation 데이터 검수용 조회 | K-Mgr |

### 4.3 운영 모니터링 (로그, 피드백, 통계)
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-BO-LOG-01` | GET | `/api/v1/workspaces/{ws_id}/chat-logs` | 사용자 대화 이력 조회 (기간, 미응답 필터 가능) | Op, W-Admin |
| `API-BO-LOG-02` | GET | `/api/v1/workspaces/{ws_id}/feedback` | 사용자가 남긴 평가(좋아요/싫어요) 내역 리스트 조회 | Op |
| `API-BO-STT-01` | GET | `/api/v1/workspaces/{ws_id}/stats/daily` | 해당 프로젝트의 일별 질의 수 및 LLM 토큰 소모 추이 | Op, Viewer |

### 4.4 프로젝트 권한 및 보안 통제
| API ID | Method | Endpoint | 설명 | 권한 |
|---|---|---|---|---|
| `API-BO-USR-01` | GET | `/api/v1/workspaces/{ws_id}/users` | 해당 프로젝트 내 등록된 구성원 목록 및 Role 조회 | W-Admin |
| `API-BO-USR-02` | PUT | `/api/v1/workspaces/{ws_id}/users/{user_id}/role` | 특정 구성원에게 Role 할당 (Manager/Operator 지정 등) | W-Admin |
| `API-BO-ADT-01` | GET | `/api/v1/workspaces/{ws_id}/audit-logs` | 관리자가 시스템/문서에 가한 조작 이력(감사 로그) 열람 | W-Admin |

---

## 5. 공통 오류 (Error) 및 응답 구조
멀티 테넌시 적용에 따라, 권한 부재 및 격리 위반에 대한 표준 에러 응답 규격을 준수합니다.

```json
{
  "status": "error",
  "error": {
    "code": "ERR_WORKSPACE_FORBIDDEN",
    "message": "해당 Workspace(DPPA)에 접근할 권한이 없습니다."
  }
}
```

| HTTP Status | 에러 코드 (code) | 의미 |
|---|---|---|
| `401 Unauthorized` | `ERR_UNAUTHORIZED` | 인증 토큰 만료 또는 없음 |
| `403 Forbidden` | `ERR_WORKSPACE_FORBIDDEN` | 다른 프로젝트 데이터에 접근 시도 시 (데이터 격리 방어) |
| `404 Not Found` | `ERR_WORKSPACE_NOT_FOUND` | 요청한 `workspace_id`가 비활성화 또는 존재하지 않음 |
| `429 Too Many Requests`| `ERR_RATE_LIMIT_EXCEEDED` | 과도한 챗봇 질의 시 차단 (Rate Limit) |
