from __future__ import annotations
import os, uuid
from asgiref.sync import async_to_sync
from channels.consumer import get_channel_layer
from django.contrib.auth.base_user import BaseUserManager
from django.core import serializers
from django.utils.translation import gettext as _
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.apps import apps

from settings.http import ws
from pong.models.mixins.TimestampMixin import TimestampMixin


# Gerenciador personalizado para o modelo de usuário
class CustomUserManager(BaseUserManager):
    """
    Gerenciador de modelo de usuário personalizado onde o email é o identificador único
    para autenticação em vez de nomes de usuário.
    """

    def create_user(self, name, email, password, **extra_fields):
        """
        Cria e salva um usuário com o email e senha fornecidos.
        """
        if not email:
            raise ValueError(_("O Email deve ser definido"))
        name = name
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Cria e salva um SuperUsuário com o email e senha fornecidos.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superusuário deve ter is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superusuário deve ter is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


# Função para definir o caminho de upload do avatar do jogador
def playerAvatarPath(player, filename: str):
    """
    Gera um caminho único para o avatar do jogador baseado em seu public_id.
    """
    _, extension = os.path.splitext(filename)
    return f"player/avatar/{player.public_id}{extension}"


# Modelo principal do Jogador
class Player(AbstractBaseUser, PermissionsMixin, TimestampMixin):
    """
    Modelo de jogador customizado que estende o modelo de usuário base do Django.
    Inclui campos adicionais para gerenciar jogadores no contexto do jogo Pong.
    """

    # Define os possíveis status de atividade do jogador
    class ActivityStatus(models.TextChoices):
        ONLINE = "ONLINE", _("Online")
        OFFLINE = "OFFLINE", _("Offline")

    # Campos do modelo
    id = models.AutoField(primary_key=True)
    public_id = models.UUIDField(
        unique=True, db_index=True, default=uuid.uuid4, editable=False
    )
    email = models.EmailField(_("endereço de email"), unique=True)
    name = models.CharField(max_length=150, unique=True)
    avatar = models.ImageField(
        upload_to=playerAvatarPath,
        default="/default/player/avatar/default.jpg",
        blank=True,
    )
    activity_status = models.CharField(
        max_length=20, choices=ActivityStatus.choices, default=ActivityStatus.OFFLINE
    )
    friends = models.ManyToManyField("self", blank=True)
    blocked_chats = models.ManyToManyField("Chat")

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "password"]

    ##################################################
    # Queries
    ##################################################

    def query_exclude_self(self):
        """
        Retorna todos os jogadores exceto o próprio.
        """
        return Player.objects.exclude(id=self.id)

    def query_by_not_friends(self):
        """
        Retorna todos os jogadores que não são amigos deste jogador.
        """
        return self.query_exclude_self().exclude(id__in=self.friends.all())

    ##################################################
    # Computed
    ##################################################

    def total_play_time(self):
        matches = (
            apps.get_model("pong.Match")
            .query_by_finished()
            .filter(players__in=[self])
            .all()
        )
        total_time = 0
        for match in matches:
            total_time += match.game_duration()
        return total_time

    def total_score(self):
        matches = (
            apps.get_model("pong.Match")
            .query_by_finished()
            .filter(players__in=[self])
            .all()
        )
        scores = 0
        for match in matches:
            if match.scores:
                scores += match.scores[str(self.public_id)]
        return scores

    def is_chat_blocked(self, chat):
        """
        Verifica se um chat específico está bloqueado para este jogador.
        """
        return self.blocked_chats.filter(id=chat.id).exists()

    def can_receive_messages_from(self, chat):
        """
        Verifica se o jogador pode receber mensagens de um chat específico.
        """
        return not self.is_chat_blocked(chat)

    def can_send_messages_to(self, chat):
        """
        Verifica se o jogador pode enviar mensagens para um chat específico.
        """
        return not self.is_chat_blocked(chat)

    def has_pending_match_to_answer(self):
        """
        Verifica se o jogador tem partidas pendentes para responder.
        """
        return (
            apps.get_model("pong.Match")
            .query_by_awaiting_matches_with_pending_confirmation_by([self])
            .exists()
        )

    def has_pending_match_to_play(self):
        """
        Verifica se o jogador tem partidas em andamento.
        """
        return (
            apps.get_model("pong.Match")
            .query_by_in_progress_match_from([self])
            .exists()
        )

    def has_pending_match_to_await(self):
        """
        Verifica se o jogador tem partidas aguardando para começar.
        """
        return (
            apps.get_model("pong.Match")
            .query_by_awaiting_match_accepted_by([self])
            .exists()
        )

    def has_pending_tournament_to_answer(self):
        """
        Verifica se o jogador tem torneios pendentes para responder.
        """
        return (
            apps.get_model("pong.Tournament")
            .query_by_awaiting_tournament_with_pending_confirmation_by([self])
            .exists()
        )

    def has_pending_tournament_to_await(self):
        """
        Verifica se o jogador tem torneios aguardando para começar.
        """
        return (
            apps.get_model("pong.Tournament")
            .query_by_awaiting_tournament_accepted_by([self])
            .exists()
        )

    def has_pending_tournament_in_progress(self):
        return (
            apps.get_model("pong.Tournament")
            .query_by_in_progress_tournament_from([self])
            .exists()
        )

    ##################################################
    # Notification
    ##################################################

    def broadcast_friends(self, ws_response: dict):
        """
        Envia uma mensagem para todos os amigos do jogador.
        """
        friends = self.friends.all()

        for player in friends:
            player.send_message(ws_response)

    def send_message(self, ws_response):
        """
        Envia uma mensagem para o próprio jogador.
        """
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(str(self.public_id), ws_response)

    ##################################################
    # Logic
    ##################################################

    def set_activity_status(self, activity_status: ActivityStatus):
        """
        Atualiza o status de atividade do jogador e notifica os amigos.
        """
        self.activity_status = activity_status
        self.save()
        self.broadcast_friends(
            ws.WSResponse(ws.WSEvents.FRIEND_ACTIVITY_STATUS, self.toDict())
        )

    ##################################################
    # Resource
    ##################################################

    def toDict(self) -> dict:
        """
        Converte o objeto Player em um dicionário para serialização.
        """
        return {
            "id": str(self.public_id),
            "name": self.name,
            "email": self.email,
            "avatar": None if not self.avatar else self.avatar.url,
            "activity_status": self.activity_status,
            "stats": {
                "total_play_time": self.total_play_time(),
                "total_score": self.total_score(),
            },
            "pendencies": {
                "match_to_accept": self.has_pending_match_to_answer(),
                "match_to_await": self.has_pending_match_to_await(),
                "match_to_play": self.has_pending_match_to_play(),
                "tournament_to_accept": self.has_pending_tournament_to_answer(),
                "tournament_to_await": self.has_pending_tournament_to_await(),
                "tournament_in_progress": self.has_pending_tournament_in_progress(),
            },
        }

    def __str__(self):
        """
        Retorna uma representação em string do objeto Player.
        """
        return serializers.serialize(
            "json",
            [
                self,
            ],
        )
