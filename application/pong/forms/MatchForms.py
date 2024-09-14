from django import forms

from pong.forms.Forms import ArrayUUIDsField
from pong.models.Match import Match


class MatchGetFilterForm(forms.Form):
    player_id = forms.UUIDField(required=True)


class MatchRegistrationForm(forms.Form):
    players_id = ArrayUUIDsField(min=1, max=4)
    type = forms.ChoiceField(choices=Match.Type.choices, required=False)
