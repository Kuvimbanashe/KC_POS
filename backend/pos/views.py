from django.db.models import Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Asset, Expense, Product, Purchase, Sale, StaffUser
from .serializers import (
    AssetSerializer,
    ExpenseSerializer,
    ProductSerializer,
    PurchaseSerializer,
    SaleSerializer,
    StaffUserSerializer,
)


class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = StaffUser.objects.all().order_by('-id')
    serializer_class = StaffUserSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
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


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').all().order_by('-id')
    serializer_class = SaleSerializer


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().order_by('-id')
    serializer_class = PurchaseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-id')
    serializer_class = ExpenseSerializer


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by('-id')
    serializer_class = AssetSerializer
