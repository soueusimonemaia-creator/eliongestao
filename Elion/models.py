from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone

User = get_user_model()


def _is_maia_username(value):
    return (value or "").strip().casefold() == "maia"


class Fornecedor(models.Model):
    empresa = models.ForeignKey(
        "Empresa",
        on_delete=models.CASCADE,
        related_name="fornecedores",
        verbose_name="Empresa",
        null=True,
        blank=True,
    )
    nif = models.CharField("Contribuinte", max_length=50)
    nome = models.CharField("Nome", max_length=150)
    iban = models.CharField("IBAN", max_length=50, blank=True, default="")
    contato = models.CharField("Contato", max_length=100, blank=True, default="")
    responsavel = models.CharField("Responsável", max_length=150, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, null=True)
    morada = models.CharField("Morada", max_length=255, blank=True, default="")
    conselho = models.CharField("Conselho", max_length=120, blank=True, default="")
    caixa_postal = models.CharField("Caixa Postal", max_length=100, blank=True, default="")
    telefone = models.CharField("Telefone", max_length=50, blank=True, default="")

    class Meta:
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "nif"], name="uniq_fornecedor_empresa_nif"),
        ]

    def __str__(self):
        return f"{self.nome} ({self.nif})"


class Funcionario(models.Model):
    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="funcionarios", verbose_name="Empresa", null=True, blank=True)
    nome = models.CharField("Nome", max_length=150)
    contato = models.CharField("Telefone", max_length=50, blank=True)
    email = models.EmailField("E-mail", blank=True, null=True)

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Frota(models.Model):
    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="frotas", verbose_name="Empresa", null=True, blank=True)
    matricula = models.CharField("Matrícula", max_length=50)
    marca = models.CharField("Marca", max_length=120, blank=True, default="")
    modelo = models.CharField("Modelo", max_length=120, blank=True, default="")
    combustivel_padrao = models.ForeignKey("Combustivel", on_delete=models.SET_NULL, null=True, blank=True, related_name="frotas_padrao", verbose_name="Combustível Padrão")
    consumo_medio_esperado = models.DecimalField("Consumo Médio Esperado", max_digits=8, decimal_places=2, default=Decimal("0.00"))
    seguro = models.DateField("Seguro", blank=True, null=True)
    seguradora = models.CharField("Seguradora", max_length=150, blank=True)
    inspecao = models.DateField("Inspeção", blank=True, null=True)
    iuc = models.DateField("IUC", blank=True, null=True)
    proxima_revisao = models.DateField("Próxima Revisão", blank=True, null=True)
    observacoes = models.TextField("Observações", blank=True, default="")

    class Meta:
        verbose_name = "Frota"
        verbose_name_plural = "Frotas"
        ordering = ["matricula"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "matricula"], name="uniq_frota_empresa_matricula"),
        ]

    def __str__(self):
        return self.matricula


class Combustivel(models.Model):
    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="combustiveis", verbose_name="Empresa", null=True, blank=True)
    nome = models.CharField("Nome", max_length=100)

    class Meta:
        verbose_name = "Combustível"
        verbose_name_plural = "Combustíveis"
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "nome"], name="uniq_combustivel_empresa_nome"),
        ]

    def __str__(self):
        return self.nome


class Empresa(models.Model):
    nif = models.CharField("Contribuinte", max_length=50, unique=True)
    nome = models.CharField("Nome da Empresa", max_length=150)
    morada = models.CharField("Morada", max_length=255, blank=True, default="")
    caixa_postal = models.CharField("Caixa Postal", max_length=100, blank=True, default="")
    cidade = models.CharField("Cidade", max_length=100, blank=True, default="")
    contato = models.CharField("Telefone", max_length=50, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, null=True)
    logo = models.ImageField("Logo", upload_to="empresas/logos/", blank=True, null=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class UsuarioSistema(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_sistema",
        verbose_name="Usuário Django",
    )
    nome = models.CharField("Nome", max_length=150, blank=True, default="")
    contato = models.CharField("Contato", max_length=50, blank=True, default="")
    email_recuperacao = models.EmailField("E-mail de recuperação", blank=True, null=True)
    empresas = models.ManyToManyField(
        Empresa,
        blank=True,
        related_name="usuarios_sistema",
        verbose_name="Empresas",
    )
    administrador_geral = models.BooleanField("Administrador Geral", default=False)
    permissoes_json = models.TextField("Permissões JSON", blank=True, default="")

    class Meta:
        verbose_name = "Usuário do Sistema"
        verbose_name_plural = "Usuários do Sistema"
        ordering = ["nome", "id"]

    def __str__(self):
        return self.nome or self.user.username

    @property
    def is_admin(self):
        return bool(self.user.is_staff or self.user.is_superuser or self.administrador_geral)

    def get_permissoes(self):
        import json
        if not self.permissoes_json:
            return {}
        try:
            return json.loads(self.permissoes_json) or {}
        except Exception:
            return {}

    def set_permissoes(self, permissoes):
        import json
        self.permissoes_json = json.dumps(permissoes or {}, ensure_ascii=False)


class Lancamento(models.Model):
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,
        related_name="lancamentos",
        verbose_name="Empresa",
        null=True,
        blank=True,
    )
    data_emissao = models.DateField("Data de Emissão")
    numero_fatura = models.CharField("Número da Fatura", max_length=100)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.PROTECT,
        related_name="lancamentos",
        verbose_name="Fornecedor",
    )
    dinheiro = models.DecimalField(
        "Dinheiro",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    cartao = models.DecimalField(
        "Cartão",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    transferencia = models.DecimalField(
        "Transferência",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    mbway = models.DecimalField(
        "MBWay",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    nota_credito = models.DecimalField(
        "Nota de Crédito",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    status_pagamento = models.CharField("Status do Pagamento", max_length=20, default="Em aberto")
    valor_fatura = models.DecimalField(
        "Valor da Fatura",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    data_vencimento = models.DateField("Data de Vencimento", blank=True, null=True)
    saldo_aberto = models.DecimalField(
        "Saldo em Aberto",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    data_pagamento = models.DateField("Data do Pagamento", blank=True, null=True)
    total = models.DecimalField(
        "Total Pago",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lancamentos_criados",
        verbose_name="Criado por",
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Lançamento"
        verbose_name_plural = "Lançamentos"
        ordering = ["-data_emissao", "-id"]

    def __str__(self):
        return f"{self.numero_fatura} - {self.fornecedor.nome if self.fornecedor else ''}"

    def save(self, *args, **kwargs):
        dinheiro = self.dinheiro or Decimal("0.00")
        cartao = self.cartao or Decimal("0.00")
        transferencia = self.transferencia or Decimal("0.00")
        mbway = self.mbway or Decimal("0.00")
        nota_credito = self.nota_credito or Decimal("0.00")
        total_pago = dinheiro + cartao + transferencia + mbway - nota_credito
        self.total = total_pago

        valor_fatura = self.valor_fatura or Decimal("0.00")
        possui_credito = nota_credito > Decimal("0.00")
        possui_pagamento = any(v > Decimal("0.00") for v in [dinheiro, cartao, transferencia, mbway])
        possui_movimento = possui_pagamento or possui_credito or total_pago != Decimal("0.00") or valor_fatura > Decimal("0.00")
        possui_vencimento = bool(self.data_vencimento)

        if not possui_vencimento:
            self.saldo_aberto = Decimal("0.00")
            self.status_pagamento = "Paga" if possui_movimento else "Paga"
            self.data_pagamento = self.data_pagamento or self.data_emissao or timezone.localdate()
        else:
            saldo = valor_fatura - total_pago
            if saldo < Decimal("0.00"):
                saldo = Decimal("0.00")
            self.saldo_aberto = saldo

            if saldo == Decimal("0.00") or (possui_credito and not possui_pagamento):
                self.status_pagamento = "Paga"
                self.data_pagamento = self.data_pagamento or timezone.localdate()
                if possui_credito and not possui_pagamento:
                    self.saldo_aberto = Decimal("0.00")
            elif total_pago != Decimal("0.00"):
                self.status_pagamento = "Parcial"
                self.data_pagamento = None
            else:
                self.status_pagamento = "Em aberto"
                self.data_pagamento = None

        super().save(*args, **kwargs)


class LancamentoCombustivel(models.Model):
    lancamento = models.ForeignKey(
        Lancamento,
        on_delete=models.CASCADE,
        related_name="itens_combustivel",
        verbose_name="Lançamento",
    )
    combustivel = models.ForeignKey(
        Combustivel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="itens_lancamento",
        verbose_name="Combustível",
    )
    frota = models.ForeignKey(
        Frota,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="itens_combustivel",
        verbose_name="Frota",
    )
    km_inicio = models.IntegerField("KM Início", default=0)
    km_final = models.IntegerField("KM Final", default=0)
    km_total = models.IntegerField("KM Total", default=0)
    litro = models.DecimalField(
        "Litro (L)",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    valor_litro = models.DecimalField(
        "Valor por Litro",
        max_digits=12,
        decimal_places=3,
        default=Decimal("0.000"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    valor_total = models.DecimalField(
        "Valor Total",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    class Meta:
        verbose_name = "Item de Combustível"
        verbose_name_plural = "Itens de Combustível"
        ordering = ["id"]

    def __str__(self):
        combustivel = self.combustivel.nome if self.combustivel else "Sem combustível"
        return f"{combustivel} - {self.lancamento.numero_fatura if self.lancamento else ''}"

    def save(self, *args, **kwargs):
        self.km_total = (self.km_final or 0) - (self.km_inicio or 0)
        super().save(*args, **kwargs)


class ManutencaoFrota(models.Model):
    lancamento = models.ForeignKey(
        Lancamento,
        on_delete=models.CASCADE,
        related_name="itens_manutencao",
        verbose_name="Lançamento",
    )
    frota = models.ForeignKey(
        Frota,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="itens_manutencao",
        verbose_name="Frota",
    )
    km_inicio = models.IntegerField("KM Início", default=0)
    km_final = models.IntegerField("KM Final", default=0)
    km_total = models.IntegerField("KM Total", default=0)
    descricao = models.CharField("Descrição", max_length=120, blank=True, default="Manutenção")
    valor = models.DecimalField(
        "Valor",
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    observacao = models.TextField("Observação", blank=True, default="")

    class Meta:
        verbose_name = "Manutenção de Frota"
        verbose_name_plural = "Manutenções de Frota"
        ordering = ["id"]

    def __str__(self):
        return f"{self.frota.matricula if self.frota else 'Sem matrícula'} - {self.lancamento.numero_fatura if self.lancamento else ''}"

    def save(self, *args, **kwargs):
        self.km_total = (self.km_final or 0) - (self.km_inicio or 0)
        super().save(*args, **kwargs)


class RevisaoFrota(models.Model):
    lancamento = models.ForeignKey(
        Lancamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="itens_revisao",
        verbose_name="Lançamento",
    )
    frota = models.ForeignKey(
        Frota,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisoes",
        verbose_name="Frota",
    )
    funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisoes_frota",
        verbose_name="Funcionário",
    )
    data_ultima_revisao = models.DateField("Data da Última Revisão", default=timezone.localdate)
    km_ultima_revisao = models.IntegerField("KM da Última Revisão", default=0)
    km_rodados = models.IntegerField("KM Rodados", default=0)
    kms_previsao = models.IntegerField("KMs de Previsão", default=0)
    km_para_revisao = models.IntegerField("KM para Fazer a Revisão", default=0)
    observacao = models.TextField("Observação", blank=True, default="")
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Revisão de Frota"
        verbose_name_plural = "Revisões de Frota"
        ordering = ["-data_ultima_revisao", "-id"]

    def __str__(self):
        return f"{self.frota.matricula if self.frota else 'Sem matrícula'} - {self.data_ultima_revisao}"

    @property
    def marca(self):
        return getattr(self.frota, 'marca', '') or ''

    @property
    def modelo(self):
        return getattr(self.frota, 'modelo', '') or ''

    def save(self, *args, **kwargs):
        self.km_para_revisao = int(self.km_rodados or 0) + int(self.kms_previsao or 0)
        super().save(*args, **kwargs)


class BaixaFatura(models.Model):
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,
        related_name="baixas_faturas",
        verbose_name="Empresa",
        null=True,
        blank=True,
    )
    lancamento = models.ForeignKey(
        Lancamento,
        on_delete=models.CASCADE,
        related_name="baixas_registradas",
        verbose_name="Lançamento",
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="baixas_faturas_registradas",
        verbose_name="Utilizador",
    )
    data_baixa = models.DateField("Data da Baixa", default=timezone.localdate)
    fornecedor_snapshot = models.CharField("Fornecedor", max_length=150, blank=True, default="")
    numero_fatura_snapshot = models.CharField("Número da Fatura", max_length=100, blank=True, default="")
    dinheiro = models.DecimalField("Dinheiro", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    cartao = models.DecimalField("Cartão", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    transferencia = models.DecimalField("Transferência", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    mbway = models.DecimalField("MBWay", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    nota_credito = models.DecimalField("Nota de Crédito", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    total_baixa = models.DecimalField("Total da Baixa", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    saldo_resultante = models.DecimalField("Saldo Resultante", max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    observacao = models.TextField("Observação", blank=True, default="")

    class Meta:
        verbose_name = "Baixa de Fatura"
        verbose_name_plural = "Baixas de Faturas"
        ordering = ["-data_baixa", "-id"]

    def __str__(self):
        return f"{self.numero_fatura_snapshot or self.lancamento_id} - {self.data_baixa}"

    @property
    def forma_pagamento(self):
        formas = []
        if self.dinheiro and self.dinheiro > 0:
            formas.append("Dinheiro")
        if self.cartao and self.cartao > 0:
            formas.append("Cartão")
        if self.transferencia and self.transferencia > 0:
            formas.append("Transferência")
        if self.mbway and self.mbway > 0:
            formas.append("MBWay")
        if self.nota_credito and self.nota_credito > 0:
            formas.append("Nota de Crédito")
        return ", ".join(formas)




class Cliente(models.Model):
    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="clientes", verbose_name="Empresa", null=True, blank=True)
    nif = models.CharField("Contribuinte", max_length=50)
    nome = models.CharField("Nome", max_length=150)
    morada = models.CharField("Morada", max_length=255, blank=True, default="")
    cidade = models.CharField("Cidade", max_length=100, blank=True, default="")
    telefone = models.CharField("Telefone", max_length=50, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, null=True)
    limite_credito = models.DecimalField("Limite de Crédito", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "nif"], name="uniq_cliente_empresa_nif"),
        ]

    def __str__(self):
        return f"{self.nome} ({self.nif})"


class Vendedor(models.Model):
    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="vendedores", verbose_name="Empresa", null=True, blank=True)
    nome = models.CharField("Nome", max_length=150)
    email = models.EmailField("E-mail", blank=True, null=True)
    telefone = models.CharField("Telefone", max_length=50, blank=True, default="")
    comissao_padrao = models.DecimalField("Comissão %", max_digits=5, decimal_places=2, default=Decimal("0.00"))
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class CategoriaArtigo(models.Model):
    nome = models.CharField("Nome", max_length=120, unique=True)
    descricao = models.TextField("Descrição", blank=True, default="")

    class Meta:
        verbose_name = "Categoria de Artigo"
        verbose_name_plural = "Categorias de Artigos"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Armazem(models.Model):
    codigo = models.CharField("Código", max_length=30, unique=True)
    nome = models.CharField("Nome", max_length=120)
    morada = models.CharField("Morada", max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Armazém"
        verbose_name_plural = "Armazéns"
        ordering = ["codigo", "nome"]

    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class Artigo(models.Model):
    TIPO_CHOICES = (("produto", "Produto"), ("servico", "Serviço"))

    empresa = models.ForeignKey("Empresa", on_delete=models.CASCADE, related_name="artigos", verbose_name="Empresa", null=True, blank=True)
    codigo = models.CharField("Código", max_length=50)
    nome = models.CharField("Nome", max_length=150)
    categoria = models.ForeignKey(CategoriaArtigo, on_delete=models.SET_NULL, null=True, blank=True, related_name="artigos")
    armazem = models.ForeignKey(Armazem, on_delete=models.SET_NULL, null=True, blank=True, related_name="artigos")
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_CHOICES, default="produto")
    preco_venda = models.DecimalField("Preço de Venda", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    preco_custo = models.DecimalField("Preço de Custo", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    taxa_iva_padrao = models.DecimalField("Taxa IVA Padrão", max_digits=5, decimal_places=2, default=Decimal("23.00"))
    unidade_medida = models.CharField("Unidade de Medida", max_length=20, blank=True, default="UN")
    stock_atual = models.DecimalField("Stock Atual", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    stock_minimo = models.DecimalField("Stock Mínimo", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    localizacao_prateleira = models.CharField("Localização na Prateleira", max_length=80, blank=True, default="")
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        verbose_name = "Artigo"
        verbose_name_plural = "Artigos"
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "codigo"], name="uniq_artigo_empresa_codigo"),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class SerieDocumento(models.Model):
    TIPO_CHOICES = (
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
    )

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="series_documentos", null=True, blank=True)
    codigo = models.CharField("Código", max_length=10)
    descricao = models.CharField("Descrição", max_length=120)
    tipo_documento = models.CharField("Tipo de Documento", max_length=10, choices=TIPO_CHOICES, default="FT")
    prefixo_documento = models.CharField("Prefixo do Documento", max_length=20, blank=True, default="")
    usar_ano = models.BooleanField("Usar Ano", default=True)
    separador = models.CharField("Separador", max_length=5, blank=True, default="/")
    casas_numero = models.PositiveIntegerField("Casas do Número", default=4)
    ano = models.IntegerField("Ano", default=timezone.now().year)
    proximo_numero = models.PositiveIntegerField("Próximo Número", default=1)
    codigo_validacao = models.CharField("Código de Validação AT", max_length=20, blank=True, default="")
    ativa = models.BooleanField("Ativa", default=True)

    class Meta:
        verbose_name = "Série de Documento"
        verbose_name_plural = "Séries de Documentos"
        ordering = ["codigo", "ano"]
        unique_together = (("empresa", "codigo", "ano"),)

    def __str__(self):
        return f"{self.codigo}/{self.ano}"

    def gerar_numero(self):
        numero = self.proximo_numero
        self.proximo_numero += 1
        self.save(update_fields=["proximo_numero"])
        prefixo = (self.prefixo_documento or self.codigo or "DOC").strip()
        casas = max(int(self.casas_numero or 4), 1)
        seq = f"{numero:0{casas}d}"
        if self.usar_ano:
            sep = self.separador or "/"
            return f"{prefixo} {self.ano}{sep}{seq}"
        return f"{prefixo} {seq}"


class TemplateDocumento(models.Model):
    nome = models.CharField("Nome", max_length=120, unique=True)
    cabecalho = models.TextField("Cabeçalho", blank=True, default="")
    rodape = models.TextField("Rodapé", blank=True, default="")
    mostrar_logo = models.BooleanField("Mostrar logo", default=True)
    mostrar_iban = models.BooleanField("Mostrar IBAN", default=True)
    observacoes = models.TextField("Observações", blank=True, default="")

    class Meta:
        verbose_name = "Template de Documento"
        verbose_name_plural = "Templates de Documentos"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class CentroCusto(models.Model):
    codigo = models.CharField("Código", max_length=30, unique=True)
    nome = models.CharField("Nome", max_length=120)
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        verbose_name = "Centro de Custo"
        verbose_name_plural = "Centros de Custo"
        ordering = ["codigo", "nome"]

    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class NivelAprovacao(models.Model):
    nome = models.CharField("Nome", max_length=120)
    ordem = models.PositiveIntegerField("Ordem", default=1)
    limite_valor = models.DecimalField("Limite de Valor", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        verbose_name = "Nível de Aprovação"
        verbose_name_plural = "Níveis de Aprovação"
        ordering = ["ordem", "nome"]

    def __str__(self):
        return self.nome


class DocumentoVenda(models.Model):
    ESTADO_CHOICES = (("rascunho", "Rascunho"), ("emitido", "Emitido"), ("pago", "Pago"), ("anulado", "Anulado"))

    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="documentos_venda", null=True, blank=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="documentos")
    vendedor = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos")
    serie = models.ForeignKey(SerieDocumento, on_delete=models.PROTECT, related_name="documentos")
    template = models.ForeignKey(TemplateDocumento, on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos")
    centro_custo = models.ForeignKey(CentroCusto, on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos")
    tipo_documento = models.CharField("Tipo de Documento", max_length=10, default="FT")
    numero_documento = models.CharField("Número do Documento", max_length=50, blank=True, default="")
    data_emissao = models.DateField("Data de Emissão", default=timezone.localdate)
    data_vencimento = models.DateField("Data de Vencimento", null=True, blank=True)
    estado = models.CharField("Estado", max_length=20, choices=ESTADO_CHOICES, default="emitido")
    subtotal = models.DecimalField("Subtotal", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_iva = models.DecimalField("IVA", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField("Total", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    saldo_aberto = models.DecimalField("Saldo em Aberto", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    observacoes = models.TextField("Observações", blank=True, default="")
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="documentos_venda_criados")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Documento de Venda"
        verbose_name_plural = "Documentos de Venda"
        ordering = ["-data_emissao", "-id"]

    def __str__(self):
        return self.numero_documento or f"Documento {self.id}"

    def recalcular_totais(self, guardar=True):
        subtotal = Decimal("0.00")
        total_iva = Decimal("0.00")
        for linha in self.linhas.all():
            subtotal += linha.subtotal
            total_iva += linha.valor_iva
        self.subtotal = subtotal
        self.total_iva = total_iva
        self.total = subtotal + total_iva
        if not self.saldo_aberto:
            self.saldo_aberto = self.total
        if guardar:
            self.save(update_fields=["subtotal", "total_iva", "total", "saldo_aberto", "atualizado_em"])

    def save(self, *args, **kwargs):
        if not self.numero_documento and self.serie_id:
            self.tipo_documento = self.serie.tipo_documento
            self.numero_documento = self.serie.gerar_numero()
        super().save(*args, **kwargs)


class DocumentoVendaLinha(models.Model):
    documento = models.ForeignKey(DocumentoVenda, on_delete=models.CASCADE, related_name="linhas")
    artigo = models.ForeignKey(Artigo, on_delete=models.SET_NULL, null=True, blank=True, related_name="linhas_documento")
    descricao = models.CharField("Descrição", max_length=255)
    quantidade = models.DecimalField("Quantidade", max_digits=12, decimal_places=2, default=Decimal("1.00"))
    preco_unitario = models.DecimalField("Preço Unitário", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    taxa_iva = models.DecimalField("Taxa IVA", max_digits=5, decimal_places=2, default=Decimal("23.00"))
    subtotal = models.DecimalField("Subtotal", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    valor_iva = models.DecimalField("Valor IVA", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField("Total", max_digits=12, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        verbose_name = "Linha de Documento"
        verbose_name_plural = "Linhas de Documento"
        ordering = ["id"]

    def save(self, *args, **kwargs):
        self.subtotal = (self.quantidade or Decimal("0.00")) * (self.preco_unitario or Decimal("0.00"))
        self.valor_iva = (self.subtotal * (self.taxa_iva or Decimal("0.00"))) / Decimal("100.00")
        self.total = self.subtotal + self.valor_iva
        super().save(*args, **kwargs)


class RecebimentoCliente(models.Model):
    documento = models.ForeignKey(DocumentoVenda, on_delete=models.CASCADE, related_name="recebimentos")
    data = models.DateField("Data", default=timezone.localdate)
    valor = models.DecimalField("Valor", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    metodo = models.CharField("Método", max_length=50, default="Transferência")
    observacao = models.TextField("Observação", blank=True, default="")

    class Meta:
        verbose_name = "Recebimento de Cliente"
        verbose_name_plural = "Recebimentos de Cliente"
        ordering = ["-data", "-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        documento = self.documento
        total_recebido = sum((item.valor for item in documento.recebimentos.all()), Decimal("0.00"))
        saldo = documento.total - total_recebido
        if saldo < Decimal("0.00"):
            saldo = Decimal("0.00")
        documento.saldo_aberto = saldo
        documento.estado = "pago" if saldo == Decimal("0.00") else "emitido"
        documento.save(update_fields=["saldo_aberto", "estado", "atualizado_em"])


@receiver(post_save, sender=User)
def criar_ou_atualizar_usuario_sistema(sender, instance, created, **kwargs):
    username_norm = (instance.username or "").strip().casefold()
    alterou_user = False

    if username_norm == "maia":
        if not instance.is_staff:
            instance.is_staff = True
            alterou_user = True
        if not instance.is_superuser:
            instance.is_superuser = True
            alterou_user = True

    if alterou_user:
        instance.save(update_fields=["is_staff", "is_superuser"])

    perfil, perfil_criado = UsuarioSistema.objects.get_or_create(
        user=instance,
        defaults={
            "nome": instance.first_name or instance.username,
            "email_recuperacao": instance.email or None,
            "administrador_geral": bool(instance.is_staff or instance.is_superuser or username_norm == "maia"),
        },
    )

    alterado = False

    nome_padrao = instance.first_name or instance.username
    if created and not perfil.nome:
        perfil.nome = nome_padrao
        alterado = True

    if instance.email and not perfil.email_recuperacao:
        perfil.email_recuperacao = instance.email
        alterado = True

    admin_flag = bool(instance.is_staff or instance.is_superuser or username_norm == "maia")
    if perfil.administrador_geral != admin_flag:
        perfil.administrador_geral = admin_flag
        alterado = True

    if alterado:
        perfil.save()

    if perfil.administrador_geral:
        perfil.empresas.set(Empresa.objects.all())


@receiver(pre_delete, sender=User)
def impedir_exclusao_user_maia(sender, instance, **kwargs):
    if _is_maia_username(getattr(instance, "username", "")):
        raise ValidationError("O utilizador Maia é protegido e não pode ser excluído.")


@receiver(pre_delete, sender=UsuarioSistema)
def impedir_exclusao_perfil_maia(sender, instance, **kwargs):
    user = getattr(instance, "user", None)
    if user and _is_maia_username(getattr(user, "username", "")):
        raise ValidationError("O utilizador Maia é protegido e não pode ser excluído.")

class ConfiguracaoFiscal(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="configuracoes_fiscais", null=True, blank=True)
    regime_iva = models.CharField("Regime de IVA", max_length=50, blank=True, default="Regime normal")
    iva_caixa = models.BooleanField("IVA de Caixa", default=False)
    taxa_normal = models.DecimalField("Taxa normal IVA", max_digits=5, decimal_places=2, default=Decimal("23.00"))
    taxa_intermedia = models.DecimalField("Taxa intermédia IVA", max_digits=5, decimal_places=2, default=Decimal("13.00"))
    taxa_reduzida = models.DecimalField("Taxa reduzida IVA", max_digits=5, decimal_places=2, default=Decimal("6.00"))
    retencao_padrao = models.DecimalField("Retenção padrão", max_digits=5, decimal_places=2, default=Decimal("0.00"))
    motivo_isencao = models.CharField("Motivo de isenção", max_length=60, blank=True, default="M99")
    moeda = models.CharField("Moeda", max_length=10, blank=True, default="EUR")
    software_certificado = models.CharField("Software certificado", max_length=120, blank=True, default="")
    exportar_qr_atcud = models.BooleanField("Exportar QR/ATCUD", default=True)
    observacoes_legais = models.TextField("Observações legais", blank=True, default="")
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuração Fiscal"
        verbose_name_plural = "Configurações Fiscais"
        ordering = ["-id"]

    def __str__(self):
        if self.empresa_id and getattr(self, "empresa", None):
            return f"Fiscal - {self.empresa.nome}"
        return "Configuração Fiscal"



class PasswordResetCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_reset_codes")
    code = models.CharField("Código", max_length=6)
    channel = models.CharField("Canal", max_length=20, blank=True, default="email")
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    expires_at = models.DateTimeField("Expira em")
    used = models.BooleanField("Usado", default=False)

    class Meta:
        verbose_name = "Código de recuperação"
        verbose_name_plural = "Códigos de recuperação"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user.username} - {self.code}"


class ConfiguracaoSistema(models.Model):
    nome_sistema = models.CharField("Nome do Sistema", max_length=120, default="Elion Gestão")
    subtitulo_login = models.CharField("Subtítulo do Login", max_length=255, blank=True, default="Faturação, financeiro, frota e combustível num único sistema")
    logo_login = models.ImageField("Logo do Login", upload_to="configuracao/", blank=True, null=True)
    logo_paineis = models.ImageField("Logo dos Painéis", upload_to="configuracao/", blank=True, null=True)
    smtp_host = models.CharField("SMTP Host", max_length=150, blank=True, default="")
    smtp_porta = models.PositiveIntegerField("SMTP Porta", default=587)
    smtp_user = models.CharField("SMTP Utilizador", max_length=150, blank=True, default="")
    smtp_password = models.CharField("SMTP Palavra-passe", max_length=255, blank=True, default="")
    sms_provider = models.CharField("Fornecedor SMS", max_length=100, blank=True, default="")
    sms_token = models.CharField("Token SMS", max_length=255, blank=True, default="")
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuração do Sistema"
        verbose_name_plural = "Configurações do Sistema"

    def __str__(self):
        return self.nome_sistema or "Configuração do Sistema"
