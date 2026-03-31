from django.db.models import Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'sku', 'barcode']
    ordering_fields = ['name', 'price', 'stock', 'created_at']

    @action(detail=False, methods=['get'], url_path='lookup-by-barcode')
    def lookup_by_barcode(self, request):
        barcode = request.query_params.get('barcode', '').strip()
        if not barcode:
            return Response({'detail': 'barcode query param is required'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(Q(barcode=barcode) | Q(sku=barcode)).first()
        if not product:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(product)
        return Response(serializer.data)
