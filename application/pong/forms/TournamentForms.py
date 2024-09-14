from django import forms
from django.utils.translation import gettext as _

from pong.forms.Forms import ArrayUUIDsField


class TournamentGetFilterForm(forms.Form):
    player_id = forms.UUIDField(required=True)


class TournamentRegistrationForm(forms.Form):
    name = forms.CharField(max_length=100)
    players_id = ArrayUUIDsField(exact=4)
