from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0026_alter_lancamento_total_allow_negative'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # não fazer nada no DB (coluna já existe)
            state_operations=[
                migrations.AddField(
                    model_name='configuracaosistema',
                    name='logo_paineis',
                    field=models.ImageField(blank=True, null=True, upload_to='configuracao/', verbose_name='Logo dos Painéis'),
                ),
            ],
        ),
    ]
