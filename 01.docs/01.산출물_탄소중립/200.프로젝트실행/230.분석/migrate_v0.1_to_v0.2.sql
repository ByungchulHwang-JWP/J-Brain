-- ============================================================
-- 탄소중립 챗봇 DB 마이그레이션 스크립트
-- 버전: v0.1 → v0.2
-- 작성일: 2026-06-22
-- 대상: dev.jwinpartners.com:5432 / vectordb / schema: graphrag
-- 목적: 화면 프로토타입 기반 누락 컬럼 추가 및 신규 테이블 생성
-- ============================================================

BEGIN;

-- ============================================================
-- [1] graphrag_sources 컬럼 추가
--     - file_size_bytes : BO 지식관리 목록 '파일 크기' 컬럼 표시
--     - uploaded_by     : 등록 관리자 추적
-- ============================================================
ALTER TABLE graphrag.graphrag_sources
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS uploaded_by     UUID REFERENCES graphrag.admin_users(id) ON DELETE SET NULL;

-- ============================================================
-- [2] system_prompts 컬럼 추가 및 버전 관리 지원
--     - version       : 프롬프트 버전 번호 (BO 버전 탭 UI 대응)
--     - is_active     : 현재 챗봇 적용 중인 버전 여부
--     - created_by    : 작성 관리자 ID
--     - created_at    : 최초 생성 시각
-- ============================================================
ALTER TABLE graphrag.system_prompts
    ADD COLUMN IF NOT EXISTS version    INTEGER      DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_active  BOOLEAN      DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_by UUID         REFERENCES graphrag.admin_users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ  DEFAULT NOW();

-- 기존 단일 레코드가 있다면 is_active=true, version=1 로 초기화
UPDATE graphrag.system_prompts
SET    is_active = TRUE, version = 1
WHERE  is_active IS NULL OR is_active = FALSE;

-- is_active=true 는 반드시 1건만 유지하는 Partial Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS uidx_system_prompts_active
    ON graphrag.system_prompts (is_active)
    WHERE is_active = TRUE;

-- ============================================================
-- [3] admin_users 컬럼 추가
--     - department      : 부서명 (BO 계정 목록 '부서' 컬럼)
--     - approval_status : 계정 승인 상태 (PENDING/APPROVED/REJECTED)
-- ============================================================
ALTER TABLE graphrag.admin_users
    ADD COLUMN IF NOT EXISTS department       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20) DEFAULT 'PENDING';

-- 기존 계정은 이미 활성 사용자이므로 APPROVED로 초기화
UPDATE graphrag.admin_users
SET    approval_status = 'APPROVED'
WHERE  approval_status = 'PENDING';

-- CHECK constraint: 허용 값만 저장
ALTER TABLE graphrag.admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_approval_status;
ALTER TABLE graphrag.admin_users
    ADD  CONSTRAINT chk_admin_users_approval_status
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ============================================================
-- [4] index_jobs 컬럼 추가
--     - total_chunks   : 전체 청크 수 (진행률 분모)
--     - progress_pct   : 진행률 % (BO Progress Bar UI 폴링용)
-- ============================================================
ALTER TABLE graphrag.index_jobs
    ADD COLUMN IF NOT EXISTS total_chunks  INTEGER,
    ADD COLUMN IF NOT EXISTS progress_pct  FLOAT DEFAULT 0.0;

-- ============================================================
-- [5] chat_logs 컬럼 추가
--     - query_text  : 사용자 질문 원문 (BO 사용 로그 조회)
--     - answer_text : 챗봇 답변 원문 (BO 사용 로그 조회)
-- ============================================================
ALTER TABLE graphrag.chat_logs
    ADD COLUMN IF NOT EXISTS query_text   TEXT,
    ADD COLUMN IF NOT EXISTS answer_text  TEXT;

-- ============================================================
-- [6] sys_menus 컬럼 추가
--     - menu_code  : 고유 식별 코드 (예: MENU_DASHBOARD)
--     - icon_code  : LNB 아이콘 코드
-- ============================================================
ALTER TABLE graphrag.sys_menus
    ADD COLUMN IF NOT EXISTS menu_code  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS icon_code  VARCHAR(100);

-- ============================================================
-- [7] evidence_logs 신규 테이블 생성 (v0.2)
--     FO 챗봇 위젯의 '출처(Evidence) 칩' 데이터 저장
--     chat_log 1건 : evidence_logs N건 (1:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS graphrag.evidence_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_log_id      UUID         NOT NULL REFERENCES graphrag.chat_logs(id) ON DELETE CASCADE,
    chunk_id         UUID         REFERENCES graphrag.graphrag_chunks(id)    ON DELETE SET NULL,
    source_name      VARCHAR(500) NOT NULL,   -- 출처 파일명 역정규화 (빠른 조회)
    relevance_score  FLOAT        NOT NULL,   -- 벡터 유사도 점수 (0.0~1.0)
    created_at       TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE  graphrag.evidence_logs                IS '챗봇 답변의 출처(Evidence) 청크 로그 - FO 챗봇 위젯의 출처 칩 표시에 사용';
COMMENT ON COLUMN graphrag.evidence_logs.chat_log_id    IS 'chat_logs.id FK - 어느 답변의 출처인지 연결';
COMMENT ON COLUMN graphrag.evidence_logs.chunk_id       IS 'graphrag_chunks.id FK - 실제 사용된 청크';
COMMENT ON COLUMN graphrag.evidence_logs.source_name    IS '출처 파일명 역정규화 저장 (JOIN 없이 빠른 조회)';
COMMENT ON COLUMN graphrag.evidence_logs.relevance_score IS '벡터 유사도 점수 (FO 화면의 96% 등 표시용)';

-- ============================================================
-- [8] 인덱스 최적화 추가 (v0.2)
-- ============================================================

-- 대시보드 일별 통계 집계 최적화
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at
    ON graphrag.chat_logs (created_at DESC);

-- 답변별 출처 청크 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evidence_logs_chat_log_id
    ON graphrag.evidence_logs (chat_log_id);

-- 미승인 계정 필터 조회 최적화
CREATE INDEX IF NOT EXISTS idx_admin_users_approval_status
    ON graphrag.admin_users (approval_status);

-- 현재 적용 프롬프트 단건 조회 최적화 (Partial Index)
-- (uidx_system_prompts_active에서 이미 처리됨)

-- index_jobs 진행률 폴링 최적화 (PROCESSING 상태만)
CREATE INDEX IF NOT EXISTS idx_index_jobs_status
    ON graphrag.index_jobs (status)
    WHERE status = 'PROCESSING';

-- ============================================================
-- [9] sys_roles & sys_menus 기초 데이터 적재 (없는 경우에만)
-- ============================================================
INSERT INTO graphrag.sys_roles (id, name, description)
VALUES
    ('ROLE_ADMIN',    '관리자', '시스템 전체 접근 권한'),
    ('ROLE_EMPLOYEE', '직원',   '조회 전용 접근 권한')
ON CONFLICT (id) DO NOTHING;

INSERT INTO graphrag.sys_menus (menu_name, menu_code, icon_code, url, parent_id, sort_order, is_active)
VALUES
    ('대시보드',              'MENU_DASHBOARD',     'icon-dashboard',  NULL,           NULL, 1, TRUE),
    ('운영 현황',             'MENU_DASH_VIEW',     NULL, '/admin/dashboard',        1, 1, TRUE),
    ('사용 통계',             'MENU_DASH_STATS',    NULL, '/admin/stats',            1, 2, TRUE),
    ('지식 관리',             'MENU_KNOWLEDGE',     'icon-folder',    NULL,           NULL, 2, TRUE),
    ('문서(Source) 목록',     'MENU_SRC_LIST',      NULL, '/admin/sources',          4, 1, TRUE),
    ('인덱싱 작업 현황',       'MENU_SRC_JOBS',      NULL, '/admin/jobs',             4, 2, TRUE),
    ('테스트/프롬프트',        'MENU_PROMPT',        'icon-chat',      NULL,           NULL, 3, TRUE),
    ('챗봇 테스트',           'MENU_PROMPT_TEST',   NULL, '/admin/prompt/test',      7, 1, TRUE),
    ('시스템 프롬프트 관리',   'MENU_PROMPT_EDIT',   NULL, '/admin/prompt',           7, 2, TRUE),
    ('사용 로그 조회',         'MENU_CHAT_LOGS',     NULL, '/admin/logs',             7, 3, TRUE),
    ('권한 관리',             'MENU_RBAC',          'icon-settings',  NULL,           NULL, 4, TRUE),
    ('계정 목록',             'MENU_USR_LIST',      NULL, '/admin/users',            11, 1, TRUE),
    ('메뉴-권한 매핑',         'MENU_PERM_MAP',      NULL, '/admin/permissions',      11, 2, TRUE)
ON CONFLICT DO NOTHING;

-- ROLE_ADMIN: 전체 메뉴 full access
INSERT INTO graphrag.sys_role_menus (role_id, menu_id, can_read, can_write)
SELECT 'ROLE_ADMIN', id, TRUE, TRUE
FROM   graphrag.sys_menus
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- ROLE_EMPLOYEE: 조회 전용 (권한관리 메뉴 제외)
INSERT INTO graphrag.sys_role_menus (role_id, menu_id, can_read, can_write)
SELECT 'ROLE_EMPLOYEE', id,
       CASE WHEN menu_code IN ('MENU_USR_LIST','MENU_PERM_MAP','MENU_RBAC') THEN FALSE ELSE TRUE END,
       FALSE
FROM   graphrag.sys_menus
ON CONFLICT (role_id, menu_id) DO NOTHING;

COMMIT;

-- ============================================================
-- 마이그레이션 결과 확인
-- ============================================================
SELECT
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'graphrag'
  AND (
    (c.table_name = 'graphrag_sources'  AND c.column_name IN ('file_size_bytes','uploaded_by'))
 OR (c.table_name = 'system_prompts'   AND c.column_name IN ('version','is_active','created_by','created_at'))
 OR (c.table_name = 'admin_users'      AND c.column_name IN ('department','approval_status'))
 OR (c.table_name = 'index_jobs'       AND c.column_name IN ('total_chunks','progress_pct'))
 OR (c.table_name = 'chat_logs'        AND c.column_name IN ('query_text','answer_text'))
 OR (c.table_name = 'sys_menus'        AND c.column_name IN ('menu_code','icon_code'))
 OR (c.table_name = 'evidence_logs')
  )
ORDER BY c.table_name, c.column_name;
