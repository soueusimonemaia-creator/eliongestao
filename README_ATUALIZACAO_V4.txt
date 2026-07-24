ERP v4 - atualização unificada

Esta versão mantém a base de dados existente (db.sqlite3) e acrescenta:
- Clientes
- Vendedores
- Artigos com localização na prateleira
- Séries de documentos
- Templates de documentos
- Centro de custos
- Níveis de aprovação
- Faturação de clientes
- PDF de documentos com logo da empresa
- Extrato de clientes
- Extrato de fornecedores
- Campos extra de fornecedor: IBAN, morada e telefone
- Campos extra de frota: modelo, combustível padrão, consumo esperado, IUC, próxima revisão e observações

IMPORTANTE
1) Faça uma cópia do ficheiro db.sqlite3 antes de atualizar.
2) Depois de substituir os ficheiros, execute:

python manage.py migrate
python manage.py runserver

URLS novas principais:
- /faturacao/clientes/
- /relatorios/extrato-clientes/
- /relatorios/extrato-fornecedores/

Observação:
Esta entrega adiciona a base estrutural e operacional principal destas rotinas. Algumas rotinas legais avançadas (ex.: SAF-T, ATCUD, comunicação AT, guias e importações massivas) ainda precisam de implementação complementar antes de certificação/comercialização plena.


ATUALIZAÇÃO EXTRA V4.1
- Séries personalizáveis: agora a empresa pode manter a série já usada internamente.
- Cada série permite definir: código, prefixo do documento, uso do ano, separador e próximo número.
- Exemplo: FT 2026/0001, FAC 2026-0001, VENDA 000123.
- Rotinas novas protegidas por permissões de utilizador: séries, faturação, clientes, vendedores, artigos e extratos.
- Depois de atualizar, execute: python manage.py migrate
