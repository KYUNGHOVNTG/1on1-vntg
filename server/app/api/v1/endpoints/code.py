from typing import List

from fastapi import APIRouter, Depends, Path

from server.app.core.database import get_db, AsyncSession
from server.app.domain.common.schemas import CodeMasterResponse, CodeDetailResponse
from server.app.domain.common.service import CommonCodeService
from server.app.shared.types import ServiceResult

router = APIRouter(
    prefix="/codes",
    tags=["codes"],
)


@router.get(
    "/masters",
    response_model=ServiceResult[List[CodeMasterResponse]],
    summary="공통코드 마스터 목록 조회",
    description="모든 공통코드 마스터 목록을 조회합니다.",
)
async def read_code_masters(
    db: AsyncSession = Depends(get_db),
):
    service = CommonCodeService(db)
    masters = await service.get_all_masters()
    return ServiceResult.ok(data=masters, message="공통코드 마스터 목록 조회 성공")


@router.get(
    "/masters/{code_type}/details",
    response_model=ServiceResult[List[CodeDetailResponse]],
    summary="공통코드 상세 목록 조회",
    description="특정 마스터 코드에 속한 상세 코드 목록을 조회합니다.",
)
async def read_code_details(
    code_type: str = Path(..., description="코드 타입"),
    db: AsyncSession = Depends(get_db),
):
    service = CommonCodeService(db)
    details = await service.get_details_by_master_id(code_type)
    return ServiceResult.ok(data=details, message="공통코드 상세 목록 조회 성공")
