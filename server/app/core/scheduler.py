"""
세션 정리 스케줄러

APScheduler를 사용하여 주기적으로 만료된 세션을 정리합니다.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from server.app.core.config import settings
from server.app.core.database import AsyncSessionLocal
from server.app.core.logging import get_logger
from server.app.domain.auth.models import RefreshToken

logger = get_logger(__name__)

# 전역 스케줄러 인스턴스
_scheduler: Optional[AsyncIOScheduler] = None


async def cleanup_expired_sessions() -> None:
    """
    만료된 세션을 정리하는 작업입니다.

    15분 이상 비활동 상태인 세션을 폐기합니다.
    매 10분마다 실행됩니다.
    """
    logger.info("만료 세션 정리 크론잡 시작")

    try:
        # 독립적인 DB 세션 생성
        async with AsyncSessionLocal() as db:
            # Idle 기준 시간 계산 (15분)
            idle_threshold = datetime.utcnow() - timedelta(minutes=15)

            # Idle 상태 세션 조회
            stmt = select(RefreshToken).where(
                RefreshToken.revoked_yn == 'N',
                RefreshToken.last_activity_at < idle_threshold
            )

            result = await db.execute(stmt)
            idle_sessions = result.scalars().all()

            # 세션 폐기
            cleaned_count = 0
            for session in idle_sessions:
                session.revoke()
                cleaned_count += 1

            await db.commit()

            if cleaned_count > 0:
                logger.info(
                    f"[크론잡] 만료 세션 정리 완료: {cleaned_count}개 폐기됨",
                    extra={"cleaned_count": cleaned_count}
                )
            else:
                logger.debug("[크론잡] 정리할 만료 세션 없음")

    except Exception as e:
        logger.error(f"[크론잡] 만료 세션 정리 중 오류: {str(e)}")


def start_scheduler() -> AsyncIOScheduler:
    """
    스케줄러를 시작합니다.

    Returns:
        AsyncIOScheduler: 시작된 스케줄러 인스턴스
    """
    global _scheduler

    if _scheduler is not None:
        logger.warning("스케줄러가 이미 실행 중입니다")
        return _scheduler

    _scheduler = AsyncIOScheduler()

    # 만료 세션 정리 작업 등록 (매 10분마다)
    _scheduler.add_job(
        cleanup_expired_sessions,
        trigger=IntervalTrigger(minutes=10),
        id="cleanup_expired_sessions",
        name="만료 세션 정리",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("세션 정리 스케줄러 시작됨 (10분 간격)")

    return _scheduler


def stop_scheduler() -> None:
    """
    스케줄러를 중지합니다.
    """
    global _scheduler

    if _scheduler is None:
        logger.warning("스케줄러가 실행 중이 아닙니다")
        return

    _scheduler.shutdown(wait=False)
    _scheduler = None
    logger.info("세션 정리 스케줄러 중지됨")


def get_scheduler() -> Optional[AsyncIOScheduler]:
    """
    현재 스케줄러 인스턴스를 반환합니다.

    Returns:
        Optional[AsyncIOScheduler]: 스케줄러 인스턴스 또는 None
    """
    return _scheduler
