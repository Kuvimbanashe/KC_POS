from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('products.urls')),
    path('api/', include('sales.urls')),
    path('api/', include('purchases.urls')),
    path('api/', include('expenses.urls')),
    path('api/', include('assets_mgmt.urls')),
]
