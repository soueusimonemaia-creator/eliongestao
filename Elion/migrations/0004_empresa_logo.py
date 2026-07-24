from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0003_add_administrador_geral'),
    ]

    operations = [
        migrations.AddField(
            model_name='empresa',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='empresas/logos/', verbose_name='Logo'),
        ),
    ]
