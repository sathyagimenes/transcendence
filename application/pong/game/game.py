import time
import math
import threading
import random
from datetime import datetime
from typing import Callable
import uuid
from .constants import GamePlayerPlacement, GameDirection, CANVAS_WIDTH, CANVAS_HEIGHT
from settings.http import ws
from .position import Position
from .player import GamePlayer
from .ball import Ball
from .paddle import Paddle
from ..models import Match, Player


class Game:
    ball_size = {"width": 0.8, "height": 0.8}
    ball_speed = 1.3
    vertical_paddle_size = {"width": 1, "height": 20}
    max_score = 5

    def __init__(self, match: Match, on_game_end: Callable):
        self.cache = (
            {  # cache from database to avoid hitting it during the game
                "match": match.toDict(),
            }
        )
        self.match = match
        self.on_game_end = on_game_end
        self.reset()

    def reset(self):
        self.players: dict[str, GamePlayer] = {}
        self.paddle_sizes = {}
        self.ball = Ball()
        self.game_running = False
        self.winner = None
        self.last_paddle_hit = None
        self.scores = {}
        self.start_time = None

        self.paddle_velocity = 1.5
        placements = [
            GamePlayerPlacement.LEFT,
            GamePlayerPlacement.RIGHT,
        ]

        players = [
            {
                "id": str(p.public_id),
                "name": p.name,
                "is_local_player": False,
                "avatar": p.avatar,
            }
            for p in self.match.players.all()
        ]
        if self.match.is_multiplayer_local():
            players.append(
                {
                    "id": str(uuid.uuid4()),
                    "name": players[0]["name"] + " 2",
                    "is_local_player": True,
                    "avatar": players[0]["avatar"],
                }
            )
        for i, player in enumerate(players):
            placement = placements[i]
            paddle_size = self.get_paddle_size(placement)
            position = self.get_initial_position(placement, paddle_size)
            self.players[player["id"]] = GamePlayer(
                placement,
                position,
                player["name"],
                player["id"],
                player["is_local_player"],
                player["avatar"],
            )
            self.paddle_sizes[player["id"]] = paddle_size
            self.scores[player["id"]] = 0
        self.reset_ball()

    def reset_ball(self):
        self.ball.position = Position(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        angle = random.uniform(-math.pi / 4, math.pi / 4)
        self.ball.velocity = Position(
            self.ball_speed * math.cos(angle), self.ball_speed * math.sin(angle)
        )
        if random.choice([True, False]):
            self.ball.velocity.x *= -1
        self.last_paddle_hit = None

    def start_game(self):
        if not self.game_running:
            self.game_running = True
            self.match.started_at = datetime.now()
            self.match.save()
            game_thread = threading.Thread(target=self.game_loop)
            game_thread.start()

    def game_loop(self):
        while self.game_running:
            self.update_game_state()
            self.broadcast_game_state()
            if self.check_game_end():
                self.end_game(max(self.scores, key=self.scores.get))
                break
            time.sleep(0.016)

    def update_game_state(self):
        self.move_ball()
        self.check_collisions()

    def move_ball(self):
        new_x = self.ball.position.x + self.ball.velocity.x
        new_y = self.ball.position.y + self.ball.velocity.y
        num_players = len(self.players)

        if num_players == 2:
            # Verifica se a bola saiu pelos lados (ponto)
            if new_x <= 0 or new_x >= CANVAS_WIDTH:
                self.handle_score()
                self.reset_ball()  # Reseta a bola imediatamente após marcar ponto
                return

            # Verifica colisão com as paredes superior e inferior
            if new_y <= 0 or new_y >= CANVAS_HEIGHT:
                self.ball.velocity.y *= -1
                new_y = max(0, min(new_y, CANVAS_HEIGHT - self.ball_size["height"]))

        elif num_players == 4:
            if (
                new_x <= 0
                or new_x >= CANVAS_WIDTH
                or new_y <= 0
                or new_y >= CANVAS_HEIGHT
            ):
                self.handle_score()
                self.reset_ball()  # Reseta a bola imediatamente após marcar ponto
                return

        self.ball.position = Position(new_x, new_y)

    def check_collisions(self):
        for player_id, player in self.players.items():
            if self.check_paddle_collision(player_id, player):
                self.last_paddle_hit = player_id
                return True
        return False

    def check_paddle_collision(self, player_id: str, player: GamePlayer):
        paddle = Paddle(player.position)
        paddle_size = self.paddle_sizes[player_id]
        ball_next_x = self.ball.position.x + self.ball.velocity.x
        ball_next_y = self.ball.position.y + self.ball.velocity.y
        ball_right = ball_next_x + self.ball_size["width"]
        ball_left = ball_next_x
        ball_top = ball_next_y
        ball_bottom = ball_next_y + self.ball_size["height"]
        paddle_right = paddle.position.x + paddle_size["width"]
        paddle_left = paddle.position.x
        paddle_top = paddle.position.y
        paddle_bottom = paddle.position.y + paddle_size["height"]

        if (ball_right >= paddle_left and ball_left <= paddle_right) and (
            ball_bottom >= paddle_top and ball_top <= paddle_bottom
        ):
            if player.placement in [
                GamePlayerPlacement.LEFT,
                GamePlayerPlacement.RIGHT,
            ]:
                relative_intersect_y = (
                    paddle.position.y + paddle_size["height"] / 2
                ) - ball_next_y
                normalized_relative_intersect = relative_intersect_y / (
                    paddle_size["height"] / 2
                )
                bounce_angle = normalized_relative_intersect * (5 * math.pi / 12)
                direction = -1 if self.ball.velocity.x > 0 else 1
                self.ball.velocity.x = (
                    direction * self.ball_speed * math.cos(bounce_angle)
                )
                self.ball.velocity.y = self.ball_speed * -math.sin(bounce_angle)

            return True
        return False

    def handle_score(self):
        new_x = self.ball.position.x + self.ball.velocity.x
        new_y = self.ball.position.y + self.ball.velocity.y
        scorer_id = None
        num_players = len(self.players)

        if num_players == 2:
            if new_x <= 0:
                scorer_id = next(
                    player_id
                    for player_id, player in self.players.items()
                    if player.placement == GamePlayerPlacement.RIGHT
                )
            elif new_x >= CANVAS_WIDTH:
                scorer_id = next(
                    player_id
                    for player_id, player in self.players.items()
                    if player.placement == GamePlayerPlacement.LEFT
                )

        if scorer_id:
            self.scores[scorer_id] += 1
            if self.check_game_end():
                self.end_game(scorer_id)

    def check_game_end(self):
        if self.winner is not None:
            return False
        for player_id, score in self.scores.items():
            if score >= self.max_score:
                return True
        return False

    def end_game(self, game_winner_id):
        self.game_running = False
        game_player = self.players.get(game_winner_id)
        if game_player and game_player.is_local_player:
            # if is some local player we just set that the host himself won the match
            self.winner = self.match.players.first()
        else:
            self.winner = self.match.players.get(public_id=game_winner_id)

        self.match.finished_at = datetime.now()
        self.match.scores = self.scores
        self.match.save()

        self.match.finish(self.winner)

        self.cache["match"] = self.match.toDict()
        self.match.broadcast_match(ws.WSResponse(ws.WSEvents.MATCH_END, self.toDict()))
        self.on_game_end()

    def handleKeyPress(self, game_player_id: str, direction: GameDirection):
        game_player = self.players.get(game_player_id)
        if game_player:
            paddle_size = self.paddle_sizes[game_player_id]
            if game_player.placement in [
                GamePlayerPlacement.LEFT,
                GamePlayerPlacement.RIGHT,
            ]:
                if direction == GameDirection.UP:
                    new_y = game_player.position.y - self.paddle_velocity
                    game_player.position.y = max(new_y, 0)
                elif direction == GameDirection.DOWN:
                    new_y = game_player.position.y + self.paddle_velocity
                    game_player.position.y = min(
                        new_y, CANVAS_HEIGHT - paddle_size["height"]
                    )

    def get_paddle_size(self, placement):
        if placement in [GamePlayerPlacement.LEFT, GamePlayerPlacement.RIGHT]:
            return self.vertical_paddle_size

    # Função de define posição dos paddles
    def get_initial_position(self, placement, paddle_size):
        if placement == GamePlayerPlacement.LEFT:
            return Position(0, CANVAS_HEIGHT / 2 - paddle_size["height"] / 2)
        elif placement == GamePlayerPlacement.RIGHT:
            return Position(
                CANVAS_WIDTH - paddle_size["width"],
                CANVAS_HEIGHT / 2 - paddle_size["height"] / 2,
            )

    def broadcast_game_state(self):
        self.match.broadcast_match(
            ws.WSResponse(ws.WSEvents.MATCH_UPDATE, self.toDict()),
        )

    def toDict(self) -> dict:
        return {
            "match": self.cache["match"],
            "game": {
                "players": [
                    player.toDict(self.scores) for player in self.players.values()
                ],
                "ball": self.ball.toDict(),
                "paddle": {"size": self.vertical_paddle_size},
                "is_running": self.game_running,
                "last_paddle_hit": self.last_paddle_hit,
                "winner": None if self.winner is None else self.winner.toDict(),
            },
        }
