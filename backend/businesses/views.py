from rest_framework.exceptions import PermissionDenied
from rest_framework import viewsets

from users.authentication import get_request_business_id
from users.permissions import IsAdminOrReadOnly
from .models import Business
from .serializers import BusinessSerializer


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all().order_by('-id')
    serializer_class = BusinessSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        business_id = get_request_business_id(self.request)
        if not business_id:
            return self.queryset.none()
        return self.queryset.filter(id=business_id)

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only admins can create businesses')
        serializer.save()
