# 🗄️ Database Migration with Alembic

이 프로젝트는 **Alembic**을 사용하여 데이터베이스 마이그레이션을 관리합니다.

## 📏 규칙 (Rules)

`.cursorrules`에 정의된 다음 규칙을 반드시 준수해야 합니다:

1. **직접 수정 금지**: DB 콘솔에서 직접 DDL(CREATE, ALTER, DROP 등)을 실행하지 않습니다.
2. **Alembic 사용**: 모든 스키마 변경은 Alembic 마이그레이션으로 관리합니다.
3. **모델 우선**: SQLAlchemy 모델을 먼저 수정한 후 마이그레이션을 생성합니다.
4. **Append-Only**: 기존에 생성된 마이그레이션 파일은 수정하지 않습니다. 변경이 필요한 경우 새로운 마이그레이션을 생성합니다.

## 🚀 사용 방법

### 1. 마이그레이션 생성

```bash
# Step 1: 모델 먼저 수정 (server/app/domain/{domain}/models.py)
# Step 2: 마이그레이션 자동 생성
alembic revision --autogenerate -m "Add session columns to refresh_token"

# Step 3: 생성된 마이그레이션 파일 검토
# alembic/versions/{revision_id}_*.py
```

### 2. 마이그레이션 적용

```bash
# 최신 버전으로 업그레이드
alembic upgrade head

# 특정 버전으로 업그레이드
alembic upgrade <revision_id>

# 한 단계 다운그레이드
alembic downgrade -1

# 모든 마이그레이션 롤백
alembic downgrade base
```

### 3. 마이그레이션 이력 확인

```bash
# 현재 버전 확인
alembic current

# 마이그레이션 히스토리 확인
alembic history

# 마이그레이션 상세 정보
alembic show <revision_id>
```

## 📂 마이그레이션 파일 위치

모든 Alembic 마이그레이션 파일은 `/alembic/versions/` 폴더에 저장됩니다.

- **위치**: `/alembic/versions/{revision_id}_{description}.py`
- **자동 생성**: `alembic revision --autogenerate` 명령어로 생성
- **파일명 예시**: `b83b2a688072_add_session_columns_to_refresh_token.py`

## 🔧 Alembic 설정

### alembic.ini
- 데이터베이스 URL은 환경변수(`DATABASE_URL`)에서 자동으로 가져옵니다.
- 별도 설정 변경 불필요

### alembic/env.py
- 비동기 SQLAlchemy 환경에서 동기 마이그레이션 지원
- `postgresql+asyncpg://` → `postgresql+psycopg2://` 자동 변환
- 모든 도메인 모델 자동 import

## 💡 데이터 마이그레이션 (Seed Data)

초기 데이터는 마이그레이션 파일에서 직접 삽입:

```python
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # 스키마 변경
    op.create_table('users', ...)

    # 초기 데이터 삽입
    op.bulk_insert(
        sa.table('users',
            sa.column('id', sa.Integer),
            sa.column('name', sa.String)
        ),
        [
            {'id': 1, 'name': 'Admin'},
            {'id': 2, 'name': 'User'}
        ]
    )

def downgrade() -> None:
    op.drop_table('users')
```

## ⚠️ 주의사항

1. **autogenerate 검토 필수**: 자동 생성된 마이그레이션은 반드시 검토 후 수정
2. **복잡한 변경은 수동 작성**: 컬럼 타입 변경, 데이터 변환 등은 수동으로 작성
3. **프로덕션 배포 전 테스트**: 로컬/스테이징에서 충분히 테스트 후 배포
4. **백업 필수**: 프로덕션 DB 마이그레이션 전 백업 필수

## 🔗 참고 자료

- [Alembic 공식 문서](https://alembic.sqlalchemy.org/)
- [SQLAlchemy 공식 문서](https://docs.sqlalchemy.org/)
- [프로젝트 .cursorrules](./.cursorrules) - DB Migration 규칙
