from django.urls import path

from apps.studio.views import (
    FeedLikeView,
    FeedView,
    GenerationDetailView,
    GenerationListCreateView,
)

urlpatterns = [
    path("generations/", GenerationListCreateView.as_view(), name="generation-list"),
    path(
        "generations/<uuid:generation_id>/",
        GenerationDetailView.as_view(),
        name="generation-detail",
    ),
    path("feed/", FeedView.as_view(), name="feed"),
    path("feed/<uuid:generation_id>/like/", FeedLikeView.as_view(), name="feed-like"),
]
