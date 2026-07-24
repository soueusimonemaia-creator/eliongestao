
from __future__ import annotations
from pathlib import Path
from datetime import datetime
import shutil
from django.conf import settings

def create_local_backup(reason: str = "manual") -> Path:
    backup_dir = Path(getattr(settings, "BACKUP_DIR", Path.home() / "Desktop" / "Elion" / "Backup"))
    backup_dir.mkdir(parents=True, exist_ok=True)

    db_path = Path(settings.DATABASES["default"]["NAME"])
    if not db_path.is_absolute():
        db_path = Path(settings.BASE_DIR) / db_path

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = backup_dir / f"{db_path.stem}_{reason}_{stamp}{db_path.suffix}"
    shutil.copy2(db_path, target)
    return target
