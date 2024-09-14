from __future__ import annotations
import uuid
from asgiref.sync import async_to_sync
from channels.consumer import get_channel_layer
from django.apps import apps
from django.utils.translation import gettext as _
from django.core import serializers
from django.db import models
from datetime import datetime

from settings.http import ws
from pong.models.Player import Player
from pong.models.mixins.PlayersAcceptRejectMixin import PlayersAcceptRejectMixin
from pong.models.mixins.TimestampMixin import TimestampMixin
from pong.resources.MatchResource import MatchResource


# A classe Match representa uma partida do jogo Pong.
# Ela herda de PlayersAcceptRejectMixin, que provavelmente fornece métodos para os jogadores aceitarem ou rejeitarem a partida.
# Também herda de TimestampMixin, que adiciona campos de data de criação e atualização automaticamente.
class Match(PlayersAcceptRejectMixin, TimestampMixin):
    class Status(models.TextChoices):
        CREATED = "CREATED", _("Criado")  # Estado inicial quando a partida é criada
        AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION", _(
            "Aguardando Confirmação"
        )  # Esperando jogadores confirmarem participação
        IN_PROGRESS = "IN_PROGRESS", _("Em Progresso")  # Partida em andamento
        FINISHED = "FINISHED", _("Finalizado")  # Partida concluída
        CANCELLED = "CANCELLED", _("Cancelado")  # Partida cancelada

    class Type(models.TextChoices):
        MULTIPLAYER_ONLINE = "MULTIPLAYER_ONLINE", _("Multijogador Online")
        MULTIPLAYER_LOCAL = "MULTIPLAYER_LOCAL", _("Multijogador Local")

    id = models.AutoField(primary_key=True)  # Chave primária autoincremental
    public_id = models.UUIDField(
        unique=True, db_index=True, default=uuid.uuid4, editable=False
    )  # ID público único para referência externa segura
    name = models.CharField(max_length=200)  # Nome da partida
    winner = models.ForeignKey(
        Player,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="winner",
    )  # Referência ao jogador vencedor, pode ser nulo
    status = models.CharField(
        max_length=100, choices=Status.choices, default=Status.CREATED
    )
    type = models.CharField(
        max_length=100, choices=Status.choices, default=Type.MULTIPLAYER_ONLINE
    )
    child_upper = models.ForeignKey(
        "self",
        default=None,
        null=True,
        on_delete=models.CASCADE,
        related_name="parent_upper",
    )  # Referência à partida "filha" superior (para torneios)
    child_lower = models.ForeignKey(
        "self",
        default=None,
        null=True,
        on_delete=models.CASCADE,
        related_name="parent_lower",
    )  # Referência à partida "filha" inferior (para torneios)
    max = models.IntegerField(default=2)  # Número máximo de jogadores permitidos
    scores = models.JSONField("scores", null=True)
    started_at = models.DateTimeField(null=True)
    finished_at = models.DateTimeField(null=True)

    ##################################################
    # Queries
    ##################################################

    # Métodos estáticos para realizar consultas comuns no banco de dados
    # Estes métodos facilitam a busca de partidas com base em diferentes critérios

    @staticmethod
    def query_by_finished():
        # Retorna todas as partidas que estão aguardando confirmação
        return Match.objects.filter(status=Match.Status.FINISHED)

    @staticmethod
    def query_by_player(players):
        # Retorna todas as partidas que incluem os jogadores especificados (exceto partidas canceladas)
        return Match.objects.filter(players__in=players).exclude(status=Match.Status.CANCELLED)

    @staticmethod
    def query_by_awaiting():
        # Retorna todas as partidas que estão aguardando confirmação
        return Match.objects.filter(status=Match.Status.AWAITING_CONFIRMATION)

    @staticmethod
    def query_by_active_match_from(players):
        # Retorna partidas ativas (aguardando confirmação ou em progresso) para os jogadores especificados
        return Match.objects.filter(players__in=players).filter(
            models.Q(status=Match.Status.AWAITING_CONFIRMATION)
            | models.Q(status=Match.Status.IN_PROGRESS)
        )

    @staticmethod
    def query_by_in_progress_match_from(players):
        # Retorna partidas em andamento para os jogadores especificados
        return Match.objects.filter(players__in=players).filter(
            status=Match.Status.IN_PROGRESS
        )

    @staticmethod
    def query_by_awaiting_match_accepted_by(players):
        # Retorna partidas aguardando confirmação que foram aceitas pelos jogadores especificados
        return (
            Match.objects.filter(players__in=players)
            .filter(status=Match.Status.AWAITING_CONFIRMATION)
            .filter(accepted_players__in=players)
        )

    @staticmethod
    def query_by_awaiting_matches_with_pending_confirmation_by(players):
        # Retorna partidas aguardando confirmação que ainda não foram aceitas ou rejeitadas pelos jogadores especificados
        return (
            Match.objects.filter(players__in=players)
            .filter(status=Match.Status.AWAITING_CONFIRMATION)
            .exclude(accepted_players__in=players)
            .exclude(rejected_players__in=players)
        )

    ##################################################
    # Computed
    ##################################################

    # Métodos que calculam propriedades baseadas no estado atual da partida
    # Estes métodos ajudam a determinar o estado do jogo e as ações possíveis

    def game_duration(self):

        if self.finished_at is None or self.started_at is None:
            return 0
        return (self.finished_at - self.started_at).seconds

    def get_player_score(self, player: Player):
        return self.scores[player.public_id]

    def is_full(self):
        # Verifica se a partida atingiu o número máximo de jogadores
        return bool(self.players.count() >= self.max)

    def is_multiplayer_local(self):
        return bool(self.type == self.Type.MULTIPLAYER_LOCAL)

    def is_multiplayer_online(self):
        return bool(self.type == self.Type.MULTIPLAYER_ONLINE)

    def has_players_in_another_match(self):
        # Verifica se algum jogador desta partida está em outra partida ativa
        return (
            Match.query_by_active_match_from(self.players.all())
            .exclude(public_id=self.public_id)
            .exists()
        )

    def has_finished(self):
        # Verifica se a partida foi concluída (tem um vencedor e status finalizado)
        if self.winner is not None and self.status == self.Status.FINISHED:
            return True
        return False

    def is_cancelled(self):
        # Verifica se a partida foi cancelada
        return bool(self.status == self.Status.CANCELLED)

    def can_receive_new_players(self):
        # Verifica se a partida pode receber novos jogadores
        return bool(not self.is_full() and not self.has_finished())

    def can_accept_or_reject(self):
        # Verifica se os jogadores podem aceitar ou rejeitar a partida
        return bool(
            self.status == Match.Status.CREATED
            and not self.has_players_in_another_match()
            and self.is_full()
            and not self.is_fully_accepted()
            and not self.has_finished()
        )

    def can_begin(self):
        # Verifica se a partida pode começar
        return bool(
            self.is_full() and self.is_fully_accepted() and not self.has_finished()
        )

    def get_root(self) -> Match | None:
        # Encontra a partida raiz em uma estrutura de torneio
        child = self
        parent = child.get_parent()

        if parent is None:
            return child

        while parent is not None:
            child = parent
            parent = child.get_parent()
            if parent is None:
                return child

        return child

    def get_parent(self) -> Match | None:
        # Encontra a partida pai (se existir)
        p = self.parent_upper.first()
        if p is None:
            p = self.parent_lower.first()
        return p

    ##################################################
    # Notification
    ##################################################

    # Métodos para notificar os jogadores sobre atualizações na partida
    # Utilizam websockets para comunicação em tempo real

    def broadcast_match(self, ws_response: dict):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(str(self.public_id), ws_response)

    def notify_players_update(self):
        # Notifica todos os jogadores sobre uma atualização na partida
        players = self.players.all()

        for player in players:
            player.send_message(
                ws.WSResponse(
                    ws.WSEvents.PLAYER_NOTIFY_MATCH_UPDATE,
                    {"match": MatchResource(self, player)},
                )
            )

    ##################################################
    # Logic
    ##################################################

    # Métodos que implementam a lógica principal da partida
    # Controlam o fluxo do jogo, desde o início até o fim

    def begin(self):
        # Inicia a partida, mudando seu status conforme apropriado
        if self.can_accept_or_reject():
            self.status = Match.Status.AWAITING_CONFIRMATION
            self.save()
            self.notify_players_update()

        if self.can_begin():
            self.status = Match.Status.IN_PROGRESS
            self.save()

    def cancel(self):
        # Cancela a partida e notifica os jogadores
        self.status = self.Status.CANCELLED
        self.save()
        self.notify_players_update()
        self.broadcast_match(
            ws.WSResponse(ws.WSEvents.MATCH_END, {"match": self.toDict()})
        )

    def finish(self, winner: Player):
        if self.status == self.Status.FINISHED:
            return  # Evita finalizar a partida mais de uma vez

        self.winner = winner
        self.status = self.Status.FINISHED
        self.save()

    def onAccept(self, player: Player):
        # Lida com a aceitação de um jogador, possivelmente iniciando a partida
        if self.is_fully_accepted():
            self.begin()
        self.notify_players_update()

    def onReject(self, player: Player):
        # Lida com a rejeição de um jogador, cancelando a partida e possivelmente o torneio
        self.cancel()
        tournament = (
            apps.get_model("pong.Tournament").query_by_match(self.get_root()).first()
        )
        if tournament:
            tournament.cancel()

    ##################################################
    # Resource
    ##################################################

    # Métodos para serialização e representação da partida

    def toDict(self) -> dict:
        # Converte a partida em um dicionário para fácil serialização
        r = {}

        r["id"] = str(self.public_id)
        r["name"] = self.name
        r["status"] = self.status
        r["type"] = self.type
        r["players"] = [player.toDict() for player in self.players.all()]
        r["child_upper"] = None if not self.child_upper else self.child_upper.toDict()
        r["child_lower"] = None if not self.child_lower else self.child_lower.toDict()
        r["winner"] = None if not self.winner else self.winner.toDict()
        r["has_finished"] = self.has_finished()
        r["created_at"] = str(self.created_at)
        r["updated_at"] = str(self.updated_at)

        return r

    def __str__(self):
        # Representação em string da partida, útil para debugging
        return serializers.serialize(
            "json",
            [
                self,
            ],
        )
