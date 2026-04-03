from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    LoginView,
    RegisterBusinessOwnerView,
    RequestPasswordResetView,
    ResetPasswordView,
    StaffUserViewSet,
    VerifyPasswordResetOtpView,
)

router = DefaultRouter()
router.register(r'users', StaffUserViewSet)

urlpatterns = router.urls + [
    path('auth/register-business/', RegisterBusinessOwnerView.as_view(), name='register-business'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('auth/verify-reset-otp/', VerifyPasswordResetOtpView.as_view(), name='verify-reset-otp'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]
