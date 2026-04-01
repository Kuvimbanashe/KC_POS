from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0001_initial'),
        ('purchases', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchase',
            name='business',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='purchases', to='businesses.business'),
        ),
    ]
