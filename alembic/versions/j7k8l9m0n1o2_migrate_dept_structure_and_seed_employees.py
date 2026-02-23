"""D___ 부서를 DEPT___ 계층 구조로 전환하고 직원 데이터 시드 추가

Revision ID: j7k8l9m0n1o2
Revises: i6j7k8l9m0n1
Create Date: 2026-02-23 00:00:00.000000

변경 사항:
1. hr_mgnt에 EMP001~EMP020 직원 데이터 추가 (DEPT___ 계층 구조 부서 코드, P001~P005 직책 코드)
2. hr_mgnt_concur에 겸직 데이터 추가 (5명, 10건)
3. cm_department의 DEPT___ 부서 dept_head_emp_no 업데이트 (NULL → EMP___ 사번)
4. cm_department_tree의 DEPT___ 부서 dept_head_emp_no / name_kor 업데이트
5. D001~D005 구 부서 삭제 (cm_department)

직원 배치 구조 (hr_mgnt 주소속 기준):
    경영본부 (DEPT001): EMP001 (대표이사)
    기술본부 (DEPT002): EMP002 (대표이사)
    영업본부 (DEPT003): EMP003 (대표이사)
    인사팀   (DEPT011): EMP004 (총괄), EMP018 (팀장, 퇴직)
    재무팀   (DEPT012): EMP005 (총괄)
    개발1팀  (DEPT021): EMP006 (총괄), EMP019 (팀장, 퇴직)
    개발2팀  (DEPT022): EMP007 (총괄)
    영업1팀  (DEPT031): EMP008 (총괄), EMP020 (팀장, 퇴직)
    영업2팀  (DEPT032): EMP009 (총괄)
    채용파트 (DEPT111): EMP010 (센터장/실장)
    평가파트 (DEPT112): EMP011 (센터장/실장)
    프론트엔드파트 (DEPT211): EMP012 (센터장/실장)
    백엔드파트     (DEPT212): EMP013 (센터장/실장), EMP016 (팀장)
    AI파트         (DEPT221): EMP014 (센터장/실장), EMP017 (팀장)
    영업지원파트   (DEPT311): EMP015 (센터장/실장)

겸직 구조 (hr_mgnt_concur):
    EMP004: DEPT011(주소속/총괄) + DEPT111(겸직/센터장)
    EMP006: DEPT021(주소속/총괄) + DEPT211(겸직/센터장)
    EMP008: DEPT031(주소속/총괄) + DEPT311(겸직/센터장)
    EMP016: DEPT212(주소속/팀장) + DEPT022(겸직/팀장)
    EMP017: DEPT221(주소속/팀장) + DEPT021(겸직/팀장)
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "j7k8l9m0n1o2"
down_revision: Union[str, None] = "i6j7k8l9m0n1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    DEPT___ 계층 구조로 직원 데이터 시드 및 D___ 구 부서 삭제
    """

    # =============================================
    # 1. hr_mgnt: 직원 20명 데이터 INSERT
    #    - 사번: EMP001~EMP020 (6자리)
    #    - user_id: user001~user020 (cm_user FK)
    #    - dept_code: DEPT___ 계층 구조 부서 코드
    #    - position_code: P001~P005 (cm_codedetail POSITION 타입)
    #      P001=대표이사, P002=총괄, P003=센터장/실장, P004=팀장, P005=팀원
    # =============================================
    op.execute("""
        INSERT INTO hr_mgnt
            (emp_no, user_id, name_kor, dept_code, position_code, on_work_yn, in_user)
        VALUES
            -- 경영본부 (DEPT001) - 본부장
            ('EMP001', 'user001', '김철수', 'DEPT001', 'P001', 'Y', 'system'),
            -- 기술본부 (DEPT002) - 본부장
            ('EMP002', 'user002', '이영희', 'DEPT002', 'P001', 'Y', 'system'),
            -- 영업본부 (DEPT003) - 본부장
            ('EMP003', 'user003', '박민수', 'DEPT003', 'P001', 'Y', 'system'),
            -- 인사팀 (DEPT011) - 팀장 (겸직: 채용파트 DEPT111)
            ('EMP004', 'user004', '정지훈', 'DEPT011', 'P002', 'Y', 'system'),
            -- 재무팀 (DEPT012) - 팀장
            ('EMP005', 'user005', '최수진', 'DEPT012', 'P002', 'Y', 'system'),
            -- 개발1팀 (DEPT021) - 팀장 (겸직: 프론트엔드파트 DEPT211)
            ('EMP006', 'user006', '강동원', 'DEPT021', 'P002', 'Y', 'system'),
            -- 개발2팀 (DEPT022) - 팀장
            ('EMP007', 'user007', '윤아름', 'DEPT022', 'P002', 'Y', 'system'),
            -- 영업1팀 (DEPT031) - 팀장 (겸직: 영업지원파트 DEPT311)
            ('EMP008', 'user008', '조민호', 'DEPT031', 'P002', 'Y', 'system'),
            -- 영업2팀 (DEPT032) - 팀장
            ('EMP009', 'user009', '한지민', 'DEPT032', 'P002', 'Y', 'system'),
            -- 채용파트 (DEPT111) - 파트장
            ('EMP010', 'user010', '오세훈', 'DEPT111', 'P003', 'Y', 'system'),
            -- 평가파트 (DEPT112) - 파트장
            ('EMP011', 'user011', '송혜교', 'DEPT112', 'P003', 'Y', 'system'),
            -- 프론트엔드파트 (DEPT211) - 파트장
            ('EMP012', 'user012', '임시완', 'DEPT211', 'P003', 'Y', 'system'),
            -- 백엔드파트 (DEPT212) - 파트장
            ('EMP013', 'user013', '배수지', 'DEPT212', 'P003', 'Y', 'system'),
            -- AI파트 (DEPT221) - 파트장
            ('EMP014', 'user014', '남주혁', 'DEPT221', 'P003', 'Y', 'system'),
            -- 영업지원파트 (DEPT311) - 파트장
            ('EMP015', 'user015', '전지현', 'DEPT311', 'P003', 'Y', 'system'),
            -- 백엔드파트 (DEPT212) - 팀원 (겸직: 개발2팀 DEPT022)
            ('EMP016', 'user016', '유재석', 'DEPT212', 'P004', 'Y', 'system'),
            -- AI파트 (DEPT221) - 팀원 (겸직: 개발1팀 DEPT021)
            ('EMP017', 'user017', '강호동', 'DEPT221', 'P004', 'Y', 'system'),
            -- 인사팀 (DEPT011) - 퇴직자
            ('EMP018', 'user018', '신동엽', 'DEPT011', 'P004', 'N', 'system'),
            -- 개발1팀 (DEPT021) - 퇴직자
            ('EMP019', 'user019', '김구라', 'DEPT021', 'P004', 'N', 'system'),
            -- 영업1팀 (DEPT031) - 퇴직자
            ('EMP020', 'user020', '서장훈', 'DEPT031', 'P004', 'N', 'system')
        ON CONFLICT (emp_no) DO NOTHING
    """)

    # =============================================
    # 2. hr_mgnt_concur: 겸직 데이터 INSERT (5명, 10건)
    #    is_main='Y': 주소속 (hr_mgnt.dept_code와 일치)
    #    is_main='N': 겸직 (다른 부서에 추가 소속)
    # =============================================
    op.execute("""
        INSERT INTO hr_mgnt_concur
            (emp_no, dept_code, is_main, position_code, in_user)
        VALUES
            -- EMP004 (정지훈): 주소속 인사팀(DEPT011) + 겸직 채용파트(DEPT111)
            ('EMP004', 'DEPT011', 'Y', 'P002', 'system'),
            ('EMP004', 'DEPT111', 'N', 'P003', 'system'),
            -- EMP006 (강동원): 주소속 개발1팀(DEPT021) + 겸직 프론트엔드파트(DEPT211)
            ('EMP006', 'DEPT021', 'Y', 'P002', 'system'),
            ('EMP006', 'DEPT211', 'N', 'P003', 'system'),
            -- EMP008 (조민호): 주소속 영업1팀(DEPT031) + 겸직 영업지원파트(DEPT311)
            ('EMP008', 'DEPT031', 'Y', 'P002', 'system'),
            ('EMP008', 'DEPT311', 'N', 'P003', 'system'),
            -- EMP016 (유재석): 주소속 백엔드파트(DEPT212) + 겸직 개발2팀(DEPT022)
            ('EMP016', 'DEPT212', 'Y', 'P004', 'system'),
            ('EMP016', 'DEPT022', 'N', 'P004', 'system'),
            -- EMP017 (강호동): 주소속 AI파트(DEPT221) + 겸직 개발1팀(DEPT021)
            ('EMP017', 'DEPT221', 'Y', 'P004', 'system'),
            ('EMP017', 'DEPT021', 'N', 'P004', 'system')
        ON CONFLICT (emp_no, dept_code) DO NOTHING
    """)

    # =============================================
    # 3. cm_department: DEPT___ 부서 dept_head_emp_no 업데이트
    #    i6j7k8l9m0n1 마이그레이션에서 NULL로 설정되었던 부서장 정보 업데이트
    # =============================================
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP001', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT001'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP002', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT002'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP003', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT003'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP004', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT011'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP005', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT012'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP006', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT021'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP007', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT022'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP008', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT031'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP009', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT032'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP010', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT111'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP011', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT112'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP012', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT211'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP013', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT212'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP014', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT221'
    """)
    op.execute("""
        UPDATE cm_department SET dept_head_emp_no = 'EMP015', up_user = 'system', up_date = NOW()
        WHERE dept_code = 'DEPT311'
    """)

    # =============================================
    # 4. cm_department_tree: DEPT___ 부서장 사번 및 성명 업데이트
    #    i6j7k8l9m0n1 마이그레이션에서 NULL로 설정되었던 정보 업데이트
    # =============================================
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP001', name_kor = '김철수', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT001'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP002', name_kor = '이영희', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT002'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP003', name_kor = '박민수', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT003'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP004', name_kor = '정지훈', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT011'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP005', name_kor = '최수진', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT012'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP006', name_kor = '강동원', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT021'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP007', name_kor = '윤아름', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT022'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP008', name_kor = '조민호', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT031'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP009', name_kor = '한지민', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT032'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP010', name_kor = '오세훈', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT111'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP011', name_kor = '송혜교', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT112'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP012', name_kor = '임시완', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT211'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP013', name_kor = '배수지', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT212'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP014', name_kor = '남주혁', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT221'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = 'EMP015', name_kor = '전지현', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = 'DEPT311'
    """)

    # =============================================
    # 5. cm_department: D001~D005 구 부서 삭제
    #    hr_mgnt / hr_mgnt_concur에 D___ 데이터가 없으므로 FK 위반 없음
    #    dept_head_emp_no는 FK 제약 없으므로 직접 삭제 가능
    # =============================================
    op.execute("""
        DELETE FROM cm_department
        WHERE dept_code IN ('D001', 'D002', 'D003', 'D004', 'D005')
    """)


def downgrade() -> None:
    """
    Rollback: 직원 데이터 삭제 및 D___ 부서 복원
    """

    # =============================================
    # 1. D001~D005 구 부서 복원
    # =============================================
    op.execute("""
        INSERT INTO cm_department (dept_code, dept_name, upper_dept_code, dept_head_emp_no, use_yn, in_user)
        VALUES
            ('D001', '경영지원팀', NULL, 'E002', 'Y', 'system'),
            ('D002', '개발팀',     NULL, 'E004', 'Y', 'system'),
            ('D003', '디자인팀',   NULL, 'E011', 'Y', 'system'),
            ('D004', '마케팅팀',   NULL, 'E015', 'Y', 'system'),
            ('D005', '영업팀',     NULL, 'E018', 'Y', 'system')
        ON CONFLICT (dept_code) DO NOTHING
    """)

    # =============================================
    # 2. cm_department_tree: DEPT___ 부서장 정보 NULL로 초기화
    # =============================================
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = NULL, name_kor = NULL, up_user = 'system', up_date = NOW()
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

    # =============================================
    # 3. cm_department: DEPT___ 부서장 정보 NULL로 초기화
    # =============================================
    op.execute("""
        UPDATE cm_department
        SET dept_head_emp_no = NULL, up_user = 'system', up_date = NOW()
        WHERE dept_code IN (
            'DEPT001','DEPT002','DEPT003',
            'DEPT011','DEPT012',
            'DEPT021','DEPT022',
            'DEPT031','DEPT032',
            'DEPT111','DEPT112',
            'DEPT211','DEPT212','DEPT221',
            'DEPT311'
        )
    """)

    # =============================================
    # 4. hr_mgnt_concur: 겸직 데이터 삭제 (hr_mgnt 삭제 전에 먼저)
    # =============================================
    op.execute("""
        DELETE FROM hr_mgnt_concur
        WHERE emp_no IN (
            'EMP001','EMP002','EMP003','EMP004','EMP005',
            'EMP006','EMP007','EMP008','EMP009','EMP010',
            'EMP011','EMP012','EMP013','EMP014','EMP015',
            'EMP016','EMP017','EMP018','EMP019','EMP020'
        )
    """)

    # =============================================
    # 5. hr_mgnt: 직원 데이터 삭제
    # =============================================
    op.execute("""
        DELETE FROM hr_mgnt
        WHERE emp_no IN (
            'EMP001','EMP002','EMP003','EMP004','EMP005',
            'EMP006','EMP007','EMP008','EMP009','EMP010',
            'EMP011','EMP012','EMP013','EMP014','EMP015',
            'EMP016','EMP017','EMP018','EMP019','EMP020'
        )
    """)
