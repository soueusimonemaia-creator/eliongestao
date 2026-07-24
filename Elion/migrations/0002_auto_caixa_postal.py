from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='empresa',
            name='caixa_postal',
            field=models.CharField(
                verbose_name='Caixa Postal',
                max_length=100,
                blank=True,
                default='',
            ),
        ),
    ]