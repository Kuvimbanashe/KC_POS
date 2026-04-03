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

    def __str__(self):
        return f'{self.name} ({self.role})'
