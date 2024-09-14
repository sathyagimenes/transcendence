from .constants import PADDLE_SIZE, PADDLE_VELOCITY, CANVAS_HEIGHT
from .position import Position

class Paddle:
    def __init__(self, initial_position: Position):
        self.position = initial_position
        self.size = PADDLE_SIZE

    def move(self, direction: int):
        new_y = self.position.y + direction * PADDLE_VELOCITY
        self.position.y = max(0, min(CANVAS_HEIGHT - self.size["height"], new_y))

    def toDict(self):
        return {
            "size": self.size,
            "position": self.position.toDict()
        }