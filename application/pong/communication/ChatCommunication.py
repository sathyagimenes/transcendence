import typing
from channels.generic.websocket import JsonWebsocketConsumer
from channels.http import async_to_sync
from django.core.exceptions import ValidationError

from settings.http import ws
from pong.forms.ChatForms import ChatSendMessageForm
from pong.models import Chat, Message, Player
from django.utils.translation import gettext as _

from pong.resources.ChatResource import ChatResource


class ChatCommunicationConsumer(JsonWebsocketConsumer):
    chat: Chat

    def connect(self):
        player = self.scope["user"]
        if not player.is_authenticated:
            return
        player = typing.cast(Player, player)
        chat_channel_id = self.scope["url_route"]["kwargs"]["chat_id"]
        chat = Chat.objects.filter(public_id=chat_channel_id).first()

        if chat is None:
            return

        self.chat = chat
        self.accept()
        async_to_sync(self.channel_layer.group_add)(
            self.chat.channel_name(player),
            self.channel_name,
        )

    def disconnect(self, code):
        player = typing.cast(Player, self.scope["user"])
        if self.chat:
            async_to_sync(self.channel_layer.group_discard)(
                self.chat.channel_name(player),
                self.channel_name,
            )

    def send_event(self, event):
        self.send_json(event["event"])
