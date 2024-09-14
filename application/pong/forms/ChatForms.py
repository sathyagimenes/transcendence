from django import forms

from pong.forms.Forms import ArrayUUIDsField


class ChatCreationForm(forms.Form):
    name = forms.CharField(required=False)
    players_id = ArrayUUIDsField()


class ChatSendMessageForm(forms.Form):
    sender_id = forms.UUIDField()
    text = forms.CharField(max_length=1000)
