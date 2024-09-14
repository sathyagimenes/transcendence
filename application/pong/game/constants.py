from enum import Enum

class GamePlayerPlacement(Enum):
    LEFT = 1
    RIGHT = 2

class GameDirection(Enum):
    UP = "UP"
    DOWN = "DOWN"

PADDLE_SIZE = {"width": 1, "height": 7.5}
BALL_SIZE = {"width": 0.8, "height": 0.8}
PADDLE_VELOCITY = 1
INITIAL_BALL_VELOCITY = 1.5

CANVAS_WIDTH = 100
CANVAS_HEIGHT = 100