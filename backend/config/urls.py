"""Every route this tier serves. The gateway is the only intended caller."""

from django.contrib import admin
from django.urls import include, path

from core.views import HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/", include("apps.studio.urls")),
    path("api/v1/health/", HealthView.as_view(), name="health"),
]
