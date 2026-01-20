-- Database Seeding: Auth & Common Data
-- Created at 2026-01-20

-- ===============================================
-- 1. cm_codemaster (공통코드 마스터)
-- ===============================================
INSERT INTO cm_codemaster (code_type, code_type_name, code_len, rmk, in_user)
VALUES 
    ('ROLE', '사용자 권한 역할', 5, '시스템 접근 권한 정의', 'system'),
    ('POSITION', '회사 직책/직급', 5, '임직원 직책 정보', 'system');

-- ===============================================
-- 2. cm_codedetail (공통코드 상세)
-- ===============================================
-- ROLE 상세
INSERT INTO cm_codedetail (code_type, code, code_name, sort_seq, in_user)
VALUES 
    ('ROLE', 'R001', '시스템 관리자', 1, 'system'),
    ('ROLE', 'R002', '일반 사용자', 2, 'system');

-- POSITION 상세
INSERT INTO cm_codedetail (code_type, code, code_name, sort_seq, in_user)
VALUES 
    ('POSITION', 'P001', '대표이사(CEO)', 1, 'system'),
    ('POSITION', 'P002', '총괄', 2, 'system'),
    ('POSITION', 'P003', '센터장/실장', 3, 'system'),
    ('POSITION', 'P004', '팀장', 4, 'system'),
    ('POSITION', 'P005', '팀원', 5, 'system');

-- ===============================================
-- 3. cm_menu (메뉴 정의)
-- ===============================================
INSERT INTO cm_menu (menu_code, menu_name, sort_seq, in_user)
VALUES 
    ('M001', '대시보드', 1, 'system'),
    ('M002', '목표 관리', 2, 'system'),
    ('M003', '1on1 면담', 3, 'system'),
    ('M004', '시스템 관리', 4, 'system');

-- ===============================================
-- 4. cm_position_menu (직책별 메뉴 권한)
-- ===============================================
-- 대표이사(P001) 총괄(P002), 센터장/실장(P003), 팀장(P004), 팀원(P005) 
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES 
    ('P001', 'M001', 'system'), ('P001', 'M002', 'system'), ('P001', 'M003', 'system'), ('P001', 'M004', 'system'),
    ('P002', 'M001', 'system'), ('P002', 'M002', 'system'), ('P002', 'M003', 'system'), ('P002', 'M004', 'system'),
    ('P003', 'M001', 'system'), ('P003', 'M002', 'system'), ('P003', 'M003', 'system'), ('P003', 'M004', 'system'),
    ('P004', 'M001', 'system'), ('P004', 'M002', 'system'), ('P004', 'M003', 'system'), ('P004', 'M004', 'system'),
    ('P005', 'M001', 'system'), ('P005', 'M002', 'system'), ('P005', 'M003', 'system'), ('P005', 'M004', 'system');

-- 팀장(P004) 및 팀원(P005): 관리 제외 모든 메뉴
INSERT INTO cm_position_menu (position_code, menu_code, in_user)
VALUES 
    ('P004', 'M001', 'system'), ('P004', 'M002', 'system'), ('P004', 'M003', 'system'),
    ('P005', 'M001', 'system'), ('P005', 'M002', 'system'), ('P005', 'M003', 'system');

-- ===============================================
-- 5. cm_user (테스트 사용자 등록)
-- ===============================================
-- ※ 실제 OAuth 로그인 시 해당 이메일로 가입된 사용자가 있어야 로그인이 가능합니다.
INSERT INTO cm_user (user_id, email, role_code, position_code, in_user)
VALUES 
    ('cjhol2107', 'cjhol2107@vntgcorp.com', 'R001', 'P001', 'system');
    -- ('leader', 'leader@example.com', 'R002', 'P003', 'system'),
    -- ('member', 'member@example.com', 'R002', 'P004', 'system'),;
