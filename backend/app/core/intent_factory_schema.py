from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


INTENT_FACTORY_TABLES = [
    "intent_definitions",
    "intent_examples",
    "intent_action_links",
    "intent_source_scopes",
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

    CREATE INDEX IF NOT EXISTS idx_intent_definitions_project_status
        ON graphrag.intent_definitions(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_intent_examples_project_intent
        ON graphrag.intent_examples(project_id, intent_id);

    CREATE INDEX IF NOT EXISTS idx_intent_source_scopes_project_intent
        ON graphrag.intent_source_scopes(project_id, intent_id);
    """


async def ensure_intent_factory_schema(db: AsyncSession) -> dict[str, int]:
    statements = [stmt.strip() for stmt in build_create_table_sql().split(";") if stmt.strip()]
    for statement in statements:
        await db.execute(text(statement))
    await db.commit()
    return {"tables": len(INTENT_FACTORY_TABLES), "statements": len(statements)}
