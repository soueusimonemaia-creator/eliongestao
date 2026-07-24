
from django.core.management.base import BaseCommand
from Elion.backup_utils import create_local_backup

class Command(BaseCommand):
    help = "Cria backup local do banco do ERP"

    def add_arguments(self, parser):
        parser.add_argument("--motivo", default="manual")

    def handle(self, *args, **options):
        path = create_local_backup(options["motivo"])
        self.stdout.write(self.style.SUCCESS(f"Backup criado em: {path}"))
