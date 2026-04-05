from secrets import compare_digest

from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import AuthToken, StaffUser

TOKEN_LENGTH = 48


def hash_password(raw_password: str) -> str:
    return make_password(raw_password)


def password_is_hashed(value: str) -> bool:
    if not value:
        return False
    try:
        identify_hasher(value)
        return True
    except ValueError:
        return False


def verify_password(user: StaffUser, raw_password: str) -> bool:
    stored_password = user.password or ''
    if password_is_hashed(stored_password):
        return check_password(raw_password, stored_password)

    if compare_digest(stored_password, raw_password):
        user.password = hash_password(raw_password)
        user.save(update_fields=['password', 'updated_at'])
        return True

    return False


def set_password(user: StaffUser, raw_password: str, *, save: bool = True) -> None:
    user.password = hash_password(raw_password)
    if save:
        user.save(update_fields=['password', 'updated_at'])


def issue_auth_token(user: StaffUser) -> AuthToken:
    token, created = AuthToken.objects.get_or_create(
        user=user,
        defaults={'key': get_random_string(TOKEN_LENGTH)},
    )
    if not created:
        token.key = get_random_string(TOKEN_LENGTH)
        token.save(update_fields=['key', 'last_used_at'])
    return token


def invalidate_auth_token(user: StaffUser) -> None:
    AuthToken.objects.filter(user=user).delete()


def get_request_business_id(request) -> int | None:
    user = getattr(request, 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    return getattr(user, 'business_id', None)


class StaffUserTokenAuthentication(BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        authorization = get_authorization_header(request).split()
        if not authorization:
            return None

        if authorization[0].lower() != self.keyword.lower().encode():
            return None

        if len(authorization) != 2:
            raise AuthenticationFailed('Invalid authorization header')

        token_key = authorization[1].decode('utf-8')
        token = AuthToken.objects.select_related('user', 'user__business').filter(key=token_key).first()
        if not token:
            raise AuthenticationFailed('Invalid authentication token')

        user = token.user
        if not user.is_active:
            raise AuthenticationFailed('User account is inactive')

        AuthToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())
        return user, token

    def authenticate_header(self, request):
        return self.keyword
