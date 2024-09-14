import typing
from uuid import UUID
from channels.generic.websocket import json
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.http import HttpRequest, HttpResponse
from settings.http import http
from pong.forms.TournamentForms import (
    TournamentGetFilterForm,
    TournamentRegistrationForm,
)
from pong.models import Player, Tournament
from pong.models.Match import Match
from pong.resources.TournamentResource import TournamentResource


def index(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    form = TournamentGetFilterForm(request.GET.dict())

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    player = typing.cast(Player, request.user)
    target_player = Player.objects.filter(public_id=form.data.get("player_id")).first()

    if target_player is None:
        return http.NotFound({"message": _("Jogador não encontrado")})

    tournaments = Tournament.query_by_player([target_player])
    tournaments = [TournamentResource(tournament, player) for tournament in tournaments]

    return http.OK(tournaments)


def get(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    tournament = Tournament.query_by_active_tournament_from([player]).first()
    if tournament is None:
        return http.NotFound({"message": _("Torneio não encontrado")})

    return http.OK(TournamentResource(tournament, player))


def create(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    form = TournamentRegistrationForm(json.loads(request.body))

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    player = typing.cast(Player, request.user)
    name = form.data.get("name")
    players_id: list[UUID] = form.data.get("players_id")
    players = Player.objects.filter(public_id__in=players_id).all()

    if not players:
        return http.NotFound({"message": _("Jogadores não encontrados")})

    active_match = Match.query_by_active_match_from(players)
    active_tournament = Tournament.query_by_active_tournament_from(players)
    if active_match.exists() or active_tournament.exists():
        raise ValidationError(
            {"players_id": [_("Os jogadores selecionados já estão em partidas ativas")]}
        )

    tournament = Tournament(name=name)
    tournament.save()
    tournament.generate_matches_tree_for(len(players))
    tournament.initialize_matches_tree(list(players))

    tournament.begin()

    return http.Created(TournamentResource(tournament, player))


def accept(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    tournament = Tournament.query_by_active_tournament_from([player]).first()
    if tournament is None:
        return http.NotFound({"message": _("Torneio não encontrado")})
    tournament.accept(player)

    return http.OK(TournamentResource(tournament, player))


def reject(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    tournament = Tournament.query_by_active_tournament_from([player]).first()
    if tournament is None:
        return http.NotFound({"message": _("Torneio não encontrado")})
    tournament.reject(player)

    return http.OK(TournamentResource(tournament, player))
