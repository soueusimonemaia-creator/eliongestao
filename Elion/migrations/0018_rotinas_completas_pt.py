from django.db import migrations, models
import django.utils.timezone
import json

TIPOS = [
    ("FT", "Fatura"),
    ("FS", "Fatura Simplificada"),
    ("FR", "Fatura-Recibo"),
    ("RC", "Recibo"),
    ("NC", "Nota de Crédito"),
    ("ND", "Nota de Débito"),
    ("NL", "Nota de Liquidação"),
    ("DV", "Nota de Devolução Cliente"),
    ("DVP", "Devolução de Pagamento"),
    ("OR", "Orçamento"),
    ("GR", "Guia de Remessa"),
    ("GT", "Guia de Transporte"),
    ("FSV", "Ficha de Serviço"),
]

ROTINAS = [
    "clientes","fornecedor","funcionario","frota","combustivel","faturacao","orcamentos",
    "recibos_venda","notas_liquidacao_venda","devolucao_cliente","lancamentos","consulta",
    "baixa_faturas","notas_credito_fornecedor","notas_devolucao_fornecedor","artigos",
    "nota_quebra","entrada_inventario","saida_inventario","guias_remessa","guias_transporte",
    "fichas_servico","recibos_liquidacao","notas_liquidacao","notas_credito","devolucoes_pagamento",
    "series","iva_caixa","saft","inventario_existencias","numeracao_series","configuracao_iva",
    "impostos","saft_inventario_ficheiros","resumo_stock_legal","artigos_stocks","empresa","usuario",
    "configuracoes_sistema","exportacoes","relatorio_financeiro","relatorio_fornecedor","relatorio_faturas",
    "relatorio_manutencao","relatorio_caixa","relatorio_combustivel","relatorio_documentos",
    "extrato_clientes","extrato_fornecedores"
]
ACOES = ["view", "create", "edit", "delete", "export"]


def seed_series_and_permissions(apps, schema_editor):
    SerieDocumento = apps.get_model("Elion", "SerieDocumento")
    Empresa = apps.get_model("Elion", "Empresa")
    UsuarioSistema = apps.get_model("Elion", "UsuarioSistema")
    User = apps.get_model("auth", "User")
    ano = django.utils.timezone.now().year
    defaults = [
        ("RC", "Recibo"),
        ("NL", "Nota de Liquidação"),
        ("DV", "Devolução Cliente"),
        ("GT", "Guia de Transporte"),
        ("FSV", "Ficha de Serviço"),
        ("DVP", "Devolução Pagamento"),
    ]
    empresas = list(Empresa.objects.all()) or [None]
    for empresa in empresas:
        for codigo, descricao in defaults:
            lookup = {"empresa": empresa, "codigo": codigo, "ano": ano}
            if not SerieDocumento.objects.filter(**lookup).exists():
                SerieDocumento.objects.create(
                    empresa=empresa,
                    codigo=codigo,
                    descricao=descricao,
                    tipo_documento=codigo,
                    prefixo_documento=codigo,
                    ano=ano,
                    ativa=True,
                )
    permissoes_totais = {rotina: {acao: True for acao in ACOES} for rotina in ROTINAS}
    for perfil in UsuarioSistema.objects.all():
        bruto = getattr(perfil, "permissoes_json", "") or "{}"
        try:
            data = json.loads(bruto) if bruto else {}
        except Exception:
            data = {}
        changed = False
        for rotina in ROTINAS:
            if rotina not in data or not isinstance(data[rotina], dict):
                data[rotina] = {acao: False for acao in ACOES}
                changed = True
            for acao in ACOES:
                if acao not in data[rotina]:
                    data[rotina][acao] = False
                    changed = True
        user = getattr(perfil, "user", None)
        username = (getattr(user, "username", "") or "").lower()
        if username == "maia" or getattr(perfil, "administrador_geral", False):
            data = permissoes_totais
            changed = True
            try:
                perfil.empresas.set(Empresa.objects.all())
            except Exception:
                pass
        if changed:
            perfil.permissoes_json = json.dumps(data, ensure_ascii=False)
            perfil.save(update_fields=["permissoes_json"])
    for user in User.objects.filter(username__iexact="maia"):
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_staff", "is_superuser"])


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0017_maia_permissoes_totais_empresas"),
    ]

    operations = [
        migrations.AlterField(
            model_name="seriedocumento",
            name="tipo_documento",
            field=models.CharField(choices=TIPOS, default="FT", max_length=10, verbose_name="Tipo de Documento"),
        ),
        migrations.RunPython(seed_series_and_permissions, migrations.RunPython.noop),
    ]
