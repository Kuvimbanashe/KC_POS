from rest_framework import viewsets

from users.authentication import get_request_business_id
from users.permissions import CanReadCreateSales
from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').all().order_by('-id')
    permission_classes = [CanReadCreateSales]

    def get_queryset(self):
        business_id = get_request_business_id(self.request)
        if not business_id:
            return self.queryset.none()
        return super().get_queryset().filter(business_id=business_id)

    serializer_class = SaleSerializer

    def perform_create(self, serializer):
        serializer.save(business=self.request.user.business)

    def perform_update(self, serializer):
        serializer.save(business=self.get_object().business)
