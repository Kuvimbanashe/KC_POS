from rest_framework.routers import DefaultRouter

from .views import StaffUserViewSet

router = DefaultRouter()
router.register(r'users', StaffUserViewSet)

urlpatterns = router.urls
