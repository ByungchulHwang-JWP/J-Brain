"""Optional FastAPI router skeleton for the Admin MVP."""

from common_core.admin.schemas import (
    AdminApiResponse,
    GraphRAGSearchTestRequest,
    IndexJobRequest,
    SourceCreateRequest,
)
from common_core.admin.service import AdminService


def create_admin_router(service: AdminService | None = None):
    """Create a FastAPI router when FastAPI is installed."""

    try:
        from fastapi import APIRouter
    except ImportError as exc:
        raise RuntimeError("FastAPI is required to create the admin router.") from exc

    admin_service = service or AdminService()
    router = APIRouter(prefix="/api/admin", tags=["admin"])

    @router.post("/sources")
    def create_source(request: SourceCreateRequest):
        return AdminApiResponse(success=True, data=admin_service.create_source(request))

    @router.get("/sources")
    def list_sources():
        return AdminApiResponse(success=True, data=admin_service.list_sources())

    @router.get("/sources/{source_id}")
    def get_source(source_id: str):
        return AdminApiResponse(success=True, data=admin_service.get_source(source_id))

    @router.delete("/sources/{source_id}")
    def delete_source(source_id: str):
        return AdminApiResponse(success=True, data=admin_service.delete_source(source_id))

    @router.get("/sources/{source_id}/preview")
    def get_source_preview(source_id: str, limit: int = 20):
        return AdminApiResponse(success=True, data=admin_service.get_source_preview(source_id, limit))

    @router.post("/index-jobs")
    def create_index_job(request: IndexJobRequest):
        return AdminApiResponse(success=True, data=admin_service.create_index_job(request))

    @router.post("/index-jobs/{job_id}/run")
    def run_index_job(job_id: str):
        return AdminApiResponse(success=True, data=admin_service.run_index_job(job_id))

    @router.get("/index-jobs")
    def list_index_jobs():
        return AdminApiResponse(success=True, data=admin_service.list_index_jobs())

    @router.get("/index-jobs/{job_id}")
    def get_index_job(job_id: str):
        return AdminApiResponse(success=True, data=admin_service.get_index_job(job_id))

    @router.post("/index-jobs/{job_id}/retry")
    def retry_index_job(job_id: str):
        return AdminApiResponse(success=True, data=admin_service.retry_index_job(job_id))

    @router.post("/retrieval-tests")
    def search_test(request: GraphRAGSearchTestRequest):
        return AdminApiResponse(success=True, data=admin_service.search_test(request))

    return router
