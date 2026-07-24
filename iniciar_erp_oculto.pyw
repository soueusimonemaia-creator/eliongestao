import os
import atexit
import threading
import time
import webbrowser
from waitress import serve

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp.settings')

from erp.wsgi import application
from Elion.backup_utils import create_local_backup


def abrir_navegador():
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:8000/')


if __name__ == '__main__':
    if os.environ.get('AUTO_BACKUP_ON_START', '1'):
        create_local_backup('abrir')
    atexit.register(lambda: create_local_backup('fechar'))
    threading.Thread(target=abrir_navegador, daemon=True).start()
    serve(application, host='127.0.0.1', port=8000)
