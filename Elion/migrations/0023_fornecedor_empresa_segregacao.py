from django.db import migrations, models
import django.db.models.deletion


def atribuir_empresa_fornecedores(apps, schema_editor):
    Fornecedor = apps.get_model('Elion', 'Fornecedor')
    Empresa = apps.get_model('Elion', 'Empresa')
    Lancamento = apps.get_model('Elion', 'Lancamento')

    primeira_empresa = Empresa.objects.order_by('id').first()
    for fornecedor in Fornecedor.objects.all().order_by('id'):
        empresa_id = (
            Lancamento.objects.filter(fornecedor_id=fornecedor.id, empresa_id__isnull=False)
            .order_by('empresa_id', 'id')
            .values_list('empresa_id', flat=True)
            .first()
        )
        if not empresa_id and primeira_empresa:
            empresa_id = primeira_empresa.id
        if empresa_id and fornecedor.empresa_id != empresa_id:
            fornecedor.empresa_id = empresa_id
            fornecedor.save(update_fields=['empresa'])


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0022_fornecedor_campos_crm'),
    ]

    operations = [
        migrations.AddField(
            model_name='fornecedor',
            name='empresa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='fornecedores', to='Elion.empresa', verbose_name='Empresa'),
        ),
        migrations.RunPython(atribuir_empresa_fornecedores, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='fornecedor',
            name='nif',
            field=models.CharField(max_length=50, verbose_name='Contribuinte'),
        ),
        migrations.AddConstraint(
            model_name='fornecedor',
            constraint=models.UniqueConstraint(fields=('empresa', 'nif'), name='uniq_fornecedor_empresa_nif'),
        ),
    ]
