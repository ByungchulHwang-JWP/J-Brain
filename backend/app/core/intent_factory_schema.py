from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


INTENT_FACTORY_TABLES = [
    "intent_definitions",
    "intent_examples",
    "intent_actions",
    "intent_action_links",
    "intent_source_scopes",
    "intent_entities",
    "entity_synonyms",
    "intent_entity_links",
    "intent_faqs",
    "intent_pack_exports",
    "runtime_pack_store",
    "pack_validation_questions",
    "pack_validation_results",
    "faq_candidates",
    "active_runtime_packs",
    "pack_operation_audit_logs",
    "runtime_event_logs",
    "operation_metrics",
    "operation_improvement_requests",
    "pack_improvement_links",
    "project_operation_settings",
]


def build_create_table_sql() -> str:
    return """
    CREATE TABLE IF NOT EXISTS graphrag.intent_definitions (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        intent_name VARCHAR(240) NOT NULL,
        description TEXT,
        category VARCHAR(60) NOT NULL,
        action_id VARCHAR(160),
        status VARCHAR(40) NOT NULL DEFAULT 'draft',
        priority INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_examples (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        example_text TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id, example_text)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_actions (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        action_id VARCHAR(160) NOT NULL,
        action_name VARCHAR(240) NOT NULL,
        action_type VARCHAR(60) NOT NULL,
        description TEXT,
        execution_mode VARCHAR(80) NOT NULL DEFAULT 'local',
        route_value TEXT,
        menu_name VARCHAR(240),
        api_method VARCHAR(20),
        api_endpoint TEXT,
        sql_template TEXT,
        allowed_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, action_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_action_links (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        action_id VARCHAR(160) NOT NULL,
        action_type VARCHAR(60) NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id, action_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_source_scopes (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        source_category VARCHAR(120),
        source_status VARCHAR(40) NOT NULL DEFAULT 'completed',
        document_types JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        top_k INTEGER NOT NULL DEFAULT 5,
        score_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.650,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_entities (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        entity_type VARCHAR(160) NOT NULL,
        display_name VARCHAR(240) NOT NULL,
        value_type VARCHAR(80) NOT NULL DEFAULT 'string',
        required_validation BOOLEAN NOT NULL DEFAULT FALSE,
        normalization_rule VARCHAR(160),
        description TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, entity_type)
    );

    CREATE TABLE IF NOT EXISTS graphrag.entity_synonyms (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        entity_type VARCHAR(160) NOT NULL,
        canonical_value VARCHAR(240) NOT NULL,
        synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
        code VARCHAR(160),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, entity_type, canonical_value)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_entity_links (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        entity_type VARCHAR(160) NOT NULL,
        parameter_name VARCHAR(160),
        required BOOLEAN NOT NULL DEFAULT FALSE,
        default_policy TEXT,
        validation_rule TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id, entity_type)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_faqs (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        faq_id VARCHAR(160) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(120),
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_id VARCHAR(160),
        action_id VARCHAR(160) NOT NULL DEFAULT 'SEARCH_DOC',
        approved_for_pack BOOLEAN NOT NULL DEFAULT TRUE,
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, faq_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_pack_exports (
        id BIGSERIAL PRIMARY KEY,
        export_id VARCHAR(80) NOT NULL,
        project_id VARCHAR(120) NOT NULL,
        pack_id VARCHAR(180) NOT NULL,
        pack_version VARCHAR(80) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'exported',
        file_path TEXT NOT NULL,
        manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
        validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
        counts JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (export_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.runtime_pack_store (
        id BIGSERIAL PRIMARY KEY,
        import_id VARCHAR(80) NOT NULL,
        project_id VARCHAR(120) NOT NULL,
        pack_id VARCHAR(180) NOT NULL,
        pack_version VARCHAR(80) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'imported',
        source_export_id VARCHAR(80),
        zip_path TEXT,
        store_path TEXT NOT NULL,
        manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
        validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (import_id),
        UNIQUE (project_id, pack_id, pack_version)
    );

    ALTER TABLE graphrag.runtime_pack_store
        ADD COLUMN IF NOT EXISTS approved_by VARCHAR(120);

    ALTER TABLE graphrag.runtime_pack_store
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

    ALTER TABLE graphrag.runtime_pack_store
        ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

    CREATE TABLE IF NOT EXISTS graphrag.pack_validation_questions (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        question_id VARCHAR(160) NOT NULL,
        question TEXT NOT NULL,
        expected_intent_id VARCHAR(160) NOT NULL,
        expected_action_id VARCHAR(160) NOT NULL,
        min_confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.650,
        pack_id VARCHAR(180),
        pack_version VARCHAR(80),
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.pack_validation_results (
        id BIGSERIAL PRIMARY KEY,
        result_id VARCHAR(80) NOT NULL,
        project_id VARCHAR(120) NOT NULL,
        pack_id VARCHAR(180) NOT NULL,
        pack_version VARCHAR(80) NOT NULL,
        target_type VARCHAR(40) NOT NULL DEFAULT 'runtime_pack',
        status VARCHAR(40) NOT NULL,
        summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        results JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (result_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.faq_candidates (
        id BIGSERIAL PRIMARY KEY,
        candidate_id VARCHAR(160) NOT NULL,
        project_id VARCHAR(120) NOT NULL,
        question TEXT NOT NULL,
        suggested_answer TEXT,
        source_log_id VARCHAR(160),
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(40) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, candidate_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.active_runtime_packs (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        pack_id VARCHAR(180) NOT NULL,
        pack_version VARCHAR(80) NOT NULL,
        previous_pack_id VARCHAR(180),
        previous_pack_version VARCHAR(80),
        activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        activated_by VARCHAR(120),
        UNIQUE (project_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.pack_operation_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        operation VARCHAR(60) NOT NULL,
        pack_id VARCHAR(180),
        pack_version VARCHAR(80),
        status VARCHAR(40) NOT NULL,
        message TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS graphrag.runtime_event_logs (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        session_id VARCHAR(160),
        question TEXT NOT NULL,
        matched_intent_id VARCHAR(160),
        action_id VARCHAR(160),
        action_type VARCHAR(60),
        confidence NUMERIC(4, 3),
        confidence_label VARCHAR(40),
        fallback_yn BOOLEAN NOT NULL DEFAULT FALSE,
        response_status VARCHAR(40),
        response_time_ms INTEGER,
        active_pack_id VARCHAR(180),
        active_pack_version VARCHAR(80),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS graphrag.operation_metrics (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        metric_date DATE NOT NULL,
        total_requests INTEGER NOT NULL DEFAULT 0,
        intent_match_count INTEGER NOT NULL DEFAULT 0,
        fallback_count INTEGER NOT NULL DEFAULT 0,
        avg_confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.0,
        avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
        action_type_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, metric_date)
    );

    CREATE TABLE IF NOT EXISTS graphrag.operation_improvement_requests (
        id BIGSERIAL PRIMARY KEY,
        request_id VARCHAR(160) NOT NULL,
        project_id VARCHAR(120) NOT NULL,
        source_type VARCHAR(60),
        source_log_id BIGINT,
        request_type VARCHAR(60) NOT NULL,
        title VARCHAR(240) NOT NULL,
        description TEXT,
        severity VARCHAR(40) NOT NULL DEFAULT 'medium',
        status VARCHAR(40) NOT NULL DEFAULT 'new',
        assigned_to BIGINT,
        linked_intent_id VARCHAR(160),
        linked_action_id VARCHAR(160),
        linked_faq_id VARCHAR(160),
        target_pack_version VARCHAR(80),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, request_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.pack_improvement_links (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        request_id VARCHAR(160) NOT NULL,
        pack_id VARCHAR(180) NOT NULL,
        pack_version VARCHAR(80) NOT NULL,
        validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
        deployed_yn BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, request_id, pack_id, pack_version)
    );

    CREATE TABLE IF NOT EXISTS graphrag.project_operation_settings (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        low_confidence_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.650,
        alert_email VARCHAR(240),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id)
    );


    CREATE INDEX IF NOT EXISTS idx_intent_definitions_project_status
        ON graphrag.intent_definitions(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_intent_examples_project_intent
        ON graphrag.intent_examples(project_id, intent_id);

    CREATE INDEX IF NOT EXISTS idx_intent_actions_project_status
        ON graphrag.intent_actions(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_intent_source_scopes_project_intent
        ON graphrag.intent_source_scopes(project_id, intent_id);

    CREATE INDEX IF NOT EXISTS idx_intent_entities_project_status
        ON graphrag.intent_entities(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_entity_synonyms_project_entity
        ON graphrag.entity_synonyms(project_id, entity_type);

    CREATE INDEX IF NOT EXISTS idx_intent_entity_links_project_intent
        ON graphrag.intent_entity_links(project_id, intent_id);

    CREATE INDEX IF NOT EXISTS idx_intent_faqs_project_status
        ON graphrag.intent_faqs(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_intent_pack_exports_project_created
        ON graphrag.intent_pack_exports(project_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_runtime_pack_store_project_status
        ON graphrag.runtime_pack_store(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_pack_validation_questions_project_status
        ON graphrag.pack_validation_questions(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_pack_validation_results_project_created
        ON graphrag.pack_validation_results(project_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_faq_candidates_project_status
        ON graphrag.faq_candidates(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_pack_operation_audit_logs_project_created
        ON graphrag.pack_operation_audit_logs(project_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_runtime_event_logs_project_created
        ON graphrag.runtime_event_logs(project_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_operation_improvement_requests_project_status
        ON graphrag.operation_improvement_requests(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_pack_improvement_links_project_pack
        ON graphrag.pack_improvement_links(project_id, pack_id, pack_version);
    """


async def ensure_intent_factory_schema(db: AsyncSession) -> dict[str, int]:
    statements = [stmt.strip() for stmt in build_create_table_sql().split(";") if stmt.strip()]
    for statement in statements:
        await db.execute(text(statement))
    await db.commit()
    return {"tables": len(INTENT_FACTORY_TABLES), "statements": len(statements)}
