from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import require_league_member
from app.database import get_session
from app.domain.models.league import LeagueMember
from app.domain.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.features.assistant import service as assistant_service

router = APIRouter(prefix="/leagues/{league_id}/assistant", tags=["assistant"])


@router.post(
    "/query", response_model=AssistantQueryResponse, status_code=status.HTTP_200_OK
)
async def query_assistant(
    league_id: int,
    data: AssistantQueryRequest,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> AssistantQueryResponse:
    answer = await assistant_service.answer_query(session, league_id, data.question)
    return AssistantQueryResponse(answer=answer)
