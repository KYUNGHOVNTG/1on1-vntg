from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class CodeMasterBase(BaseModel):
    code_type: str = Field(..., description="코드 타입 (ROLE, POSITION 등)")
    code_type_name: str = Field(..., description="코드 타입명")
    code_len: int = Field(..., description="코드 길이")
    rmk: Optional[str] = Field(None, description="비고")


class CodeMasterCreate(BaseModel):
    code_type: str = Field(..., description="코드 타입")
    code_type_name: str = Field(..., description="코드 타입명")
    code_len: int = Field(0, description="코드 길이")
    rmk: Optional[str] = Field(None, description="비고")


class CodeMasterUpdate(BaseModel):
    code_type_name: Optional[str] = Field(None, description="코드 타입명")
    rmk: Optional[str] = Field(None, description="비고")


class CodeMasterResponse(CodeMasterBase):
    in_user: Optional[str] = Field(None, description="등록자")
    in_date: datetime = Field(..., description="등록일시")
    up_user: Optional[str] = Field(None, description="수정자")
    up_date: Optional[datetime] = Field(None, description="수정일시")

    model_config = ConfigDict(from_attributes=True)


class CodeDetailBase(BaseModel):
    code_type: str = Field(..., description="코드 타입")
    code: str = Field(..., description="코드 (CD001 형태)")
    code_name: str = Field(..., description="코드명 (HR, TEAM_LEADER 등)")
    use_yn: str = Field("Y", description="사용여부")
    sort_seq: Optional[int] = Field(None, description="정렬순서")
    rmk: Optional[str] = Field(None, description="비고")


class CodeDetailResponse(CodeDetailBase):
    in_user: Optional[str] = Field(None, description="등록자")
    in_date: datetime = Field(..., description="등록일시")
    up_user: Optional[str] = Field(None, description="수정자")
    up_date: Optional[datetime] = Field(None, description="수정일시")

    model_config = ConfigDict(from_attributes=True)
