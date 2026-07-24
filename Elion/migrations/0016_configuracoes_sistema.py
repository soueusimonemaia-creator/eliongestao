from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0015_passwordresetcode_maia_hotmail"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConfiguracaoSistema",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome_sistema", models.CharField(default="Elion One ERP", max_length=120, verbose_name="Nome do Sistema")),
                ("subtitulo_login", models.CharField(blank=True, default="Faturação, financeiro, frota e combustível num único sistema", max_length=255, verbose_name="Subtítulo do Login")),
                ("logo_login", models.ImageField(blank=True, null=True, upload_to="configuracao/", verbose_name="Logo do Login")),
                ("smtp_host", models.CharField(blank=True, default="", max_length=150, verbose_name="SMTP Host")),
                ("smtp_porta", models.PositiveIntegerField(default=587, verbose_name="SMTP Porta")),
                ("smtp_user", models.CharField(blank=True, default="", max_length=150, verbose_name="SMTP Utilizador")),
                ("smtp_password", models.CharField(blank=True, default="", max_length=255, verbose_name="SMTP Palavra-passe")),
                ("sms_provider", models.CharField(blank=True, default="", max_length=100, verbose_name="Fornecedor SMS")),
                ("sms_token", models.CharField(blank=True, default="", max_length=255, verbose_name="Token SMS")),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Configuração do Sistema",
                "verbose_name_plural": "Configurações do Sistema",
            },
        ),
    ]
