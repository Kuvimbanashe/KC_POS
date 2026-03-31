from rest_framework import viewsets

from .models import StaffUser
from .serializers import StaffUserSerializer


class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = StaffUser.objects.all().order_by('-id')
    serializer_class = StaffUserSerializer
