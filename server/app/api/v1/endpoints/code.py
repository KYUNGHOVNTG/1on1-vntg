from typing import List

from fastapi import APIRouter, Depends, Path

from server.app.core.database import get_db, AsyncSession
from server.app.domain.common.schemas import (
    CodeMasterResponse, 
    CodeDetailResponse, 
    CodeMasterCreate, 
    CodeMasterUpdate
)
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


@router.post(
    "/masters",
    response_model=ServiceResult[CodeMasterResponse],
    summary="공통코드 마스터 생성",
    description="새로운 공통코드 마스터를 생성합니다.",
)
async def create_code_master(
    data: "CodeMasterCreate",
    db: AsyncSession = Depends(get_db),
):
    from server.app.domain.common.schemas import CodeMasterCreate  # local import to avoid circular issues
    service = CommonCodeService(db)
    try:
        master = await service.create_master(data)
        return ServiceResult.ok(data=master, message="공통코드 마스터 생성 성공")
    except ValueError as e:
        return ServiceResult.fail(message=str(e), error="DUPLICATE_CODE")
    except Exception as e:
        return ServiceResult.fail(message="공통코드 마스터 생성 중 오류 발생", error=str(e))


@router.put(
    "/masters/{code_type}",
    response_model=ServiceResult[CodeMasterResponse],
    summary="공통코드 마스터 수정",
    description="공통코드 마스터 정보를 수정합니다. (코드타입명 등)",
)
async def update_code_master(
    code_type: str = Path(..., description="코드 타입"),
    data: "CodeMasterUpdate" = None,
    db: AsyncSession = Depends(get_db),
):
    from server.app.domain.common.schemas import CodeMasterUpdate
    service = CommonCodeService(db)
    master = await service.update_master(code_type, data)
    if not master:
        return ServiceResult.fail(message=f"Code Type '{code_type}' not found.", error="NOT_FOUND")
    return ServiceResult.ok(data=master, message="공통코드 마스터 수정 성공")


@router.delete(
    "/masters/{code_type}",
    response_model=ServiceResult[bool],
    summary="공통코드 마스터 삭제",
    description="공통코드 마스터를 삭제합니다.",
)
async def delete_code_master(
    code_type: str = Path(..., description="코드 타입"),
    db: AsyncSession = Depends(get_db),
):
    service = CommonCodeService(db)
    success = await service.delete_master(code_type)
    if not success:
        return ServiceResult.fail(message=f"Code Type '{code_type}' not found.", error="NOT_FOUND")
    return ServiceResult.ok(data=True, message="공통코드 마스터 삭제 성공")
