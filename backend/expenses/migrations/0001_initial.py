from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(max_length=100)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('description', models.TextField()),
                ('payment_method', models.CharField(choices=[('Bank Transfer', 'Bank Transfer'), ('Cash', 'Cash'), ('Check', 'Check'), ('Online Payment', 'Online Payment')], max_length=32)),
                ('vendor', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('Paid', 'Paid'), ('Pending', 'Pending')], default='Paid', max_length=20)),
                ('receipt_number', models.CharField(max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
