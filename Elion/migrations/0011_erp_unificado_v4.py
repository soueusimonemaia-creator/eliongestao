from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("Elion", "0010_baixafatura"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(model_name="fornecedor", name="iban", field=models.CharField(blank=True, default="", max_length=50, verbose_name="IBAN")),
        migrations.AddField(model_name="fornecedor", name="morada", field=models.CharField(blank=True, default="", max_length=255, verbose_name="Morada")),
        migrations.AddField(model_name="fornecedor", name="telefone", field=models.CharField(blank=True, default="", max_length=50, verbose_name="Telefone")),
        migrations.AddField(model_name="frota", name="modelo", field=models.CharField(blank=True, default="", max_length=120, verbose_name="Modelo")),
        migrations.AddField(model_name="frota", name="consumo_medio_esperado", field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=8, verbose_name="Consumo Médio Esperado")),
        migrations.AddField(model_name="frota", name="iuc", field=models.DateField(blank=True, null=True, verbose_name="IUC")),
        migrations.AddField(model_name="frota", name="proxima_revisao", field=models.DateField(blank=True, null=True, verbose_name="Próxima Revisão")),
        migrations.AddField(model_name="frota", name="observacoes", field=models.TextField(blank=True, default="", verbose_name="Observações")),
        migrations.AddField(model_name="frota", name="combustivel_padrao", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="frotas_padrao", to="Elion.combustivel", verbose_name="Combustível Padrão")),
        migrations.CreateModel(
            name="Cliente",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nif", models.CharField(max_length=50, unique=True, verbose_name="Contribuinte")),
                ("nome", models.CharField(max_length=150, verbose_name="Nome")),
                ("morada", models.CharField(blank=True, default="", max_length=255, verbose_name="Morada")),
                ("cidade", models.CharField(blank=True, default="", max_length=100, verbose_name="Cidade")),
                ("telefone", models.CharField(blank=True, default="", max_length=50, verbose_name="Telefone")),
                ("email", models.EmailField(blank=True, max_length=254, null=True, verbose_name="E-mail")),
                ("limite_credito", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Limite de Crédito")),
                ("ativo", models.BooleanField(default=True, verbose_name="Ativo")),
            ],
            options={"verbose_name": "Cliente", "verbose_name_plural": "Clientes", "ordering": ["nome"]},
        ),
        migrations.CreateModel(
            name="Vendedor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=150, verbose_name="Nome")),
                ("email", models.EmailField(blank=True, max_length=254, null=True, verbose_name="E-mail")),
                ("telefone", models.CharField(blank=True, default="", max_length=50, verbose_name="Telefone")),
                ("comissao_padrao", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=5, verbose_name="Comissão %")),
                ("ativo", models.BooleanField(default=True, verbose_name="Ativo")),
            ],
            options={"verbose_name": "Vendedor", "verbose_name_plural": "Vendedores", "ordering": ["nome"]},
        ),
        migrations.CreateModel(
            name="CategoriaArtigo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=120, unique=True, verbose_name="Nome")),
                ("descricao", models.TextField(blank=True, default="", verbose_name="Descrição")),
            ],
            options={"verbose_name": "Categoria de Artigo", "verbose_name_plural": "Categorias de Artigos", "ordering": ["nome"]},
        ),
        migrations.CreateModel(
            name="Armazem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo", models.CharField(max_length=30, unique=True, verbose_name="Código")),
                ("nome", models.CharField(max_length=120, verbose_name="Nome")),
                ("morada", models.CharField(blank=True, default="", max_length=255, verbose_name="Morada")),
            ],
            options={"verbose_name": "Armazém", "verbose_name_plural": "Armazéns", "ordering": ["codigo", "nome"]},
        ),
        migrations.CreateModel(
            name="Artigo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo", models.CharField(max_length=50, unique=True, verbose_name="Código")),
                ("nome", models.CharField(max_length=150, verbose_name="Nome")),
                ("tipo", models.CharField(choices=[("produto", "Produto"), ("servico", "Serviço")], default="produto", max_length=20, verbose_name="Tipo")),
                ("preco_venda", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Preço de Venda")),
                ("preco_custo", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Preço de Custo")),
                ("stock_atual", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Stock Atual")),
                ("stock_minimo", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Stock Mínimo")),
                ("localizacao_prateleira", models.CharField(blank=True, default="", max_length=80, verbose_name="Localização na Prateleira")),
                ("ativo", models.BooleanField(default=True, verbose_name="Ativo")),
                ("armazem", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="artigos", to="Elion.armazem")),
                ("categoria", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="artigos", to="Elion.categoriaartigo")),
            ],
            options={"verbose_name": "Artigo", "verbose_name_plural": "Artigos", "ordering": ["nome"]},
        ),
        migrations.CreateModel(
            name="SerieDocumento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo", models.CharField(max_length=10, verbose_name="Código")),
                ("descricao", models.CharField(max_length=120, verbose_name="Descrição")),
                ("tipo_documento", models.CharField(choices=[("FT", "Fatura"), ("FS", "Fatura Simplificada"), ("FR", "Fatura-Recibo"), ("RC", "Recibo"), ("NC", "Nota de Crédito"), ("ND", "Nota de Débito"), ("OR", "Orçamento"), ("GR", "Guia de Remessa")], default="FT", max_length=10, verbose_name="Tipo de Documento")),
                ("ano", models.IntegerField(default=django.utils.timezone.now().year, verbose_name="Ano")),
                ("proximo_numero", models.PositiveIntegerField(default=1, verbose_name="Próximo Número")),
                ("ativa", models.BooleanField(default=True, verbose_name="Ativa")),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="series_documentos", to="Elion.empresa")),
            ],
            options={"verbose_name": "Série de Documento", "verbose_name_plural": "Séries de Documentos", "ordering": ["codigo", "ano"]},
        ),
        migrations.CreateModel(
            name="TemplateDocumento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=120, unique=True, verbose_name="Nome")),
                ("cabecalho", models.TextField(blank=True, default="", verbose_name="Cabeçalho")),
                ("rodape", models.TextField(blank=True, default="", verbose_name="Rodapé")),
                ("mostrar_logo", models.BooleanField(default=True, verbose_name="Mostrar logo")),
                ("mostrar_iban", models.BooleanField(default=True, verbose_name="Mostrar IBAN")),
                ("observacoes", models.TextField(blank=True, default="", verbose_name="Observações")),
            ],
            options={"verbose_name": "Template de Documento", "verbose_name_plural": "Templates de Documentos", "ordering": ["nome"]},
        ),
        migrations.CreateModel(
            name="CentroCusto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo", models.CharField(max_length=30, unique=True, verbose_name="Código")),
                ("nome", models.CharField(max_length=120, verbose_name="Nome")),
                ("ativo", models.BooleanField(default=True, verbose_name="Ativo")),
            ],
            options={"verbose_name": "Centro de Custo", "verbose_name_plural": "Centros de Custo", "ordering": ["codigo", "nome"]},
        ),
        migrations.CreateModel(
            name="NivelAprovacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=120, verbose_name="Nome")),
                ("ordem", models.PositiveIntegerField(default=1, verbose_name="Ordem")),
                ("limite_valor", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Limite de Valor")),
                ("ativo", models.BooleanField(default=True, verbose_name="Ativo")),
            ],
            options={"verbose_name": "Nível de Aprovação", "verbose_name_plural": "Níveis de Aprovação", "ordering": ["ordem", "nome"]},
        ),
        migrations.CreateModel(
            name="DocumentoVenda",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tipo_documento", models.CharField(default="FT", max_length=10, verbose_name="Tipo de Documento")),
                ("numero_documento", models.CharField(blank=True, default="", max_length=50, verbose_name="Número do Documento")),
                ("data_emissao", models.DateField(default=django.utils.timezone.localdate, verbose_name="Data de Emissão")),
                ("data_vencimento", models.DateField(blank=True, null=True, verbose_name="Data de Vencimento")),
                ("estado", models.CharField(choices=[("rascunho", "Rascunho"), ("emitido", "Emitido"), ("pago", "Pago"), ("anulado", "Anulado")], default="emitido", max_length=20, verbose_name="Estado")),
                ("subtotal", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Subtotal")),
                ("total_iva", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="IVA")),
                ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Total")),
                ("saldo_aberto", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Saldo em Aberto")),
                ("observacoes", models.TextField(blank=True, default="", verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("centro_custo", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documentos", to="Elion.centrocusto")),
                ("cliente", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="documentos", to="Elion.cliente")),
                ("criado_por", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documentos_venda_criados", to=settings.AUTH_USER_MODEL)),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="documentos_venda", to="Elion.empresa")),
                ("serie", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="documentos", to="Elion.seriedocumento")),
                ("template", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documentos", to="Elion.templatedocumento")),
                ("vendedor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documentos", to="Elion.vendedor")),
            ],
            options={"verbose_name": "Documento de Venda", "verbose_name_plural": "Documentos de Venda", "ordering": ["-data_emissao", "-id"]},
        ),
        migrations.CreateModel(
            name="DocumentoVendaLinha",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("descricao", models.CharField(max_length=255, verbose_name="Descrição")),
                ("quantidade", models.DecimalField(decimal_places=2, default=Decimal("1.00"), max_digits=12, verbose_name="Quantidade")),
                ("preco_unitario", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Preço Unitário")),
                ("taxa_iva", models.DecimalField(decimal_places=2, default=Decimal("23.00"), max_digits=5, verbose_name="Taxa IVA")),
                ("subtotal", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Subtotal")),
                ("valor_iva", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Valor IVA")),
                ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Total")),
                ("artigo", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="linhas_documento", to="Elion.artigo")),
                ("documento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="linhas", to="Elion.documentovenda")),
            ],
            options={"verbose_name": "Linha de Documento", "verbose_name_plural": "Linhas de Documento", "ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="RecebimentoCliente",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("data", models.DateField(default=django.utils.timezone.localdate, verbose_name="Data")),
                ("valor", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12, verbose_name="Valor")),
                ("metodo", models.CharField(default="Transferência", max_length=50, verbose_name="Método")),
                ("observacao", models.TextField(blank=True, default="", verbose_name="Observação")),
                ("documento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recebimentos", to="Elion.documentovenda")),
            ],
            options={"verbose_name": "Recebimento de Cliente", "verbose_name_plural": "Recebimentos de Cliente", "ordering": ["-data", "-id"]},
        ),
        migrations.AlterUniqueTogether(name="seriedocumento", unique_together={("empresa", "codigo", "ano")}),
    ]
