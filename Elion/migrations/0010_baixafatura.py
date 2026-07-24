from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0009_usuariosistema_empresas_m2m"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BaixaFatura",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("data_baixa", models.DateField(default=django.utils.timezone.localdate, verbose_name="Data da Baixa")),
                ("fornecedor_snapshot", models.CharField(blank=True, default="", max_length=150, verbose_name="Fornecedor")),
                ("numero_fatura_snapshot", models.CharField(blank=True, default="", max_length=100, verbose_name="Número da Fatura")),
                ("dinheiro", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Dinheiro")),
                ("cartao", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Cartão")),
                ("transferencia", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Transferência")),
                ("mbway", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="MBWay")),
                ("nota_credito", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Nota de Crédito")),
                ("total_baixa", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Total da Baixa")),
                ("saldo_resultante", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.00"))], verbose_name="Saldo Resultante")),
                ("observacao", models.TextField(blank=True, default="", verbose_name="Observação")),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="baixas_faturas", to="Elion.empresa", verbose_name="Empresa")),
                ("lancamento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="baixas_registradas", to="Elion.lancamento", verbose_name="Lançamento")),
                ("usuario", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="baixas_faturas_registradas", to=settings.AUTH_USER_MODEL, verbose_name="Utilizador")),
            ],
            options={
                "verbose_name": "Baixa de Fatura",
                "verbose_name_plural": "Baixas de Faturas",
                "ordering": ["-data_baixa", "-id"],
            },
        ),
    ]
