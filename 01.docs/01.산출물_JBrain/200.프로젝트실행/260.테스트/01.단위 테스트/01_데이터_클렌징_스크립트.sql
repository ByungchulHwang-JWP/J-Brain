-- ============================================================================
-- J-Brain 사용자 테스트(UAT) 데이터 클렌징 스크립트
-- ============================================================================
-- 작성일: 2026-07-04
-- 목  적: 사용자 테스트 시작 전 기존 테스트 데이터를 초기화하여
--         깨끗한 상태에서 테스트를 진행하기 위한 스크립트입니다.
-- 원  칙:
--   - 기초 데이터(마스터 데이터)는 보존합니다.
--     → 시스템 메뉴(sys_menus), 역할(sys_roles), 권한(sys_role_menus),
--       관리자 계정(admin_users)
--   - 프로젝트, 문서, 벡터, 그래프, 채팅, Intent Factory 관련 데이터는
--     모두 초기화합니다.
-- 주  의:
--   - 반드시 백업을 수행한 후 실행하십시오.
--   - 프로덕션 환경에서 실행하지 마십시오.
--   - 스키마는 graphrag 를 기준으로 합니다.
-- ============================================================================

-- ──────────────────────────────────────────────
-- 0. 사전 설정
-- ──────────────────────────────────────────────
SET search_path TO graphrag;

BEGIN;  -- 트랜잭션 시작 (오류 발생 시 전체 롤백)

-- ──────────────────────────────────────────────
-- 1단계: 채팅/세션 이력 초기화
-- ──────────────────────────────────────────────
-- 설명: 챗봇 대화 테스트 중 축적된 모든 대화 이력을 삭제합니다.
--       chat_history → chat_sessions 순서로 삭제합니다. (FK 의존)

DELETE FROM graphrag.chat_history;
DELETE FROM graphrag.chat_sessions;

RAISE NOTICE '[1/8] 채팅 이력 클렌징 완료 (chat_history, chat_sessions)';


-- ──────────────────────────────────────────────
-- 2단계: 인덱싱 작업(Job) 이력 초기화
-- ──────────────────────────────────────────────
-- 설명: 벡터화 작업 현황에 표시되는 모든 인덱싱 작업 기록을 삭제합니다.

DELETE FROM graphrag.index_jobs;

RAISE NOTICE '[2/8] 인덱싱 작업 이력 클렌징 완료 (index_jobs)';


-- ──────────────────────────────────────────────
-- 3단계: 벡터 청크 / GraphRAG Entity·Relation 초기화
-- ──────────────────────────────────────────────
-- 설명: Source 문서에서 생성된 임베딩 청크와 그래프 데이터를 삭제합니다.
--       graphrag_chunks 는 graphrag_sources.id를 FK로 참조합니다.

DELETE FROM graphrag.graphrag_chunks;
DELETE FROM graphrag.relations;
DELETE FROM graphrag.entities;

RAISE NOTICE '[3/8] 벡터 청크 / 그래프 데이터 클렌징 완료 (graphrag_chunks, entities, relations)';


-- ──────────────────────────────────────────────
-- 4단계: Source(지식 문서) 초기화
-- ──────────────────────────────────────────────
-- 설명: 프로젝트에 등록된 모든 지식 문서(Source)를 삭제합니다.
--       placeholder 레코드(프로젝트 생성용 더미)도 함께 삭제합니다.
--       → 프로젝트는 category 기반 가상 프로젝트이므로
--         graphrag_sources 를 전부 지우면 프로젝트도 초기화됩니다.

DELETE FROM graphrag.graphrag_sources;

RAISE NOTICE '[4/8] Source(지식 문서) 및 가상 프로젝트 클렌징 완료 (graphrag_sources)';


-- ──────────────────────────────────────────────
-- 5단계: 시스템 프롬프트 초기화
-- ──────────────────────────────────────────────
-- 설명: 사용자 정의 시스템 프롬프트를 모두 삭제합니다.
--       챗봇 응답 시 기본 내장 프롬프트가 자동으로 사용됩니다.

DELETE FROM graphrag.system_prompts;

RAISE NOTICE '[5/8] 시스템 프롬프트 클렌징 완료 (system_prompts)';


-- ──────────────────────────────────────────────
-- 6단계: Intent Factory 전체 초기화
-- ──────────────────────────────────────────────
-- 설명: Intent, Example, Action, FAQ, Entity, Synonym, Pack 관련
--       모든 테이블을 삭제합니다.
-- 주의: FK 의존 순서를 고려하여 삭제합니다.

-- 6-1. Pack 운영/감사 관련
DELETE FROM graphrag.pack_operation_audit_logs;
DELETE FROM graphrag.active_runtime_packs;
DELETE FROM graphrag.pack_validation_results;
DELETE FROM graphrag.pack_validation_questions;

-- 6-2. Pack Export/Import/Store
DELETE FROM graphrag.runtime_pack_store;
DELETE FROM graphrag.intent_pack_exports;

-- 6-3. FAQ 후보
DELETE FROM graphrag.faq_candidates;

-- 6-4. Intent-Entity 연결
DELETE FROM graphrag.intent_entity_links;

-- 6-5. Entity / Synonym
DELETE FROM graphrag.entity_synonyms;
DELETE FROM graphrag.intent_entities;

-- 6-6. Intent-Action 연결 및 Source Scope
DELETE FROM graphrag.intent_source_scopes;
DELETE FROM graphrag.intent_action_links;

-- 6-7. FAQ
DELETE FROM graphrag.intent_faqs;

-- 6-8. Action 정의
DELETE FROM graphrag.intent_actions;

-- 6-9. Intent Example / Definition
DELETE FROM graphrag.intent_examples;
DELETE FROM graphrag.intent_definitions;

RAISE NOTICE '[6/8] Intent Factory 전체 클렌징 완료 (16개 테이블)';


-- ──────────────────────────────────────────────
-- 7단계: 기존 projects 테이블 초기화 (존재 시)
-- ──────────────────────────────────────────────
-- 설명: init_db.py에서 생성된 레거시 projects 테이블이 존재할 경우
--       해당 데이터도 초기화합니다.

DELETE FROM graphrag.project_users;
DELETE FROM graphrag.chunks;
DELETE FROM graphrag.prompts;
DELETE FROM graphrag.sources;
DELETE FROM graphrag.projects;

RAISE NOTICE '[7/8] 레거시 프로젝트 테이블 클렌징 완료 (projects, sources, chunks, prompts, project_users)';


-- ──────────────────────────────────────────────
-- 8단계: 시퀀스 리셋 (선택사항)
-- ──────────────────────────────────────────────
-- 설명: SERIAL/BIGSERIAL 자동 증가 값을 1로 초기화합니다.
--       ID가 깔끔한 테스트 결과를 원할 때 사용합니다.

-- 채팅/세션
ALTER SEQUENCE IF EXISTS graphrag.chat_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.chat_history_id_seq RESTART WITH 1;

-- 인덱싱
-- (index_jobs.id는 UUID이므로 시퀀스 없음)

-- Intent Factory 테이블
ALTER SEQUENCE IF EXISTS graphrag.intent_definitions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_examples_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_actions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_action_links_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_source_scopes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_entities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphraf.entity_synonyms_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_entity_links_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_faqs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.intent_pack_exports_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.runtime_pack_store_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.pack_validation_questions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.pack_validation_results_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.faq_candidates_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.active_runtime_packs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.pack_operation_audit_logs_id_seq RESTART WITH 1;

-- 시스템 프롬프트
ALTER SEQUENCE IF EXISTS graphrag.system_prompts_id_seq RESTART WITH 1;

-- 레거시 테이블
ALTER SEQUENCE IF EXISTS graphrag.sources_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.chunks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.entities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.relations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS graphrag.prompts_id_seq RESTART WITH 1;

RAISE NOTICE '[8/8] 시퀀스 리셋 완료';


COMMIT;  -- 트랜잭션 커밋


-- ──────────────────────────────────────────────
-- 클렌징 결과 검증 쿼리
-- ──────────────────────────────────────────────
-- 아래 쿼리를 실행하여 모든 테이블이 0건인지 확인합니다.

SELECT '검증: graphrag_sources' AS 테이블명, COUNT(*) AS 건수 FROM graphrag.graphrag_sources
UNION ALL
SELECT '검증: graphrag_chunks', COUNT(*) FROM graphrag.graphrag_chunks
UNION ALL
SELECT '검증: index_jobs', COUNT(*) FROM graphrag.index_jobs
UNION ALL
SELECT '검증: chat_sessions', COUNT(*) FROM graphrag.chat_sessions
UNION ALL
SELECT '검증: chat_history', COUNT(*) FROM graphrag.chat_history
UNION ALL
SELECT '검증: system_prompts', COUNT(*) FROM graphrag.system_prompts
UNION ALL
SELECT '검증: intent_definitions', COUNT(*) FROM graphrag.intent_definitions
UNION ALL
SELECT '검증: intent_examples', COUNT(*) FROM graphrag.intent_examples
UNION ALL
SELECT '검증: intent_actions', COUNT(*) FROM graphrag.intent_actions
UNION ALL
SELECT '검증: intent_faqs', COUNT(*) FROM graphrag.intent_faqs
UNION ALL
SELECT '검증: intent_entities', COUNT(*) FROM graphrag.intent_entities
UNION ALL
SELECT '검증: entity_synonyms', COUNT(*) FROM graphrag.entity_synonyms
UNION ALL
SELECT '검증: runtime_pack_store', COUNT(*) FROM graphrag.runtime_pack_store
UNION ALL
SELECT '검증: active_runtime_packs', COUNT(*) FROM graphrag.active_runtime_packs
UNION ALL
SELECT '검증: entities (GraphRAG)', COUNT(*) FROM graphrag.entities
UNION ALL
SELECT '검증: relations (GraphRAG)', COUNT(*) FROM graphrag.relations;


-- ──────────────────────────────────────────────
-- 보존 데이터 확인 쿼리
-- ──────────────────────────────────────────────
-- 아래 쿼리로 기초(마스터) 데이터가 보존되었는지 확인합니다.

SELECT '보존: admin_users' AS 테이블명, COUNT(*) AS 건수 FROM graphrag.admin_users
UNION ALL
SELECT '보존: sys_menus', COUNT(*) FROM graphrag.sys_menus
UNION ALL
SELECT '보존: sys_roles', COUNT(*) FROM graphrag.sys_roles
UNION ALL
SELECT '보존: sys_role_menus', COUNT(*) FROM graphrag.sys_role_menus;


-- ============================================================================
-- 클렌징 완료
-- ============================================================================
-- 다음 단계:
--   1. 위 검증 쿼리 결과에서 모든 건수가 0인지 확인
--   2. 보존 데이터(admin_users, sys_menus 등)가 정상인지 확인
--   3. uploads 폴더의 파일 정리 (수동)
--        → 경로: backend/app_data/uploads/
--        → 테스트에 사용할 소스 파일 외 불필요한 파일 삭제
--   4. J-Brain 프로젝트 생성 테스트 시작
-- ============================================================================
