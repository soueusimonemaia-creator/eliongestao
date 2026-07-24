# create_superuser.py
import os
import django

# Configura o Django para usar as settings do projeto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Dados do superuser master
username = 'SimoneMaia'
email = 'simonemai@hotmail.com'
password = 'Sophia@01'

# Cria o superuser apenas se não existir
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' criado com sucesso!")
else:
    print(f"Usuário '{username}' já existe.")