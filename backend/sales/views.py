from rest_framework import viewsets

from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').all().order_by('-id')
    serializer_class = SaleSerializer
