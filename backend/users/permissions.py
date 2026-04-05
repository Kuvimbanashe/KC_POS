from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminStaffUser(BasePermission):
    message = 'Admin access is required for this action.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and getattr(user, 'is_authenticated', False) and getattr(user, 'role', None) == 'admin')


class IsAdminOrReadOnly(BasePermission):
    message = 'Admin access is required for this action.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, 'role', None) == 'admin'


class CanReadCreateSales(BasePermission):
    message = 'Only admins can modify or delete sales records.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        if request.method in SAFE_METHODS or request.method == 'POST':
            return True
        return getattr(user, 'role', None) == 'admin'
