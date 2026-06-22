"""Vector store adapter factory."""

from common_core.ai_pipeline.vectorstores.base import VectorStoreAdapter
from common_core.ai_pipeline.vectorstores.faiss_adapter import FAISSVectorStoreAdapter
from common_core.ai_pipeline.vectorstores.in_memory import InMemoryVectorStore
from common_core.ai_pipeline.vectorstores.pgvector_adapter import PGVectorStoreAdapter


class VectorStoreFactory:
    """Registry based factory for vector store adapters."""

    def __init__(self, register_defaults: bool = True) -> None:
        self._providers: dict[str, VectorStoreAdapter] = {}
        if register_defaults:
            self.register("in_memory", InMemoryVectorStore())
            self.register("faiss", FAISSVectorStoreAdapter())
            self.register("pgvector", PGVectorStoreAdapter())

    def register(self, provider: str, adapter: VectorStoreAdapter) -> None:
        """Register a vector store adapter."""

        self._providers[provider.lower()] = adapter

    def unregister(self, provider: str) -> None:
        """Remove a registered provider."""

        self._providers.pop(provider.lower(), None)

    def get(self, provider: str) -> VectorStoreAdapter:
        """Return a registered adapter by provider name."""

        key = provider.lower()
        try:
            return self._providers[key]
        except KeyError as exc:
            raise KeyError(f"Vector store provider is not registered: {provider}") from exc

    def list_providers(self) -> list[str]:
        """Return registered provider names."""

        return sorted(self._providers)

    def health_check_all(self) -> dict[str, object]:
        """Return health checks for all registered providers."""

        return {
            provider: adapter.health_check()
            for provider, adapter in self._providers.items()
        }
