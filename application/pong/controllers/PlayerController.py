import json
import typing
from django.http import HttpRequest, HttpResponse
from django.utils.translation import gettext as _
from settings.http import http
from pong.models import Chat, Player
from django.core.exceptions import ValidationError
from django.contrib import auth

from pong.forms.PlayerForms import (
    PlayerAddFriendForm,
    PlayerAvatarForm,
    PlayerGetFilterForm,
    PlayerLoginForm,
    PlayerRegistrationForm,
    PlayerUpdateForm,
)


def login(request: HttpRequest) -> HttpResponse:
    form = PlayerLoginForm(json.loads(request.body))

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    player = auth.authenticate(
        request, email=form.data.get("email"), password=form.data.get("password")
    )
    if player is not None:
        auth.login(request, player)
        player = typing.cast(Player, player)
        player.set_activity_status(player.ActivityStatus.ONLINE)
        return http.OK(
            player.toDict()
            | {"blocked_chats": [chat.toDict() for chat in player.blocked_chats.all()]}
        )
    return http.Unauthorized({"error": {"_errors": _("Email ou senha inválidos")}})


def logout(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})
    player = typing.cast(Player, request.user)
    player.set_activity_status(player.ActivityStatus.OFFLINE)
    auth.logout(request)
    return http.NoContent()


def create(request: HttpRequest) -> HttpResponse:
    form = PlayerRegistrationForm(json.loads(request.body))

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    if Player.objects.filter(email=form.data.get("email")).exists():
        raise ValueError({"email": _("Email já existente!")})

    if Player.objects.filter(name=form.data.get("name")).exists():
        raise ValueError({"name": _("Nome de usuário já existente!")})

    user = Player.objects.create_user(
        name=form.data.get("name"),
        email=form.data.get("email"),
        password=form.data.get("password"),
    )
    user.save()

    return http.Created(user.toDict())


def setAvatar(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)

    form = PlayerAvatarForm(request.POST, request.FILES)

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    player.avatar = form.files.get("avatar")
    player.save()

    return http.OK(player.toDict())


def index(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    form = PlayerGetFilterForm(request.GET.dict())

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    players = Player.objects.filter(activity_status=form.data.get("activity_status"))
    players = [player.toDict() for player in players]

    return http.OK(players)


def get(request: HttpRequest, public_id: str) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = Player.objects.filter(public_id=public_id).first()

    if not player:
        return http.NotFound({"message": _("Jogador não encontrado")})

    return http.OK(
        player.toDict()
        | {"blocked_chats": [chat.toDict() for chat in player.blocked_chats.all()]}
    )


def update(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    form = PlayerUpdateForm(json.loads(request.body))

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    if Player.objects.filter(name=form.data.get("name")).exists():
        raise ValidationError({"name": _("Um jogador já possui esse nome")})

    player.name = form.data.get("name")
    player.save()

    return http.OK(player.toDict())


def addFriend(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    form = PlayerAddFriendForm(json.loads(request.body))
    email = form.data.get("email")

    if not form.is_valid():
        raise ValidationError(form.errors.as_data())

    if email == player.email:
        raise ValueError({"email": _("Você não pode adicionar a si mesmo como amigo")})

    if player.friends.filter(email=email).exists():
        raise ValueError({"email": _("Você já é amigo deste jogador")})

    friend = Player.objects.filter(email=email).first()

    if not friend:
        raise ValueError({"email": _("Jogador não encontrado")})
    player.friends.add(friend)
    player.save()

    chat = Chat(is_private=True)
    chat.save()
    chat.players.add(player)
    chat.players.add(friend)

    return http.OK(player.toDict())


def getFriends(request: HttpRequest) -> HttpResponse:
    if not request.user.is_authenticated:
        return http.Unauthorized({"message": _("Você não está autenticado")})

    player = typing.cast(Player, request.user)
    friends = player.friends.all()
    friends = [player.toDict() for player in friends]

    return http.OK(friends)
