from __future__ import annotations
import uuid
from channels.consumer import get_channel_layer
from channels.generic.websocket import async_to_sync
from django.utils.translation import gettext as _
from django.core import serializers
from django.db import models

from settings.http import ws
from pong.models.Message import Message
from pong.models.Player import Player
from pong.models.mixins.TimestampMixin import TimestampMixin


class Chat(TimestampMixin):
    id = models.AutoField(primary_key=True)
    public_id = models.UUIDField(
        unique=True, db_index=True, default=uuid.uuid4, editable=False
    )
    name = models.CharField(max_length=100, null=True)
    players = models.ManyToManyField(Player)
    messages = models.ManyToManyField(Message)
    is_private = models.BooleanField()

    ##################################################
    # Queries
    ##################################################

    ##################################################
    # Computed
    ##################################################

    ##################################################
    # Notification
    ##################################################

    def channel_name(self, participant: Player):
        return str(self.public_id) + "__" + str(participant.public_id)

    def broadcast(self, ws_response):
        channel_layer = get_channel_layer()
        participants = self.players.all()

        for participant in participants:
            if not participant.can_receive_messages_from(self):
                continue

            async_to_sync(channel_layer.group_send)(
                self.channel_name(participant), ws_response
            )

    ##################################################
    # Logic
    ##################################################

    def message(self, sender: Player, text: str):
        is_sender_in_chat = self.players.filter(public_id=sender.public_id).exists()
        if not sender.can_send_messages_to(self) or not is_sender_in_chat:
            return
        message = Message.objects.create(sender=sender, text=text)
        self.messages.add(message)
        self.broadcast(ws.WSResponse(ws.WSEvents.CHAT_MESSAGE, message.toDict()))

    ##################################################
    # Resource
    ##################################################

    def toDict(self) -> dict:
        r = {}
        r["id"] = str(self.public_id)
        r["players"] = [player.toDict() for player in self.players.all()]
        r["is_private"] = self.is_private
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
