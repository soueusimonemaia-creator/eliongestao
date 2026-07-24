from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0019_fiscal_artigos_series_exports"),
    ]

    operations = [
        migrations.AddField(
            model_name="manutencaofrota",
            name="descricao",
            field=models.CharField(blank=True, default="Manutenção", max_length=120, verbose_name="Descrição"),
        ),
    ]
