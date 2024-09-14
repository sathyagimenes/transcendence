from django.db.models.fields.files import ImageFieldFile
from .constants import GamePlayerPlacement
from .position import Position


class GamePlayer:
    def __init__(
        self,
        placement: GamePlayerPlacement,
        position: Position,
        name: str,
        id: str,
        is_local_player: bool,
        avatar: ImageFieldFile,
    ):
        self.placement = placement
        self.position = position
        self.id = id
        self.name = name
        self.is_local_player = is_local_player
        self.avatar = avatar

    def toDict(self, scores: dict) -> dict:
        paddle_size = {}
        if self.placement in [GamePlayerPlacement.LEFT, GamePlayerPlacement.RIGHT]:
            paddle_size = {"width": 1, "height": 20}

        return {
            "placement": self.placement.value,
            "position": self.position.toDict(),
            "paddle": {"size": paddle_size},
            "name": self.name,
            "id": str(self.id),
            "score": scores[self.id],
            "is_local_player": self.is_local_player,
            "avatar": self.avatar.url,
        }
