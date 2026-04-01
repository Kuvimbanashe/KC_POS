from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssetViewSet, ExpenseViewSet, ProductViewSet, PurchaseViewSet, SaleViewSet, StaffUserViewSet

router = DefaultRouter()
router.register(r'users', StaffUserViewSet)
router.register(r'products', ProductViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'assets', AssetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
