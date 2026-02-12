"""
HR 도메인 모델

인사/조직 정보 관련 ORM 모델을 정의합니다.
"""

# CM_USER 테이블은 기존 User 도메인의 모델을 재사용
from server.app.domain.user.models import User as CMUser
from server.app.domain.hr.models.employee import HRMgnt
from server.app.domain.hr.models.concurrent_position import HRMgntConcur
from server.app.domain.hr.models.department import CMDepartment, CMDepartmentTree

__all__ = [
    "CMUser",
    "HRMgnt",
    "HRMgntConcur",
    "CMDepartment",
    "CMDepartmentTree",
]
