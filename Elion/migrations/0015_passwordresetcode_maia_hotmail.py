from django.db import migrations, models
import django.db.models.deletion
from django.contrib.auth.hashers import make_password


def atualizar_maia(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    user, _ = User.objects.get_or_create(
        username="Maia",
        defaults={
            "email": "simonemai@hotmail.com",
            "is_active": True,
            "is_staff": True,
            "is_superuser": True,
            "first_name": "Maia",
            "password": make_password("Sophia@01"),
        },
    )
    user.email = "simonemai@hotmail.com"
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.first_name = "Maia"
    user.password = make_password("Sophia@01")
    user.save()

    perfil = UsuarioSistema.objects.filter(user_id=user.id).first()
    if perfil:
        if hasattr(perfil, "email_recuperacao"):
            perfil.email_recuperacao = "simonemai@hotmail.com"
        if hasattr(perfil, "contato"):
            perfil.contato = "926799324"
        if hasattr(perfil, "administrador_geral"):
            perfil.administrador_geral = True
        perfil.save()


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0014_maia_acesso_recuperacao"),
        migrations.swappable_dependency("auth.User"),
    ]

    operations = [
        migrations.CreateModel(
            name="PasswordResetCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=6, verbose_name="Código")),
                ("channel", models.CharField(blank=True, default="email", max_length=20, verbose_name="Canal")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("expires_at", models.DateTimeField(verbose_name="Expira em")),
                ("used", models.BooleanField(default=False, verbose_name="Usado")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="password_reset_codes", to="auth.user")),
            ],
            options={
                "verbose_name": "Código de recuperação",
                "verbose_name_plural": "Códigos de recuperação",
                "ordering": ["-created_at", "-id"],
            },
        ),
        migrations.RunPython(atualizar_maia, migrations.RunPython.noop),
    ]
