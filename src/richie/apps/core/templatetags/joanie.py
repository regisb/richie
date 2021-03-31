"""Custom template tags related to Joanie."""
from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag()
def is_joanie_enabled():
    """
    Determines if Joanie is enabled

    Within settings, JOANIE can be enable/disable by setting the value of
    `JOANIE.ENABLED` to True/False
    """
    if settings.JOANIE is None:
        return False

    return settings.JOANIE.get("ENABLED") is True
