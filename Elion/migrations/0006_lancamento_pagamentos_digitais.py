from decimal import Decimal

from django.db import migrations, models


def atualizar_status_e_totais(apps, schema_editor):
    Lancamento = apps.get_model("Elion", "Lancamento")
    for lanc in Lancamento.objects.all():
        dinheiro = lanc.dinheiro or Decimal("0.00")
        cartao = lanc.cartao or Decimal("0.00")
        transferencia = getattr(lanc, "transferencia", Decimal("0.00")) or Decimal("0.00")
        mbway = getattr(lanc, "mbway", Decimal("0.00")) or Decimal("0.00")
        total = dinheiro + cartao + transferencia + mbway
        lanc.total = total
        lanc.status_pagamento = "Paga" if total > Decimal("0.00") else "Em aberto"
        lanc.save(update_fields=["total", "status_pagamento"])


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0005_lancamento_empresa_and_fix_existing"),
    ]

    operations = [
        migrations.AddField(
            model_name="lancamento",
            name="mbway",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="MBWay"),
        ),
        migrations.AddField(
            model_name="lancamento",
            name="status_pagamento",
            field=models.CharField(default="Em aberto", max_length=20, verbose_name="Status do Pagamento"),
        ),
        migrations.AddField(
            model_name="lancamento",
            name="transferencia",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Transferência"),
        ),
        migrations.RunPython(atualizar_status_e_totais, migrations.RunPython.noop),
    ]
