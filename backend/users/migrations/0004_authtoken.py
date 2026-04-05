from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_passwordresetcode'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuthToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(db_index=True, max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_used_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='auth_token', to='users.staffuser')),
            ],
        ),
    ]
