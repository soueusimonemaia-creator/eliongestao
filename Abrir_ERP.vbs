Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

pasta = fso.GetParentFolderName(WScript.ScriptFullName)
script = pasta & "\iniciar_erp_janela.pyw"

' Abre sem janela de CMD. Ao fechar a janela do sistema, o servidor local também é encerrado.
comando = "pyw.exe """ & script & """"
shell.Run comando, 0, False
