from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0025_lancamento_nota_credito"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lancamento",
            name="total",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name="Total Pago"),
        ),
    ]
