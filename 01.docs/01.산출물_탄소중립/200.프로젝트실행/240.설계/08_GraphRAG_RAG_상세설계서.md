# 08. GraphRAG / RAG 상세 설계서

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | 사내 멀티 프로젝트 챗봇 GraphRAG 상세 설계서 |
| 작성일 | 2026-06-22 |
| 버전 | v1.0 |
| 목적 | 탄소중립, DPPA 등 사내 프로젝트의 도메인 특화 지식을 효과적으로 검색하고 추론하기 위한 AI 파이프라인 설계 |

---

## 2. 지식 인덱싱 파이프라인 (Data Ingestion)

### 2.1 문서 수집 및 파싱 구조
- **수집 대상**: PDF (매뉴얼/지침서), DOCX/HWP (기획서/요건서), TXT (로그/코드스니펫).
- **파서(Parser)**: 
  - `pdfplumber` 또는 `Unstructured` 라이브러리를 활용하여 텍스트 및 표(Table) 추출.
  - 표 데이터는 Markdown 형식으로 변환하여 행/열 컨텍스트 유실 방지.

### 2.2 청킹(Chunking) 및 정규화 정책
- **Text Normalization**: 특수 기호 제거, 다중 공백 단일화, 사내 고유 약어(예: DPPA, RE100, 온실가스) 보호 처리.
- **Chunking 규칙 (Recursive Character)**:
  - **Chunk Size**: 1024 Tokens (약 2000자 내외).
  - **Overlap**: 200 Tokens (문맥 단절 방지).
  - **문단 기반 분할**: 문장 중간이 끊기지 않도록 `\n\n` (문단), `.` (문장) 단위로 우선 분할.

### 2.3 Metadata Enrichment 정책
생성된 각 청크에 컨텍스트 메타데이터를 추가하여 검색 정확도를 높입니다.
- **`workspace_id`**: 철저한 데이터 격리를 위한 프로젝트 식별자 (필수).
- **`source_name`**: 원본 파일명 (답변 출처 표시에 사용).
- **`page_number`**: PDF 등 페이지 기반 문서의 경우 위치 정보.
- **`category`**: 지침, 매뉴얼, 기획서 등 관리자가 지정한 문서 유형.

---

## 3. GraphRAG 핵심: Entity & Relation 추출

단순 벡터 검색의 한계(단어 겹침에만 의존)를 극복하기 위해, LLM을 활용하여 청크 내에서 '사내 도메인 특화 지식 그래프'를 추출합니다.

### 3.1 탄소중립 도메인 예시
- **Entities (노드)**: 
  - `메뉴` (예: 배출량 산정 화면)
  - `배출원` (예: 고정연소, 이동연소)
  - `지표` (예: Scope1 배출량)
  - `문서` (예: 2024 탄소중립 가이드라인)
- **Relations (엣지)**: 
  - [고정연소] --(`산정방식이다`)--> [명세서 작성법]
  - [배출량 산정 화면] --(`포함한다`)--> [Scope1 배출량]

### 3.2 DPPA / ITO 도메인 예시 (확장 고려)
- **Entities**: `API 엔드포인트`, `정산 테이블`, `오류 코드`, `조치 방법`.
- **Relations**: [ERR-001] --(`해결책이다`)--> [DB 재시작 매뉴얼].

### 3.3 추출 프로세스
1. 청크별로 프롬프트("다음 텍스트에서 탄소중립 도메인 관련 주요 엔티티와 관계를 추출해")를 통해 JSON 형태로 결과 반환.
2. 중복 엔티티 병합 (Entity Resolution).
3. PostgreSQL (`entities`, `relations` 테이블)에 구조화하여 저장.

---

## 4. Hybrid Retrieval (하이브리드 검색)

사용자가 챗봇에 질의할 때 2가지 검색 엔진을 동시 가동합니다.

1. **Vector Search (Semantic)**:
   - 질의를 임베딩(예: `text-embedding-3-small`)하여 pgvector `chunks` 테이블에서 코사인 유사도(Cosine Similarity) 기준 상위 K개(예: Top 5) 청크 추출.
2. **Graph Traversal (Contextual)**:
   - 질의에서 핵심 엔티티(키워드)를 추출.
   - 해당 엔티티와 `relations` 테이블에 1~2 Depth로 연결된 이웃 엔티티들의 관계 설명(Description) 추출.

**Context Assembler**:
Vector 결과와 Graph 결과를 하나의 컨텍스트 문자열로 병합 (Re-ranking 적용 가능).

---

## 5. 생성 및 답변 구조 (LLM Answer Node)

### 5.1 프롬프트 구성 (System Prompt)
```text
당신은 [workspace_name] 프로젝트의 사내 지식 AI 어시스턴트입니다.
아래 제공된 [Context]만을 기반으로 사용자의 질문에 답변하세요.
[Context]에 없는 내용은 "해당 지식을 찾을 수 없습니다"라고 답하세요.
답변 시 참조한 [Context]의 출처(Source명)를 명시하세요.

[Context]
{assembled_context_from_vector_and_graph}

[User Query]
{user_query}
```

### 5.2 출처 표시 및 Fallback 구조
- **출처 맵핑**: 프롬프트 상단 Context에 `[문서명_페이지]` 태그를 삽입해두고, LLM이 응답 시 해당 태그를 인용하도록 유도합니다. (예: "배출량 산정은 A방식을 따릅니다. [탄소중립가이드_p12]"). 파서는 이 태그를 칩 UI로 변환합니다.
- **Fallback (미응답 처리)**: LLM이 "해당 지식을 찾을 수 없습니다" 류의 거절 문구를 출력하면, 시스템은 이를 `is_fallback=true`로 `chat_messages` 테이블에 로깅하여 향후 관리자가 보완할 수 있도록 합니다.

### 5.3 보안 및 필터링 제어
- **Prompt Injection 방어**: 사용자 질의(`user_query`) 내에 "이전 지시 무시해" 등의 공격 벡터가 있는지 LLM(가드레일 프롬프트) 또는 규칙 기반으로 사전 필터링합니다.
- **PII 필터링**: 정규식을 통해 주민번호, 여권번호, 사내 주요 비밀번호 패턴을 마스킹한 후 LLM API로 전송합니다.
