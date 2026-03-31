from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class StaffUser(TimeStampedModel):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('cashier', 'Cashier'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

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

    def __str__(self):
        return f'{self.name} ({self.role})'


class Product(TimeStampedModel):
    UNIT_TYPE_CHOICES = (
        ('single', 'Single'),
        ('pack', 'Pack'),
        ('both', 'Both'),
    )

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=128, unique=True, null=True, blank=True)
    supplier = models.CharField(max_length=255, blank=True)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, default='single')
    pack_size = models.IntegerField(null=True, blank=True)
    pack_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    single_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    min_stock_level = models.IntegerField(default=10)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Sale(TimeStampedModel):
    PAYMENT_CHOICES = (
        ('Cash', 'Cash'),
        ('Card', 'Card'),
        ('Mobile Payment', 'Mobile Payment'),
    )

    date = models.DateTimeField(auto_now_add=True)
    cashier = models.CharField(max_length=255)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=32, choices=PAYMENT_CHOICES)
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.CharField(max_length=255, blank=True)


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    unit_type = models.CharField(max_length=20, default='single')
    pack_size = models.IntegerField(null=True, blank=True)


class Purchase(TimeStampedModel):
    STATUS_CHOICES = (
        ('Completed', 'Completed'),
        ('Pending', 'Pending'),
    )

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    supplier = models.CharField(max_length=255)
    order_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    delivery_date = models.DateTimeField(null=True, blank=True)


class Expense(TimeStampedModel):
    PAYMENT_CHOICES = (
        ('Bank Transfer', 'Bank Transfer'),
        ('Cash', 'Cash'),
        ('Check', 'Check'),
        ('Online Payment', 'Online Payment'),
    )
    STATUS_CHOICES = (
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
    )

    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    payment_method = models.CharField(max_length=32, choices=PAYMENT_CHOICES)
    vendor = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Paid')
    receipt_number = models.CharField(max_length=100, unique=True)


class Asset(TimeStampedModel):
    CONDITION_CHOICES = (
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    )

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    purchase_value = models.DecimalField(max_digits=12, decimal_places=2)
    current_value = models.DecimalField(max_digits=12, decimal_places=2)
    purchase_date = models.DateField()
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    location = models.CharField(max_length=255)
