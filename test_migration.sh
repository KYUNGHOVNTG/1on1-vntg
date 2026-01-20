#!/bin/bash

# 공통코드 마이그레이션 실행 스크립트
# Supabase SQL Editor에서 실행하거나, psql 명령으로 실행

echo "==================================="
echo "공통코드 마이그레이션 실행 가이드"
echo "==================================="
echo ""
echo "방법 1: Supabase Dashboard 사용 (권장)"
echo "  1. Supabase Dashboard 접속"
echo "  2. SQL Editor 메뉴 선택"
echo "  3. migration/20260120_common_code_init.sql 파일 내용 복사"
echo "  4. SQL Editor에 붙여넣기 후 실행"
echo ""
echo "방법 2: psql 명령 사용"
echo "  psql -h YOUR_HOST -U postgres -d postgres -f migration/20260120_common_code_init.sql"
echo ""
echo "==================================="
echo "마이그레이션 파일 내용:"
echo "==================================="
cat migration/20260120_common_code_init.sql
