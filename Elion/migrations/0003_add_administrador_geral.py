from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0002_auto_caixa_postal'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuariosistema',
            name='administrador_geral',
            field=models.BooleanField(
                verbose_name='Administrador Geral',
                default=False,
            ),
        ),
    ]