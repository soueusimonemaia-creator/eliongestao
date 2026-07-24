from decimal import Decimal

from django.db import migrations, models


def atualizar_campos_financeiros(apps, schema_editor):
    Lancamento = apps.get_model("Elion", "Lancamento")
    for lanc in Lancamento.objects.all():
        dinheiro = lanc.dinheiro or Decimal("0.00")
        cartao = lanc.cartao or Decimal("0.00")
        transferencia = getattr(lanc, "transferencia", Decimal("0.00")) or Decimal("0.00")
        mbway = getattr(lanc, "mbway", Decimal("0.00")) or Decimal("0.00")
        total_pago = dinheiro + cartao + transferencia + mbway
        valor_fatura = getattr(lanc, "valor_fatura", Decimal("0.00")) or Decimal("0.00")
        if valor_fatura > Decimal("0.00"):
            saldo = valor_fatura - total_pago
            if saldo < Decimal("0.00"):
                saldo = Decimal("0.00")
            lanc.saldo_aberto = saldo
            if saldo == Decimal("0.00"):
                lanc.status_pagamento = "Paga"
            elif total_pago > Decimal("0.00"):
                lanc.status_pagamento = "Parcial"
            else:
                lanc.status_pagamento = "Em aberto"
        else:
            lanc.saldo_aberto = Decimal("0.00")
            lanc.status_pagamento = "Paga" if total_pago > Decimal("0.00") else "Em aberto"
        lanc.total = total_pago
        lanc.save(update_fields=["total", "valor_fatura", "saldo_aberto", "status_pagamento"])


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0006_lancamento_pagamentos_digitais"),
    ]

    operations = [
        migrations.AddField(
            model_name="lancamento",
            name="data_pagamento",
            field=models.DateField(blank=True, null=True, verbose_name="Data do Pagamento"),
        ),
        migrations.AddField(
            model_name="lancamento",
            name="data_vencimento",
            field=models.DateField(blank=True, null=True, verbose_name="Data de Vencimento"),
        ),
        migrations.AddField(
            model_name="lancamento",
            name="saldo_aberto",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Saldo em Aberto"),
        ),
        migrations.AddField(
            model_name="lancamento",
            name="valor_fatura",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Valor da Fatura"),
        ),
        migrations.RunPython(atualizar_campos_financeiros, migrations.RunPython.noop),
    ]
