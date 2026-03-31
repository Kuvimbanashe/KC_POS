# Generated manually for POS backend bootstrap
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Asset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=100)),
                ('purchase_value', models.DecimalField(decimal_places=2, max_digits=12)),
                ('current_value', models.DecimalField(decimal_places=2, max_digits=12)),
                ('purchase_date', models.DateField()),
                ('condition', models.CharField(choices=[('excellent', 'Excellent'), ('good', 'Good'), ('fair', 'Fair'), ('poor', 'Poor')], max_length=20)),
                ('location', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.CharField(max_length=100)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('description', models.TextField()),
                ('payment_method', models.CharField(choices=[('Bank Transfer', 'Bank Transfer'), ('Cash', 'Cash'), ('Check', 'Check'), ('Online Payment', 'Online Payment')], max_length=32)),
                ('vendor', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('Paid', 'Paid'), ('Pending', 'Pending')], default='Paid', max_length=20)),
                ('receipt_number', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=100)),
                ('price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('cost', models.DecimalField(decimal_places=2, max_digits=12)),
                ('stock', models.IntegerField(default=0)),
                ('sku', models.CharField(max_length=100, unique=True)),
                ('barcode', models.CharField(blank=True, max_length=128, null=True, unique=True)),
                ('supplier', models.CharField(blank=True, max_length=255)),
                ('unit_type', models.CharField(choices=[('single', 'Single'), ('pack', 'Pack'), ('both', 'Both')], default='single', max_length=20)),
                ('pack_size', models.IntegerField(blank=True, null=True)),
                ('pack_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('single_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('min_stock_level', models.IntegerField(default=10)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Sale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('cashier', models.CharField(max_length=255)),
                ('total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('payment_method', models.CharField(choices=[('Cash', 'Cash'), ('Card', 'Card'), ('Mobile Payment', 'Mobile Payment')], max_length=32)),
                ('invoice_number', models.CharField(max_length=100, unique=True)),
                ('customer', models.CharField(blank=True, max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='StaffUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('password', models.CharField(max_length=255)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('cashier', 'Cashier')], max_length=20)),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('address', models.TextField(blank=True)),
                ('join_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('permissions', models.JSONField(blank=True, default=list)),
                ('last_login_at', models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Purchase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product_name', models.CharField(max_length=255)),
                ('quantity', models.IntegerField()),
                ('unit_cost', models.DecimalField(decimal_places=2, max_digits=12)),
                ('total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('supplier', models.CharField(max_length=255)),
                ('order_number', models.CharField(max_length=100, unique=True)),
                ('status', models.CharField(choices=[('Completed', 'Completed'), ('Pending', 'Pending')], default='Completed', max_length=20)),
                ('delivery_date', models.DateTimeField(blank=True, null=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='pos.product')),
            ],
        ),
        migrations.CreateModel(
            name='SaleItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('quantity', models.IntegerField()),
                ('price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=12)),
                ('unit_type', models.CharField(default='single', max_length=20)),
                ('pack_size', models.IntegerField(blank=True, null=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='pos.product')),
                ('sale', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='pos.sale')),
            ],
        ),
    ]
