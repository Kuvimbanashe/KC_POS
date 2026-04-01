from rest_framework import viewsets

from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').all().order_by('-id')

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

    serializer_class = SaleSerializer
