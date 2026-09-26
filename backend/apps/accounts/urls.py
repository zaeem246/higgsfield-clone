from django.urls import path

from apps.accounts.views import LoginView, LogoutView, MeView, PlanView, RegisterView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("account/plan/", PlanView.as_view(), name="account-plan"),
]
