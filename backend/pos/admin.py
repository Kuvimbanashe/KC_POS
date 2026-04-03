from django.contrib import admin

from .models import Asset, Expense, Product, Purchase, Sale, SaleItem, StaffUser


admin.site.register(StaffUser)
admin.site.register(Product)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Purchase)
admin.site.register(Expense)
admin.site.register(Asset)
