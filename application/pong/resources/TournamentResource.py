def TournamentResource(tournament, player):
    accepted = tournament.has_player_accepted(player)
    rejected = tournament.has_player_rejected(player)
    pending = (
        bool(not accepted and not rejected)
        and tournament.status == tournament.Status.AWAITING_CONFIRMATION
    )

    r = {
        "confirmation": {
            "accepted": accepted,
            "rejected": rejected,
            "pending": pending,
        },
        "await_next_match": player.has_pending_tournament_in_progress()
        and not player.has_pending_match_to_answer(),
    }

    return r | tournament.toDict()
