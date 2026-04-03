from django.db import models


class StaffUser(models.Model):
    ROLE_CHOICES = (('admin', 'Admin'), ('cashier', 'Cashier'))
    STATUS_CHOICES = (('active', 'Active'), ('inactive', 'Inactive'))

    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    join_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    permissions = models.JSONField(default=list, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return self.status == 'active'

    def __str__(self):
        return f'{self.name} ({self.role})'


class PasswordResetCode(models.Model):
    user = models.ForeignKey(StaffUser, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} - {self.code}'


class AuthToken(models.Model):
    user = models.OneToOneField(StaffUser, on_delete=models.CASCADE, related_name='auth_token')
    key = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Token for {self.user.email}'
