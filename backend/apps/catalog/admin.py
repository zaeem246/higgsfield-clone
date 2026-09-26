from __future__ import annotations

from django.contrib import admin

from apps.catalog.models import Model, Preset


@admin.register(Model)
class ModelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "kind", "cost", "badge", "position")
    list_filter = ("kind", "badge")
    search_fields = ("id", "name", "tagline")
    ordering = ("position",)


@admin.register(Preset)
class PresetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "family", "grouping", "position")
    list_filter = ("family", "grouping")
    search_fields = ("id", "name", "fragment")
    ordering = ("family", "position")
