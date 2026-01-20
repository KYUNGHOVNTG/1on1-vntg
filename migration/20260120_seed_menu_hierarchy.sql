-- ===============================================
-- Menu Hierarchy Seed Data
-- Created at 2026-01-20
--
-- Purpose: 계층형 메뉴 구조 샘플 데이터 추가
--          기존 최상위 메뉴 아래에 2차, 3차 메뉴를 추가합니다.
-- ===============================================

-- ===============================================
-- 1. 2차 메뉴 추가 (Level 2)
-- ===============================================

-- M002 (목표 관리) 하위 메뉴
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES
    ('M002_1', '목표 설정', 'M002', 2, '/goals/setting', 1, 'system'),
    ('M002_2', '목표 진행 현황', 'M002', 2, '/goals/progress', 2, 'system'),
    ('M002_3', '목표 평가', 'M002', 2, '/goals/evaluation', 3, 'system');

-- M003 (1on1 면담) 하위 메뉴
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES
    ('M003_1', '면담 예약', 'M003', 2, '/one-on-one/booking', 1, 'system'),
    ('M003_2', '면담 이력', 'M003', 2, '/one-on-one/history', 2, 'system'),
    ('M003_3', '면담 통계', 'M003', 2, '/one-on-one/statistics', 3, 'system');

-- M004 (시스템 관리) 하위 메뉴
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES
    ('M004_1', '사용자 관리', 'M004', 2, '/system/users', 1, 'system'),
    ('M004_2', '코드 관리', 'M004', 2, '/system/codes', 2, 'system'),
    ('M004_3', '메뉴 관리', 'M004', 2, '/system/menus', 3, 'system'),
    ('M004_4', '권한 관리', 'M004', 2, '/system/permissions', 4, 'system');

-- ===============================================
-- 2. 3차 메뉴 추가 (Level 3) - 예시
-- ===============================================

-- M004_1 (사용자 관리) 하위 메뉴
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES
    ('M004_1_1', '직원 조회', 'M004_1', 3, '/system/users/list', 1, 'system'),
    ('M004_1_2', '직원 등록', 'M004_1', 3, '/system/users/register', 2, 'system');

-- M004_2 (코드 관리) 하위 메뉴
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES
    ('M004_2_1', '공통코드 조회', 'M004_2', 3, '/system/codes/list', 1, 'system'),
    ('M004_2_2', '공통코드 등록', 'M004_2', 3, '/system/codes/register', 2, 'system');

-- ===============================================
-- 3. 직책별 메뉴 권한 추가
-- ===============================================

-- 대표이사(P001), 총괄(P002), 센터장/실장(P003): 모든 메뉴 접근
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES
    -- 2차 메뉴
    ('P001', 'M002_1', 'system'), ('P001', 'M002_2', 'system'), ('P001', 'M002_3', 'system'),
    ('P001', 'M003_1', 'system'), ('P001', 'M003_2', 'system'), ('P001', 'M003_3', 'system'),
    ('P001', 'M004_1', 'system'), ('P001', 'M004_2', 'system'), ('P001', 'M004_3', 'system'), ('P001', 'M004_4', 'system'),
    -- 3차 메뉴
    ('P001', 'M004_1_1', 'system'), ('P001', 'M004_1_2', 'system'),
    ('P001', 'M004_2_1', 'system'), ('P001', 'M004_2_2', 'system'),

    -- P002
    ('P002', 'M002_1', 'system'), ('P002', 'M002_2', 'system'), ('P002', 'M002_3', 'system'),
    ('P002', 'M003_1', 'system'), ('P002', 'M003_2', 'system'), ('P002', 'M003_3', 'system'),
    ('P002', 'M004_1', 'system'), ('P002', 'M004_2', 'system'), ('P002', 'M004_3', 'system'), ('P002', 'M004_4', 'system'),
    ('P002', 'M004_1_1', 'system'), ('P002', 'M004_1_2', 'system'),
    ('P002', 'M004_2_1', 'system'), ('P002', 'M004_2_2', 'system'),

    -- P003
    ('P003', 'M002_1', 'system'), ('P003', 'M002_2', 'system'), ('P003', 'M002_3', 'system'),
    ('P003', 'M003_1', 'system'), ('P003', 'M003_2', 'system'), ('P003', 'M003_3', 'system'),
    ('P003', 'M004_1', 'system'), ('P003', 'M004_2', 'system'), ('P003', 'M004_3', 'system'), ('P003', 'M004_4', 'system'),
    ('P003', 'M004_1_1', 'system'), ('P003', 'M004_1_2', 'system'),
    ('P003', 'M004_2_1', 'system'), ('P003', 'M004_2_2', 'system');

-- 팀장(P004): 시스템 관리 제외한 메뉴
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES
    ('P004', 'M002_1', 'system'), ('P004', 'M002_2', 'system'), ('P004', 'M002_3', 'system'),
    ('P004', 'M003_1', 'system'), ('P004', 'M003_2', 'system'), ('P004', 'M003_3', 'system');

-- 팀원(P005): 시스템 관리 제외한 메뉴 (조회 중심)
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES
    ('P005', 'M002_1', 'system'), ('P005', 'M002_2', 'system'),
    ('P005', 'M003_1', 'system'), ('P005', 'M003_2', 'system');

-- ===============================================
-- 확인 쿼리
-- ===============================================
-- SELECT
--     m.menu_code,
--     m.menu_name,
--     m.up_menu_code,
--     m.menu_level,
--     m.menu_url,
--     m.sort_seq,
--     pm.position_code
-- FROM cm_menu m
-- LEFT JOIN cm_position_menu pm ON m.menu_code = pm.menu_code
-- WHERE m.use_yn = 'Y'
-- ORDER BY m.menu_level, m.sort_seq, pm.position_code;
