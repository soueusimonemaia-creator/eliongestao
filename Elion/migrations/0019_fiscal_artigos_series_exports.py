from decimal import Decimal
from django.db import migrations, models


def criar_bases(apps, schema_editor):
    Empresa = apps.get_model("Elion", "Empresa")
    SerieDocumento = apps.get_model("Elion", "SerieDocumento")
    ConfiguracaoFiscal = apps.get_model("Elion", "ConfiguracaoFiscal")
    Artigo = apps.get_model("Elion", "Artigo")

    for empresa in Empresa.objects.all():
        ConfiguracaoFiscal.objects.get_or_create(empresa=empresa)
        for codigo, descricao, tipo in [
            ("FT", "Fatura", "FT"),
            ("FS", "Fatura Simplificada", "FS"),
            ("FR", "Fatura-Recibo", "FR"),
            ("RC", "Recibo", "RC"),
        ]:
            SerieDocumento.objects.get_or_create(empresa=empresa, codigo=codigo, ano=2026, defaults={
                "descricao": descricao,
                "tipo_documento": tipo,
                "prefixo_documento": codigo,
                "usar_ano": True,
                "separador": "/",
                "casas_numero": 4,
                "proximo_numero": 1,
                "ativa": True,
            })

    for artigo in Artigo.objects.all():
        if not getattr(artigo, "unidade_medida", None):
            artigo.unidade_medida = "UN"
        if getattr(artigo, "taxa_iva_padrao", None) is None:
            artigo.taxa_iva_padrao = Decimal("23.00")
        artigo.save(update_fields=["unidade_medida", "taxa_iva_padrao"])


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0018_rotinas_completas_pt"),
    ]

    operations = [
        migrations.AddField(
            model_name="artigo",
            name="taxa_iva_padrao",
            field=models.DecimalField(decimal_places=2, default=Decimal("23.00"), max_digits=5, verbose_name="Taxa IVA Padrão"),
        ),
        migrations.AddField(
            model_name="artigo",
            name="unidade_medida",
            field=models.CharField(blank=True, default="UN", max_length=20, verbose_name="Unidade de Medida"),
        ),
        migrations.AddField(
            model_name="seriedocumento",
            name="codigo_validacao",
            field=models.CharField(blank=True, default="", max_length=20, verbose_name="Código de Validação AT"),
        ),
        migrations.CreateModel(
            name="ConfiguracaoFiscal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("regime_iva", models.CharField(blank=True, default="Regime normal", max_length=50, verbose_name="Regime de IVA")),
                ("iva_caixa", models.BooleanField(default=False, verbose_name="IVA de Caixa")),
                ("taxa_normal", models.DecimalField(decimal_places=2, default=Decimal("23.00"), max_digits=5, verbose_name="Taxa normal IVA")),
                ("taxa_intermedia", models.DecimalField(decimal_places=2, default=Decimal("13.00"), max_digits=5, verbose_name="Taxa intermédia IVA")),
                ("taxa_reduzida", models.DecimalField(decimal_places=2, default=Decimal("6.00"), max_digits=5, verbose_name="Taxa reduzida IVA")),
                ("retencao_padrao", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=5, verbose_name="Retenção padrão")),
                ("motivo_isencao", models.CharField(blank=True, default="M99", max_length=60, verbose_name="Motivo de isenção")),
                ("moeda", models.CharField(blank=True, default="EUR", max_length=10, verbose_name="Moeda")),
                ("software_certificado", models.CharField(blank=True, default="", max_length=120, verbose_name="Software certificado")),
                ("exportar_qr_atcud", models.BooleanField(default=True, verbose_name="Exportar QR/ATCUD")),
                ("observacoes_legais", models.TextField(blank=True, default="", verbose_name="Observações legais")),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="configuracoes_fiscais", to="Elion.empresa")),
            ],
            options={
                "verbose_name": "Configuração Fiscal",
                "verbose_name_plural": "Configurações Fiscais",
                "ordering": ["-id"],
            },
        ),
        migrations.RunPython(criar_bases, migrations.RunPython.noop),
    ]
