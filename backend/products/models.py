from django.db import models


class Product(models.Model):
    UNIT_TYPE_CHOICES = (('single', 'Single'), ('pack', 'Pack'), ('both', 'Both'))

    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True, blank=True)
    barcode = models.CharField(max_length=128, unique=True, null=True, blank=True)
    supplier = models.CharField(max_length=255, blank=True)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, default='single')
    pack_size = models.IntegerField(null=True, blank=True)
    pack_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    single_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    min_stock_level = models.IntegerField(default=10)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.sku:
            prefix = self.business_id or 0
            count = Product.objects.filter(business_id=self.business_id).count() + 1
            self.sku = f'SKU-{prefix:03d}-{count:05d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
