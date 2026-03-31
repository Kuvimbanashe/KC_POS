from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business
from .models import StaffUser
from .serializers import StaffUserSerializer


class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = StaffUser.objects.all().order_by('-id')

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

    serializer_class = StaffUserSerializer


class RegisterBusinessOwnerView(APIView):
    def post(self, request):
        data = request.data
        required = ['business_name', 'name', 'email', 'password']
        missing = [key for key in required if not data.get(key)]
        if missing:
            return Response({'detail': f'Missing required fields: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

        business = Business.objects.create(
            name=data['business_name'],
            email=data.get('business_email', data['email']),
            phone=data.get('business_phone', ''),
            address=data.get('business_address', ''),
            tax_id=data.get('business_tax_id', ''),
            currency=data.get('business_currency', 'USD'),
            timezone=data.get('business_timezone', 'UTC'),
        )

        user = StaffUser.objects.create(
            business=business,
            name=data['name'],
            email=data['email'],
            password=data['password'],
            role=data.get('role', 'admin'),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            status='active',
            permissions=['all'],
        )

        return Response(
            {
                'token': 'mock-jwt-token',
                'user': StaffUserSerializer(user).data,
                'business': {
                    'id': business.id,
                    'name': business.name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = StaffUser.objects.filter(email=email, password=password).select_related('business').first()
        if not user:
            return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(
            {
                'token': 'mock-jwt-token',
                'user': StaffUserSerializer(user).data,
                'business': {
                    'id': user.business.id if user.business else None,
                    'name': user.business.name if user.business else None,
                },
            }
        )
