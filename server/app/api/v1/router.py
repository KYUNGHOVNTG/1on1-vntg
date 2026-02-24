"""
API v1 라우터 통합

모든 v1 엔드포인트를 하나의 라우터로 통합합니다.
"""

from fastapi import APIRouter

from server.app.api.v1.endpoints import sample, docs, system, menu, code
from server.app.domain.auth.router import router as auth_router
from server.app.domain.permission.router import router as permission_router
from server.app.domain.hr.router import router as hr_router
from server.app.domain.rnr.router import router as rnr_router

# v1 메인 라우터 생성
api_router = APIRouter()

# 각 도메인의 라우터를 포함
api_router.include_router(
    sample.router,
    # prefix는 이미 sample.router에 정의되어 있음
)

# 문서 제공 라우터
api_router.include_router(
    docs.router,
    # prefix는 이미 docs.router에 정의되어 있음
)

# System 도메인 라우터
api_router.include_router(
    system.router,
    # prefix는 이미 system.router에 정의되어 있음
)

# Auth 도메인 라우터 (Google OAuth)
api_router.include_router(
    auth_router,
    # prefix는 이미 auth_router에 정의되어 있음
)

# Menu 도메인 라우터
api_router.include_router(
    menu.router,
    # prefix는 이미 menu.router에 정의되어 있음
)

# Common Code 도메인 라우터
api_router.include_router(
    code.router,
)

# Permission 도메인 라우터 (권한 관리)
api_router.include_router(
    permission_router,
    # prefix는 이미 permission_router에 정의되어 있음
)

# HR 도메인 라우터 (직원/부서 관리)
api_router.include_router(
    hr_router,
    # prefix는 이미 hr_router에 정의되어 있음
)

# R&R 도메인 라우터 (나의 R&R 관리)
api_router.include_router(
    rnr_router,
    # prefix는 이미 rnr_router에 정의되어 있음
)

# TODO: 새로운 도메인을 추가할 때 여기에 라우터를 포함하세요
# 예시:
# from server.app.api.v1.endpoints import another_domain
# api_router.include_router(another_domain.router)


# 헬스체크 엔드포인트 (v1 루트)
@api_router.get(
    "/health",
    tags=["health"],
    summary="API 헬스체크",
    description="API v1의 전체 상태를 확인합니다.",
)
async def health_check() -> dict:
    """
    전체 API 헬스체크

    Returns:
        dict: API 상태 정보
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "api": "v1",
    }
