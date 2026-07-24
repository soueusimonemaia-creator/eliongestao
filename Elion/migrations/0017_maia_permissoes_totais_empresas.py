from django.db import migrations, models
import json


ROTINAS = [
    "fornecedor",
    "funcionario",
    "frota",
    "combustivel",
    "empresa",
    "usuario",
    "configuracoes_sistema",
    "lancamentos",
    "consulta",
    "baixa_faturas",
    "relatorio_financeiro",
    "relatorio_fornecedor",
    "relatorio_faturas",
    "relatorio_manutencao",
    "relatorio_caixa",
    "relatorio_combustivel",
    "relatorio_documentos",
    "clientes",
    "vendedores",
    "faturacao",
    "artigos",
    "series",
    "impostos",
    "extrato_clientes",
    "extrato_fornecedores",
    "configuracao_iva",
    "exportacoes",
    "saft",
    "inventario_existencias",
]
ACOES = ["view", "create", "edit", "delete", "export"]


def adicionar_permissoes_json_se_nao_existir(apps, schema_editor):
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    table = UsuarioSistema._meta.db_table
    connection = schema_editor.connection

    existing = {
        c.name
        for c in connection.introspection.get_table_description(connection.cursor(), table)
    }
    if "permissoes_json" in existing:
        return

    qn = schema_editor.quote_name
    with connection.cursor() as cursor:
        cursor.execute(
            f"ALTER TABLE {qn(table)} ADD COLUMN {qn('permissoes_json')} TEXT NOT NULL DEFAULT ''"
        )


def remover_permissoes_json_se_existir(apps, schema_editor):
    # noop seguro para rollback em SQLite / bases existentes
    pass


def garantir_maia_total(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    Empresa = apps.get_model("Elion", "Empresa")

    campos_usuario = {f.name for f in UsuarioSistema._meta.get_fields()}
    tem_permissoes_json = "permissoes_json" in campos_usuario
    tem_empresas = "empresas" in campos_usuario

    permissoes = json.dumps({rotina: {acao: True for acao in ACOES} for rotina in ROTINAS}, ensure_ascii=False)

    for user in User.objects.filter(username__iexact="maia"):
        alterado = []
        if not user.is_staff:
            user.is_staff = True
            alterado.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            alterado.append("is_superuser")
        if alterado:
            user.save(update_fields=alterado)

        defaults = {
            "nome": user.first_name or user.username,
            "email_recuperacao": user.email or None,
            "administrador_geral": True,
        }
        if tem_permissoes_json:
            defaults["permissoes_json"] = permissoes

        perfil, _ = UsuarioSistema.objects.get_or_create(
            user_id=user.id,
            defaults=defaults,
        )

        perfil_alterado = []
        if not getattr(perfil, "administrador_geral", False):
            perfil.administrador_geral = True
            perfil_alterado.append("administrador_geral")
        if tem_permissoes_json and getattr(perfil, "permissoes_json", "") != permissoes:
            perfil.permissoes_json = permissoes
            perfil_alterado.append("permissoes_json")
        if perfil_alterado:
            perfil.save(update_fields=perfil_alterado)

        if tem_empresas and hasattr(perfil, "empresas"):
            perfil.empresas.set(Empresa.objects.all())


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0016_configuracoes_sistema"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(adicionar_permissoes_json_se_nao_existir, remover_permissoes_json_se_existir),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="usuariosistema",
                    name="permissoes_json",
                    field=models.TextField(blank=True, default="", verbose_name="Permissões JSON"),
                ),
            ],
        ),
        migrations.RunPython(garantir_maia_total, migrations.RunPython.noop),
    ]
