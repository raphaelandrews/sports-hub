import json
import logging
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.athlete import Athlete
from app.domain.models.competition import Competition
from app.domain.models.delegation import Delegation
from app.domain.models.event import Event, Match, MatchStatus
from app.domain.models.narrative import AIGeneration
from app.domain.models.prediction import MatchPrediction
from app.domain.models.result import Result
from app.domain.models.sport import Modality, Sport
from app.features.narratives import ai as ai_service

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "Você é um analista esportivo especializado em estatísticas e previsões de partidas. "
    "Com base nos dados históricos fornecidos, gere uma previsão para a partida em formato JSON. "
    "O JSON deve conter obrigatoriamente:\n"
    "- win_probability_a: float (0-1) - probabilidade de vitória do time/atleta A\n"
    "- win_probability_b: float (0-1) - probabilidade de vitória do time/atleta B\n"
    "- draw_probability: float (0-1) - probabilidade de empate (quando aplicável, senão 0)\n"
    "- predicted_score_a: int - placar previsto para A\n"
    "- predicted_score_b: int - placar previsto para B\n"
    "- reasoning: str - breve justificativa da previsão em português\n"
    "- key_factor: str - fator decisivo para a previsão\n"
    "Responda APENAS com o JSON válido, sem markdown ou texto adicional."
)


def _mock_prediction() -> dict:
    return {
        "win_probability_a": 0.5,
        "win_probability_b": 0.5,
        "draw_probability": 0.0,
        "predicted_score_a": 1,
        "predicted_score_b": 1,
        "reasoning": "Modo demonstração — configure GROQ_API_KEY para previsões reais.",
        "key_factor": "Dados insuficientes no modo de demonstração.",
    }


async def _build_match_context(
    session: AsyncSession, match: Match, league_id: int
) -> str:
    lines: list[str] = []

    event = await session.get(Event, match.event_id)
    modality = await session.get(Modality, event.modality_id) if event else None
    sport = await session.get(Sport, modality.sport_id) if modality else None

    lines.append(
        f"## Partida: {sport.name if sport else 'Desconhecido'} / {modality.name if modality else 'Desconhecido'}"
    )

    # Team/athlete A info
    if match.team_a_delegation_id:
        delegation_a = await session.get(Delegation, match.team_a_delegation_id)
        lines.append(
            f"\n### Time A: {delegation_a.name if delegation_a else 'Desconhecido'} ({delegation_a.code if delegation_a else ''})"
        )
    elif match.athlete_a_id:
        athlete_a = await session.get(Athlete, match.athlete_a_id)
        lines.append(
            f"\n### Atleta A: {athlete_a.name if athlete_a else 'Desconhecido'}"
        )

    # Team/athlete B info
    if match.team_b_delegation_id:
        delegation_b = await session.get(Delegation, match.team_b_delegation_id)
        lines.append(
            f"### Time B: {delegation_b.name if delegation_b else 'Desconhecido'} ({delegation_b.code if delegation_b else ''})"
        )
    elif match.athlete_b_id:
        athlete_b = await session.get(Athlete, match.athlete_b_id)
        lines.append(f"### Atleta B: {athlete_b.name if athlete_b else 'Desconhecido'}")

    # Historical matches for team A in this league
    team_a_matches = await session.execute(
        select(Match, Event)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Competition.league_id == league_id,
            Match.status == MatchStatus.COMPLETED,
            Match.id != match.id,
        )
        .where(
            (Match.team_a_delegation_id == match.team_a_delegation_id)
            | (Match.team_b_delegation_id == match.team_a_delegation_id)
            | (Match.athlete_a_id == match.athlete_a_id)
            | (Match.athlete_b_id == match.athlete_a_id)
        )
        .order_by(Match.ended_at.desc().nullslast())
        .limit(10)
    )
    team_a_rows = team_a_matches.all()
    if team_a_rows:
        lines.append(
            f"\n## Histórico Recente do Time/Atleta A ({len(team_a_rows)} partidas)"
        )
        for m, e in team_a_rows:
            is_a = (
                m.team_a_delegation_id == match.team_a_delegation_id
                or m.athlete_a_id == match.athlete_a_id
            )
            score = f"{m.score_a}x{m.score_b}" if is_a else f"{m.score_b}x{m.score_a}"
            result = (
                "V"
                if (
                    m.winner_delegation_id == match.team_a_delegation_id
                    or m.winner_athlete_id == match.athlete_a_id
                )
                else (
                    "E"
                    if m.winner_delegation_id is None and m.winner_athlete_id is None
                    else "D"
                )
            )
            lines.append(f"- {score} ({result})")

    # Historical matches for team B in this league
    team_b_matches = await session.execute(
        select(Match, Event)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .where(
            Competition.league_id == league_id,
            Match.status == MatchStatus.COMPLETED,
            Match.id != match.id,
        )
        .where(
            (Match.team_a_delegation_id == match.team_b_delegation_id)
            | (Match.team_b_delegation_id == match.team_b_delegation_id)
            | (Match.athlete_a_id == match.athlete_b_id)
            | (Match.athlete_b_id == match.athlete_b_id)
        )
        .order_by(Match.ended_at.desc().nullslast())
        .limit(10)
    )
    team_b_rows = team_b_matches.all()
    if team_b_rows:
        lines.append(
            f"\n## Histórico Recente do Time/Atleta B ({len(team_b_rows)} partidas)"
        )
        for m, e in team_b_rows:
            is_a = (
                m.team_a_delegation_id == match.team_b_delegation_id
                or m.athlete_a_id == match.athlete_b_id
            )
            score = f"{m.score_a}x{m.score_b}" if is_a else f"{m.score_b}x{m.score_a}"
            result = (
                "V"
                if (
                    m.winner_delegation_id == match.team_b_delegation_id
                    or m.winner_athlete_id == match.athlete_b_id
                )
                else (
                    "E"
                    if m.winner_delegation_id is None and m.winner_athlete_id is None
                    else "D"
                )
            )
            lines.append(f"- {score} ({result})")

    # Head-to-head
    if match.team_a_delegation_id and match.team_b_delegation_id:
        h2h = await session.execute(
            select(Match)
            .join(Event, Event.id == Match.event_id)
            .join(Competition, Competition.id == Event.competition_id)
            .where(
                Competition.league_id == league_id,
                Match.status == MatchStatus.COMPLETED,
                Match.id != match.id,
            )
            .where(
                (
                    (Match.team_a_delegation_id == match.team_a_delegation_id)
                    & (Match.team_b_delegation_id == match.team_b_delegation_id)
                )
                | (
                    (Match.team_a_delegation_id == match.team_b_delegation_id)
                    & (Match.team_b_delegation_id == match.team_a_delegation_id)
                )
            )
            .order_by(Match.ended_at.desc().nullslast())
            .limit(5)
        )
        h2h_rows = h2h.scalars().all()
        if h2h_rows:
            lines.append(f"\n## Confronto Direto ({len(h2h_rows)} partidas)")
            for m in h2h_rows:
                lines.append(f"- {m.score_a}x{m.score_b}")

    # Overall stats for league
    total_completed = (
        await session.execute(
            select(func.count())
            .select_from(Match)
            .join(Event, Event.id == Match.event_id)
            .join(Competition, Competition.id == Event.competition_id)
            .where(
                Competition.league_id == league_id,
                Match.status == MatchStatus.COMPLETED,
            )
        )
    ).scalar_one()
    lines.append(
        f"\n## Estatísticas da Liga: {total_completed} partidas concluídas no total"
    )

    return "\n".join(lines)


def _parse_prediction(raw: str) -> dict:
    text = raw.strip()
    # Try to extract JSON from markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("prediction_parse_failed raw=%s", raw[:200])
        return _mock_prediction()


async def generate_prediction(
    session: AsyncSession, league_id: int, match_id: int
) -> MatchPrediction:
    match = await session.get(Match, match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    # Verify match belongs to league
    event = await session.get(Event, match.event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
        )
    competition = await session.get(Competition, event.competition_id)
    if competition is None or competition.league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found in league"
        )

    context = await _build_match_context(session, match, league_id)
    user_prompt = (
        f"Dados da partida e histórico:\n\n{context}\n\nGere a previsão em JSON."
    )

    raw = await ai_service.generate_text(_SYSTEM_PROMPT, user_prompt, max_tokens=800)
    prediction_data = _parse_prediction(raw)

    # Ensure required keys
    for key in (
        "win_probability_a",
        "win_probability_b",
        "draw_probability",
        "predicted_score_a",
        "predicted_score_b",
        "reasoning",
        "key_factor",
    ):
        if key not in prediction_data:
            prediction_data[key] = _mock_prediction()[key]

    prediction = MatchPrediction(
        match_id=match_id,
        league_id=league_id,
        prediction_json=prediction_data,
    )
    session.add(prediction)
    session.add(
        AIGeneration(league_id=league_id, generation_type="match_prediction", count=1)
    )
    await session.commit()
    await session.refresh(prediction)
    logger.info("match_prediction_generated match_id=%s", match_id)
    return prediction


async def get_prediction(
    session: AsyncSession, match_id: int
) -> MatchPrediction | None:
    result = await session.execute(
        select(MatchPrediction)
        .where(MatchPrediction.match_id == match_id)
        .order_by(MatchPrediction.generated_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
