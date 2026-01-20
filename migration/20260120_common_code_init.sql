-- Common Code Tables Migration
-- Created at 2026-01-20
--
-- 공통코드 마스터 및 디테일 테이블과 초기 데이터 설정

-- ============================================
-- 공통코드 마스터 테이블 (cm_codemaster)
-- ============================================
CREATE TABLE IF NOT EXISTS cm_codemaster (
    code_type VARCHAR(20) PRIMARY KEY COMMENT '코드 타입 (ROLE, POSITION, MENU 등)',
    code_type_name VARCHAR(50) NOT NULL COMMENT '코드 타입명',
    code_len SMALLINT NOT NULL COMMENT '코드 길이',
    rmk VARCHAR(500) COMMENT '비고',
    in_user VARCHAR(50) COMMENT '등록자',
    in_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    up_user VARCHAR(50) COMMENT '수정자',
    up_date TIMESTAMP COMMENT '수정일시'
);

-- ============================================
-- 공통코드 디테일 테이블 (cm_codedetail)
-- ============================================
CREATE TABLE IF NOT EXISTS cm_codedetail (
    code_type VARCHAR(20) NOT NULL COMMENT '코드 타입',
    code VARCHAR(10) NOT NULL COMMENT '코드 (CD001 형태)',
    code_name VARCHAR(100) NOT NULL COMMENT '코드명 (HR, TEAM_LEADER 등)',
    use_yn CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
    sort_seq INTEGER COMMENT '정렬순서',
    rmk VARCHAR(500) COMMENT '비고',
    in_user VARCHAR(50) COMMENT '등록자',
    in_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    up_user VARCHAR(50) COMMENT '수정자',
    up_date TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (code_type, code),
    FOREIGN KEY (code_type) REFERENCES cm_codemaster(code_type)
);

-- ============================================
-- 공통코드 마스터 초기 데이터
-- ============================================
INSERT INTO cm_codemaster (code_type, code_type_name, code_len, rmk, in_user, in_date)
VALUES
    ('ROLE', '역할', 5, '사용자 역할 구분 (HR/GENERAL)', 'system', NOW()),
    ('POSITION', '직급', 5, '사용자 직급 구분 (TEAM_LEADER/MEMBER)', 'system', NOW())
ON CONFLICT (code_type) DO NOTHING;

-- ============================================
-- 공통코드 디테일 초기 데이터 - ROLE
-- ============================================
INSERT INTO cm_codedetail (code_type, code, code_name, use_yn, sort_seq, rmk, in_user, in_date)
VALUES
    ('ROLE', 'CD001', 'HR', 'Y', 1, 'HR 담당자', 'system', NOW()),
    ('ROLE', 'CD002', 'GENERAL', 'Y', 2, '일반 사용자', 'system', NOW())
ON CONFLICT (code_type, code) DO NOTHING;

-- ============================================
-- 공통코드 디테일 초기 데이터 - POSITION
-- ============================================
INSERT INTO cm_codedetail (code_type, code, code_name, use_yn, sort_seq, rmk, in_user, in_date)
VALUES
    ('POSITION', 'CD101', 'TEAM_LEADER', 'Y', 1, '팀 리더', 'system', NOW()),
    ('POSITION', 'CD102', 'MEMBER', 'Y', 2, '팀 멤버', 'system', NOW())
ON CONFLICT (code_type, code) DO NOTHING;
