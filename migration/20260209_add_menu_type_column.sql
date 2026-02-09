-- ===============================================
-- Menu Type Column 추가 및 Role 기반 메뉴 권한 분리
-- Created at 2026-02-09
--
-- Purpose: cm_menu 테이블에 menu_type 컬럼을 추가하여
--          일반 메뉴(COMMON)와 관리자 전용 메뉴(ADMIN)를 구분합니다.
--          ROLE 공통코드를 시스템 관리자/일반 사용자로 재정의합니다.
-- ===============================================

-- ===============================================
-- 1. cm_menu 테이블에 menu_type 컬럼 추가
-- ===============================================
ALTER TABLE cm_menu
ADD COLUMN menu_type VARCHAR(10) NOT NULL DEFAULT 'COMMON';

COMMENT ON COLUMN cm_menu.menu_type IS '메뉴 타입 (COMMON: 일반 메뉴, ADMIN: 관리자 전용 메뉴)';

-- 인덱스 생성 (menu_type 기반 조회 성능 최적화)
CREATE INDEX idx_menu_type ON cm_menu (menu_type);

-- ===============================================
-- 2. 시스템 관리 메뉴를 ADMIN 타입으로 업데이트
-- ===============================================

-- M004 (시스템 관리) 및 모든 하위 메뉴를 ADMIN으로 설정
UPDATE cm_menu SET menu_type = 'ADMIN'
WHERE menu_code IN (
    'M004',        -- 시스템 관리 (1차)
    'M004_1',      -- 사용자 관리 (2차)
    'M004_2',      -- 코드 관리 (2차)
    'M004_3',      -- 메뉴 관리 (2차)
    'M004_4',      -- 권한 관리 (2차)
    'M004_1_1',    -- 직원 조회 (3차)
    'M004_1_2',    -- 직원 등록 (3차)
    'M004_2_1',    -- 공통코드 조회 (3차)
    'M004_2_2'     -- 공통코드 등록 (3차)
);

-- ===============================================
-- 3. ROLE 공통코드 재정의
--    기존: CD001=HR, CD002=GENERAL
--    변경: R001=시스템 관리자, R002=일반 사용자
-- ===============================================

-- 새로운 ROLE 코드 추가
INSERT INTO cm_codedetail (code_type, code, code_name, use_yn, sort_seq, rmk, in_user, in_date)
VALUES
    ('ROLE', 'R001', '시스템 관리자', 'Y', 1, '시스템 관리자 (관리 메뉴 접근 가능)', 'system', NOW()),
    ('ROLE', 'R002', '일반 사용자', 'Y', 2, '일반 사용자 (직책별 메뉴만 접근)', 'system', NOW())
ON CONFLICT (code_type, code) DO UPDATE SET
    code_name = EXCLUDED.code_name,
    rmk = EXCLUDED.rmk,
    up_user = 'system',
    up_date = NOW();

-- 기존 ROLE 코드 비활성화
UPDATE cm_codedetail
SET use_yn = 'N', up_user = 'system', up_date = NOW()
WHERE code_type = 'ROLE' AND code IN ('CD001', 'CD002');

-- ===============================================
-- 4. cm_user의 role_code 업데이트
--    CD001 → R001, CD002 → R002
-- ===============================================
UPDATE cm_user SET role_code = 'R001', up_user = 'system', up_date = NOW()
WHERE role_code = 'CD001';

UPDATE cm_user SET role_code = 'R002', up_user = 'system', up_date = NOW()
WHERE role_code = 'CD002';

-- ===============================================
-- 확인 쿼리
-- ===============================================
-- SELECT menu_code, menu_name, menu_type, menu_level
-- FROM cm_menu
-- ORDER BY menu_type, menu_level, sort_seq;
--
-- SELECT code, code_name, use_yn
-- FROM cm_codedetail
-- WHERE code_type = 'ROLE';
--
-- SELECT user_id, role_code, position_code
-- FROM cm_user;
