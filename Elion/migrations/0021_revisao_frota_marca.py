from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('Elion', '0020_manutencao_descricao'),
    ]

    operations = [
        migrations.AddField(
            model_name='frota',
            name='marca',
            field=models.CharField(blank=True, default='', max_length=120, verbose_name='Marca'),
        ),
        migrations.CreateModel(
            name='RevisaoFrota',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_ultima_revisao', models.DateField(default=django.utils.timezone.localdate, verbose_name='Data da Última Revisão')),
                ('km_ultima_revisao', models.IntegerField(default=0, verbose_name='KM da Última Revisão')),
                ('km_rodados', models.IntegerField(default=0, verbose_name='KM Rodados')),
                ('kms_previsao', models.IntegerField(default=0, verbose_name='KMs de Previsão')),
                ('km_para_revisao', models.IntegerField(default=0, verbose_name='KM para Fazer a Revisão')),
                ('observacao', models.TextField(blank=True, default='', verbose_name='Observação')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('frota', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='revisoes', to='Elion.frota', verbose_name='Frota')),
                ('funcionario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='revisoes_frota', to='Elion.funcionario', verbose_name='Funcionário')),
                ('lancamento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='itens_revisao', to='Elion.lancamento', verbose_name='Lançamento')),
            ],
            options={
                'verbose_name': 'Revisão de Frota',
                'verbose_name_plural': 'Revisões de Frota',
                'ordering': ['-data_ultima_revisao', '-id'],
            },
        ),
    ]
