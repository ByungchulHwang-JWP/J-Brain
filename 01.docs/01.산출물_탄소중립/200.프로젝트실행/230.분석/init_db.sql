-- 탄소 중립플랫폼 챗봇 데이터베이스 DDL 스크립트
-- 환경: PostgreSQL 15 + pgvector
-- 대상 DB: vectordb

-- 1. pgvector 확장 활성화 (이미 설치되어 있어야 함)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1-1. 스키마 생성 및 설정 (PostgreSQL 15+ 권한 문제 해결)
CREATE SCHEMA IF NOT EXISTS graphrag AUTHORIZATION vectorsvc;
SET search_path TO graphrag, public;

-- 2. 지식 소스 (문서) 메타데이터
CREATE TABLE IF NOT EXISTS graphrag_sources (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'UPLOADED', -- UPLOADED, PROCESSING, COMPLETED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 청크 (문서 파편화 데이터 및 벡터 임베딩)
CREATE TABLE IF NOT EXISTS graphrag_chunks (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES graphrag_sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    -- 텍스트 임베딩 벡터 (예: OpenAI text-embedding-3-small 사용 시 1536 차원)
    embedding vector(1536), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 벡터 검색을 위한 HNSW 인덱스 생성 (Cosine distance)
CREATE INDEX IF NOT EXISTS idx_graphrag_chunks_embedding ON graphrag_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. 엔티티 (그래프 노드)
CREATE TABLE IF NOT EXISTS graphrag_entities (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- Organization, Regulation, Project 등
    description TEXT,
    source_chunk_ids UUID[], -- 이 엔티티가 발견된 Chunk ID 목록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 엔티티 이름 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_name ON graphrag_entities(name);

-- 5. 관계 (그래프 엣지)
CREATE TABLE IF NOT EXISTS graphrag_relations (
    id UUID PRIMARY KEY,
    source_entity_id UUID REFERENCES graphrag_entities(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES graphrag_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL, -- COMPLIES_WITH, REGULATES 등
    description TEXT,
    source_chunk_ids UUID[], -- 이 관계가 발견된 Chunk ID 목록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_graphrag_relations_src_tgt ON graphrag_relations(source_entity_id, target_entity_id);

-- 6. 챗봇 세션
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY,
    user_id VARCHAR(100), -- 인증 연동 시 사용자 식별자 (Optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 챗봇 대화 이력
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);

-- 8. 관리자 프롬프트 관리
CREATE TABLE IF NOT EXISTS system_prompts (
    id SERIAL PRIMARY KEY,
    prompt_content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 프롬프트 데이터 1건 삽입
INSERT INTO system_prompts (prompt_content) 
VALUES ('당신은 KT Net Zero의 전문 탄소중립 어시스턴트입니다. 항상 친절하고 명확하게 답변하며, 제공된 문맥(Context)을 기반으로 답변합니다. 탄소와 무관한 질문에는 정중히 거절하십시오.')
ON CONFLICT DO NOTHING;

-- 9. 권한 (Roles)
CREATE TABLE IF NOT EXISTS sys_roles (
    id VARCHAR(50) PRIMARY KEY, -- 예: 'ROLE_ADMIN', 'ROLE_EMPLOYEE'
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 기본 권한 데이터 삽입
INSERT INTO sys_roles (id, name, description) VALUES 
('ROLE_ADMIN', '관리자', '시스템 전체 통제 및 관리 권한'),
('ROLE_EMPLOYEE', '직원', '조회 및 제한적 관리 권한')
ON CONFLICT DO NOTHING;

-- 10. 메뉴 (Menus)
CREATE TABLE IF NOT EXISTS sys_menus (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES sys_menus(id) ON DELETE SET NULL,
    menu_name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. 권한별 메뉴 접근 관리 (Role-Menu Mapping)
CREATE TABLE IF NOT EXISTS sys_role_menus (
    role_id VARCHAR(50) REFERENCES sys_roles(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES sys_menus(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT FALSE,  -- 조회 권한
    can_write BOOLEAN DEFAULT FALSE, -- 등록/수정 권한
    PRIMARY KEY (role_id, menu_id)
);

-- 12. 사용자 정보 (구글 SSO 연동용)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    role_id VARCHAR(50) REFERENCES sys_roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 13. 지식 인덱싱 작업 이력 (Index Jobs)
CREATE TABLE IF NOT EXISTS index_jobs (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES graphrag_sources(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- PENDING, PROCESSING, COMPLETED, FAILED
    processed_chunks INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_index_jobs_source ON index_jobs(source_id);

-- 14. 챗봇 사용 통계 및 로그
CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(100),
    processing_time_ms INTEGER, -- 응답 소요 시간
    tokens_used INTEGER, -- LLM 토큰 사용량
    status VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, ERROR
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
