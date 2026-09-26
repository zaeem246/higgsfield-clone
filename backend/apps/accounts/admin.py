from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import Session, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("-created_at",)
    list_display = ("email", "name", "plan", "credits", "is_staff", "created_at")
    list_filter = ("plan", "is_staff", "is_active")
    search_fields = ("email", "name")
    readonly_fields = ("id", "created_at", "last_login")
    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Profile", {"fields": ("name", "plan", "credits")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups",
                                    "user_permissions")}),
        ("Dates", {"fields": ("last_login", "created_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2"),
        }),
    )


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("token", "user", "created_at", "expires_at")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
