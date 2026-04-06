from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_home(_request):
    return JsonResponse(
        {
            'status': 'ok',
            'service': 'KC POS Backend',
            'health': '/healthz/',
            'api_base': '/api/',
        }
    )


def healthz(_request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', api_home),
    path('admin/', admin.site.urls),
    path('healthz/', healthz),
    path('api/', include('businesses.urls')),
    path('api/', include('users.urls')),
    path('api/', include('products.urls')),
    path('api/', include('sales.urls')),
    path('api/', include('purchases.urls')),
    path('api/', include('expenses.urls')),
    path('api/', include('assets_mgmt.urls')),
    path('api/', include('reports.urls')),
]
