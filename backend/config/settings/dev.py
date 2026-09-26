"""Local development: debug on, hosts wide open, everything else from base."""

from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
