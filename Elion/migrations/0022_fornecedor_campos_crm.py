from django.db import migrations, models
import json


def limpar_permissao_cliente(apps, schema_editor):
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    for perfil in UsuarioSistema.objects.all():
        bruto = getattr(perfil, "permissoes_json", "") or ""
        if not bruto:
            continue
        try:
            data = json.loads(bruto) or {}
        except Exception:
            continue
        if "clientes" in data:
            data.pop("clientes", None)
            perfil.permissoes_json = json.dumps(data, ensure_ascii=False)
            perfil.save(update_fields=["permissoes_json"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0021_revisao_frota_marca"),
    ]

    operations = [
        migrations.AddField(
            model_name="fornecedor",
            name="caixa_postal",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="Caixa Postal"),
        ),
        migrations.AddField(
            model_name="fornecedor",
            name="conselho",
            field=models.CharField(blank=True, default="", max_length=120, verbose_name="Conselho"),
        ),
        migrations.AddField(
            model_name="fornecedor",
            name="contato",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="Contato"),
        ),
        migrations.AddField(
            model_name="fornecedor",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, verbose_name="E-mail"),
        ),
        migrations.AddField(
            model_name="fornecedor",
            name="responsavel",
            field=models.CharField(blank=True, default="", max_length=150, verbose_name="Responsável"),
        ),
        migrations.RunPython(limpar_permissao_cliente, noop),
    ]
