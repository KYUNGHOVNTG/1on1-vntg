"""조직도 계층형 시드 데이터 추가

Revision ID: i6j7k8l9m0n1
Revises: h5i6j7k8l9m0
Create Date: 2026-02-23 00:00:00.000000

조직도 관리 메뉴에서 트리 구조가 표시되도록 계층형 부서 데이터를 추가합니다.

cm_department: 3depth 구조 (경영본부 / 기술본부 / 영업본부 및 하위 팀/파트)
cm_department_tree: 위와 동일한 계층 정보 (조직도 트리 조회용)

특이사항:
- ON CONFLICT DO NOTHING 사용으로 중복 실행 안전
- 기존 D001~D005 데이터와 코드 체계가 다른 DEPT001~ 사용하므로 충돌 없음
- dept_head_emp_no는 hr_mgnt 참조가 없으므로 NULL로 설정
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "i6j7k8l9m0n1"
down_revision: Union[str, None] = "h5i6j7k8l9m0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    계층형 조직도 시드 데이터 추가

    구조:
    경영본부 (DEPT001) [Lvl 1]
    ├── 인사팀 (DEPT011) [Lvl 2]
    │   ├── 채용파트 (DEPT111) [Lvl 3]
    │   └── 평가파트 (DEPT112) [Lvl 3]
    └── 재무팀 (DEPT012) [Lvl 2]

    기술본부 (DEPT002) [Lvl 1]
    ├── 개발1팀 (DEPT021) [Lvl 2]
    │   ├── 프론트엔드파트 (DEPT211) [Lvl 3]
    │   └── 백엔드파트 (DEPT212) [Lvl 3]
    └── 개발2팀 (DEPT022) [Lvl 2]
        └── AI파트 (DEPT221) [Lvl 3]

    영업본부 (DEPT003) [Lvl 1]
    ├── 영업1팀 (DEPT031) [Lvl 2]
    │   └── 영업지원파트 (DEPT311) [Lvl 3]
    └── 영업2팀 (DEPT032) [Lvl 2]
    """

    # =============================================
    # 1. cm_department: 계층형 부서 데이터
    # =============================================
    op.execute("""
        INSERT INTO cm_department (dept_code, dept_name, upper_dept_code, dept_head_emp_no, use_yn, in_user)
        VALUES
            -- Level 1: 본부
            ('DEPT001', '경영본부',        NULL,       NULL, 'Y', 'system'),
            ('DEPT002', '기술본부',        NULL,       NULL, 'Y', 'system'),
            ('DEPT003', '영업본부',        NULL,       NULL, 'Y', 'system'),
            -- Level 2: 팀 (경영본부 산하)
            ('DEPT011', '인사팀',          'DEPT001',  NULL, 'Y', 'system'),
            ('DEPT012', '재무팀',          'DEPT001',  NULL, 'Y', 'system'),
            -- Level 2: 팀 (기술본부 산하)
            ('DEPT021', '개발1팀',         'DEPT002',  NULL, 'Y', 'system'),
            ('DEPT022', '개발2팀',         'DEPT002',  NULL, 'Y', 'system'),
            -- Level 2: 팀 (영업본부 산하)
            ('DEPT031', '영업1팀',         'DEPT003',  NULL, 'Y', 'system'),
            ('DEPT032', '영업2팀',         'DEPT003',  NULL, 'Y', 'system'),
            -- Level 3: 파트 (인사팀 산하)
            ('DEPT111', '채용파트',        'DEPT011',  NULL, 'Y', 'system'),
            ('DEPT112', '평가파트',        'DEPT011',  NULL, 'Y', 'system'),
            -- Level 3: 파트 (개발1팀 산하)
            ('DEPT211', '프론트엔드파트',  'DEPT021',  NULL, 'Y', 'system'),
            ('DEPT212', '백엔드파트',      'DEPT021',  NULL, 'Y', 'system'),
            -- Level 3: 파트 (개발2팀 산하)
            ('DEPT221', 'AI파트',          'DEPT022',  NULL, 'Y', 'system'),
            -- Level 3: 파트 (영업1팀 산하)
            ('DEPT311', '영업지원파트',    'DEPT031',  NULL, 'Y', 'system')
        ON CONFLICT (dept_code) DO NOTHING
    """)

    # =============================================
    # 2. cm_department_tree: 조직도 트리 데이터 (2026년 기준)
    # =============================================
    op.execute("""
        INSERT INTO cm_department_tree
            (std_year, dept_code, upper_dept_code, dept_name, disp_lvl, dept_head_emp_no, name_kor, in_user)
        VALUES
            -- Level 1: 본부
            ('2026', 'DEPT001', NULL,       '경영본부',        1, NULL, NULL, 'system'),
            ('2026', 'DEPT002', NULL,       '기술본부',        1, NULL, NULL, 'system'),
            ('2026', 'DEPT003', NULL,       '영업본부',        1, NULL, NULL, 'system'),
            -- Level 2: 팀 (경영본부 산하)
            ('2026', 'DEPT011', 'DEPT001',  '인사팀',          2, NULL, NULL, 'system'),
            ('2026', 'DEPT012', 'DEPT001',  '재무팀',          2, NULL, NULL, 'system'),
            -- Level 2: 팀 (기술본부 산하)
            ('2026', 'DEPT021', 'DEPT002',  '개발1팀',         2, NULL, NULL, 'system'),
            ('2026', 'DEPT022', 'DEPT002',  '개발2팀',         2, NULL, NULL, 'system'),
            -- Level 2: 팀 (영업본부 산하)
            ('2026', 'DEPT031', 'DEPT003',  '영업1팀',         2, NULL, NULL, 'system'),
            ('2026', 'DEPT032', 'DEPT003',  '영업2팀',         2, NULL, NULL, 'system'),
            -- Level 3: 파트 (인사팀 산하)
            ('2026', 'DEPT111', 'DEPT011',  '채용파트',        3, NULL, NULL, 'system'),
            ('2026', 'DEPT112', 'DEPT011',  '평가파트',        3, NULL, NULL, 'system'),
            -- Level 3: 파트 (개발1팀 산하)
            ('2026', 'DEPT211', 'DEPT021',  '프론트엔드파트',  3, NULL, NULL, 'system'),
            ('2026', 'DEPT212', 'DEPT021',  '백엔드파트',      3, NULL, NULL, 'system'),
            -- Level 3: 파트 (개발2팀 산하)
            ('2026', 'DEPT221', 'DEPT022',  'AI파트',          3, NULL, NULL, 'system'),
            -- Level 3: 파트 (영업1팀 산하)
            ('2026', 'DEPT311', 'DEPT031',  '영업지원파트',    3, NULL, NULL, 'system')
        ON CONFLICT (std_year, dept_code) DO UPDATE SET
            upper_dept_code = EXCLUDED.upper_dept_code,
            dept_name       = EXCLUDED.dept_name,
            disp_lvl        = EXCLUDED.disp_lvl,
            up_user         = 'system',
            up_date         = NOW()
    """)


def downgrade() -> None:
    """
    Rollback 시 삽입한 시드 데이터 삭제 (역순)
    """
    # cm_department_tree 삭제
    op.execute("""
        DELETE FROM cm_department_tree
        WHERE std_year = '2026'
          AND dept_code IN (
              'DEPT001','DEPT002','DEPT003',
              'DEPT011','DEPT012',
              'DEPT021','DEPT022',
              'DEPT031','DEPT032',
              'DEPT111','DEPT112',
              'DEPT211','DEPT212','DEPT221',
              'DEPT311'
          )
    """)

    # cm_department 삭제 (leaf → root 순서로 FK 위반 방지)
    op.execute("""
        DELETE FROM cm_department
        WHERE dept_code IN (
            'DEPT111','DEPT112',
            'DEPT211','DEPT212','DEPT221',
            'DEPT311',
            'DEPT011','DEPT012',
            'DEPT021','DEPT022',
            'DEPT031','DEPT032',
            'DEPT001','DEPT002','DEPT003'
        )
    """)
