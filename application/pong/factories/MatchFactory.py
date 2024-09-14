from pong.models import *
from random import random


def MatchFactory(player_email, name=None):
    """
    ```python
    from pong.factories import *
    MatchFactory("fulano@example.com")
    ```
    """
    p = Player.objects.get(email=player_email)

    for i in range(1, 10):
        against = Player.objects.all().order_by("?").first()
        m = Match(name=name if name else "Pong Game aleatorio - " + str(i))
        m.save()
        m.players.add(p)
        m.players.add(against)
        m.finish(p if random() < 0.5 else against)
