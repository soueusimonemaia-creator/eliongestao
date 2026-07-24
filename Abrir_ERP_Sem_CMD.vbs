Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

pasta = fso.GetParentFolderName(WScript.ScriptFullName)
comando = "cmd /c cd /d """ & pasta & """ && pyw iniciar_erp_oculto.pyw"

shell.Run comando, 0, False
