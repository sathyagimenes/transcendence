import collections.abc
import uuid
from django.core.exceptions import ValidationError
from django.forms import forms

from django.utils.translation import gettext as _


class ArrayUUIDsField(forms.Field):

    def __init__(
        self,
        *args,
        min=1,
        exact: None | int = None,
        max: None | int = None,
        is_even=False,
        **kwargs
    ):
        self.min = min
        self.max = max
        self.exact = exact
        self.is_even = is_even

        super().__init__(*args, **kwargs)

    def clean(self, value):
        ids = super().clean(value)

        if not isinstance(ids, collections.abc.Sequence):
            raise ValidationError(_("Este campo deve ser uma lista"), code="array")

        if self.exact and len(ids) != self.exact:
            raise ValidationError(
                _("Esta lista deve ser igual à " + str(self.exact)), code="exact"
            )
        else:
            if self.min and len(ids) < self.min:
                raise ValidationError(
                    _("Esta lista deve ser maior ou igual à " + str(self.min)),
                    code="min",
                )
            if self.max and len(ids) > self.max:
                raise ValidationError(
                    _("Esta lista deve ser menor ou igual à " + str(self.max)),
                    code="max",
                )

        if self.is_even and (len(ids) % 2 != 0):
            raise ValidationError(_("Esta lista deve ser par"), code="is_even")

        for id in ids:
            try:
                uuid.UUID(id, version=4)
            except ValueError:
                raise ValidationError(
                    _("Os dados da lista devem ser UUIDs"), code="uuid"
                )
        return ids
