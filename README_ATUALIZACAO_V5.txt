ERP V5 - Layout compacto e comercial

Antes de atualizar:
1. Faça backup do ficheiro db.sqlite3
2. Substitua os ficheiros do projeto mantendo a sua base atual
3. Corra:
   python manage.py migrate
   python manage.py runserver

O que entrou nesta versão:
- layout mais compacto e profissional
- menu horizontal reorganizado com nomes mais claros
- faturação e orçamentos em ecrã próprio
- seleção de série por documento
- pesquisa rápida de cliente por nome ou contribuinte
- aviso de cliente duplicado no cadastro
- criação rápida de cliente na própria emissão
- orçamento com opção de converter em fatura
- cancelamento de orçamento/documento
- extrato de clientes
- extrato de fornecedores
- permissões reforçadas nas novas rotinas
- produtos com localização em prateleira

Observações:
- esta versão mantém a estrutura para preservar os lançamentos já existentes
- o SAF-T(PT), comunicação AT e restantes rotinas fiscais avançadas ainda exigem etapa própria para cobertura legal completa
