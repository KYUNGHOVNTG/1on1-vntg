-- ===============================================
-- Menu Table Hierarchy Refactoring
-- Created at 2026-01-20
--
-- Purpose: cm_menu 테이블을 단일(Flat) 구조에서
--          계층형(Depth) 구조로 변경
-- ===============================================

-- 1. 상위 메뉴 코드 컬럼 추가 (Self-Referencing FK)
ALTER TABLE cm_menu
ADD COLUMN up_menu_code VARCHAR(10);

COMMENT ON COLUMN cm_menu.up_menu_code IS '상위 메뉴 코드 (NULL: 최상위 메뉴)';

-- 2. 메뉴 레벨(깊이) 컬럼 추가
ALTER TABLE cm_menu
ADD COLUMN menu_level INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN cm_menu.menu_level IS '메뉴 깊이 (1: 최상위, 2: 2차, 3: 3차...)';

-- 3. 메뉴 URL 컬럼 추가
ALTER TABLE cm_menu
ADD COLUMN menu_url VARCHAR(200);

COMMENT ON COLUMN cm_menu.menu_url IS '프론트엔드 라우팅 경로 (예: /dashboard, /goals)';

-- 4. Self-Referencing Foreign Key 제약조건 추가
ALTER TABLE cm_menu
ADD CONSTRAINT fk_menu_parent
    FOREIGN KEY (up_menu_code)
    REFERENCES cm_menu (menu_code)
    ON DELETE CASCADE;

-- 5. 기존 데이터 업데이트 (최상위 메뉴로 설정)
UPDATE cm_menu
SET menu_level = 1,
    up_menu_code = NULL
WHERE menu_code IN ('M001', 'M002', 'M003', 'M004');

-- 6. 기존 메뉴에 URL 할당
UPDATE cm_menu SET menu_url = '/dashboard' WHERE menu_code = 'M001';
UPDATE cm_menu SET menu_url = '/goals' WHERE menu_code = 'M002';
UPDATE cm_menu SET menu_url = '/one-on-one' WHERE menu_code = 'M003';
UPDATE cm_menu SET menu_url = '/system' WHERE menu_code = 'M004';

-- 7. 인덱스 생성 (계층 구조 쿼리 성능 최적화)
CREATE INDEX idx_menu_up_menu_code ON cm_menu (up_menu_code);
CREATE INDEX idx_menu_level ON cm_menu (menu_level);
CREATE INDEX idx_menu_url ON cm_menu (menu_url);

-- ===============================================
-- 확인 쿼리
-- ===============================================
-- SELECT
--     menu_code,
--     menu_name,
--     up_menu_code,
--     menu_level,
--     menu_url,
--     sort_seq,
--     use_yn
-- FROM cm_menu
-- ORDER BY menu_level, sort_seq;
