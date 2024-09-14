import typing
from uuid import UUID
from channels.generic.websocket import json
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.http import HttpRequest, HttpResponse
from settings.http import http, ws
from pong.forms.ChatForms import ChatCreationForm, ChatSendMessageForm
from pong.models import Chat, Player
from pong.models.Message import Message
from pong.resources.ChatResource import ChatResource

def index(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)
    chats = Chat.objects.filter(players__in=[player]).all()
    chats = [ChatResource(chat, player) for chat in chats]

    return http.OK(chats)


def get(request: HttpRequest, public_id: str) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)

    chat = Chat.objects.get(public_id=public_id)
    if chat is None:
        print('[ERROR] Conversa não encontrada')
        return http.NotFound({"message": _("Conversa não encontrada")})

    return http.OK(ChatResource(chat, player))


def create(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    form = ChatCreationForm(json.loads(request.body))

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    player = typing.cast(Player, request.user)
    name: str | None = form.data.get("name")
    players_id: list[UUID] = form.data.get("players_id")
    players = Player.objects.filter(public_id__in=players_id).all()

    if not players:
        print('[INFO] Joagador não encontrado')
        return http.NotFound({"message": _("Jogadores não encontrados")})

    chat = Chat(name=name)
    chat.save()
    chat.players.add(player)
    chat.players.add(*players)

    return http.Created(ChatResource(chat, player))


def message(request: HttpRequest, public_id: str) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)
    chat = Chat.objects.filter(public_id=public_id).first()

    if chat is None:
        print('[ERROR] Conversa não encontrada')
        return http.NotFound({"message": _("Conversa não encontrada")})

    form = ChatSendMessageForm(json.loads(request.body))

    if not form.is_valid():
        print('[ERROR] Form invalido')
        raise ValidationError(form.errors.as_data())

    chat.message(player, form.data.get("text"))
    return http.Created(ChatResource(chat, player))


def block(request: HttpRequest, public_id: str) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)
    chat = player.blocked_chats.filter(public_id=public_id).first()

    if chat is not None:
        raise ValueError({"public_id": _("Esta conversa já foi bloqueada")})

    chat = Chat.objects.filter(public_id=public_id).first()

    if not chat:
        print('[ERROR] Conversa não encontrada')
        return http.NotFound({"message": _("Conversa não encontrada")})

    player.blocked_chats.add(chat)

    return http.OK(ChatResource(chat, player))


def unblock(request: HttpRequest, public_id: str) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)

    chat = player.blocked_chats.filter(public_id=public_id).first()

    if chat is None:
        print('[ERROR] Conversa não encontrada')
        return http.NotFound({"message": _("Conversa não encontrada")})

    player.blocked_chats.remove(chat)

    return http.OK(ChatResource(chat, player))
