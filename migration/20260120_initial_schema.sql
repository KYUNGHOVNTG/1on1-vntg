-- Initial schema based on supabase_schema.sql
-- Created at 2026-01-20

-- connection_tests 테이블 생성
CREATE TABLE IF NOT EXISTS connection_tests (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입
INSERT INTO connection_tests (message) VALUES ('Supabase 연결 성공! 🚀');
