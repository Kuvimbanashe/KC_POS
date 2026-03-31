from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
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
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
