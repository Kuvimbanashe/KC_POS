from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business
from .authentication import StaffUserTokenAuthentication, issue_auth_token, set_password, verify_password
from .models import PasswordResetCode, StaffUser
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

    def perform_create(self, serializer):
        password = serializer.validated_data.pop('password', None)
        user = serializer.save()
        if password:
            set_password(user, password)

    def perform_update(self, serializer):
        password = serializer.validated_data.pop('password', None)
        user = serializer.save()
        if password:
            set_password(user, password)


class RegisterBusinessOwnerView(APIView):
    def post(self, request):
        data = request.data
        required = ['business_name', 'name', 'email', 'password']
        missing = [key for key in required if not data.get(key)]
        if missing:
            return Response({'detail': f'Missing required fields: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

        if StaffUser.objects.filter(email=data['email']).exists():
            return Response({'detail': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
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
                password='',
                role=data.get('role', 'admin'),
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                status='active',
                permissions=['all'],
            )
            set_password(user, data['password'])

        token = issue_auth_token(user)

        return Response(
            {
                'token': token.key,
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

        user = StaffUser.objects.filter(email=email).select_related('business').first()
        if not user or not verify_password(user, password or ''):
            return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at', 'updated_at'])
        token = issue_auth_token(user)

        return Response(
            {
                'token': token.key,
                'user': StaffUserSerializer(user).data,
                'business': {
                    'id': user.business.id if user.business else None,
                    'name': user.business.name if user.business else None,
                },
            }
        )


class RequestPasswordResetView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = StaffUser.objects.filter(email=email).first()
        if not user:
            return Response({'detail': 'No account found for that email address'}, status=status.HTTP_404_NOT_FOUND)

        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
        code = get_random_string(6, allowed_chars='0123456789')
        expires_at = timezone.now() + timedelta(minutes=10)
        PasswordResetCode.objects.create(user=user, code=code, expires_at=expires_at)

        return Response(
            {
                'detail': 'Password reset code generated successfully',
                'email': user.email,
                'otp_code': code,
                'expires_at': expires_at.isoformat(),
            }
        )


class VerifyPasswordResetOtpView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip()
        if not email or not code:
            return Response({'detail': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code = (
            PasswordResetCode.objects.select_related('user')
            .filter(user__email=email, code=code, used_at__isnull=True)
            .order_by('-created_at')
            .first()
        )
        if not reset_code:
            return Response({'detail': 'Invalid reset code'}, status=status.HTTP_400_BAD_REQUEST)
        if reset_code.is_expired:
            return Response({'detail': 'Reset code has expired'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Reset code verified successfully'})


class ResetPasswordView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip()
        new_password = request.data.get('new_password') or ''

        if not email or not code or not new_password:
            return Response(
                {'detail': 'Email, code, and new password are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 6:
            return Response(
                {'detail': 'Password must be at least 6 characters long'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_code = (
            PasswordResetCode.objects.select_related('user')
            .filter(user__email=email, code=code, used_at__isnull=True)
            .order_by('-created_at')
            .first()
        )
        if not reset_code:
            return Response({'detail': 'Invalid reset code'}, status=status.HTTP_400_BAD_REQUEST)
        if reset_code.is_expired:
            return Response({'detail': 'Reset code has expired'}, status=status.HTTP_400_BAD_REQUEST)

        set_password(reset_code.user, new_password)
        reset_code.used_at = timezone.now()
        reset_code.save(update_fields=['used_at'])

        return Response({'detail': 'Password reset successfully'})


class ChangePasswordView(APIView):
    authentication_classes = [StaffUserTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''

        if not current_password or not new_password:
            return Response(
                {'detail': 'Current password and new password are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 6:
            return Response(
                {'detail': 'Password must be at least 6 characters long'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not verify_password(request.user, current_password):
            return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        set_password(request.user, new_password)
        return Response({'detail': 'Password changed successfully'})
