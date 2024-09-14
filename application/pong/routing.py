from django.urls import path, re_path

from pong.communication.ChatCommunication import ChatCommunicationConsumer
from pong.communication.PlayerCommunication import PlayerCommunicationConsumer
from pong.communication.MatchCommunication import MatchCommunicationConsumer


websocket_urlpatterns = [
    re_path(r"ws/player/", PlayerCommunicationConsumer.as_asgi()),
    path(r"ws/chat/<slug:chat_id>", ChatCommunicationConsumer.as_asgi()),
    path(
        r"ws/match/<slug:match_id>", MatchCommunicationConsumer.as_asgi()
    ),
]
