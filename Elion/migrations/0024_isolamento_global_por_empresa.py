from django.db import migrations, models
import django.db.models.deletion


def atribuir_empresa_registos(apps, schema_editor):
    Empresa = apps.get_model('Elion', 'Empresa')
    Lancamento = apps.get_model('Elion', 'Lancamento')
    DocumentoVenda = apps.get_model('Elion', 'DocumentoVenda')
    Funcionario = apps.get_model('Elion', 'Funcionario')
    Frota = apps.get_model('Elion', 'Frota')
    Combustivel = apps.get_model('Elion', 'Combustivel')
    Cliente = apps.get_model('Elion', 'Cliente')
    Vendedor = apps.get_model('Elion', 'Vendedor')
    Artigo = apps.get_model('Elion', 'Artigo')

    empresa_padrao = Empresa.objects.order_by('id').first()
    empresa_docs = DocumentoVenda.objects.exclude(empresa_id=None).order_by('empresa_id').values_list('empresa_id', flat=True).first()
    empresa_lanc = Lancamento.objects.exclude(empresa_id=None).order_by('empresa_id').values_list('empresa_id', flat=True).first()
    empresa_id = empresa_lanc or empresa_docs or (empresa_padrao.id if empresa_padrao else None)
    if not empresa_id:
        return

    for model in [Funcionario, Frota, Combustivel, Cliente, Vendedor, Artigo]:
        for obj in model.objects.filter(empresa_id__isnull=True).only('id'):
            obj.empresa_id = empresa_id
            obj.save(update_fields=['empresa'])


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0023_fornecedor_empresa_segregacao'),
    ]

    operations = [
        migrations.AddField(
            model_name='funcionario',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='funcionarios', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.AddField(
            model_name='frota',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='frotas', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.AddField(
            model_name='combustivel',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='combustiveis', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.AddField(
            model_name='cliente',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='clientes', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.AddField(
            model_name='vendedor',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='vendedores', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.AddField(
            model_name='artigo',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='artigos', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.RunPython(atribuir_empresa_registos, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='frota',
            name='matricula',
            field=models.CharField(max_length=50, verbose_name='Matrícula'),
        ),
        migrations.AlterField(
            model_name='combustivel',
            name='nome',
            field=models.CharField(max_length=100, verbose_name='Nome'),
        ),
        migrations.AlterField(
            model_name='cliente',
            name='nif',
            field=models.CharField(max_length=50, verbose_name='Contribuinte'),
        ),
        migrations.AlterField(
            model_name='artigo',
            name='codigo',
            field=models.CharField(max_length=50, verbose_name='Código'),
        ),
        migrations.AddConstraint(
            model_name='frota',
            constraint=models.UniqueConstraint(fields=('empresa', 'matricula'), name='uniq_frota_empresa_matricula'),
        ),
        migrations.AddConstraint(
            model_name='combustivel',
            constraint=models.UniqueConstraint(fields=('empresa', 'nome'), name='uniq_combustivel_empresa_nome'),
        ),
        migrations.AddConstraint(
            model_name='cliente',
            constraint=models.UniqueConstraint(fields=('empresa', 'nif'), name='uniq_cliente_empresa_nif'),
        ),
        migrations.AddConstraint(
            model_name='vendedor',
            constraint=models.UniqueConstraint(fields=('empresa', 'nome'), name='uniq_vendedor_empresa_nome'),
        ),
        migrations.AddConstraint(
            model_name='artigo',
            constraint=models.UniqueConstraint(fields=('empresa', 'codigo'), name='uniq_artigo_empresa_codigo'),
        ),
    ]
