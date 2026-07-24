
Pacote completo do ERP com base SQLite preservada.

O que já vem neste pacote:
- dados do db.sqlite3 incluídos;
- lançamentos já feitos da ML AGRO preservados;
- utilizador Maia mantido como admin/master;
- proteção para ninguém excluir o Maia;
- backup local com comando:
  python manage.py backup_elion
- backup automático ao abrir e ao fechar usando:
  iniciar_erp.py
  iniciar_erp_oculto.pyw

Como usar:
1. extraia o ZIP;
2. abra CMD na pasta do projeto;
3. instale dependências:
   pip install -r requirements.txt
4. rode:
   python manage.py runserver

Acesso:
- base atual vinda do arquivo db.sqlite3 incluído no pacote.
- empresa real: ML II Agro-Serviços, Lda
- empresa de teste: Simone Maia

Backup local:
- pasta: Desktop\Elion\Backup
- manual:
  python manage.py backup_elion
