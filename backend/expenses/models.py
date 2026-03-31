from django.db import models


class Expense(models.Model):
    PAYMENT_CHOICES = (
        ('Bank Transfer', 'Bank Transfer'),
        ('Cash', 'Cash'),
        ('Check', 'Check'),
        ('Online Payment', 'Online Payment'),
    )
    STATUS_CHOICES = (('Paid', 'Paid'), ('Pending', 'Pending'))

    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    payment_method = models.CharField(max_length=32, choices=PAYMENT_CHOICES)
    vendor = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Paid')
    receipt_number = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
