from __future__ import annotations
from typing import Callable
import uuid
from django.utils.translation import gettext as _
from django.core import serializers
from django.db import models
from threading import Timer

from settings.http import ws
from pong.models.Match import Match
from pong.models.Player import Player
from pong.models.mixins.PlayersAcceptRejectMixin import PlayersAcceptRejectMixin
from pong.resources.TournamentResource import TournamentResource
from pong.models.mixins.TimestampMixin import TimestampMixin


class Tournament(PlayersAcceptRejectMixin, TimestampMixin):
    class Status(models.TextChoices):
        CREATED = "CREATED", _("Criado")
        AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION", _("Aguardando Confirmação")
        IN_PROGRESS = "IN_PROGRESS", _("Em Progresso")
        FINISHED = "FINISHED", _("Finalizado")
        CANCELLED = "CANCELLED", _("Cancelado")

    id = models.AutoField(primary_key=True)
    public_id = models.UUIDField(
        unique=True, db_index=True, default=uuid.uuid4, editable=False
    )
    name = models.CharField(max_length=200)
    root_match = models.ForeignKey(
        Match, default=None, null=True, on_delete=models.CASCADE
    )
    champion = models.ForeignKey(
        Player,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="champion",
    )
    status = models.CharField(
        max_length=100, choices=Status.choices, default=Status.CREATED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    ##################################################
    # Queries
    ##################################################

    @staticmethod
    def query_by_player(players):
        return Tournament.objects.filter(players__in=players).exclude(
            status=Tournament.Status.CANCELLED
        )

    @staticmethod
    def query_by_match(match: Match):
        return Tournament.objects.filter(root_match=match)

    @staticmethod
    def query_by_active_tournament_from(players):
        return Tournament.objects.filter(players__in=players).filter(
            models.Q(status=Tournament.Status.AWAITING_CONFIRMATION)
            | models.Q(status=Tournament.Status.IN_PROGRESS)
        )

    @staticmethod
    def query_by_awaiting_tournament_with_pending_confirmation_by(players):
        return (
            Tournament.objects.filter(players__in=players)
            .filter(status=Tournament.Status.AWAITING_CONFIRMATION)
            .exclude(accepted_players__in=players)
            .exclude(rejected_players__in=players)
        )

    @staticmethod
    def query_by_awaiting_tournament_accepted_by(players):
        return (
            Tournament.objects.filter(players__in=players)
            .filter(status=Tournament.Status.AWAITING_CONFIRMATION)
            .filter(accepted_players__in=players)
        )

    @staticmethod
    def query_by_in_progress_tournament_from(players):
        return Tournament.objects.filter(players__in=players).filter(
            status=Tournament.Status.IN_PROGRESS
        )

    ##################################################
    # Computed
    ##################################################

    def has_finished(self):
        return bool(self.champion != None and self.status == self.Status.FINISHED)

    def can_begin(self):
        return bool(
            self.root_match != None
            and not self.has_finished()
            and self.is_fully_accepted()
        )

    def can_accept_or_reject(self):
        return bool(
            self.status == Tournament.Status.CREATED
            and not self.has_players_in_another_tournament()
            and not self.is_fully_accepted()
            and not self.has_finished()
        )

    def has_players_in_another_tournament(self):
        return (
            Tournament.query_by_active_tournament_from(self.players.all())
            .exclude(public_id=self.public_id)
            .exists()
        )

    ##################################################
    # Notification
    ##################################################

    def notify_players_update(self):
        players = self.players.all()

        for player in players:
            player.send_message(
                ws.WSResponse(
                    ws.WSEvents.PLAYER_NOTIFY_TOURNAMENT_UPDATE,
                    {"tournament": TournamentResource(self, player)},
                )
            )

    ##################################################
    # Logic
    ##################################################

    def generate_matches_tree_for(self, players_n: int):
        self.root_match = Match(name=self.name + " - Partida Final")
        self.root_match.save()
        self.save()

        matches_n = players_n // 2

        if players_n != 4:
            raise ValueError(_("Número de jogadores deve ser 4"))

        def generate_children(match: Match, n: int):
            if n <= 0:
                return
            match.child_upper = Match(name=self.name + " - Partida")
            match.child_lower = Match(name=self.name + " - Partida")
            match.child_upper.save()
            match.child_lower.save()
            match.save()
            n -= 2
            generate_children(match.child_upper, n)
            generate_children(match.child_lower, n)

        generate_children(self.root_match, matches_n)

    def initialize_matches_tree(self, players: list[Player]):
        self.players.add(*players)

        def it(match: Match):
            if match.child_upper is None and match.child_lower is None:
                p1 = players[0]
                p2 = players[1]
                match.players.add(p1)
                match.players.add(p2)
                match.save()
                players.remove(p1)
                players.remove(p2)

        self.foreach_match(it)

    def update_matches_tree(self):
        def it(match: Match):
            if not match.has_finished():
                return
            parent = match.get_parent()
            if not parent:
                return
            if parent.can_receive_new_players():
                parent.players.add(match.winner)
            if parent.can_accept_or_reject() or parent.can_begin():
                parent.begin()
                self.notify_players_update()

        self.foreach_match(it)

    def begin(self):
        if self.can_accept_or_reject():
            self.status = Tournament.Status.AWAITING_CONFIRMATION
            self.save()
            self.notify_players_update()

        if self.can_begin():
            self.status = Tournament.Status.IN_PROGRESS
            self.save()

            def it(match: Match):
                match.begin()

            self.foreach_match(it)
            self.notify_players_update()

    def finish(self):
        has_not_finished: list[bool] = []

        def it(match: Match):
            nonlocal has_not_finished
            if not match.has_finished():
                has_not_finished.append(True)

        self.foreach_match(it)
        self.update_matches_tree()

        if len(has_not_finished) == 0:
            self.status = self.Status.FINISHED
            self.champion = self.root_match.winner
            self.save()
            self.champion.send_message(
                ws.WSResponse(
                    ws.WSEvents.PLAYER_NOTIFY_TOURNAMENT_END,
                    {"tournament": self.toDict()},
                )
            )
            self.notify_players_update()
        else:
            raise ValueError(
                "All matches must be finished first before finishing the tournament"
            )

    def cancel(self):
        self.status = Tournament.Status.CANCELLED
        self.save()
        self.cancel_matches()
        self.notify_players_update()

    def onAccept(self, player: Player):
        if self.is_fully_accepted():
            self.begin()
        self.notify_players_update()

    def onReject(self, player: Player):
        self.cancel()

    def cancel_matches(self):
        def cancel_match(match: Match):
            match.cancel()

        self.foreach_match(cancel_match)

    def foreach_match(
        self, fn: Callable[[Match], None], start_root: Match | None = None
    ):
        if start_root is None:
            start_root = self.root_match

        def iterate_tree(match: Match):
            fn(match)

            if match.child_upper is not None:
                iterate_tree(match.child_upper)
            if match.child_lower is not None:
                iterate_tree(match.child_lower)

        iterate_tree(start_root)

    ##################################################
    # Resource
    ##################################################

    def toDict(self) -> dict:
        r = {}
        r["id"] = str(self.public_id)
        r["name"] = self.name
        r["status"] = self.status
        r["root_match"] = None if not self.root_match else self.root_match.toDict()
        r["champion"] = None if not self.champion else self.champion.toDict()
        r["players"] = [player.toDict() for player in self.players.all()]
        r["created_at"] = str(self.created_at)
        r["updated_at"] = str(self.updated_at)

        return r

    def __str__(self):
        return serializers.serialize(
            "json",
            [
                self,
            ],
        )
