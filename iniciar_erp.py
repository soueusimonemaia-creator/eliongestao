import os
import atexit
from waitress import serve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "erp.settings")

from erp.wsgi import application
from Elion.backup_utils import create_local_backup

serve(application, host="127.0.0.1", port=8000)