from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet)

urlpatterns = router.urls
