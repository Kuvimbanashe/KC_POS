from datetime import timedelta

from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business
from .authentication import get_request_business_id, invalidate_auth_token, issue_auth_token, set_password, verify_password
from .models import PasswordResetCode, StaffUser
from .serializers import StaffUserSerializer


class StaffUserViewSet(viewsets.ModelViewSet):
    queryset = StaffUser.objects.select_related('business').all().order_by('-id')
    serializer_class = StaffUserSerializer

    def get_queryset(self):
        business_id = get_request_business_id(self.request)
        if not business_id:
            return self.queryset.none()

        queryset = self.queryset.filter(business_id=business_id)
        if self.request.user.role != 'admin':
            queryset = queryset.filter(id=self.request.user.id)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only admins can create users')
        if not self.request.user.business:
            raise PermissionDenied('Business context is missing for this user')
        serializer.save(business=self.request.user.business, status='active')

    def perform_update(self, serializer):
        target_user = self.get_object()
        requester = self.request.user

        if requester.role != 'admin' and target_user.id != requester.id:
            raise PermissionDenied('You can only update your own profile')

        if requester.role != 'admin':
            serializer.save(
                business=target_user.business,
                role=target_user.role,
                status=target_user.status,
                permissions=target_user.permissions,
            )
            return

        serializer.save(business=target_user.business or requester.business)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            raise PermissionDenied('Only admins can delete users')

        target_user = self.get_object()
        if target_user.id == request.user.id:
            return Response({'detail': 'You cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)

        return super().destroy(request, *args, **kwargs)


def get_active_reset_code(email, code):
    now = timezone.now()
    return (
        PasswordResetCode.objects.select_related('user')
        .filter(user__email__iexact=email, code=code, used_at__isnull=True, expires_at__gte=now)
        .order_by('-created_at')
        .first()
    )


class RegisterBusinessOwnerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        required = ['business_name', 'name', 'email', 'password']
        missing = [key for key in required if not data.get(key)]
        if missing:
            return Response({'detail': f'Missing required fields: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

        email = data['email'].strip().lower()
        if StaffUser.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'An account with that email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        business = Business.objects.create(
            name=data['business_name'],
            email=(data.get('business_email') or email).strip().lower(),
            phone=data.get('business_phone', ''),
            address=data.get('business_address', ''),
            tax_id=data.get('business_tax_id', ''),
            currency=data.get('business_currency', 'USD'),
            timezone=data.get('business_timezone', 'UTC'),
        )

        user = StaffUser.objects.create(
            business=business,
            name=data['name'],
            email=email,
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
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or ''

        user = StaffUser.objects.filter(email__iexact=email).select_related('business').first()
        if not user or not verify_password(user, password):
            return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({'detail': 'User account is inactive'}, status=status.HTTP_403_FORBIDDEN)

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
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = StaffUser.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'detail': 'No account found for that email address'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        PasswordResetCode.objects.filter(user=user, used_at__isnull=True, expires_at__gte=now).update(used_at=now)

        code = get_random_string(6, allowed_chars='0123456789')
        reset_code = PasswordResetCode.objects.create(
            user=user,
            code=code,
            expires_at=now + timedelta(minutes=10),
        )

        return Response(
            {
                'detail': 'Password reset code generated successfully',
                'email': user.email,
                'otp_code': code,
                'expires_at': reset_code.expires_at,
            }
        )


class VerifyPasswordResetOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip()
        if not email or not code:
            return Response({'detail': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code = get_active_reset_code(email, code)
        if not reset_code:
            return Response({'detail': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Verification successful'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip()
        new_password = request.data.get('new_password') or ''

        if not email or not code or not new_password:
            return Response({'detail': 'Email, code and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code = get_active_reset_code(email, code)
        if not reset_code:
            return Response({'detail': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)

        set_password(reset_code.user, new_password)
        invalidate_auth_token(reset_code.user)
        reset_code.used_at = timezone.now()
        reset_code.save(update_fields=['used_at'])

        return Response({'detail': 'Password updated successfully'})


class ChangePasswordView(APIView):
    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''

        if not current_password or not new_password:
            return Response({'detail': 'Current password and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_password(request.user, current_password):
            return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        set_password(request.user, new_password)
        return Response({'detail': 'Password updated successfully'})
