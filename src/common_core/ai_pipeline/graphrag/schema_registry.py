"""Domain schema registry."""

from common_core.ai_pipeline.graphrag.schemas import DomainSchema, EntityTypeDef, RelationTypeDef


class SchemaRegistry:
    """In-memory registry for domain entity/relation schemas."""

    def __init__(self) -> None:
        self._schemas: dict[str, DomainSchema] = {}

    def register(self, schema: DomainSchema) -> None:
        """Register or replace a domain schema."""

        self._schemas[schema.domain] = schema

    def get(self, domain: str) -> DomainSchema:
        """Return a schema by domain."""

        try:
            return self._schemas[domain]
        except KeyError as exc:
            raise KeyError(f"Domain schema is not registered: {domain}") from exc

    def list_domains(self) -> list[str]:
        """Return registered domain names."""

        return sorted(self._schemas)

    @classmethod
    def with_defaults(cls) -> "SchemaRegistry":
        """Create a registry with the Sol-Bat pilot schema."""

        registry = cls()
        registry.register(sol_bat_pilot_schema())
        return registry


def sol_bat_pilot_schema() -> DomainSchema:
    """Return the Sol-Bat pilot domain schema."""

    return DomainSchema(
        domain="sol_bat",
        version="1.1.0-pilot",
        entity_types=[
            EntityTypeDef(
                type="CROP",
                description="Crop or variety grown on a farm",
                aliases=[
                    "crop",
                    "tomato",
                    "pepper",
                    "strawberry",
                    "garlic",
                    "작물",
                    "재배작물",
                    "토마토",
                    "고추",
                    "딸기",
                    "마늘",
                    "배추",
                    "상추",
                    "오이",
                ],
            ),
            EntityTypeDef(
                type="PEST_DISEASE",
                description="Plant disease, pest, or physiological disorder",
                aliases=[
                    "disease",
                    "pest",
                    "blight",
                    "aphid",
                    "mite",
                    "병해충",
                    "병",
                    "해충",
                    "역병",
                    "탄저병",
                    "흰가루병",
                    "잿빛곰팡이병",
                    "진딧물",
                    "응애",
                    "총채벌레",
                ],
            ),
            EntityTypeDef(
                type="SYMPTOM",
                description="Observed symptom on crop, leaf, stem, or fruit",
                aliases=[
                    "symptom",
                    "spot",
                    "wilting",
                    "yellowing",
                    "증상",
                    "병징",
                    "반점",
                    "갈변",
                    "황화",
                    "시듦",
                    "잎마름",
                    "낙과",
                ],
            ),
            EntityTypeDef(
                type="ENVIRONMENT_CONDITION",
                description="Weather or soil condition affecting crop growth and disease risk",
                aliases=[
                    "weather",
                    "soil",
                    "humid",
                    "humidity",
                    "rain",
                    "temperature",
                    "pH",
                    "환경",
                    "기상",
                    "날씨",
                    "토양",
                    "고온",
                    "저온",
                    "다습",
                    "건조",
                    "강우",
                    "습도",
                    "온도",
                    "배수",
                ],
            ),
            EntityTypeDef(
                type="MANAGEMENT_ACTION",
                description="Farm management action such as prevention, treatment, irrigation, and ventilation",
                aliases=[
                    "action",
                    "prevention",
                    "treatment",
                    "ventilation",
                    "irrigation",
                    "fertilization",
                    "관리",
                    "작업",
                    "조치",
                    "방제",
                    "예방",
                    "처방",
                    "관수",
                    "시비",
                    "환기",
                    "전정",
                    "제거",
                    "예찰",
                ],
            ),
            EntityTypeDef(
                type="AGRI_MATERIAL",
                description="Agricultural material such as pesticide, fungicide, fertilizer, or lime",
                aliases=[
                    "material",
                    "pesticide",
                    "fungicide",
                    "insecticide",
                    "fertilizer",
                    "lime",
                    "농자재",
                    "약제",
                    "농약",
                    "살균제",
                    "살충제",
                    "비료",
                    "퇴비",
                    "석회",
                    "유기물",
                    "멀칭",
                ],
            ),
            EntityTypeDef(
                type="REGION",
                description="Farm location or administrative region",
                aliases=[
                    "region",
                    "farm",
                    "field",
                    "location",
                    "지역",
                    "농장",
                    "위치",
                    "주소",
                    "전라남도",
                    "경기도",
                    "강진군",
                    "고흥군",
                ],
            ),
            EntityTypeDef(
                type="GROWTH_STAGE",
                description="Crop growth or cultivation stage",
                aliases=[
                    "growth stage",
                    "flowering",
                    "harvest",
                    "생육단계",
                    "재배단계",
                    "정식기",
                    "활착기",
                    "생육기",
                    "개화기",
                    "착과기",
                    "비대기",
                    "수확기",
                ],
            ),
        ],
        relation_types=[
            RelationTypeDef(
                type="HAS_RISK_OF",
                description="Crop, growth stage, or region has risk of disease or pest",
                source_types=["CROP", "GROWTH_STAGE", "REGION"],
                target_types=["PEST_DISEASE"],
            ),
            RelationTypeDef(
                type="PREVENTS",
                description="Management action or material prevents disease, pest, or symptom",
                source_types=["MANAGEMENT_ACTION", "AGRI_MATERIAL"],
                target_types=["PEST_DISEASE", "SYMPTOM"],
            ),
            RelationTypeDef(
                type="TREATS",
                description="Management action or material treats disease, pest, or symptom",
                source_types=["MANAGEMENT_ACTION", "AGRI_MATERIAL"],
                target_types=["PEST_DISEASE", "SYMPTOM"],
            ),
            RelationTypeDef(
                type="AFFECTS",
                description="Environment condition or disease affects crop, disease, or symptom",
                source_types=["ENVIRONMENT_CONDITION", "PEST_DISEASE"],
                target_types=["CROP", "PEST_DISEASE", "SYMPTOM"],
            ),
            RelationTypeDef(
                type="APPLIES_AT",
                description="Management action or material applies at growth stage or condition",
                source_types=["MANAGEMENT_ACTION", "AGRI_MATERIAL"],
                target_types=["GROWTH_STAGE", "ENVIRONMENT_CONDITION"],
            ),
        ],
    )
