from __future__ import annotations

from django.contrib import admin

from apps.studio.models import Generation, Like


@admin.register(Generation)
class GenerationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "kind", "model", "status", "credits_spent", "created_at")
    list_filter = ("kind", "status", "resolution", "aspect")
    search_fields = ("id", "prompt", "user__email")
    readonly_fields = ("id", "created_at", "composed_prompt", "seed", "credits_spent")
    autocomplete_fields = ("user", "model", "camera", "effect", "film", "palette", "light")
    date_hierarchy = "created_at"


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "generation", "created_at")
    search_fields = ("user__email", "generation__id")
    autocomplete_fields = ("user", "generation")
