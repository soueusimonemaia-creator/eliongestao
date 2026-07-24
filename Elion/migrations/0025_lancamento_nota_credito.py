from decimal import Decimal
from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0024_isolamento_global_por_empresa"),
    ]

    operations = [
        migrations.AddField(
            model_name="lancamento",
            name="nota_credito",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Nota de Crédito"),
        ),
    ]
