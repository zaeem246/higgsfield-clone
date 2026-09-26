from django.urls import path

from apps.catalog.views import CatalogView

urlpatterns = [
    path("catalog/", CatalogView.as_view(), name="catalog"),
]
