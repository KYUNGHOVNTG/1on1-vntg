"""cjhol2107(EMP021) 부서/직책 변경 및 R&R 목데이터 추가

Revision ID: p3q4r5s6t7u8
Revises: o2p3q4r5s6t7
Create Date: 2026-02-26 00:00:00.000000

변경 사항:
1. hr_mgnt (EMP021 = cjhol2107)
   - dept_code: DEPT001 → DEPT212 (백엔드파트)
   - position_code: P001 → P004 (팀장)

2. hr_mgnt_concur (EMP021 기존 레코드 교체)
   - 기존: DEPT001 / is_main='Y' / P001
   - 변경: DEPT212 / is_main='Y' / P004

3. tb_rr — EMP021의 LEADER R&R 1건 추가 (RR_EMP021_001)
   - dept_code: DEPT212 (백엔드파트)
   - 상위 R&R: RR_LEADER_003 (EMP013 배수지, 센터장/실장의 R&R)
   - 목적: cjhol2107 기준으로 상위 R&R(센터장/실장)이 조회되도록 테스트 데이터 구성

4. tb_rr_period — EMP021 R&R의 기간 데이터

배경:
- cjhol2107 사용자가 R&R 현황 화면에서 '상위 R&R' 표시 기능을 테스트할 수 있도록
  DEPT212 (백엔드파트) 팀장으로 배치
- 직속상위 센터장/실장은 EMP013 (배수지, DEPT212 파트장, P003)
- EMP013의 LEADER R&R (11111111-1111-1111-1111-111111111003)을 상위 R&R로 참조

UUID:
  RR_EMP021_001: 11111111-1111-1111-1111-111111111008
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "p3q4r5s6t7u8"
down_revision: Union[str, None] = "o2p3q4r5s6t7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    EMP021(cjhol2107) 부서·직책 변경 및 R&R 목데이터 추가
    """

    # =============================================
    # 1. hr_mgnt: EMP021 부서/직책 변경
    #    DEPT001(경영본부) P001(대표이사) → DEPT212(백엔드파트) P004(팀장)
    # =============================================
    op.execute("""
        UPDATE hr_mgnt
        SET
            dept_code     = 'DEPT212',
            position_code = 'P004',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = 'EMP021'
    """)

    # =============================================
    # 2. hr_mgnt_concur: EMP021 기존 DEPT001 레코드 삭제 후 DEPT212 레코드 삽입
    # =============================================
    op.execute("""
        DELETE FROM hr_mgnt_concur
        WHERE emp_no = 'EMP021'
    """)

    op.execute("""
        INSERT INTO hr_mgnt_concur (
            emp_no,
            dept_code,
            is_main,
            position_code,
            in_user,
            in_date
        )
        VALUES (
            'EMP021',
            'DEPT212',
            'Y',
            'P004',
            'system',
            NOW()
        )
        ON CONFLICT (emp_no, dept_code) DO UPDATE SET
            is_main       = EXCLUDED.is_main,
            position_code = EXCLUDED.position_code,
            up_user       = 'system',
            up_date       = NOW()
    """)

    # =============================================
    # 3. tb_rr: EMP021(cjhol2107)의 LEADER R&R 1건 추가
    #
    #    RR_EMP021_001: EMP021(최경호) / DEPT212(백엔드파트) / LEADER
    #    - 상위 R&R: RR_LEADER_003 (EMP013 배수지, 센터장/실장)
    #    - 팀장(P004)으로서 백엔드파트 R&R을 직속상위(센터장/실장)에 연결
    # =============================================
    op.execute("""
        INSERT INTO tb_rr
            (rr_id, year, level_id, emp_no, dept_code, rr_type, parent_rr_id,
             title, content, status, in_user, in_date)
        VALUES
            (
                '11111111-1111-1111-1111-111111111008'::uuid,
                '2026', 'LV2026_4', 'EMP021', 'DEPT212', 'LEADER',
                '11111111-1111-1111-1111-111111111003'::uuid,
                '백엔드파트 API 품질 기준 수립 및 코드 리뷰 운영',
                'RESTful API 설계 원칙 및 응답 스키마 표준 수립.'
                || E'\\n' || '코드 리뷰 프로세스 정착 및 리뷰어 역할 체계 구축.'
                || E'\\n' || '단위 테스트 커버리지 80% 이상 달성 목표 관리.'
                || E'\\n' || '신규 팀원 온보딩 및 개발 컨벤션 가이드 제공.',
                'R', 'system', '2026-01-08 09:00:00'
            )
        ON CONFLICT (rr_id) DO NOTHING
    """)

    # =============================================
    # 4. tb_rr_period: EMP021 R&R 기간 (연간)
    # =============================================
    op.execute("""
        INSERT INTO tb_rr_period (rr_id, seq, start_date, end_date)
        VALUES
            ('11111111-1111-1111-1111-111111111008'::uuid, 1, '202601', '202612')
        ON CONFLICT (rr_id, seq) DO NOTHING
    """)


def downgrade() -> None:
    """
    변경 사항 롤백:
    1. tb_rr_period / tb_rr: EMP021 R&R 삭제
    2. hr_mgnt_concur: EMP021 DEPT212 레코드 삭제 후 DEPT001 복원
    3. hr_mgnt: EMP021 부서/직책 원복
    """

    # =============================================
    # 1. tb_rr_period 삭제 (tb_rr FK 참조)
    # =============================================
    op.execute("""
        DELETE FROM tb_rr_period
        WHERE rr_id = '11111111-1111-1111-1111-111111111008'::uuid
    """)

    # =============================================
    # 2. tb_rr 삭제
    # =============================================
    op.execute("""
        DELETE FROM tb_rr
        WHERE rr_id = '11111111-1111-1111-1111-111111111008'::uuid
    """)

    # =============================================
    # 3. hr_mgnt_concur: DEPT212 삭제 후 DEPT001 복원
    # =============================================
    op.execute("""
        DELETE FROM hr_mgnt_concur
        WHERE emp_no = 'EMP021'
    """)

    op.execute("""
        INSERT INTO hr_mgnt_concur (
            emp_no, dept_code, is_main, position_code, in_user, in_date
        )
        VALUES (
            'EMP021', 'DEPT001', 'Y', 'P001', 'system', NOW()
        )
        ON CONFLICT (emp_no, dept_code) DO NOTHING
    """)

    # =============================================
    # 4. hr_mgnt: EMP021 원복
    # =============================================
    op.execute("""
        UPDATE hr_mgnt
        SET
            dept_code     = 'DEPT001',
            position_code = 'P001',
            up_user       = 'system',
            up_date       = NOW()
        WHERE emp_no = 'EMP021'
    """)
