from .constants import CANVAS_WIDTH, CANVAS_HEIGHT

class Position:
    def __init__(self, x: float, y: float):
        self.x = max(0, min(CANVAS_WIDTH, x))
        self.y = max(0, min(CANVAS_HEIGHT, y))

    def toDict(self) -> dict:
        return {"x": self.x, "y": self.y}