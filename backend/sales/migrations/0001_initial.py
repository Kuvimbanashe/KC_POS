from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Sale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('cashier', models.CharField(max_length=255)),
                ('total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('payment_method', models.CharField(choices=[('Cash', 'Cash'), ('Card', 'Card'), ('Mobile Payment', 'Mobile Payment')], max_length=32)),
                ('invoice_number', models.CharField(max_length=100, unique=True)),
                ('customer', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
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
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='products.product')),
                ('sale', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='sales.sale')),
            ],
        ),
    ]
