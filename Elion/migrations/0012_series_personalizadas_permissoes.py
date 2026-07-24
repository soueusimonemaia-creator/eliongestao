from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0011_erp_unificado_v4"),
    ]

    operations = [
        migrations.AddField(
            model_name="seriedocumento",
            name="casas_numero",
            field=models.PositiveIntegerField(default=4, verbose_name="Casas do Número"),
        ),
        migrations.AddField(
            model_name="seriedocumento",
            name="prefixo_documento",
            field=models.CharField(blank=True, default="", max_length=20, verbose_name="Prefixo do Documento"),
        ),
        migrations.AddField(
            model_name="seriedocumento",
            name="separador",
            field=models.CharField(blank=True, default="/", max_length=5, verbose_name="Separador"),
        ),
        migrations.AddField(
            model_name="seriedocumento",
            name="usar_ano",
            field=models.BooleanField(default=True, verbose_name="Usar Ano"),
        ),
    ]
