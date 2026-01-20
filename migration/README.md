# 🗄️ Database Migration History

이 폴더는 프로젝트의 데이터베이스 스키마 변경 이력을 SQL 파일로 관리합니다.

## 📏 규칙 (Rules)

`.cursorrules`에 정의된 다음 규칙을 반드시 준수해야 합니다:

1. **직접 수정 금지**: DB 콘솔에서 직접 DDL(CREATE, ALTER, DROP 등)을 실행하지 않습니다.
2. **SQL 파일 관리**: 모든 스키마 변경은 이 폴더의 SQL 파일로 기록합니다.
3. **파일명 규칙**: `YYYYMMDD_행위명.sql` 형식을 사용합니다.
    - 예: `20260120_initial_schema.sql`
    - 예: `20260121_add_user_table.sql`
4. **Append-Only**: 기존에 생성된 migration 파일은 수정하지 않습니다. 변경이 필요한 경우 새로운 migration 파일을 생성합니다.

## 🚀 실행 방법

새로운 migration 파일을 생성한 후, 해당 SQL 쿼리를 대상 데이터베이스(Supabase SQL Editor 등)에서 순차적으로 실행하여 반영합니다.
