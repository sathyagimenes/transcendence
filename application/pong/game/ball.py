from .position import Position
from .constants import BALL_SIZE, INITIAL_BALL_VELOCITY, CANVAS_WIDTH, CANVAS_HEIGHT

class Ball:
    def __init__(self):
        self.position = Position(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        self.velocity = Position(INITIAL_BALL_VELOCITY, INITIAL_BALL_VELOCITY)
        self.size = BALL_SIZE

    def update_position(self):
        new_x = self.position.x + self.velocity.x
        new_y = self.position.y + self.velocity.y

        if new_x <= 0 or new_x >= CANVAS_WIDTH:
            self.velocity.x *= -1
        if new_y <= 0 or new_y >= CANVAS_HEIGHT:
            self.velocity.y *= -1

        self.position.x = max(0, min(CANVAS_WIDTH, new_x))
        self.position.y = max(0, min(CANVAS_HEIGHT, new_y))

    def reset(self):
        self.position = Position(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        self.velocity = Position(INITIAL_BALL_VELOCITY, INITIAL_BALL_VELOCITY)

    def toDict(self):
        return {
            "size": self.size,
            "position": self.position.toDict()
        }