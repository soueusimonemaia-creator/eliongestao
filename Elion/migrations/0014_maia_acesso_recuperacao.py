from django.db import migrations
from django.contrib.auth.hashers import make_password


def garantir_maia(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UsuarioSistema = apps.get_model('Elion', 'UsuarioSistema')
    Empresa = apps.get_model('Elion', 'Empresa')

    user, _ = User.objects.get_or_create(
        username='Maia',
        defaults={
            'email': 'simonemai@hotmail.com',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'Maia',
            'password': make_password('Sophia@01'),
        },
    )
    changed = []
    if user.email != 'simonemai@hotmail.com':
        user.email = 'simonemai@hotmail.com'
        changed.append('email')
    if user.first_name != 'Maia':
        user.first_name = 'Maia'
        changed.append('first_name')
    if not user.is_active:
        user.is_active = True
        changed.append('is_active')
    if not user.is_staff:
        user.is_staff = True
        changed.append('is_staff')
    if not user.is_superuser:
        user.is_superuser = True
        changed.append('is_superuser')
    # ensure requested password works
    user.password = make_password('Sophia@01')
    changed.append('password')
    user.save(update_fields=changed)

    perfil, _ = UsuarioSistema.objects.get_or_create(
        user_id=user.id,
        defaults={
            'nome': 'Maia',
            'contato': '926799324',
            'email_recuperacao': 'simonemai@hotmail.com',
            'administrador_geral': True,
            'permissoes_json': '',
        },
    )
    perfil_changed = []
    if perfil.nome != 'Maia':
        perfil.nome = 'Maia'
        perfil_changed.append('nome')
    if perfil.contato != '926799324':
        perfil.contato = '926799324'
        perfil_changed.append('contato')
    if perfil.email_recuperacao != 'simonemai@hotmail.com':
        perfil.email_recuperacao = 'simonemai@hotmail.com'
        perfil_changed.append('email_recuperacao')
    if not perfil.administrador_geral:
        perfil.administrador_geral = True
        perfil_changed.append('administrador_geral')
    if perfil_changed:
        perfil.save(update_fields=perfil_changed)

    try:
        perfil.empresas.set(Empresa.objects.all())
    except Exception:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0013_maia_admin_login_fix'),
    ]

    operations = [
        migrations.RunPython(garantir_maia, migrations.RunPython.noop),
    ]
