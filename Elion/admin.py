from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import (
    Cliente,
    Vendedor,
    CategoriaArtigo,
    Armazem,
    Artigo,
    SerieDocumento,
    TemplateDocumento,
    CentroCusto,
    NivelAprovacao,
    DocumentoVenda,
    DocumentoVendaLinha,
    RecebimentoCliente,
    Fornecedor,
    Funcionario,
    Frota,
    Combustivel,
    Empresa,
    UsuarioSistema,
    Lancamento,
    LancamentoCombustivel,
)


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ("id", "empresa", "nif", "nome", "contato", "responsavel", "email", "iban")
    search_fields = ("empresa__nome", "nif", "nome", "contato", "responsavel", "email", "iban", "morada", "conselho", "caixa_postal")
    ordering = ("empresa__nome", "nome")


@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "contato", "email")
    search_fields = ("nome", "contato", "email")
    ordering = ("nome",)


@admin.register(Frota)
class FrotaAdmin(admin.ModelAdmin):
    list_display = ("id", "matricula", "seguro", "seguradora", "inspecao")
    search_fields = ("matricula", "seguradora")
    ordering = ("matricula",)


@admin.register(Combustivel)
class CombustivelAdmin(admin.ModelAdmin):
    list_display = ("id", "nome")
    search_fields = ("nome",)
    ordering = ("nome",)


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("id", "nif", "nome", "cidade", "contato", "email")
    search_fields = ("nif", "nome", "cidade", "contato", "email")
    ordering = ("nome",)


@admin.register(UsuarioSistema)
class UsuarioSistemaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "nome",
        "contato",
        "email_recuperacao",
        "administrador_geral",
        "listar_empresas",
    )
    search_fields = (
        "user__username",
        "nome",
        "contato",
        "email_recuperacao",
    )
    list_filter = ("administrador_geral", "empresas")
    filter_horizontal = ("empresas",)
    ordering = ("nome", "id")

    def listar_empresas(self, obj):
        if obj.administrador_geral:
            return "Todas as empresas"
        return ", ".join(obj.empresas.values_list("nome", flat=True)) or "-"

    listar_empresas.short_description = "Empresas"

    def has_delete_permission(self, request, obj=None):
        if obj and getattr(getattr(obj, "user", None), "username", "").strip().casefold() == "maia":
            return False
        return super().has_delete_permission(request, obj)

    def get_actions(self, request):
        actions = super().get_actions(request)
        actions.pop("delete_selected", None)
        return actions

    def delete_model(self, request, obj):
        if getattr(getattr(obj, "user", None), "username", "").strip().casefold() == "maia":
            raise ValidationError("O utilizador Maia é protegido e não pode ser excluído.")
        return super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        queryset = queryset.exclude(user__username__iexact="maia")
        return super().delete_queryset(request, queryset)


class LancamentoCombustivelInline(admin.TabularInline):
    model = LancamentoCombustivel
    extra = 0


@admin.register(Lancamento)
class LancamentoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "data_emissao",
        "numero_fatura",
        "fornecedor",
        "dinheiro",
        "cartao",
        "total",
        "criado_por",
    )
    search_fields = (
        "numero_fatura",
        "fornecedor__nome",
        "fornecedor__nif",
        "criado_por__username",
    )
    list_filter = ("data_emissao", "fornecedor")
    ordering = ("-data_emissao", "-id")
    inlines = [LancamentoCombustivelInline]


@admin.register(LancamentoCombustivel)
class LancamentoCombustivelAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lancamento",
        "combustivel",
        "frota",
        "km_inicio",
        "km_final",
        "km_total",
        "litro",
        "valor_litro",
        "valor_total",
    )
    search_fields = (
        "lancamento__numero_fatura",
        "combustivel__nome",
        "frota__matricula",
    )
    list_filter = ("combustivel", "frota")
    ordering = ("id",)

admin.site.register(Cliente)
admin.site.register(Vendedor)
admin.site.register(CategoriaArtigo)
admin.site.register(Armazem)
admin.site.register(Artigo)
admin.site.register(SerieDocumento)
admin.site.register(TemplateDocumento)
admin.site.register(CentroCusto)
admin.site.register(NivelAprovacao)
admin.site.register(DocumentoVenda)
admin.site.register(DocumentoVendaLinha)
admin.site.register(RecebimentoCliente)
