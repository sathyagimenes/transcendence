from settings.http.methods import GET, POST, PUT
from pong.controllers import (
    ChatController,
    PlayerController,
    MatchController,
    TournamentController,
)

urlpatterns = [
    GET("player", PlayerController.index),
    POST("player/create", PlayerController.create),
    PUT("player/update", PlayerController.update),
    POST("player/avatar", PlayerController.setAvatar),
    POST("player/login", PlayerController.login),
    POST("player/logout", PlayerController.logout),
    GET("player/friends", PlayerController.getFriends),
    POST("player/friends/add", PlayerController.addFriend),
    GET("player/<slug:public_id>", PlayerController.get),
    #
    GET("chat", ChatController.index),
    POST("chat/create", ChatController.create),
    POST("chat/<slug:public_id>/message", ChatController.message),
    GET("chat/block/<slug:public_id>", ChatController.block),
    GET("chat/unblock/<slug:public_id>", ChatController.unblock),
    GET("chat/<slug:public_id>", ChatController.get),
    #
    GET("match", MatchController.index),
    GET("match/matchmaking", MatchController.matchmaking),
    POST("match/create", MatchController.create),
    GET("match/get", MatchController.get),
    GET("match/accept", MatchController.accept),
    GET("match/reject", MatchController.reject),
    #
    GET("tournament", TournamentController.index),
    POST("tournament/create", TournamentController.create),
    GET("tournament/get", TournamentController.get),
    GET("tournament/accept", TournamentController.accept),
    GET("tournament/reject", TournamentController.reject),
]
