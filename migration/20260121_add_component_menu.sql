-- ===============================================
-- Add Common Component Menu
-- Created at 2026-01-21
--
-- Purpose: '공통컴포넌트' 메뉴 추가 및 권한 부여
-- ===============================================

-- 1. 메뉴 추가
INSERT INTO cm_menu (menu_code, menu_name, up_menu_code, menu_level, menu_url, sort_seq, in_user)
VALUES ('M004_5', '공통컴포넌트', 'M004', 2, '/system/components', 5, 'system');

-- 2. 권한 부여 (관리자급: P001, P002, P003)
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES 
    ('P001', 'M004_5', 'system'),
    ('P002', 'M004_5', 'system'),
    ('P003', 'M004_5', 'system');
