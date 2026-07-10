from pydantic import BaseModel, Field

class LLMIntent(BaseModel):
    intent_name: str = Field(description="The name of the user intent")
    description: str = Field(description="Description of what the user wants to achieve")
    examples: list[str] = Field(description="3 to 5 example sentences the user might type")

class LLMEntity(BaseModel):
    entity_type: str = Field(description="The category or type of the entity (e.g., DEPARTMENT, SYSTEM_NAME)")
    display_name: str = Field(description="Human readable name of the entity")
    canonical_value: str = Field(description="The standard value of the entity")
    synonyms: list[str] = Field(description="List of synonyms or alternative names")

class LLMFaq(BaseModel):
    question: str = Field(description="A common question asked by users based on the document")
    answer: str = Field(description="The answer to the question based entirely on the document")

class LLMDiscoveryOutput(BaseModel):
    intents: list[LLMIntent] = Field(description="List of intents extracted from the document", max_length=15)
    entities: list[LLMEntity] = Field(description="List of entities/terms extracted from the document", max_length=15)
    faqs: list[LLMFaq] = Field(description="List of frequently asked questions extracted from the document", max_length=15)
