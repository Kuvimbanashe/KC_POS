from rest_framework import viewsets

from .models import Business
from .serializers import BusinessSerializer


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all().order_by('-id')
    serializer_class = BusinessSerializer
