from django import forms
from django.contrib.auth.password_validation import validate_password
from django.forms.fields import CharField

from pong.models.Player import Player


class PasswordField(CharField):
    default_validators = [validate_password]


class PlayerGetFilterForm(forms.Form):
    activity_status = forms.ChoiceField(choices=Player.ActivityStatus.choices)


class PlayerLoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField()


class PlayerRegistrationForm(forms.Form):
    name = forms.CharField(max_length=10)
    email = forms.EmailField()
    password = PasswordField()


class PlayerAvatarForm(forms.Form):
    avatar = forms.ImageField(required=True)


class PlayerUpdateForm(forms.Form):
    name = forms.CharField(max_length=10)


class PlayerAddFriendForm(forms.Form):
    email = forms.EmailField()
