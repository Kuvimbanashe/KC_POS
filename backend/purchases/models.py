from django.db import models


class Purchase(models.Model):
    STATUS_CHOICES = (('Completed', 'Completed'), ('Pending', 'Pending'))

    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='purchases', null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    supplier = models.CharField(max_length=255)
    order_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    delivery_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
