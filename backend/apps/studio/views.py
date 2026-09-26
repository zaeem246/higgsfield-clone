"""Studio endpoints. Thin: validate, delegate to services/selectors, serialise."""

from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.studio import selectors, services
from apps.studio.serializers import (
    FeedQuerySerializer,
    GenerationCreateSerializer,
    GenerationSerializer,
)
from core.pagination import paginate, read_limit
from core.permissions import HasGatewayKeyAndSession


class GenerationListCreateView(APIView):
    permission_classes = [HasGatewayKeyAndSession]

    def get(self, request: Request) -> Response:
        page = paginate(
            selectors.own_generations(viewer=request.user),
            limit=read_limit(request.query_params.get("limit")),
            cursor=request.query_params.get("cursor"),
        )
        return Response(
            {
                "items": GenerationSerializer(page.items, many=True).data,
                "next_cursor": page.next_cursor,
            }
        )

    def post(self, request: Request) -> Response:
        serializer = GenerationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = services.create_generations(user=request.user, spec=serializer.to_spec())

        # Re-read through the selector so the batch carries the same annotations
        # as every other response.
        items = selectors.own_generations(viewer=request.user).filter(
            pk__in=[row.pk for row in created]
        )
        return Response(
            {"items": GenerationSerializer(items, many=True).data},
            status=status.HTTP_201_CREATED,
        )


class GenerationDetailView(APIView):
    permission_classes = [HasGatewayKeyAndSession]

    def get(self, request: Request, generation_id: str) -> Response:
        generation = selectors.own_generation(viewer=request.user, generation_id=generation_id)
        if generation is None:
            raise NotFound("Generation not found.")
        return Response({"generation": GenerationSerializer(generation).data})

    def delete(self, request: Request, generation_id: str) -> Response:
        refunded = services.delete_generation(user=request.user, generation_id=generation_id)
        return Response({"ok": True, "refunded": refunded})


class FeedView(APIView):
    """Browsable without an account; `liked_by_me` is simply false then."""

    def get(self, request: Request) -> Response:
        query = FeedQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        page = paginate(
            selectors.feed_generations(
                viewer=request.user,
                kind=query.validated_data.get("kind"),
                model_id=query.validated_data.get("model"),
            ),
            limit=read_limit(request.query_params.get("limit")),
            cursor=request.query_params.get("cursor"),
        )
        return Response(
            {
                "items": GenerationSerializer(
                    page.items, many=True, context={"with_author": True}
                ).data,
                "next_cursor": page.next_cursor,
            }
        )


class FeedLikeView(APIView):
    permission_classes = [HasGatewayKeyAndSession]

    def post(self, request: Request, generation_id: str) -> Response:
        return self._set(request, generation_id, liked=True)

    def delete(self, request: Request, generation_id: str) -> Response:
        return self._set(request, generation_id, liked=False)

    def _set(self, request: Request, generation_id: str, *, liked: bool) -> Response:
        generation = selectors.feed_generation(
            viewer=request.user, generation_id=generation_id
        )
        if generation is None:
            raise NotFound("Generation not found.")
        liked, likes = services.set_like(
            user=request.user, generation=generation, liked=liked
        )
        return Response({"liked": liked, "likes": likes})
