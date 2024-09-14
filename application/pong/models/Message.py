from __future__ import annotations
import uuid
from django.utils.translation import gettext as _
from django.core import serializers
from django.db import models

from pong.models.Player import Player
from pong.models.mixins.TimestampMixin import TimestampMixin


class Message(TimestampMixin):
    id = models.AutoField(primary_key=True)
    public_id = models.UUIDField(
        unique=True, db_index=True, default=uuid.uuid4, editable=False
    )
    sender = models.ForeignKey(Player, on_delete=models.DO_NOTHING)
    text = models.CharField(max_length=1000)

    ##################################################
    # Queries
    ##################################################

    ##################################################
    # Computed
    ##################################################

    ##################################################
    # Notification
    ##################################################

    ##################################################
    # Logic
    ##################################################

    ##################################################
    # Resource
    ##################################################

    def toDict(self) -> dict:
        r = {}
        r["id"] = str(self.public_id)
        r["sender"] = self.sender.toDict()
        r["text"] = str(self.text)
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
