from django.db import migrations


def garantir_maia_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    Empresa = apps.get_model("Elion", "Empresa")

    for user in User.objects.filter(username__iexact="maia"):
        alterado = False
        if not user.is_staff:
            user.is_staff = True
            alterado = True
        if not user.is_superuser:
            user.is_superuser = True
            alterado = True
        if alterado:
            user.save(update_fields=["is_staff", "is_superuser"])

        perfil, _ = UsuarioSistema.objects.get_or_create(
            user_id=user.id,
            defaults={
                "nome": user.first_name or user.username,
                "email_recuperacao": user.email or None,
                "administrador_geral": True,
                "permissoes_json": "",
            },
        )
        if not perfil.administrador_geral:
            perfil.administrador_geral = True
            perfil.save(update_fields=["administrador_geral"])
        try:
            perfil.empresas.set(Empresa.objects.all())
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0012_series_personalizadas_permissoes"),
    ]

    operations = [
        migrations.RunPython(garantir_maia_admin, migrations.RunPython.noop),
    ]
