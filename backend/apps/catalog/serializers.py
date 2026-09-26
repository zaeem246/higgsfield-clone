"""Read-only catalogue shapes. Field names are the contract's, snake_case."""

from __future__ import annotations

from rest_framework import serializers

from apps.catalog.models import Model, Preset


class ModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Model
        fields = ("id", "name", "kind", "tagline", "cost", "badge", "strengths")


class PresetSerializer(serializers.ModelSerializer):
    # Stored as `grouping` to avoid colliding with auth's Group; the contract
    # calls the field `group`, so that is what goes over the wire.
    group = serializers.CharField(source="grouping")

    class Meta:
        model = Preset
        fields = ("id", "family", "name", "group", "fragment")
