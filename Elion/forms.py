from django import forms
from django.contrib.auth.models import User

from .models import (
    Fornecedor, Funcionario, Frota, Combustivel,
    Empresa, UsuarioSistema, Lancamento, LancamentoCombustivel
)


class FornecedorForm(forms.ModelForm):
    class Meta:
        model = Fornecedor
        fields = ['nif', 'nome', 'iban', 'contato', 'responsavel', 'email', 'morada', 'conselho', 'caixa_postal']


class FuncionarioForm(forms.ModelForm):
    class Meta:
        model = Funcionario
        fields = ['nome', 'contato', 'email']


class FrotaForm(forms.ModelForm):
    class Meta:
        model = Frota
        fields = ['matricula', 'seguro', 'seguradora', 'inspecao']
        widgets = {
            'seguro': forms.DateInput(attrs={'type': 'date'}),
            'inspecao': forms.DateInput(attrs={'type': 'date'}),
        }


class CombustivelForm(forms.ModelForm):
    class Meta:
        model = Combustivel
        fields = ['nome']


class EmpresaForm(forms.ModelForm):
    class Meta:
        model = Empresa
        fields = ['nif', 'nome', 'morada', 'caixa_postal', 'cidade', 'contato', 'email']


class UsuarioSistemaForm(forms.ModelForm):
    username = forms.CharField(label='Usuário')
    password = forms.CharField(label='Senha', widget=forms.PasswordInput)

    class Meta:
        model = UsuarioSistema
        fields = ['nome', 'contato', 'email_recuperacao', 'empresa']

    def save(self, commit=True):
        instance = super().save(commit=False)

        if not instance.pk:
            user = User.objects.create_user(
                username=self.cleaned_data['username'],
                password=self.cleaned_data['password']
            )
            instance.user = user
        else:
            user = instance.user
            user.username = self.cleaned_data['username']
            if self.cleaned_data['password']:
                user.set_password(self.cleaned_data['password'])
            if commit:
                user.save()

        if commit:
            instance.save()

        return instance


class LancamentoForm(forms.ModelForm):
    class Meta:
        model = Lancamento
        fields = ['data_emissao', 'numero_fatura', 'fornecedor', 'dinheiro', 'cartao']
        widgets = {
            'data_emissao': forms.DateInput(attrs={'type': 'date'}),
        }


class LancamentoCombustivelForm(forms.ModelForm):
    class Meta:
        model = LancamentoCombustivel
        fields = [
            'combustivel', 'frota', 'km_inicio', 'km_final',
            'litro', 'valor_litro', 'valor_total'
        ]