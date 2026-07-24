"""
Abre o Elion Gestão sem janela de CMD, em uma janela própria do navegador.
Quando essa janela é fechada, o servidor local é encerrado e um backup local é criado.
"""
import os
import sys
import time
import socket
import shutil
import signal
import tempfile
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
URL = "http://127.0.0.1:8000/"
PORT = 8000


def criar_backup(motivo: str) -> None:
    try:
        os.chdir(BASE_DIR)
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "erp.settings")
        from Elion.backup_utils import create_local_backup
        create_local_backup(motivo)
    except Exception:
        # Não impede o sistema de abrir/fechar se o backup falhar.
        pass


def porta_aberta(porta: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", porta), timeout=0.5):
            return True
    except OSError:
        return False


def aguardar_servidor(timeout: int = 30) -> bool:
    fim = time.time() + timeout
    while time.time() < fim:
        if porta_aberta(PORT):
            return True
        time.sleep(0.5)
    return False


def localizar_navegador() -> str | None:
    candidatos = [
        os.environ.get("LOCALAPPDATA", "") + r"\Microsoft\Edge\Application\msedge.exe",
        os.environ.get("PROGRAMFILES", "") + r"\Microsoft\Edge\Application\msedge.exe",
        os.environ.get("PROGRAMFILES(X86)", "") + r"\Microsoft\Edge\Application\msedge.exe",
        os.environ.get("LOCALAPPDATA", "") + r"\Google\Chrome\Application\chrome.exe",
        os.environ.get("PROGRAMFILES", "") + r"\Google\Chrome\Application\chrome.exe",
        os.environ.get("PROGRAMFILES(X86)", "") + r"\Google\Chrome\Application\chrome.exe",
        shutil.which("msedge"),
        shutil.which("chrome"),
    ]
    for caminho in candidatos:
        if caminho and Path(caminho).exists():
            return caminho
    return None


def iniciar_servidor() -> subprocess.Popen:
    script_servidor = BASE_DIR / "iniciar_erp.py"
    creationflags = 0
    startupinfo = None
    if os.name == "nt":
        creationflags = subprocess.CREATE_NO_WINDOW
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    return subprocess.Popen(
        [sys.executable, str(script_servidor)],
        cwd=str(BASE_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creationflags,
        startupinfo=startupinfo,
    )


def abrir_janela_navegador() -> subprocess.Popen | None:
    navegador = localizar_navegador()
    if not navegador:
        # Fallback: abre no navegador padrão. Neste modo não é possível detectar o fechamento.
        import webbrowser
        webbrowser.open(URL)
        return None

    perfil_temp = Path(tempfile.mkdtemp(prefix="elion_gestao_"))
    return subprocess.Popen([
        navegador,
        f"--app={URL}",
        f"--user-data-dir={perfil_temp}",
        "--no-first-run",
        "--disable-extensions",
    ])


def encerrar_servidor(proc: subprocess.Popen | None) -> None:
    if not proc or proc.poll() is not None:
        return
    try:
        proc.terminate()
        proc.wait(timeout=8)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


if __name__ == "__main__":
    os.chdir(BASE_DIR)
    criar_backup("abrir")

    servidor = None
    servidor_iniciado_por_mim = False
    if not porta_aberta(PORT):
        servidor = iniciar_servidor()
        servidor_iniciado_por_mim = True
        aguardar_servidor()

    janela = abrir_janela_navegador()

    if janela is not None:
        # Quando a janela/app do navegador for fechada, o servidor também será fechado.
        janela.wait()
        criar_backup("fechar")
        if servidor_iniciado_por_mim:
            encerrar_servidor(servidor)
    else:
        # Sem Edge/Chrome detectável, mantém o comportamento antigo: abre no navegador padrão.
        pass
