ATUALIZAÇÃO - LOGIN MAIA E PRESERVAÇÃO DA BASE

1. NÃO SUBSTITUIR o ficheiro db.sqlite3.
   Este pacote foi preparado para manter os lançamentos já existentes.

2. Faça backup da base atual antes de atualizar:
   copy db.sqlite3 db_backup.sqlite3

3. Copie apenas as pastas e ficheiros do código para cima do projeto atual.

4. Depois execute:
   python manage.py migrate
   python manage.py runserver

O que foi ajustado:
- login agora usa apenas utilizador e senha
- logo do login vem da pasta static/logo.png
- nome do sistema atualizado para Elion One ERP
- login mais bonito e profissional
- migration para garantir o utilizador Maia com perfil administrador total
- permissões do Maia mantidas como acesso total

Importante:
- se já existir o utilizador Maia na sua base, a migration reforça o perfil administrativo
- os lançamentos existentes são preservados porque a base atual deve ser mantida


Atualização adicional:
- email do Maia corrigido para simonemai@hotmail.com
- recuperação de senha via popup adicionada
- base db.sqlite3 incluída no pacote
- para envio real por e-mail/SMS é necessária configuração de SMTP/API SMS.
