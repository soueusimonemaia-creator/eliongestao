from django.db import migrations, models
import django.db.models.deletion


def definir_empresa_existente(apps, schema_editor):
    Empresa = apps.get_model("Elion", "Empresa")
    Lancamento = apps.get_model("Elion", "Lancamento")
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")

    empresas = list(Empresa.objects.order_by("id"))
    if not empresas:
        return

    empresa_padrao = empresas[0]

    for lanc in Lancamento.objects.filter(empresa__isnull=True).iterator():
        empresa_escolhida = None
        if len(empresas) == 1:
            empresa_escolhida = empresas[0]
        elif lanc.criado_por_id:
            perfil = UsuarioSistema.objects.filter(user_id=lanc.criado_por_id).first()
            if perfil:
                vinculadas = list(perfil.empresas.order_by("id"))
                if len(vinculadas) == 1:
                    empresa_escolhida = vinculadas[0]
        lanc.empresa_id = (empresa_escolhida or empresa_padrao).id
        lanc.save(update_fields=["empresa"])


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0004_empresa_logo"),
    ]

    operations = [
        migrations.AddField(
            model_name="lancamento",
            name="empresa",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="lancamentos", to="Elion.empresa", verbose_name="Empresa"),
        ),
        migrations.RunPython(definir_empresa_existente, migrations.RunPython.noop),
    ]
