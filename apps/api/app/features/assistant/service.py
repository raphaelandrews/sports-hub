import logging
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.athlete import Athlete
from app.domain.models.competition import Competition
from app.domain.models.delegation import Delegation
from app.domain.models.event import Event, Match, MatchStatus
from app.domain.models.league_delegation import LeagueDelegation
from app.domain.models.narrative import AIGeneration
from app.domain.models.result import Medal, Result
from app.domain.models.sport import Modality, Sport
from app.features.narratives import ai as ai_service
from app.features.results import service as result_service

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "Você é um assistente especialista em esportes e estatísticas de uma plataforma de gestão de "
    "ligas esportivas escolares/universitárias. Você responde perguntas em português brasileiro "
    "com base nos dados fornecidos. Seja direto, objetivo e amigável. Use markdown para formatar "
    "respostas quando apropriado (listas, negrito, etc). Se não houver dados suficientes para "
    "responder com precisão, diga claramente que não há informações suficientes. "
    "Não invente dados que não estejam no contexto."
)


async def _build_league_context(session: AsyncSession, league_id: int) -> str:
    lines: list[str] = []

    # Medal board
    medal_board = await result_service.get_medal_board(session, league_id)
    if medal_board:
        lines.append("## Quadro de Medalhas")
        for entry in medal_board[:10]:
            lines.append(
                f"- {entry.delegation_name}: {entry.gold} ouro, {entry.silver} prata, {entry.bronze} bronze (total: {entry.total})"
            )

    # Recent completed matches (last 20)
    recent_matches_result = await session.execute(
        select(Match, Event, Modality, Sport)
        .join(Event, Event.id == Match.event_id)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(
            Competition.league_id == league_id, Match.status == MatchStatus.COMPLETED
        )
        .order_by(Match.ended_at.desc().nullslast())
        .limit(20)
    )
    recent_matches = recent_matches_result.all()
    if recent_matches:
        lines.append("\n## Últimas Partidas Concluídas")
        for match, event, modality, sport in recent_matches:
            winner = "Empate"
            if match.winner_delegation_id == match.team_a_delegation_id:
                winner = "Equipe A"
            elif match.winner_delegation_id == match.team_b_delegation_id:
                winner = "Equipe B"
            lines.append(
                f"- {sport.name} / {modality.name}: {match.score_a}x{match.score_b} ({winner})"
            )

    # Upcoming events (next 10)
    today = datetime.now(UTC).replace(tzinfo=None).date()
    upcoming_events_result = await session.execute(
        select(Event, Modality, Sport)
        .join(Competition, Competition.id == Event.competition_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .where(Competition.league_id == league_id, Event.event_date >= today)
        .order_by(Event.event_date.asc(), Event.start_time.asc())
        .limit(10)
    )
    upcoming_events = upcoming_events_result.all()
    if upcoming_events:
        lines.append("\n## Próximos Eventos")
        for event, modality, sport in upcoming_events:
            lines.append(
                f"- {sport.name} / {modality.name}: {event.event_date} às {event.start_time}"
            )

    # Delegations
    delegations_result = await session.execute(
        select(Delegation)
        .join(LeagueDelegation, LeagueDelegation.delegation_id == Delegation.id)
        .where(LeagueDelegation.league_id == league_id, Delegation.is_active == True)  # noqa: E712
    )
    delegations = delegations_result.scalars().all()
    lines.append(f"\n## Delegações ({len(delegations)} ativas)")
    for d in delegations:
        lines.append(f"- {d.name} ({d.code})")

    # Athlete count
    athlete_count = (
        await session.execute(
            select(func.count())
            .select_from(Athlete)
            .where(Athlete.league_id == league_id, Athlete.is_active == True)  # noqa: E712
        )
    ).scalar_one()
    lines.append(f"\n## Total de Atletas: {athlete_count}")

    # Sport counts
    sport_counts = await session.execute(
        select(Sport.name, func.count(Modality.id).label("modality_count"))
        .select_from(Sport)
        .join(Modality, Modality.sport_id == Sport.id)
        .where(Sport.is_active == True)  # noqa: E712
        .group_by(Sport.name)
    )
    sport_counts_rows = sport_counts.all()
    if sport_counts_rows:
        lines.append("\n## Modalidades por Esporte")
        for sport_name, count in sport_counts_rows:
            lines.append(f"- {sport_name}: {count} modalidades")

    return "\n".join(lines)


async def answer_query(session: AsyncSession, league_id: int, question: str) -> str:
    context = await _build_league_context(session, league_id)
    user_prompt = (
        f"Contexto da Liga (ID {league_id}):\n\n{context}\n\n"
        f"Pergunta do usuário: {question}\n\n"
        "Responda com base apenas nos dados acima."
    )
    answer = await ai_service.generate_text(
        _SYSTEM_PROMPT, user_prompt, max_tokens=1200
    )

    session.add(
        AIGeneration(league_id=league_id, generation_type="assistant_query", count=1)
    )
    await session.commit()
    logger.info("assistant_query league_id=%s question=%s", league_id, question[:60])
    return answer
