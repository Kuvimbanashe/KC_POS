from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LoginView, RegisterBusinessOwnerView, StaffUserViewSet

router = DefaultRouter()
router.register(r'users', StaffUserViewSet)

urlpatterns = router.urls + [
    path('auth/register-business/', RegisterBusinessOwnerView.as_view(), name='register-business'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
]
