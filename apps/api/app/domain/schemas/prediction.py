from datetime import datetime
from typing import Any

from pydantic import BaseModel


class MatchPredictionResponse(BaseModel):
    id: int
    match_id: int
    league_id: int
    prediction_json: dict[str, Any]
    generated_at: datetime

    model_config = {"from_attributes": True}
