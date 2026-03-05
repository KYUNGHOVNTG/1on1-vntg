"""테스트 계정 설정: cjhol2107 팀장 / choikh0795 팀원 (ERP1팀)

Revision ID: r5s6t7u8v9w0
Revises: 532ba7fc20aa
Create Date: 2026-03-05 00:00:00.000000

변경 사항:
1. cjhol2107 (사번: 26000001) → ERP1팀(261021) 팀장(P004)으로 변경
   - cm_user: role_code R001→R002, position_code P001→P004
   - hr_mgnt: dept_code 260000→261021, position_code P001→P004
   - hr_mgnt_concur: dept_code 260000→261021, position_code P001→P004

2. user023 (사번: 26000024, 류현진) → ERP1팀 팀원(P005)으로 강등
   - cm_user: position_code P004→P005
   - hr_mgnt: position_code P004→P005
   - hr_mgnt_concur: position_code P004→P005

3. 260000(대표이사) 부서장 공석 처리
   - cm_department: dept_head_emp_no NULL
   - cm_department_tree: dept_head_emp_no NULL, name_kor '(공석)'

4. 261021(ERP1팀) 부서장 cjhol2107로 변경
   - cm_department: dept_head_emp_no '26000001'
   - cm_department_tree: dept_head_emp_no '26000001', name_kor '최경호'

5. choikh0795 (이메일: choikh0795@gmail.com) 신규 생성
   - cm_user: role_code R002, position_code P005
   - hr_mgnt: 사번 26000054, dept_code 261021, position_code P005
   - hr_mgnt_concur: 주소속 ERP1팀(261021), P005

테스트 목적:
- cjhol2107: 팀장(P004) 메뉴 및 1on1 미팅 리더 기능 테스트
- choikh0795: 팀원(P005) 메뉴 및 1on1 미팅 멤버 기능 테스트
- 두 계정 모두 ERP1팀(261021) 소속으로 1on1 미팅 생성 가능
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "r5s6t7u8v9w0"
down_revision: Union[str, None] = "532ba7fc20aa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    테스트 계정 설정: cjhol2107 팀장 / choikh0795 팀원 (ERP1팀)

    R&R 구조 (ERP1팀 261021):
      LEADER R&R (rr_id=46): emp_no 26000024→26000001 (cjhol2107)
        ├── MEMBER R&R (rr_id=47): 26000025 안소희 (기존 유지)
        ├── MEMBER R&R (rr_id=48): 26000026 문재원 (기존 유지)
        └── MEMBER R&R (rr_id=76): 26000054 choikh0795 (신규 추가)
    """

    # =============================================================
    # PHASE 1: cjhol2107 (26000001) 대표이사 → ERP1팀 팀장으로 변경
    # =============================================================

    # 1-1. cm_user: role_code, position_code 변경
    op.execute("""
        UPDATE cm_user
        SET
            role_code     = 'R002',
            position_code = 'P004',
            up_user       = 'system',
            up_date       = NOW()
        WHERE user_id = 'cjhol2107'
    """)

    # 1-2. hr_mgnt: 부서/직책 변경 (대표이사실 → ERP1팀, P001 → P004)
    op.execute("""
        UPDATE hr_mgnt
        SET
            dept_code     = '261021',
            position_code = 'P004',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = '26000001'
    """)

    # 1-3. hr_mgnt_concur: 주소속 변경 (260000 → 261021)
    op.execute("""
        UPDATE hr_mgnt_concur
        SET
            dept_code     = '261021',
            position_code = 'P004',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = '26000001'
          AND dept_code = '260000'
    """)

    # =============================================================
    # PHASE 2: user023 (26000024, 류현진) 팀장 → 팀원으로 강등
    # (ERP1팀 잔류, 기존 팀장이었으나 cjhol2107이 신임 팀장)
    # =============================================================

    # 2-1. cm_user: position_code P004 → P005
    op.execute("""
        UPDATE cm_user
        SET
            position_code = 'P005',
            up_user       = 'system',
            up_date       = NOW()
        WHERE user_id = 'user023'
    """)

    # 2-2. hr_mgnt: position_code P004 → P005
    op.execute("""
        UPDATE hr_mgnt
        SET
            position_code = 'P005',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = '26000024'
    """)

    # 2-3. hr_mgnt_concur: position_code P004 → P005
    op.execute("""
        UPDATE hr_mgnt_concur
        SET
            position_code = 'P005',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = '26000024'
          AND dept_code = '261021'
    """)

    # =============================================================
    # PHASE 3: 부서장 참조 업데이트 - cm_department
    # =============================================================

    # 3-1. 260000 (대표이사) 부서장 공석 처리 (cjhol2107이 ERP1팀으로 이동)
    op.execute("""
        UPDATE cm_department
        SET
            dept_head_emp_no = NULL,
            up_user          = 'system',
            up_date          = NOW()
        WHERE dept_code = '260000'
    """)

    # 3-2. 261021 (ERP1팀) 부서장 → cjhol2107 (26000001)
    op.execute("""
        UPDATE cm_department
        SET
            dept_head_emp_no = '26000001',
            up_user          = 'system',
            up_date          = NOW()
        WHERE dept_code = '261021'
    """)

    # =============================================================
    # PHASE 4: 조직도 트리 업데이트 - cm_department_tree
    # =============================================================

    # 4-1. 260000 (대표이사) 부서장 공석 처리
    op.execute("""
        UPDATE cm_department_tree
        SET
            dept_head_emp_no = NULL,
            name_kor         = '(공석)',
            up_user          = 'system',
            up_date          = NOW()
        WHERE std_year   = '2026'
          AND dept_code  = '260000'
    """)

    # 4-2. 261021 (ERP1팀) 부서장 → 최경호 (cjhol2107)
    op.execute("""
        UPDATE cm_department_tree
        SET
            dept_head_emp_no = '26000001',
            name_kor         = '최경호',
            up_user          = 'system',
            up_date          = NOW()
        WHERE std_year   = '2026'
          AND dept_code  = '261021'
    """)

    # =============================================================
    # PHASE 5: choikh0795 신규 계정 생성 (ERP1팀 팀원)
    # =============================================================

    # 5-1. cm_user 신규 생성
    op.execute("""
        INSERT INTO cm_user (user_id, email, use_yn, role_code, position_code, in_user)
        VALUES ('choikh0795', 'choikh0795@gmail.com', 'Y', 'R002', 'P005', 'system')
        ON CONFLICT (user_id) DO UPDATE SET
            email         = EXCLUDED.email,
            use_yn        = 'Y',
            role_code     = EXCLUDED.role_code,
            position_code = EXCLUDED.position_code,
            up_user       = 'system',
            up_date       = NOW()
    """)

    # 5-2. hr_mgnt 신규 생성 (사번: 26000054)
    op.execute("""
        INSERT INTO hr_mgnt (emp_no, user_id, name_kor, dept_code, position_code, on_work_yn, in_user)
        VALUES ('26000054', 'choikh0795', '최익환', '261021', 'P005', 'Y', 'system')
        ON CONFLICT (emp_no) DO UPDATE SET
            user_id       = EXCLUDED.user_id,
            name_kor      = EXCLUDED.name_kor,
            dept_code     = EXCLUDED.dept_code,
            position_code = EXCLUDED.position_code,
            on_work_yn    = EXCLUDED.on_work_yn,
            up_user       = 'system',
            up_date       = NOW()
    """)

    # 5-3. hr_mgnt_concur 주소속 생성 (ERP1팀)
    op.execute("""
        INSERT INTO hr_mgnt_concur (emp_no, dept_code, is_main, position_code, in_user)
        VALUES ('26000054', '261021', 'Y', 'P005', 'system')
        ON CONFLICT (emp_no, dept_code) DO UPDATE SET
            is_main       = EXCLUDED.is_main,
            position_code = EXCLUDED.position_code,
            up_user       = 'system',
            up_date       = NOW()
    """)

    # =============================================================
    # PHASE 6: R&R 데이터 업데이트 (1on1 미팅 테스트를 위한 핵심)
    # =============================================================

    # 6-1. ERP1팀 LEADER R&R (rr_id=46) 담당자 변경: 26000024 → 26000001 (cjhol2107)
    #   - 기존 팀장 user023(류현진)의 LEADER R&R을 cjhol2107(최경호)으로 재할당
    #   - MEMBER R&R (rr_id=47, 48)의 parent_rr_id가 46을 참조하므로 계층 구조 유지
    op.execute("""
        UPDATE tb_rr
        SET
            emp_no  = '26000001',
            dept_code = '261021',
            up_user = 'system',
            up_date = NOW()
        WHERE rr_id = '22222222-0000-0000-0000-000000000046'::uuid
    """)

    # 6-2. choikh0795 (26000054) MEMBER R&R 2건 신규 생성
    #   - parent_rr_id = 46 (ERP1팀 LEADER R&R, cjhol2107)
    #   - rr_type = MEMBER (팀원 R&R)
    #   - 1on1 미팅 시 AI 코칭 컨텍스트로 활용됨
    op.execute("""
        INSERT INTO tb_rr
            (rr_id, year, level_id, emp_no, dept_code, rr_type, parent_rr_id,
             title, content, status, in_user, in_date)
        VALUES
            ('22222222-0000-0000-0000-000000000076'::uuid,
             '2026', 'LV2026_5', '26000054', '261021', 'MEMBER',
             '22222222-0000-0000-0000-000000000046'::uuid,
             'ERP 시스템 운영 지원 및 장애 대응',
             'ERP 운영 이슈 접수 및 1차 분류 처리.' || E'\n' || '장애 발생 시 긴급 대응 및 복구 지원.' || E'\n' || '정기 시스템 점검 체크리스트 수행.',
             'R', 'system', '2026-01-02 09:00:00'),
            ('22222222-0000-0000-0000-000000000077'::uuid,
             '2026', 'LV2026_5', '26000054', '261021', 'MEMBER',
             '22222222-0000-0000-0000-000000000046'::uuid,
             'ERP 사용자 교육 및 매뉴얼 관리',
             '신규 ERP 사용자 온보딩 교육 운영.' || E'\n' || '사용자 매뉴얼 작성 및 버전 관리.' || E'\n' || 'FAQ 등록 및 기술 지원 대응.',
             'R', 'system', '2026-01-02 09:00:00')
        ON CONFLICT (rr_id) DO NOTHING
    """)

    # 6-3. choikh0795 R&R 기간 데이터 추가 (2026년 연간)
    op.execute("""
        INSERT INTO tb_rr_period (rr_id, seq, start_date, end_date)
        VALUES
            ('22222222-0000-0000-0000-000000000076'::uuid, 1, '202601', '202612'),
            ('22222222-0000-0000-0000-000000000077'::uuid, 1, '202601', '202612')
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    """
    변경 사항 롤백: 원복 (cjhol2107 대표이사 복원, choikh0795 삭제)
    """

    # choikh0795 R&R 데이터 삭제
    op.execute("DELETE FROM tb_rr_period WHERE rr_id IN ('22222222-0000-0000-0000-000000000076'::uuid, '22222222-0000-0000-0000-000000000077'::uuid)")
    op.execute("DELETE FROM tb_rr WHERE rr_id IN ('22222222-0000-0000-0000-000000000076'::uuid, '22222222-0000-0000-0000-000000000077'::uuid)")

    # ERP1팀 LEADER R&R 원복 (26000001 → 26000024)
    op.execute("""
        UPDATE tb_rr
        SET emp_no = '26000024', up_user = 'system', up_date = NOW()
        WHERE rr_id = '22222222-0000-0000-0000-000000000046'::uuid
    """)

    # choikh0795 인사 데이터 삭제
    op.execute("DELETE FROM hr_mgnt_concur WHERE emp_no = '26000054'")
    op.execute("DELETE FROM hr_mgnt WHERE emp_no = '26000054'")
    op.execute("DELETE FROM cm_user WHERE user_id = 'choikh0795'")

    # user023 (26000024) 팀장으로 복원
    op.execute("""
        UPDATE hr_mgnt_concur
        SET position_code = 'P004', up_user = 'system', up_date = NOW()
        WHERE emp_no = '26000024' AND dept_code = '261021'
    """)
    op.execute("""
        UPDATE hr_mgnt
        SET position_code = 'P004', up_user = 'system', up_date = NOW()
        WHERE emp_no = '26000024'
    """)
    op.execute("""
        UPDATE cm_user
        SET position_code = 'P004', up_user = 'system', up_date = NOW()
        WHERE user_id = 'user023'
    """)

    # cm_department_tree 원복
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = '26000001', name_kor = '최경호', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = '260000'
    """)
    op.execute("""
        UPDATE cm_department_tree
        SET dept_head_emp_no = '26000024', name_kor = '류현진', up_user = 'system', up_date = NOW()
        WHERE std_year = '2026' AND dept_code = '261021'
    """)

    # cm_department 원복
    op.execute("""
        UPDATE cm_department
        SET dept_head_emp_no = '26000001', up_user = 'system', up_date = NOW()
        WHERE dept_code = '260000'
    """)
    op.execute("""
        UPDATE cm_department
        SET dept_head_emp_no = '26000024', up_user = 'system', up_date = NOW()
        WHERE dept_code = '261021'
    """)

    # hr_mgnt_concur 원복 (cjhol2107)
    op.execute("""
        UPDATE hr_mgnt_concur
        SET dept_code = '260000', position_code = 'P001', up_user = 'system', up_date = NOW()
        WHERE emp_no = '26000001' AND dept_code = '261021'
    """)

    # hr_mgnt 원복 (cjhol2107)
    op.execute("""
        UPDATE hr_mgnt
        SET dept_code = '260000', position_code = 'P001', up_user = 'system', up_date = NOW()
        WHERE emp_no = '26000001'
    """)

    # cm_user 원복 (cjhol2107)
    op.execute("""
        UPDATE cm_user
        SET role_code = 'R001', position_code = 'P001', up_user = 'system', up_date = NOW()
        WHERE user_id = 'cjhol2107'
    """)
