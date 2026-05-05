from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import require_league_member
from app.database import get_session
from app.domain.models.league import LeagueMember
from app.domain.schemas.prediction import MatchPredictionResponse
from app.features.predictions import service as prediction_service

router = APIRouter(prefix="/leagues/{league_id}/matches", tags=["predictions"])


@router.post(
    "/{match_id}/predict",
    response_model=MatchPredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def predict_match(
    league_id: int,
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> MatchPredictionResponse:
    prediction = await prediction_service.generate_prediction(
        session, league_id, match_id
    )
    return MatchPredictionResponse.model_validate(prediction)


@router.get("/{match_id}/prediction", response_model=MatchPredictionResponse | None)
async def get_match_prediction(
    league_id: int,
    match_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> MatchPredictionResponse | None:
    prediction = await prediction_service.get_prediction(session, match_id)
    if prediction is None:
        return None
    return MatchPredictionResponse.model_validate(prediction)
