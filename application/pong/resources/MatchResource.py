def MatchResource(match, player):
    accepted = match.has_player_accepted(player)
    rejected = match.has_player_rejected(player)
    pending = (
        bool(not accepted and not rejected) and match.status == match.Status.AWAITING_CONFIRMATION
    )

    r = {
        "confirmation": {
            "accepted": accepted,
            "rejected": rejected,
            "pending": pending,
        }
    }

    return r | match.toDict()
