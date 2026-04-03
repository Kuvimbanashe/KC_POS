from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from rest_framework.response import Response
from rest_framework.views import APIView

from expenses.models import Expense
from products.models import Product
from purchases.models import Purchase
from sales.models import Sale
from users.authentication import get_request_business_id
from users.permissions import IsAdminStaffUser


def apply_business_scope(queryset, business_id):
    if business_id:
        return queryset.filter(business_id=business_id)
    return queryset.none()


class DashboardReportView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        business_id = get_request_business_id(request)
        sales_qs = apply_business_scope(Sale.objects.all(), business_id)
        expenses_qs = apply_business_scope(Expense.objects.all(), business_id)
        products_qs = apply_business_scope(Product.objects.all(), business_id)

        total_sales = sales_qs.aggregate(total=Sum('total'))['total'] or 0
        total_expenses = expenses_qs.aggregate(total=Sum('amount'))['total'] or 0
        inventory_value = products_qs.aggregate(total=Sum(F('stock') * F('cost')))['total'] or 0
        low_stock_count = products_qs.filter(stock__lte=F('min_stock_level')).count()

        return Response(
            {
                'totals': {
                    'sales': total_sales,
                    'expenses': total_expenses,
                    'inventory_value': inventory_value,
                    'net': total_sales - total_expenses,
                },
                'alerts': {
                    'low_stock_products': low_stock_count,
                },
            }
        )


class SalesReportView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        business_id = get_request_business_id(request)
        queryset = apply_business_scope(Sale.objects.all(), business_id)

        if start:
            queryset = queryset.filter(date__date__gte=start)
        if end:
            queryset = queryset.filter(date__date__lte=end)

        totals = queryset.aggregate(total_sales=Sum('total'))
        daily = (
            queryset.annotate(day=TruncDate('date'))
            .values('day')
            .annotate(total=Sum('total'))
            .order_by('day')
        )

        return Response(
            {
                'filters': {'start': start, 'end': end},
                'summary': {'total_sales': totals['total_sales'] or 0, 'count': queryset.count()},
                'daily': list(daily),
            }
        )


class InventoryReportView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        business_id = get_request_business_id(request)
        products_qs = apply_business_scope(Product.objects.all(), business_id)
        products = products_qs.values('id', 'name', 'sku', 'barcode', 'stock', 'min_stock_level', 'cost', 'price')
        low_stock = products_qs.filter(stock__lte=F('min_stock_level')).values('id', 'name', 'stock', 'min_stock_level')
        inventory_value = products_qs.aggregate(total=Sum(F('stock') * F('cost')))['total'] or 0

        return Response(
            {
                'summary': {'inventory_value': inventory_value, 'products_count': products_qs.count()},
                'low_stock': list(low_stock),
                'products': list(products),
            }
        )


class ExpensesReportView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        business_id = get_request_business_id(request)
        queryset = apply_business_scope(Expense.objects.all(), business_id)

        if start:
            queryset = queryset.filter(date__date__gte=start)
        if end:
            queryset = queryset.filter(date__date__lte=end)

        by_category = queryset.values('category').annotate(total=Sum('amount')).order_by('-total')
        total = queryset.aggregate(total=Sum('amount'))['total'] or 0

        return Response({'summary': {'total_expenses': total, 'count': queryset.count()}, 'by_category': list(by_category)})


class ProfitLossReportView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')

        business_id = get_request_business_id(request)
        sales_qs = apply_business_scope(Sale.objects.all(), business_id)
        expenses_qs = apply_business_scope(Expense.objects.all(), business_id)
        purchases_qs = apply_business_scope(Purchase.objects.all(), business_id)

        if start:
            sales_qs = sales_qs.filter(date__date__gte=start)
            expenses_qs = expenses_qs.filter(date__date__gte=start)
            purchases_qs = purchases_qs.filter(date__date__gte=start)
        if end:
            sales_qs = sales_qs.filter(date__date__lte=end)
            expenses_qs = expenses_qs.filter(date__date__lte=end)
            purchases_qs = purchases_qs.filter(date__date__lte=end)

        revenue = sales_qs.aggregate(total=Sum('total'))['total'] or 0
        operating_expenses = expenses_qs.aggregate(total=Sum('amount'))['total'] or 0
        cogs = purchases_qs.aggregate(total=Sum('total'))['total'] or 0
        gross_profit = revenue - cogs
        net_profit = gross_profit - operating_expenses

        return Response(
            {
                'filters': {'start': start, 'end': end},
                'income_statement': {
                    'revenue': revenue,
                    'cogs': cogs,
                    'gross_profit': gross_profit,
                    'operating_expenses': operating_expenses,
                    'net_profit': net_profit,
                },
            }
        )
