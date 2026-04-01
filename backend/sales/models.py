from django.db import models


class Sale(models.Model):
    PAYMENT_CHOICES = (('Cash', 'Cash'), ('Card', 'Card'), ('Mobile Payment', 'Mobile Payment'))

    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='sales', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    cashier = models.CharField(max_length=255)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=32, choices=PAYMENT_CHOICES)
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    unit_type = models.CharField(max_length=20, default='single')
    pack_size = models.IntegerField(null=True, blank=True)
