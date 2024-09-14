from pong.models import *
from random import random


def TournamentFactory(name=None, max=4, accepted=True, cancelled=True):
    """
    ```python
    from pong.factories import *
    t = TournamentFactory()
    ```
    """
    players = Player.objects.all().order_by("?")[:max]

    t = Tournament(
        name=name if name else "Torneio Random - " + "%.0f" % (random() * 100)
    )
    t.save()
    t.generate_matches_tree_for(len(players))
    t.initialize_matches_tree(list(players))

    if accepted:
        for player in players:
            t.accept(player)

    if cancelled:
        t.cancel()
    return t
