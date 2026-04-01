from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0002_product_business'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='sku',
            field=models.CharField(blank=True, max_length=100, unique=True),
        ),
    ]
