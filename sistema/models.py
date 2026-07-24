from django.db import models

# ================= EMPRESA =================
class Empresa(models.Model):
    nome = models.CharField(max_length=100)
    nif = models.CharField(max_length=20)
    morada = models.CharField(max_length=200)
    contato = models.CharField(max_length=20)

    def __str__(self):
        return self.nome


# ================= FORNECEDOR =================
class Fornecedor(models.Model):
    nome = models.CharField(max_length=100)
    nif = models.CharField(max_length=20)
    morada = models.CharField(max_length=200)
    codigo_postal = models.CharField(max_length=10)
    contato = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.nome


# ================= FROTA =================
class Frota(models.Model):
    matricula = models.CharField(max_length=20)
    modelo = models.CharField(max_length=50)
    data_inspecao = models.DateField()
    data_seguro = models.DateField()

    def __str__(self):
        return self.matricula


# ================= FUNCIONARIO =================
class Funcionario(models.Model):
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.nome


# ================= COMBUSTIVEL =================
class Combustivel(models.Model):
    tipo = models.CharField(max_length=50)

    def __str__(self):
        return self.tipo