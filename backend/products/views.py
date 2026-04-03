from django.db.models import Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.authentication import get_request_business_id
from users.permissions import IsAdminOrReadOnly
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        business_id = get_request_business_id(self.request)
        if not business_id:
            return self.queryset.none()
        return super().get_queryset().filter(business_id=business_id)

    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'sku', 'barcode']
    ordering_fields = ['name', 'price', 'stock', 'created_at']

    def perform_create(self, serializer):
        serializer.save(business=self.request.user.business)

    def perform_update(self, serializer):
        serializer.save(business=self.get_object().business)

    @action(detail=False, methods=['get'], url_path='lookup-by-barcode')
    def lookup_by_barcode(self, request):
        barcode = request.query_params.get('barcode', '').strip()
        if not barcode:
            return Response({'detail': 'barcode query param is required'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset().filter(Q(barcode=barcode) | Q(sku=barcode))
        product = queryset.first()
        if not product:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(product)
        return Response(serializer.data)
