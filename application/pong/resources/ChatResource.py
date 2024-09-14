from pong.models import Chat, Player


def ChatResource(chat: Chat, player: Player):
    r = {"is_blocked": player.is_chat_blocked(chat), "messages": []}

    if player.can_receive_messages_from(chat):
        r["messages"] = [message.toDict() for message in chat.messages.all()]

    return r | chat.toDict()
