"""
Coaching 도메인 Calculator

순수 계산 및 비즈니스 로직 담당 (DB 접근 금지)

Task 4:
    - generate_ai_suggested_agendas : LLM을 통해 AI 추천 질문 생성
"""

import asyncio
import json
import re
from typing import Optional

from server.app.core.config import get_settings
from server.app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# LLM 타임아웃 (15초, 초과 시 빈 배열 fallback)
_LLM_TIMEOUT_SECONDS: int = 15


async def generate_ai_suggested_agendas(
    member_rnr_titles: list[str],
    previous_summaries: list[str],
    is_first_meeting: bool,
) -> list[str]:
    """
    LLM(GPT-4o)을 호출하여 AI 추천 질문(아젠다)을 생성합니다.

    팀원의 R&R과 이전 미팅 요약을 기반으로 1on1 면담에 활용할
    구체적인 질문 3~5개를 생성합니다.

    타임아웃 15초 초과 또는 API 오류 시 빈 배열을 반환합니다.
    (베타 타협: 10명 규모에서는 동기 방식 허용)

    Args:
        member_rnr_titles: 팀원의 R&R 제목 목록
        previous_summaries: 이전 미팅 AI 요약 목록 (N-1, N-2)
        is_first_meeting: 첫 미팅 여부

    Returns:
        list[str]: AI 추천 질문 목록 (실패 시 빈 배열)
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY 미설정 → AI 추천 질문 생략")
        return []

    try:
        agendas = await asyncio.wait_for(
            _call_llm_for_agendas(
                member_rnr_titles=member_rnr_titles,
                previous_summaries=previous_summaries,
                is_first_meeting=is_first_meeting,
            ),
            timeout=_LLM_TIMEOUT_SECONDS,
        )
        return agendas
    except asyncio.TimeoutError:
        logger.warning(
            "AI 추천 질문 LLM 타임아웃 (15초 초과) → 빈 배열 fallback"
        )
        return []
    except Exception as exc:
        logger.error(
            "AI 추천 질문 LLM 호출 실패 → 빈 배열 fallback",
            extra={"error": str(exc)},
        )
        return []


async def _call_llm_for_agendas(
    member_rnr_titles: list[str],
    previous_summaries: list[str],
    is_first_meeting: bool,
) -> list[str]:
    """
    실제 OpenAI GPT-4o API 호출 함수.

    Args:
        member_rnr_titles: 팀원 R&R 제목 목록
        previous_summaries: 이전 미팅 요약 목록
        is_first_meeting: 첫 미팅 여부

    Returns:
        list[str]: 파싱된 AI 추천 질문 목록
    """
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = _build_agenda_prompt(
        member_rnr_titles=member_rnr_titles,
        previous_summaries=previous_summaries,
        is_first_meeting=is_first_meeting,
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 1on1 면담을 돕는 AI 코칭 어시스턴트입니다. "
                    "리더가 팀원과 진행하는 1on1 면담에서 활용할 질문을 추천합니다."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=500,
    )

    raw_content: Optional[str] = response.choices[0].message.content
    if not raw_content:
        return []

    return _parse_agenda_response(raw_content)


def _build_agenda_prompt(
    member_rnr_titles: list[str],
    previous_summaries: list[str],
    is_first_meeting: bool,
) -> str:
    """
    AI 추천 질문 생성을 위한 LLM 프롬프트를 구성합니다.

    Args:
        member_rnr_titles: 팀원 R&R 제목 목록
        previous_summaries: 이전 미팅 요약 목록
        is_first_meeting: 첫 미팅 여부

    Returns:
        str: 완성된 프롬프트
    """
    rnr_section = (
        "\n".join(f"- {title}" for title in member_rnr_titles)
        if member_rnr_titles
        else "R&R 정보가 등록되지 않았습니다."
    )

    if is_first_meeting:
        context_section = (
            "이번이 팀원과의 첫 번째 1on1 미팅입니다. "
            "온보딩 및 아이스브레이킹에 적합한 질문을 추천해주세요."
        )
    elif previous_summaries:
        summaries_text = "\n".join(
            f"[이전 미팅 {i + 1}]\n{summary}"
            for i, summary in enumerate(previous_summaries)
        )
        context_section = f"이전 미팅 요약:\n{summaries_text}"
    else:
        context_section = "이전 미팅 내용이 없습니다."

    return f"""다음 정보를 바탕으로 1on1 면담에서 활용할 질문 3~5개를 추천해주세요.

팀원 R&R (역할 및 책임):
{rnr_section}

{context_section}

조건:
- 팀원의 업무 성장과 관심사를 파악할 수 있는 구체적인 질문
- 개방형 질문으로 작성 (예/아니오로 답하기 어려운 형태)
- 각 질문은 간결하고 명확하게 (2문장 이내)

JSON 배열 형식으로만 응답하세요 (다른 텍스트 없이):
["질문1", "질문2", "질문3"]"""


def _parse_agenda_response(raw_content: str) -> list[str]:
    """
    LLM 응답에서 JSON 배열을 파싱하여 질문 목록을 추출합니다.

    JSON 파싱 실패 시 빈 배열을 반환합니다.

    Args:
        raw_content: LLM 원문 응답

    Returns:
        list[str]: 파싱된 질문 목록
    """
    # 직접 JSON 파싱 시도
    try:
        parsed = json.loads(raw_content.strip())
        if isinstance(parsed, list):
            return [str(item) for item in parsed if item]
    except json.JSONDecodeError:
        pass

    # JSON 블록 추출 후 재시도
    json_match = re.search(r"\[.*?\]", raw_content, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            if isinstance(parsed, list):
                return [str(item) for item in parsed if item]
        except json.JSONDecodeError:
            pass

    logger.warning(
        "AI 추천 질문 JSON 파싱 실패 → 빈 배열 반환",
        extra={"raw_content_preview": raw_content[:200]},
    )
    return []
