"""Generation shapes in and out. All validation for a create lives here."""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

from apps.catalog.constants import ASPECT_IDS, DURATIONS, RESOLUTION_IDS
from apps.catalog.models import Kind, Model, Preset, PresetFamily
from apps.studio.models import Generation
from apps.studio.services import GenerationSpec

# Request field -> preset family it must belong to.
PRESET_FIELDS: dict[str, str] = {
    "camera_id": PresetFamily.CAMERA,
    "effect_id": PresetFamily.EFFECT,
    "film_id": PresetFamily.FILM,
    "palette_id": PresetFamily.PALETTE,
    "light_id": PresetFamily.LIGHT,
}


class GenerationSerializer(serializers.Serializer):
    """Output only, and deliberately explicit: this shape is a published contract."""

    id = serializers.UUIDField(read_only=True)
    prompt = serializers.CharField(read_only=True)
    composed_prompt = serializers.CharField(read_only=True)
    kind = serializers.CharField(read_only=True)
    model_id = serializers.CharField(read_only=True)
    model_name = serializers.CharField(source="model.name", read_only=True)
    camera_id = serializers.CharField(read_only=True, allow_null=True)
    effect_id = serializers.CharField(read_only=True, allow_null=True)
    film_id = serializers.CharField(read_only=True, allow_null=True)
    palette_id = serializers.CharField(read_only=True, allow_null=True)
    light_id = serializers.CharField(read_only=True, allow_null=True)
    aspect = serializers.CharField(read_only=True)
    resolution = serializers.CharField(read_only=True)
    duration = serializers.IntegerField(read_only=True)
    sound = serializers.BooleanField(read_only=True)
    status = serializers.CharField(source="current_status", read_only=True)
    seed = serializers.CharField(read_only=True)
    media_url = serializers.URLField(read_only=True, allow_null=True)
    credits_spent = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    likes = serializers.IntegerField(source="like_count", read_only=True, default=0)
    liked_by_me = serializers.BooleanField(read_only=True, default=False)
    author = serializers.SerializerMethodField()

    def get_author(self, obj: Generation) -> dict[str, str] | None:
        """Only the feed attributes work to a person; your own list does not."""
        if not self.context.get("with_author"):
            return None
        return {"id": str(obj.user_id), "name": obj.user.name}


class GenerationCreateSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=1, max_length=2000, trim_whitespace=True)
    kind = serializers.ChoiceField(choices=Kind.values)
    model_id = serializers.CharField(max_length=64)
    camera_id = serializers.CharField(max_length=64, required=False, allow_null=True, default=None)
    effect_id = serializers.CharField(max_length=64, required=False, allow_null=True, default=None)
    film_id = serializers.CharField(max_length=64, required=False, allow_null=True, default=None)
    palette_id = serializers.CharField(max_length=64, required=False, allow_null=True, default=None)
    light_id = serializers.CharField(max_length=64, required=False, allow_null=True, default=None)
    aspect = serializers.ChoiceField(choices=ASPECT_IDS)
    resolution = serializers.ChoiceField(choices=RESOLUTION_IDS)
    duration = serializers.ChoiceField(choices=DURATIONS, required=False, default=5)
    sound = serializers.BooleanField(required=False, default=False)
    batch = serializers.IntegerField(min_value=1, max_value=4, required=False, default=1)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        model = Model.objects.filter(pk=attrs["model_id"]).first()
        if model is None:
            raise serializers.ValidationError({"model_id": "Unknown model."})
        if model.kind != attrs["kind"]:
            raise serializers.ValidationError(
                {"model_id": f"{model.id} is a {model.kind} model."}
            )

        presets: dict[str, Preset | None] = {}
        for field, family in PRESET_FIELDS.items():
            preset_id = attrs.get(field)
            if not preset_id:
                presets[family] = None
                continue
            preset = Preset.objects.filter(pk=preset_id, family=family).first()
            if preset is None:
                raise serializers.ValidationError({field: f"Unknown {family} preset."})
            presets[family] = preset

        attrs["model"] = model
        attrs["presets"] = presets
        if attrs["kind"] == Kind.IMAGE:
            # Motion-only settings are dropped rather than stored as noise.
            attrs["presets"][PresetFamily.CAMERA] = None
            attrs["duration"] = 0
            attrs["sound"] = False
        return attrs

    def to_spec(self) -> GenerationSpec:
        data = self.validated_data
        return GenerationSpec(
            prompt=data["prompt"],
            kind=data["kind"],
            model=data["model"],
            presets=data["presets"],
            aspect=data["aspect"],
            resolution=data["resolution"],
            duration=data["duration"],
            sound=data["sound"],
            batch=data["batch"],
        )


class FeedQuerySerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=Kind.values, required=False, allow_null=True)
    model = serializers.CharField(max_length=64, required=False, allow_null=True)
