from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0007_lancamento_faturas_vencimento"),
    ]

    operations = [
        migrations.CreateModel(
            name="ManutencaoFrota",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("km_inicio", models.IntegerField(default=0, verbose_name="KM Início")),
                ("km_final", models.IntegerField(default=0, verbose_name="KM Final")),
                ("km_total", models.IntegerField(default=0, verbose_name="KM Total")),
                ("valor", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Valor")),
                ("observacao", models.TextField(blank=True, default="", verbose_name="Observação")),
                ("frota", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="itens_manutencao", to="Elion.frota", verbose_name="Frota")),
                ("lancamento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="itens_manutencao", to="Elion.lancamento", verbose_name="Lançamento")),
            ],
            options={
                "verbose_name": "Manutenção de Frota",
                "verbose_name_plural": "Manutenções de Frota",
                "ordering": ["id"],
            },
        ),
    ]
