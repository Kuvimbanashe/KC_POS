from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('assets_mgmt', '0001_initial'),
        ('businesses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='asset',
            name='business',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='assets', to='businesses.business'),
        ),
    ]
