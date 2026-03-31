from django.urls import path

from .views import DashboardReportView, ExpensesReportView, InventoryReportView, ProfitLossReportView, SalesReportView

urlpatterns = [
    path('reports/dashboard/', DashboardReportView.as_view(), name='reports-dashboard'),
    path('reports/sales/', SalesReportView.as_view(), name='reports-sales'),
    path('reports/inventory/', InventoryReportView.as_view(), name='reports-inventory'),
    path('reports/expenses/', ExpensesReportView.as_view(), name='reports-expenses'),
    path('reports/profit-loss/', ProfitLossReportView.as_view(), name='reports-profit-loss'),
]
