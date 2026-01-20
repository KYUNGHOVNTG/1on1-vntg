-- ===============================
-- 1. 공통코드 마스터
-- ===============================
CREATE TABLE cm_codemaster (
    code_type VARCHAR(20) PRIMARY KEY,     -- ROLE, POSITION, MENU 등
    code_type_name VARCHAR(50) NOT NULL,
    code_len SMALLINT NOT NULL,
    rmk VARCHAR(500),
    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    up_user VARCHAR(50),
    up_date TIMESTAMP
);

-- ===============================
-- 2. 공통코드 디테일
-- ===============================
CREATE TABLE cm_codedetail (
    code_type VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,              -- CD001 형태
    code_name VARCHAR(100) NOT NULL,        -- HR, TEAM_LEADER 등
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',
    sort_seq INTEGER,
    rmk VARCHAR(500),
    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    up_user VARCHAR(50),
    up_date TIMESTAMP,
    CONSTRAINT pk_cm_codedetail PRIMARY KEY (code_type, code),
    CONSTRAINT fk_codedetail_master
        FOREIGN KEY (code_type)
        REFERENCES cm_codemaster (code_type)
);

-- ===============================
-- 3. 사용자 (사전 등록 직원)
-- ===============================
CREATE TABLE cm_user (
    user_id VARCHAR(50) PRIMARY KEY,        -- 이메일 @ 앞
    email VARCHAR(255) NOT NULL UNIQUE,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',

    role_code VARCHAR(10) NOT NULL,          -- CD001 (ROLE)
    position_code VARCHAR(10) NOT NULL,      -- CD101 (POSITION)

    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    up_user VARCHAR(50),
    up_date TIMESTAMP
);

-- ===============================
-- 4. 메뉴 정의
-- ===============================
CREATE TABLE cm_menu (
    menu_code VARCHAR(10) PRIMARY KEY,      -- CD201
    menu_name VARCHAR(100) NOT NULL,
    sort_seq INTEGER,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',
    rmk VARCHAR(500),
    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    up_user VARCHAR(50),
    up_date TIMESTAMP
);

-- ===============================
-- 5. 직책별 메뉴 권한
-- ===============================
CREATE TABLE cm_position_menu (
    position_code VARCHAR(10) NOT NULL,     -- CD101
    menu_code VARCHAR(10) NOT NULL,          -- CD201
    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cm_position_menu PRIMARY KEY (position_code, menu_code)
);

-- ===============================
-- 6. 개인별 예외 메뉴 권한
-- ===============================
CREATE TABLE cm_user_menu (
    user_id VARCHAR(50) NOT NULL,
    menu_code VARCHAR(10) NOT NULL,
    in_user VARCHAR(50),
    in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cm_user_menu PRIMARY KEY (user_id, menu_code)
);

-- ===============================
-- 7. Refresh Token (JWT 확장 대비)
-- ===============================
CREATE TABLE auth_refresh_token (
    refresh_token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_yn CHAR(1) NOT NULL DEFAULT 'N',
    in_date TIMESTAMP NOT NULL DEFAULT NOW()
);
