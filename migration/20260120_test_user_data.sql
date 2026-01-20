-- 테스트용 사용자 데이터
-- Created at 2026-01-20
--
-- JWT 토큰 발급 테스트를 위한 샘플 사용자 데이터

-- 먼저 CM_USER 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS cm_user (
    user_id VARCHAR(50) PRIMARY KEY COMMENT '사용자 ID (이메일 @ 앞 부분)',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '이메일',
    use_yn CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
    role_code VARCHAR(10) NOT NULL COMMENT '역할 코드 (CD001=HR, CD002=GENERAL)',
    position_code VARCHAR(10) NOT NULL COMMENT '직급 코드 (CD101=TEAM_LEADER, CD102=MEMBER)',
    in_user VARCHAR(50) COMMENT '등록자',
    in_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    up_user VARCHAR(50) COMMENT '수정자',
    up_date TIMESTAMP COMMENT '수정일시'
);

-- 테스트 사용자 데이터 삽입
-- 주의: user_id는 이메일의 @ 앞 부분과 일치해야 합니다
INSERT INTO cm_user (user_id, email, use_yn, role_code, position_code, in_user, in_date)
VALUES
    -- HR 팀 리더 (예시)
    ('test.hr', 'test.hr@example.com', 'Y', 'CD001', 'CD101', 'system', NOW()),

    -- 일반 멤버 (예시)
    ('test.user', 'test.user@example.com', 'Y', 'CD002', 'CD102', 'system', NOW())
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    use_yn = EXCLUDED.use_yn,
    role_code = EXCLUDED.role_code,
    position_code = EXCLUDED.position_code,
    up_user = 'system',
    up_date = NOW();

-- 확인 쿼리
SELECT
    u.user_id,
    u.email,
    u.use_yn,
    u.role_code,
    r.code_name as role_name,
    u.position_code,
    p.code_name as position_name
FROM cm_user u
LEFT JOIN cm_codedetail r ON r.code_type = 'ROLE' AND r.code = u.role_code
LEFT JOIN cm_codedetail p ON p.code_type = 'POSITION' AND p.code = u.position_code
WHERE u.use_yn = 'Y';
