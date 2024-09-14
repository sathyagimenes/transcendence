from django.db import models
from pong.models.Player import Player


class PlayersAcceptRejectMixin(models.Model):
    players = models.ManyToManyField(Player, blank=True)
    accepted_players = models.ManyToManyField(
        Player, blank=True, related_name="%(class)s_accepted_players"
    )
    rejected_players = models.ManyToManyField(
        Player, blank=True, related_name="%(class)s_rejected_players"
    )

    ##################################################
    # Queries
    ##################################################

    ##################################################
    # Computed
    ##################################################

    def is_fully_accepted(self):
        players_n = self.players.count()
        return bool(players_n > 0 and self.accepted_players.count() == players_n)

    def has_player_accepted(self, player: Player):
        return self.accepted_players.filter(id=player.id).exists()

    def has_player_rejected(self, player: Player):
        return self.rejected_players.filter(id=player.id).exists()

    ##################################################
    # Notification
    ##################################################

    ##################################################
    # Logic
    ##################################################

    def accept(self, player: Player):
        self.accepted_players.add(player)
        self.onAccept(player)

    def reject(self, player: Player):
        self.rejected_players.add(player)
        self.onReject(player)

    def onAccept(self, player: Player):
        pass

    def onReject(self, player: Player):
        pass

    ##################################################
    # Resource
    ##################################################

    class Meta:
        abstract = True
