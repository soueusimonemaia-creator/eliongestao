(function () {
    'use strict';

    const App = {
        secaoAtiva: (window.ELION_INITIAL && window.ELION_INITIAL.secaoAtiva) || 'dashboard',
        combustiveisMenu: (window.ELION_INITIAL && window.ELION_INITIAL.combustiveisMenu) || [],
        empresasUsuario: (window.ELION_INITIAL && window.ELION_INITIAL.empresasUsuario) || [],
        frotaMenu: (window.ELION_INITIAL && window.ELION_INITIAL.frotaMenu) || [],
        permissoesUsuario: (window.ELION_INITIAL && window.ELION_INITIAL.permissoesUsuario) || {},
        manutencaoBotao: (window.ELION_INITIAL && window.ELION_INITIAL.manutencaoBotao) || {},
        manutencaoTipos: (window.ELION_INITIAL && window.ELION_INITIAL.manutencaoTipos) || [],
        itensCombustivel: [],
        itensManutencao: [],
        itensRevisao: [],
        combustivelSelecionado: null,
        revisaoSelecionada: null,
        baixaAtual: null,
    };

    const ROTINAS_PERMISSOES_UI = ((window.ELION_INITIAL && window.ELION_INITIAL.rotinasPermissoes) || []).map((item) => {
        if (Array.isArray(item)) {
            const [key, label, grupo] = item;
            return { key, label: label || key, grupo: grupo || 'Sistema' };
        }
        return {
            key: item.key,
            label: item.label || item.key,
            grupo: item.grupo || 'Sistema'
        };
    }).filter((item) => item && item.key);
    let usuarioPermissoesSelecionadas = {};

    function atualizarResumoPermissoes() {
        const box = $('usuario-permissoes-resumo');
        const detalhe = $('usuario-permissoes-detalhe');
        if (!box) return;
        const total = ROTINAS_PERMISSOES_UI.length;
        const selecionadas = ROTINAS_PERMISSOES_UI.filter((item) => usuarioPermissoesSelecionadas[item.key] && usuarioPermissoesSelecionadas[item.key].view);
        box.textContent = total ? `${selecionadas.length} de ${total} rotinas com acesso.` : 'Sem rotinas configuradas.';
        if (detalhe) {
            detalhe.textContent = selecionadas.length
                ? `Rotinas marcadas: ${selecionadas.map((item) => item.label).join(', ')}.`
                : 'Nenhuma rotina marcada.';
        }
    }

    const SECTION_META = {
        'dashboard-section': ['Menu Inicial', 'Visão geral do sistema'],
        'fornecedor-section': ['Fornecedor', 'Cadastro e consulta de fornecedores'],
        'funcionario-section': ['Funcionário', 'Cadastro e consulta de funcionários'],
        'frota-section': ['Frota', 'Cadastro e consulta da frota'],
        'combustivel-section': ['Combustível', 'Cadastro e consulta de combustíveis'],
        'empresa-section': ['Empresa', 'Cadastro e consulta de empresas'],
        'usuario-section': ['Usuários', 'Gestão de utilizadores'],
        'lancamentos-section': ['Lançamentos', 'Registo de lançamentos, faturas e manutenção'],
        'revisao-frota-section': ['Revisão de Frota', 'Gestão de revisões de frota'],
        'consulta-section': ['Consulta', 'Consulta de lançamentos'],
        'relatorio-financeiro-section': ['Relatório Financeiro', 'Pesquisa e exportação'],
        'relatorio-fornecedor-section': ['Gastos por Fornecedor', 'Dashboard consolidado por fornecedor'],
        'relatorio-faturas-section': ['Relatório de Baixa de Faturas', 'Pesquisa e exportação'],
        'relatorio-manutencao-section': ['Relatório de Manutenção', 'Pesquisa e exportação'],
        'relatorio-caixa-section': ['Folha de Caixa', 'Pesquisa e exportação'],
        'relatorio-combustivel-section': ['Relatório de Combustível', 'Consumos, médias e exportação'],
        'relatorio-documentos-section': ['Documento de Frota', 'Pesquisa e exportação'],
    };

    const SECTION_TO_ROTINA = {
        'dashboard-section': null,
        'fornecedor-section': 'fornecedor',
        'funcionario-section': 'funcionario',
        'frota-section': 'frota',
        'combustivel-section': 'combustivel',
        'empresa-section': 'empresa',
        'usuario-section': 'usuario',
        'lancamentos-section': 'lancamentos',
        'revisao-frota-section': 'revisao_frota',
        'consulta-section': 'consulta',
        'baixa-faturas-section': 'baixa_faturas',
        'relatorio-financeiro-section': 'relatorio_financeiro',
        'relatorio-fornecedor-section': 'relatorio_fornecedor',
        'relatorio-faturas-section': 'relatorio_faturas',
        'relatorio-manutencao-section': 'relatorio_manutencao',
        'relatorio-caixa-section': 'relatorio_caixa',
        'relatorio-combustivel-section': 'relatorio_combustivel',
        'relatorio-documentos-section': 'relatorio_documentos'
    };

    function rotinaLiberada(rotina, acao = 'view') {
        if (!rotina) return true;
        const perms = App.permissoesUsuario || {};
        if (!perms[rotina]) return false;
        return !!perms[rotina][acao];
    }

    function $(id) {
        return document.getElementById(id);
    }

    function qs(selector) {
        return document.querySelector(selector);
    }

    function qsa(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    function getCsrfToken() {
        const input = document.querySelector('[name=csrfmiddlewaretoken]');
        if (input) return input.value;
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function toNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        let normalized = String(value).trim().replace(/\s+/g, '').replace(/€/g, '');

        if (normalized.includes(',') && normalized.includes('.')) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else if (normalized.includes(',')) {
            normalized = normalized.replace(',', '.');
        }

        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatCurrency(value) {
        return `${toNumber(value).toFixed(2)} €`;
    }

    function formatNumber(value, decimals = 2) {
        const num = Number(value || 0);
        return num.toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    function escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showToast(message, type = 'success', options = {}) {
        const container = $('toast-container');
        if (!container) {
            alert(message);
            return;
        }
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/><path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/><path d="M12 7.5v6M12 16.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/><path d="M12 8v5M12 16.2h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.success}</span>
            <span class="toast-body">
                ${options.title ? `<strong class="toast-title">${escapeHtml(options.title)}</strong>` : ''}
                <span class="toast-message">${escapeHtml(message)}</span>
            </span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 20);
        const duracao = options.duration || 3200;
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 250);
        }, duracao);
    }

    function decodeHtml(value) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = value || '';
        return textarea.value;
    }

    function decodeValue(value) {
        try {
            return decodeURIComponent(value || '');
        } catch (_) {
            return value || '';
        }
    }



    function setImagePreview(id, url) {
        const img = $(id);
        if (!img) return;
        if (url) {
            img.src = url;
            img.style.display = 'block';
        } else {
            img.removeAttribute('src');
            img.style.display = 'none';
        }
    }

    function fileToObjectUrl(file) {
        try {
            return file ? URL.createObjectURL(file) : '';
        } catch (_) {
            return '';
        }
    }

    function renderStatusBadge(status) {
        const value = String(status || '').trim().toLowerCase();
        if (['paga', 'pago', 'fechada', 'fechado', 'quitada', 'quitado'].includes(value)) {
            return '<span class="badge badge-success">PAGA</span>';
        }
        if (value === 'parcial') {
            return '<span class="badge badge-warning">PARCIAL</span>';
        }
        if (['em aberto', 'aberta', 'aberto'].includes(value)) {
            return '<span class="badge badge-danger">EM ABERTO</span>';
        }
        if (value === 'ok') {
            return '<span class="badge badge-success">OK</span>';
        }
        if (value === 'a vencer') {
            return '<span class="badge badge-warning">A VENCER</span>';
        }
        if (value === 'vencido') {
            return '<span class="badge badge-danger">VENCIDO</span>';
        }
        return `<span class="badge badge-secondary">${escapeHtml(status || '-')}</span>`;
    }

    async function apiFetch(url, options = {}) {
        const config = {
            method: options.method || 'GET',
            cache: 'no-store',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...(options.headers || {})
            }
        };

        if (options.json) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.json);
        } else if (options.body) {
            config.body = options.body;
        }

        if (!config.headers['X-CSRFToken'] && config.method !== 'GET' && config.method !== 'HEAD') {
            config.headers['X-CSRFToken'] = getCsrfToken();
        }

        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            let message = `Erro ${response.status}`;
            try {
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    message = data.error || data.message || data.detail || message;
                } else {
                    const text = await response.text();
                    if (text) message = text;
                }
            } catch (_) {}
            throw new Error(message);
        }

        if (contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    }

    function buildQuery(paramsObj) {
        const params = new URLSearchParams();
        Object.entries(paramsObj || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                params.append(key, value);
            }
        });
        return params.toString();
    }

    // Controlo de concorrência para pesquisas de relatórios.
    // Evita que uma resposta antiga (ex.: carregamento automático ao abrir a secção,
    // ou uma pesquisa anterior mais lenta) sobreponha o resultado de uma pesquisa mais
    // recente feita pelo utilizador (ex.: filtrar por um período específico). Sem isto,
    // era possível pesquisar "01/02 a 28/02" e, se a resposta sem filtro (todos os meses)
    // ainda estivesse a chegar, ela substituía o resultado filtrado mostrando outros meses.
    const __reportRequestSeq = {};
    function beginReportRequest(containerId) {
        __reportRequestSeq[containerId] = (__reportRequestSeq[containerId] || 0) + 1;
        return __reportRequestSeq[containerId];
    }
    function isCurrentReportRequest(containerId, token) {
        return __reportRequestSeq[containerId] === token;
    }

    function setLoading(containerId, text = 'A carregar...') {
        const el = $(containerId);
        if (el) el.innerHTML = `<div class="loading-box">${escapeHtml(text)}</div>`;
    }

    function setError(containerId, message) {
        const el = $(containerId);
        if (el) el.innerHTML = `<div class="error-box">${escapeHtml(message)}</div>`;
    }

    function renderEmpty(containerId, message = 'Sem resultados.') {
        const el = $(containerId);
        if (el) el.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    }

    function updatePageHeader(sectionId) {
        const meta = SECTION_META[sectionId] || ['Elion ERP', ''];
        if ($('page-title')) $('page-title').textContent = meta[0];
        if ($('page-subtitle')) $('page-subtitle').textContent = meta[1];
    }

    function showSection(sectionId) {
        const rotina = SECTION_TO_ROTINA[sectionId];
        if (rotina && !rotinaLiberada(rotina, 'view')) {
            showToast('Sem acesso a esta rotina.', 'error');
            return;
        }
        qsa('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        qsa('.menu-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });

        updatePageHeader(sectionId);

        if (sectionId === 'lancamentos-section') {
            limparLancamento();
            carregarUltimosLancamentos();
        }
        if (sectionId === 'consulta-section') carregarConsulta();
        if (sectionId === 'baixa-faturas-section') carregarBaixaFaturas();
        if (sectionId === 'relatorio-financeiro-section') carregarRelatorioFinanceiro();
        if (sectionId === 'relatorio-fornecedor-section') carregarRelatorioFornecedor();
        if (sectionId === 'relatorio-faturas-section') carregarRelatorioFaturas();
        if (sectionId === 'relatorio-manutencao-section') carregarRelatorioManutencao();
        if (sectionId === 'relatorio-caixa-section') carregarRelatorioCaixa();
        if (sectionId === 'relatorio-combustivel-section') carregarRelatorioCombustivel();
        if (sectionId === 'relatorio-documentos-section') carregarRelatorioDocumentos();
        if (sectionId === 'cliente-section') carregarClientes();
        if (sectionId === 'fornecedor-section') carregarFornecedores();
        if (sectionId === 'funcionario-section') carregarFuncionarios();
        if (sectionId === 'frota-section') carregarFrota();
        if (sectionId === 'revisao-frota-section') carregarRevisaoFrota();
        if (sectionId === 'combustivel-section') carregarCombustiveis();
        if (sectionId === 'empresa-section') carregarEmpresas();
        if (sectionId === 'usuario-section') carregarUsuarios();
    }


    function fecharLancamentosPOS() {
        limparLancamento();
        ativarPainelLancamento(null);
        showSection('dashboard-section');
    }

    async function trocarEmpresaAtiva(empresaId) {
        if (!empresaId) return;
        try {
            await apiFetch('/trocar-empresa/', {
                method: 'POST',
                json: { empresa_id: empresaId }
            });
            location.reload();
        } catch (error) {
            showToast(error.message || 'Erro ao trocar empresa.', 'error');
        }
    }

    function abrirModalFornecedor() {
        const modal = $('fornecedor-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function fecharModalFornecedor() {
        const modal = $('fornecedor-modal');
        if (modal) modal.classList.add('hidden');
    }

    function fecharAlertaFrota() {
        const modal = $('fleet-alert-modal');
        if (modal) modal.classList.add('hidden');
    }

    async function salvarFornecedorModal() {
        const nif = $('modal-fornecedor-nif')?.value || '';
        const nome = $('modal-fornecedor-nome')?.value || '';
        const iban = $('modal-fornecedor-iban')?.value || '';
        const contato = $('modal-fornecedor-contato')?.value || '';
        const responsavel = $('modal-fornecedor-responsavel')?.value || '';
        const email = $('modal-fornecedor-email')?.value || '';
        const morada = $('modal-fornecedor-morada')?.value || '';
        const conselho = $('modal-fornecedor-conselho')?.value || '';
        const caixa_postal = $('modal-fornecedor-caixa-postal')?.value || '';

        try {
            const data = await apiFetch('/fornecedores/salvar/', {
                method: 'POST',
                json: { nif, nome, iban, contato, responsavel, email, morada, conselho, caixa_postal }
            });

            if ($('lancamento-fornecedor-id')) $('lancamento-fornecedor-id').value = data.id || '';
            if ($('lancamento-fornecedor-busca')) {
                $('lancamento-fornecedor-busca').value = data.nome || nome;
                $('lancamento-fornecedor-busca').dataset.selectedId = data.id || '';
                $('lancamento-fornecedor-busca').dataset.selectedLabel = data.nome || nome;
                $('lancamento-fornecedor-busca').focus();
            }
            ['modal-fornecedor-nif', 'modal-fornecedor-nome', 'modal-fornecedor-iban', 'modal-fornecedor-contato', 'modal-fornecedor-responsavel', 'modal-fornecedor-email', 'modal-fornecedor-morada', 'modal-fornecedor-conselho', 'modal-fornecedor-caixa-postal'].forEach((id) => { if ($(id)) $(id).value = ''; });

            fecharModalFornecedor();
            showToast(`"${data.nome || nome}" foi cadastrado e já está vinculado a este lançamento.`, 'success', { title: 'Fornecedor registado com sucesso', duration: 3800 });
            carregarFornecedores();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar fornecedor.', 'error');
        }
    }

    function calcularTotalLancamento() {
        const dinheiro = toNumber($('lancamento-dinheiro')?.value);
        const cartao = toNumber($('lancamento-cartao')?.value);
        const notaCredito = toNumber($('lancamento-nota-credito')?.value);
        const totalPago = dinheiro + cartao - notaCredito;
        const temVencimento = Boolean(($('lancamento-data-vencimento')?.value || '').trim());

        if ($('lancamento-total')) $('lancamento-total').value = totalPago.toFixed(2);
        if ($('lancamento-saldo-aberto')) $('lancamento-saldo-aberto').value = temVencimento ? Math.max(0, totalPago < 0 ? 0 : 0).toFixed(2) : '0.00';
        if ($('lancamento-status-pagamento')) $('lancamento-status-pagamento').value = temVencimento ? 'Em aberto' : 'Paga';

        if ($('elion-total-pago-label')) $('elion-total-pago-label').textContent = formatCurrency(totalPago);
        if ($('elion-saldo-label')) $('elion-saldo-label').textContent = formatCurrency(0);
        atualizarResumoLancamento();
    }

    function calcularValorTotalItemCombustivel() {
        const litros = toNumber($('item-litro')?.value);
        const valorLitro = toNumber($('item-valor-litro')?.value);
        const valorManual = $('item-valor-total')?.dataset.manual === '1';
        if (!valorManual && $('item-valor-total')) $('item-valor-total').value = (litros * valorLitro).toFixed(2);
    }

    function calcularParcelamentoLancamento() {
        const valorFatura = toNumber($('lancamento-valor-fatura')?.value);
        const parcelas = parseInt($('lancamento-parcelas')?.value || '1', 10) || 1;
        const valorParcela = parcelas > 0 ? valorFatura / parcelas : 0;

        if ($('lancamento-valor-parcela')) {
            $('lancamento-valor-parcela').value = valorParcela.toFixed(2);
        }
    }

    function calcularKmTotalItem() {
        const inicio = toNumber($('item-km-inicio')?.value);
        const fim = toNumber($('item-km-final')?.value);
        const total = Math.max(0, fim - inicio);
        if ($('item-km-total')) $('item-km-total').value = total;
    }

    function calcularKmTotalManutencao() {
        const inicio = toNumber($('item-manutencao-km-inicio')?.value);
        const fim = toNumber($('item-manutencao-km-final')?.value);
        const total = Math.max(0, fim - inicio);
        if ($('item-manutencao-km-total')) $('item-manutencao-km-total').value = total;
    }

    function abrirModalBaixaFatura(id, valorFatura = 0, totalJaPago = 0, saldoAtual = 0) {
        App.baixaAtual = {
            id,
            valorFatura: toNumber(valorFatura),
            totalJaPago: toNumber(totalJaPago),
            saldoAtual: toNumber(saldoAtual)
        };

        if ($('baixa-fatura-id')) $('baixa-fatura-id').value = id || '';
        if ($('baixa-valor-fatura')) $('baixa-valor-fatura').value = App.baixaAtual.valorFatura.toFixed(2);
        if ($('baixa-total-ja-pago')) $('baixa-total-ja-pago').value = App.baixaAtual.totalJaPago.toFixed(2);
        if ($('baixa-saldo-atual')) $('baixa-saldo-atual').value = App.baixaAtual.saldoAtual.toFixed(2);

        ['baixa-dinheiro', 'baixa-cartao', 'baixa-mbway', 'baixa-transferencia', 'baixa-nota-credito', 'baixa-total-baixa', 'baixa-diferenca', 'baixa-proxima-data-vencimento', 'baixa-observacao']
            .forEach(idCampo => {
                if ($(idCampo)) $(idCampo).value = '';
            });

        calcularTotaisBaixaFatura();

        const modal = $('baixa-fatura-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function fecharModalBaixaFatura() {
        const modal = $('baixa-fatura-modal');
        if (modal) modal.classList.add('hidden');
        App.baixaAtual = null;
    }

    function calcularTotaisBaixaFatura() {
        const dinheiro = toNumber($('baixa-dinheiro')?.value);
        const cartao = toNumber($('baixa-cartao')?.value);
        const mbway = toNumber($('baixa-mbway')?.value);
        const transferencia = toNumber($('baixa-transferencia')?.value);
        const notaCredito = toNumber($('baixa-nota-credito')?.value);

        const totalBaixa = dinheiro + cartao + mbway + transferencia + notaCredito;
        const saldoAtual = toNumber($('baixa-saldo-atual')?.value);
        const diferenca = Math.max(0, saldoAtual - totalBaixa);

        if ($('baixa-total-baixa')) $('baixa-total-baixa').value = totalBaixa.toFixed(2);
        if ($('baixa-diferenca')) $('baixa-diferenca').value = diferenca.toFixed(2);
    }

    async function salvarBaixaFatura() {
        const id = $('baixa-fatura-id')?.value;
        if (!id) {
            showToast('Fatura inválida.', 'error');
            return;
        }

        const fornecedorId = $('lancamento-fornecedor-id')?.value || '';
        const fornecedorBusca = ($('lancamento-fornecedor-busca')?.value || '').trim();
        if (!fornecedorId && !fornecedorBusca) {
            showToast('Selecione um fornecedor antes de salvar.', 'error');
                $('lancamento-fornecedor-busca')?.focus();
            return;
        }

        const payload = {
            dinheiro: toNumber($('baixa-dinheiro')?.value),
            cartao: toNumber($('baixa-cartao')?.value),
            mbway: toNumber($('baixa-mbway')?.value),
            transferencia: toNumber($('baixa-transferencia')?.value),
            nota_credito: toNumber($('baixa-nota-credito')?.value),
            total_baixa: toNumber($('baixa-total-baixa')?.value),
            diferenca: toNumber($('baixa-diferenca')?.value),
            proxima_data_vencimento: $('baixa-proxima-data-vencimento')?.value || '',
            observacao: $('baixa-observacao')?.value || '',
        };

        try {
            await apiFetch(`/lancamentos/${id}/baixa/`, {
                method: 'POST',
                json: payload
            });

            showToast('Baixa registada com sucesso.');
            fecharModalBaixaFatura();
            carregarRelatorioFaturas();
            carregarRelatorioFinanceiro();
            carregarConsulta();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar baixa.', 'error');
        }
    }

    function normalizeFuelName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    function ativarPainelLancamento(tipo) {
        const combustivelPanel = $('combustivel-item-panel');
        const manutencaoPanel = $('manutencao-item-panel');
        const revisaoPanel = $('revisao-item-panel');
        const placeholder = $('launch-placeholder-panel');
        const modo = tipo || 'combustivel';

        if (combustivelPanel) combustivelPanel.classList.toggle('hidden', modo !== 'combustivel');
        if (manutencaoPanel) manutencaoPanel.classList.toggle('hidden', modo !== 'manutencao');
        if (revisaoPanel) revisaoPanel.classList.toggle('hidden', modo !== 'revisao');
        if (placeholder) placeholder.classList.add('hidden');
        if (modo !== 'manutencao') qsa('.elion-manutencao-btn').forEach(btn => btn.classList.remove('active'));
        if (modo === 'manutencao') qsa('.elion-manutencao-btn').forEach(btn => btn.classList.add('active'));
        if (modo !== 'revisao') qsa('.elion-revisao-btn').forEach(btn => btn.classList.remove('active'));
        if (modo === 'revisao') qsa('.elion-revisao-btn').forEach(btn => btn.classList.add('active'));
    }

    function selecionarNenhumCombustivel() {
        App.combustivelSelecionado = null;
        if ($('item-combustivel-combustivel-id')) $('item-combustivel-combustivel-id').value = '';
        if ($('combustivel-selecionado-label')) $('combustivel-selecionado-label').value = '';
        qsa('.fuel-btn').forEach(btn => btn.classList.remove('active'));
        ativarPainelLancamento('combustivel');
    }

    function selecionarCombustivel(id, nome, opts = {}) {
        App.combustivelSelecionado = { id: id || `manual-${(nome || 'combustivel').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, nome };
        if ($('item-combustivel-combustivel-id')) $('item-combustivel-combustivel-id').value = App.combustivelSelecionado.id;
        if ($('combustivel-selecionado-label')) $('combustivel-selecionado-label').value = nome;
        ativarPainelLancamento('combustivel');
        qsa('.elion-manutencao-btn').forEach(btn => btn.classList.remove('active'));
        qsa('.fuel-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = qs(`.fuel-btn[data-id="${id}"]`) || qs(`.fuel-btn[data-key="${opts.key || ''}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        if (!opts.silent) $('item-combustivel-matricula')?.focus();
    }

    function getFuelButtonClass(nome, index = 0) {
        const n = normalizeFuelName(nome);
        if (n.includes('95')) return 'gasolina95';
        if (n.includes('98')) return 'gasolina98';
        if (n.includes('b7') || n === 'gasoleo' || n === 'gasóleo' || n.includes('gasoleo') || n.includes('gasóleo')) return 'gasoleo';
        if (n.includes('b10') || n.includes('aditiv')) return 'gpl';
        return ['gasolina95', 'gasolina98', 'gasoleo', 'gpl'][index % 4] || 'outro-combustivel';
    }

    function selecionarTipoManutencao(nome, key, opts = {}) {
        App.manutencaoSelecionada = { key: key || '', nome: nome || 'Manutenção' };
        if ($('manutencao-selecionado-label')) $('manutencao-selecionado-label').value = nome || 'Manutenção';
        qsa('.elion-manutencao-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.key === String(key || '')));
        qsa('.fuel-btn').forEach(btn => btn.classList.remove('active'));
        ativarPainelLancamento('manutencao');
        if (!opts.silent) $('item-manutencao-matricula')?.focus();
    }

    function selecionarTipoRevisao(opts = {}) {
        App.revisaoSelecionada = { key: 'revisao', nome: 'Revisão' };
        qsa('.elion-revisao-btn').forEach(btn => btn.classList.add('active'));
        qsa('.fuel-btn, .elion-manutencao-btn').forEach(btn => btn.classList.remove('active'));
        ativarPainelLancamento('revisao');
        if (!opts.silent) $('item-revisao-matricula')?.focus();
    }

    function renderFuelButtons() {
        const grid = $('fuel-button-grid');
        if (!grid) return;
        const menu = Array.isArray(App.combustiveisMenu) ? App.combustiveisMenu : [];
        if (!menu.length) {
            grid.innerHTML = '<div class="empty-state">Nenhum combustível cadastrado no CRM.</div>';
            renderMaintenanceButton();
            return;
        }
        grid.innerHTML = menu.map((item, index) => {
            const nome = item.nome || `Combustível ${index + 1}`;
            const id = item.id || `manual-${index + 1}`;
            const cls = getFuelButtonClass(nome, index);
            return `
                <button type="button" class="fuel-btn ${cls}" data-id="${escapeHtml(String(id))}" data-nome="${escapeHtml(nome)}" aria-label="${escapeHtml(nome)}" title="${escapeHtml(nome)}">
                    <span class="icon-glyph">⛽</span>
                    <span class="btn-label">${escapeHtml(nome)}</span>
                </button>`;
        }).join('');

        qsa('#fuel-button-grid .fuel-btn').forEach(btn => {
            btn.onclick = () => selecionarCombustivel(btn.dataset.id, btn.dataset.nome || btn.title || 'Combustível');
        });

        renderMaintenanceButton();

        const firstBtn = qs('#fuel-button-grid .fuel-btn.active') || qs('#fuel-button-grid .fuel-btn');
        if (firstBtn) {
            selecionarCombustivel(firstBtn.dataset.id, firstBtn.dataset.nome || firstBtn.getAttribute('title') || 'Combustível', { silent: true });
        }
    }

    function renderMaintenanceButton() {
        const slot = $('manutencao-button-slot');
        if (!slot) return;
        const tipos = Array.isArray(App.manutencaoTipos) && App.manutencaoTipos.length ? App.manutencaoTipos : [{ key: 'manutencao', nome: 'Manutenção' }];
        slot.innerHTML = tipos.map((item) => `
            <button type="button" class="btn btn-outline elion-manutencao-btn" data-key="${escapeHtml(item.key || '')}" aria-label="${escapeHtml(item.nome || 'Manutenção')}" title="${escapeHtml(item.nome || 'Manutenção')}">
                <span class="icon-glyph">🔧</span>
                <span class="btn-label">${escapeHtml(item.nome || 'Manutenção')}</span>
            </button>`).join('');
        qsa('#manutencao-button-slot .elion-manutencao-btn').forEach((btn) => {
            btn.onclick = () => selecionarTipoManutencao(btn.title || 'Manutenção', btn.dataset.key || 'manutencao');
        });
        const revisaoSlot = $('revisao-button-slot');
        if (revisaoSlot) {
            revisaoSlot.innerHTML = `<button type="button" class="btn btn-outline elion-revisao-btn" title="Revisão"><span class="icon-glyph">🛠️</span><span class="btn-label">Revisão</span></button>`;
            qsa('#revisao-button-slot .elion-revisao-btn').forEach((btn) => { btn.onclick = () => selecionarTipoRevisao(); });
        }
    }

    function recalcularValorCombustivelItem() {
        const litros = toNumber($('item-litro')?.value);
        const valorLitro = toNumber($('item-valor-litro')?.value);
        if ($('item-valor-total')) $('item-valor-total').value = (litros * valorLitro).toFixed(2);
    }

    function recalcularValorManutencaoItem() {
        const litros = toNumber($('item-manutencao-litro')?.value);
        const valorLitro = toNumber($('item-manutencao-valor-litro')?.value);
        if ($('item-manutencao-valor')) $('item-manutencao-valor').value = (litros * valorLitro).toFixed(2);
    }

function limparItemCombustivel() {
        ['item-combustivel-id', 'item-combustivel-combustivel-id', 'item-combustivel-matricula', 'item-km-inicio', 'item-km-final', 'item-km-total', 'item-litro', 'item-valor-litro', 'item-valor-total', 'item-combustivel-observacao']
            .forEach(id => { if ($(id)) $(id).value = ''; });
        if ($('item-frota-id')) $('item-frota-id').value = '';
        if ($('combustivel-frota-sugestoes')) $('combustivel-frota-sugestoes').innerHTML = '';
        hideSuggestionListById('combustivel-frota-sugestoes');
        selecionarNenhumCombustivel();
    }

    function limparItemManutencao() {
        ['item-manutencao-id', 'item-manutencao-frota-id', 'item-manutencao-matricula', 'item-manutencao-km-inicio', 'item-manutencao-km-final', 'item-manutencao-km-total', 'item-manutencao-litro', 'item-manutencao-valor-litro', 'item-manutencao-valor', 'item-manutencao-observacao']
            .forEach(id => { if ($(id)) $(id).value = ''; });
        if ($('manutencao-frota-sugestoes')) $('manutencao-frota-sugestoes').innerHTML = '';
        hideSuggestionListById('manutencao-frota-sugestoes');
    }

    function limparItemRevisao() {
        ['item-revisao-id','item-revisao-frota-id','item-revisao-matricula','item-revisao-marca','item-revisao-modelo','item-revisao-data','item-revisao-km-inicio','item-revisao-km-final','item-revisao-km-total','item-revisao-km-rodados','item-revisao-kms-previsao','item-revisao-km-para-revisao','item-revisao-funcionario-id','item-revisao-funcionario','item-revisao-observacao']
            .forEach(id => { if ($(id)) $(id).value = ''; });
        if ($('revisao-frota-sugestoes')) $('revisao-frota-sugestoes').innerHTML = '';
        if ($('revisao-funcionario-sugestoes')) $('revisao-funcionario-sugestoes').innerHTML = '';
        hideSuggestionListById('revisao-frota-sugestoes');
        hideSuggestionListById('revisao-funcionario-sugestoes');
    }

    function calcularKmTotalRevisao() {
        const ini = toNumber($('item-revisao-km-inicio')?.value);
        const fim = toNumber($('item-revisao-km-final')?.value);
        const total = Math.max(fim - ini, 0);
        if ($('item-revisao-km-total')) $('item-revisao-km-total').value = total;
        if ($('item-revisao-km-rodados')) $('item-revisao-km-rodados').value = total;
        calcularKmParaRevisao();
    }

    function calcularKmParaRevisao() {
        const rodados = toNumber($('item-revisao-km-rodados')?.value);
        const previsao = toNumber($('item-revisao-kms-previsao')?.value);
        if ($('item-revisao-km-para-revisao')) $('item-revisao-km-para-revisao').value = rodados + previsao;
    }

    function adicionarItemRevisaoNaGrade() {
        const matricula = $('item-revisao-matricula')?.value || '';
        if (!matricula) { showToast('Informe a matrícula.', 'error'); return; }
        const item = {
            frota_id: $('item-revisao-frota-id')?.value || '',
            matricula,
            marca: $('item-revisao-marca')?.value || '',
            modelo: $('item-revisao-modelo')?.value || '',
            data_ultima_revisao: $('item-revisao-data')?.value || '',
            km_inicio: toNumber($('item-revisao-km-inicio')?.value),
            km_final: toNumber($('item-revisao-km-final')?.value),
            km_total: toNumber($('item-revisao-km-total')?.value),
            km_ultima_revisao: toNumber($('item-revisao-km-final')?.value),
            km_rodados: toNumber($('item-revisao-km-rodados')?.value),
            kms_previsao: toNumber($('item-revisao-kms-previsao')?.value),
            km_para_revisao: toNumber($('item-revisao-km-para-revisao')?.value),
            funcionario_id: $('item-revisao-funcionario-id')?.value || '',
            funcionario: $('item-revisao-funcionario')?.value || '',
            observacao: $('item-revisao-observacao')?.value || '',
            descricao: 'Revisão',
            valor: 0,
        };
        App.itensRevisao.push(item);
        renderItensRevisaoGrid();
        renderLancamentoPreviewTable();
        limparItemRevisao();
    }

    function removerItemRevisao(index) {
        App.itensRevisao.splice(index,1);
        renderItensRevisaoGrid();
        renderLancamentoPreviewTable();
    }

    function renderItensRevisaoGrid() {
        const target = $('itens-revisao-grid');
        if (!target) return;
        if (!App.itensRevisao.length) { target.innerHTML=''; return; }
        target.innerHTML = `<div class="table-responsive"><table class="data-table"><thead><tr><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Data</th><th>KM Rodados</th><th>KM Previsão</th><th>KM para revisão</th><th></th></tr></thead><tbody>${App.itensRevisao.map((item,index)=>`<tr><td>${escapeHtml(item.matricula||'')}</td><td>${escapeHtml(item.marca||'')}</td><td>${escapeHtml(item.modelo||'')}</td><td>${escapeHtml(item.data_ultima_revisao||'')}</td><td>${item.km_rodados||0}</td><td>${item.kms_previsao||0}</td><td>${item.km_para_revisao||0}</td><td><button type="button" class="btn btn-sm btn-danger" onclick="removerItemRevisao(${index})">Excluir</button></td></tr>`).join('')}</tbody></table></div>`;
    }

    function adicionarItemCombustivelNaGrade() {
        if (!App.combustivelSelecionado || !App.combustivelSelecionado.id) {
            showToast('Selecione um combustível válido.', 'error');
            return;
        }

        const item = {
            combustivel_id: App.combustivelSelecionado.id,
            combustivel_nome: App.combustivelSelecionado.nome,
            frota_id: $('item-frota-id')?.value || '',
            matricula: ($('item-combustivel-matricula')?.value || '').trim(),
            km_inicio: toNumber($('item-km-inicio')?.value),
            km_final: toNumber($('item-km-final')?.value),
            km_total: toNumber($('item-km-total')?.value),
            litro: toNumber($('item-litro')?.value),
            valor_litro: toNumber($('item-valor-litro')?.value),
            valor_total: toNumber($('item-valor-total')?.value),
            observacao: $('item-combustivel-observacao')?.value || '',
        };

        if (typeof App._editandoCombustivelIndex === 'number') {
            App.itensCombustivel[App._editandoCombustivelIndex] = item;
            App._editandoCombustivelIndex = undefined;
        } else {
            App.itensCombustivel.push(item);
        }
        renderItensCombustivelGrid();
        renderLancamentoPreviewTable();
        atualizarValorTotalAutomatico();
        limparItemCombustivel();
    }

    function adicionarItemManutencaoNaGrade() {
        const matricula = $('item-manutencao-matricula')?.value || '';
        if (!matricula) {
            showToast('Informe a matrícula.', 'error');
            return;
        }

        const item = {
            frota_id: $('item-manutencao-frota-id')?.value || '',
            matricula,
            km_inicio: toNumber($('item-manutencao-km-inicio')?.value),
            km_final: toNumber($('item-manutencao-km-final')?.value),
            km_total: toNumber($('item-manutencao-km-total')?.value),
            litro: toNumber($('item-manutencao-litro')?.value),
            valor_litro: toNumber($('item-manutencao-valor-litro')?.value),
            descricao: ($('manutencao-selecionado-label')?.value || 'Manutenção').trim() || 'Manutenção',
            valor: toNumber($('item-manutencao-valor')?.value),
            observacao: $('item-manutencao-observacao')?.value || '',
        };

        if (typeof App._editandoManutencaoIndex === 'number') {
            App.itensManutencao[App._editandoManutencaoIndex] = item;
            App._editandoManutencaoIndex = undefined;
        } else {
            App.itensManutencao.push(item);
        }
        renderItensManutencaoGrid();
        renderLancamentoPreviewTable();
        atualizarValorTotalAutomatico();
        limparItemManutencao();
    }

    function removerItemCombustivel(index) {
        App.itensCombustivel.splice(index, 1);
        renderItensCombustivelGrid();
        renderLancamentoPreviewTable();
        atualizarValorTotalAutomatico();
    }

    function removerItemManutencao(index) {
        App.itensManutencao.splice(index, 1);
        renderItensManutencaoGrid();
        renderLancamentoPreviewTable();
        atualizarValorTotalAutomatico();
    }

    function editarItemCombustivel(index) {
        const item = App.itensCombustivel[index];
        if (!item) return;
        // Selecionar combustivel no painel
        selecionarCombustivel(item.combustivel_id, item.combustivel_nome || 'Combustível');
        // Preencher campos do painel
        if ($('item-combustivel-matricula')) $('item-combustivel-matricula').value = item.matricula || '';
        if ($('item-km-inicio')) $('item-km-inicio').value = item.km_inicio || '';
        if ($('item-km-final')) $('item-km-final').value = item.km_final || '';
        if ($('item-km-total')) $('item-km-total').value = item.km_total || '';
        if ($('item-litro')) $('item-litro').value = item.litro || '';
        if ($('item-valor-litro')) $('item-valor-litro').value = item.valor_litro || '';
        if ($('item-valor-total')) $('item-valor-total').value = item.valor_total || '';
        if ($('item-combustivel-combustivel-id')) $('item-combustivel-combustivel-id').value = item.combustivel_id || '';
        // Guardar index para substituir ao adicionar
        App._editandoCombustivelIndex = index;
        showToast('Edite os campos e clique em "Adicionar" para guardar as alterações.', 'info');
    }

    function editarItemManutencao(index) {
        const item = App.itensManutencao[index];
        if (!item) return;
        ativarPainelLancamento('manutencao');
        if ($('item-manutencao-matricula')) $('item-manutencao-matricula').value = item.matricula || '';
        if ($('item-manutencao-km-inicio')) $('item-manutencao-km-inicio').value = item.km_inicio || '';
        if ($('item-manutencao-km-final')) $('item-manutencao-km-final').value = item.km_final || '';
        if ($('item-manutencao-km-total')) $('item-manutencao-km-total').value = item.km_total || '';
        if ($('item-manutencao-litro')) $('item-manutencao-litro').value = item.litro || '';
        if ($('item-manutencao-valor-litro')) $('item-manutencao-valor-litro').value = item.valor_litro || '';
        if ($('item-manutencao-valor')) $('item-manutencao-valor').value = item.valor || '';
        if ($('item-manutencao-observacao')) $('item-manutencao-observacao').value = item.observacao || '';
        if ($('item-manutencao-frota-id')) $('item-manutencao-frota-id').value = item.frota_id || '';
        App._editandoManutencaoIndex = index;
        showToast('Edite os campos e clique em "Adicionar" para guardar as alterações.', 'info');
    }

    function removerItemLancamento(tipo, index) {
        if (tipo === 'manutencao') {
            removerItemManutencao(index);
            return;
        }
        removerItemCombustivel(index);
    }

    function renderItensCombustivelGrid() {
        const el = $('itens-combustivel-grid');
        if (!el) return;

        if (!App.itensCombustivel.length) {
            el.innerHTML = '<div class="empty-state">Nenhum item adicionado.</div>';
            return;
        }

        el.innerHTML = `
            <div class="table-responsive report-wide-wrap">
                <table class="data-table relatorio-baixas-table">
                    <thead>
                        <tr>
                            <th>Combustível</th>
                            <th>Frota</th>
                            <th>KM Início</th>
                            <th>KM Final</th>
                            <th>KM Total</th>
                            <th>Litro</th>
                            <th>Valor/L</th>
                            <th>Valor</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${App.itensCombustivel.map((item, index) => `
                            <tr>
                                <td>${escapeHtml(item.combustivel_nome)}</td>
                                <td>${escapeHtml(item.matricula || item.frota_id || '')}</td>
                                <td>${item.km_inicio}</td>
                                <td>${item.km_final}</td>
                                <td>${item.km_total}</td>
                                <td>${item.litro}</td>
                                <td>${item.valor_litro}</td>
                                <td>${formatCurrency(item.valor_total)}</td>
                                <td>
                                    <button type="button" class="btn btn-sm btn-outline" onclick="editarItemCombustivel(${index})" style="margin-right:4px">✏️ Editar</button>
                                    <button type="button" class="btn btn-sm btn-danger" onclick="removerItemCombustivel(${index})">🗑️ Remover</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderItensManutencaoGrid() {
        const el = $('itens-manutencao-grid');
        if (!el) return;

        if (!App.itensManutencao.length) {
            el.innerHTML = '<div class="empty-state">Nenhuma manutenção adicionada.</div>';
            return;
        }

        el.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>KM Início</th>
                            <th>KM Final</th>
                            <th>KM Total</th>
                            <th>Litros</th>
                            <th>Valor/L</th>
                            <th>Valor</th>
                            <th>Observação</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${App.itensManutencao.map((item, index) => `
                            <tr>
                                <td>${escapeHtml(item.matricula)}</td>
                                <td>${item.km_inicio}</td>
                                <td>${item.km_final}</td>
                                <td>${item.km_total}</td>
                                <td>${item.litro || ''}</td>
                                <td>${item.valor_litro || ''}</td>
                                <td>${formatCurrency(item.valor)}</td>
                                <td>${escapeHtml(item.observacao)}</td>
                                <td>
                                    <button type="button" class="btn btn-sm btn-outline" onclick="editarItemManutencao(${index})" style="margin-right:4px">✏️ Editar</button>
                                    <button type="button" class="btn btn-sm btn-danger" onclick="removerItemManutencao(${index})">🗑️ Remover</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }


    function getItensPreviewLancamento() {
        const itens = [];
        (App.itensCombustivel || []).forEach((item, index) => {
            itens.push({
                tipo: 'combustivel',
                index,
                ordem: index + 1,
                descricao: item.combustivel_nome || 'Combustível',
                matricula: item.matricula || '',
                km_inicio: item.km_inicio || 0,
                km_final: item.km_final || 0,
                km_total: item.km_total || 0,
                litro: item.litro || 0,
                valor_litro: item.valor_litro || 0,
                valor: item.valor_total || 0,
            });
        });
        (App.itensManutencao || []).forEach((item, index) => {
            itens.push({
                tipo: 'manutencao',
                index,
                ordem: (App.itensCombustivel || []).length + index + 1,
                descricao: item.descricao || 'Manutenção',
                matricula: item.matricula || '',
                km_inicio: item.km_inicio || 0,
                km_final: item.km_final || 0,
                km_total: item.km_total || 0,
                litro: item.litro || 0,
                valor_litro: item.valor_litro || 0,
                valor: item.valor || 0,
            });
        });
        (App.itensRevisao || []).forEach((item, index) => {
            itens.push({
                tipo: 'revisao',
                index,
                ordem: (App.itensCombustivel || []).length + (App.itensManutencao || []).length + index + 1,
                descricao: 'Revisão',
                matricula: item.matricula || '',
                km_inicio: item.km_inicio || 0,
                km_final: item.km_final || 0,
                km_total: item.km_total || 0,
                litro: '',
                valor_litro: '',
                valor: 0,
            });
        });
        return itens;
    }

    function renderLancamentoPreviewTable() {
        const tbody = $('itens-lancamento-preview');
        if (!tbody) return;
        const itens = getItensPreviewLancamento();
        if (!itens.length) {
            tbody.innerHTML = '<tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>€ 0,00</td><td></td></tr>';
            return;
        }
        tbody.innerHTML = itens.map(item => `
            <tr>
                <td>${item.ordem}</td>
                <td>${escapeHtml(item.descricao || '')}</td>
                <td>${escapeHtml(item.matricula || '')}</td>
                <td>${item.km_inicio || ''}</td>
                <td>${item.km_final || ''}</td>
                <td>${item.km_total || ''}</td>
                <td>${item.litro || ''}</td>
                <td>${item.valor_litro ? formatCurrency(item.valor_litro) : ''}</td>
                <td>${formatCurrency(item.valor || 0)}</td>
                <td><button type="button" class="btn btn-sm btn-danger" onclick="removerItemLancamento('${item.tipo}', ${item.index})">Excluir</button></td>
            </tr>`).join('');
    }

    function atualizarValorTotalAutomatico() {
        const dinheiro = toNumber($('lancamento-dinheiro')?.value);
        const cartao = toNumber($('lancamento-cartao')?.value);
        const notaCredito = toNumber($('lancamento-nota-credito')?.value);
        const totalPagamentos = dinheiro + cartao - notaCredito;
        if ($('lancamento-total')) $('lancamento-total').value = totalPagamentos.toFixed(2);
        if ($('elion-total-pago-label')) $('elion-total-pago-label').textContent = formatCurrency(totalPagamentos);
        if ($('elion-saldo-label')) $('elion-saldo-label').textContent = formatCurrency(0);
        renderLancamentoPreviewTable();
        calcularTotalLancamento();
        calcularParcelamentoLancamento();
        atualizarResumoLancamento();
    }

    function setLancamentoPanel(panel) {
        const alvo = panel || 'lancamento';
        qsa('.launch-panel').forEach(item => item.classList.toggle('active', item.id === `launch-panel-${alvo}`));
        qsa('.launch-tab[data-launch-panel]').forEach(btn => btn.classList.toggle('active', btn.dataset.launchPanel === alvo));
        if (alvo === 'consulta') carregarConsultaPopup();
    }

    function resetarGradeLancamento() {
        App.itensCombustivel = [];
        App.itensManutencao = [];
        App.itensRevisao = [];

        limparItemCombustivel();
        limparItemManutencao();
        limparItemRevisao();

        renderItensCombustivelGrid();
        renderItensManutencaoGrid();
        renderItensRevisaoGrid();
        renderLancamentoPreviewTable();

        const preview = $('itens-lancamento-preview');
        if (preview) {
            preview.innerHTML = '<tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>€ 0,00</td><td></td></tr>';
        }
    }

    function limparLancamento() {
        const section = $('lancamentos-section');
        if (section) {
            section.querySelectorAll('input, textarea, select').forEach(field => {
                if (!field || !field.id) return;
                if (field.type === 'button' || field.type === 'submit') return;
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = false;
                    return;
                }
                field.value = '';
            });
        }

        [
            'lancamento-id',
            'lancamento-id-visual',
            'lancamento-data-emissao',
            'lancamento-numero-fatura',
            'lancamento-fornecedor-busca',
            'lancamento-fornecedor-id',
            'lancamento-dinheiro',
            'lancamento-cartao',
            'lancamento-nota-credito',
            'lancamento-valor-fatura',
            'lancamento-parcelas',
            'lancamento-valor-parcela',
            'lancamento-data-vencimento',
            'lancamento-status-pagamento',
            'lancamento-total',
            'lancamento-saldo-aberto',
            'lancamento-observacao',
        ].forEach(id => { if ($(id)) $(id).value = ''; });

        if ($('lancamento-parcelas')) $('lancamento-parcelas').value = '1';
        if ($('lancamento-valor-parcela')) $('lancamento-valor-parcela').value = '0';
        if ($('lancamento-saldo-aberto')) $('lancamento-saldo-aberto').value = '0';
        if ($('lancamento-status-pagamento')) $('lancamento-status-pagamento').value = 'Em aberto';
        if ($('lancamento-total')) $('lancamento-total').value = '0.00';
        if ($('fornecedor-sugestoes')) $('fornecedor-sugestoes').innerHTML = '';
        hideSuggestionListById('fornecedor-sugestoes');

        resetarGradeLancamento();
        selecionarNenhumCombustivel();
        calcularTotalLancamento();
        calcularParcelamentoLancamento();
        atualizarResumoLancamento();
        if ($('lancamento-fornecedor-busca')) {
            $('lancamento-fornecedor-busca').dataset.selectedId = '';
            $('lancamento-fornecedor-busca').dataset.selectedLabel = '';
            $('lancamento-fornecedor-busca').setAttribute('autocomplete', 'off');
            $('lancamento-fornecedor-busca').focus();
        }
    }

    async function salvarLancamento() {
        const fornecedorId = $('lancamento-fornecedor-id')?.value || '';
        const fornecedorBusca = ($('lancamento-fornecedor-busca')?.value || '').trim();
        if (!fornecedorId && !fornecedorBusca) {
            showToast('Selecione um fornecedor antes de salvar.', 'error');
                $('lancamento-fornecedor-busca')?.focus();
            return;
        }

        const payload = {
            id: $('lancamento-id')?.value || '',
            data_emissao: $('lancamento-data-emissao')?.value || '',
            numero_fatura: $('lancamento-numero-fatura')?.value || '',
            fornecedor_id: $('lancamento-fornecedor-id')?.value || '',
            fornecedor_busca: $('lancamento-fornecedor-busca')?.value || '',
            dinheiro: toNumber($('lancamento-dinheiro')?.value),
            cartao: toNumber($('lancamento-cartao')?.value),
            nota_credito: toNumber($('lancamento-nota-credito')?.value),
            valor_fatura: toNumber($('lancamento-valor-fatura')?.value),
            parcelas: parseInt($('lancamento-parcelas')?.value || '1', 10) || 1,
            valor_parcela: toNumber($('lancamento-valor-parcela')?.value),
            data_vencimento: $('lancamento-data-vencimento')?.value || '',
            status_pagamento: $('lancamento-status-pagamento')?.value || '',
            total_pago: toNumber($('lancamento-total')?.value),
            saldo_aberto: toNumber($('lancamento-saldo-aberto')?.value),
            itens_combustivel: App.itensCombustivel,
            itens_manutencao: App.itensManutencao,
            itens_revisao: App.itensRevisao,
        };

        try {
            await apiFetch('/lancamentos/salvar/', {
                method: 'POST',
                json: payload
            });

            showToast('Lançamento salvo com sucesso.');
            resetarGradeLancamento();
            limparLancamento();
            const preview = $('itens-lancamento-preview');
            if (preview) {
                preview.innerHTML = '<tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>€ 0,00</td><td></td></tr>';
            }
            carregarConsulta();
            carregarUltimosLancamentos();
            carregarRelatorioFaturas();
            carregarRelatorioFinanceiro();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar lançamento.', 'error');
        }
    }

    async function editarLancamento(id) {
        try {
            // Buscar dados do servidor PRIMEIRO
            const data = await apiFetch(`/lancamentos/${id}/`);

            // Activar secção SEM chamar showSection (que chamaria limparLancamento)
            qsa('.content-section').forEach(s => {
                s.classList.toggle('active', s.id === 'lancamentos-section');
            });
            qsa('.menu-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === 'lancamentos-section');
            });
            updatePageHeader && updatePageHeader('lancamentos-section');

            // Limpar grades de itens (não limpar campos do formulário)
            App.itensCombustivel = [];
            App.itensManutencao  = [];
            App.itensRevisao     = [];

            // Preencher campos do cabeçalho com dados do servidor
            const set = (id, val) => { const el = $(id); if (el) el.value = (val != null ? val : ''); };

            set('lancamento-id',               data.id);
            set('lancamento-id-visual',        data.id);
            set('lancamento-numero-fatura',    data.numero_fatura);
            set('lancamento-data-emissao',     data.data_emissao);
            set('lancamento-data-vencimento',  data.data_vencimento);
            set('lancamento-fornecedor-id',    data.fornecedor_id);
            set('lancamento-parcelas',         data.parcelas || 1);
            set('lancamento-valor-parcela',    data.valor_parcela > 0 ? toNumber(data.valor_parcela).toFixed(2) : '');
            set('lancamento-valor-fatura',     toNumber(data.valor_fatura).toFixed(2));
            set('lancamento-status-pagamento', data.status_pagamento);
            set('lancamento-saldo-aberto',     toNumber(data.saldo_aberto).toFixed(2));
            set('lancamento-total',            toNumber(data.total_pago).toFixed(2));

            // Campos de pagamento (só mostrar se > 0)
            set('lancamento-dinheiro',    data.dinheiro    > 0 ? toNumber(data.dinheiro).toFixed(2)    : '');
            set('lancamento-cartao',      data.cartao      > 0 ? toNumber(data.cartao).toFixed(2)      : '');
            set('lancamento-nota-credito',data.nota_credito > 0 ? toNumber(data.nota_credito).toFixed(2) : '');

            // Fornecedor (campo texto + hidden)
            const fb = $('lancamento-fornecedor-busca');
            if (fb) {
                fb.value                 = data.fornecedor || '';
                fb.dataset.selectedId    = data.fornecedor_id || '';
                fb.dataset.selectedLabel = data.fornecedor || '';
            }
            const fsugest = $('fornecedor-sugestoes');
            if (fsugest) { fsugest.innerHTML = ''; }

            // Carregar itens de combustível
            App.itensCombustivel = (data.itens_combustivel || []).map(item => ({
                combustivel_id:   item.combustivel_id   || '',
                combustivel_nome: item.combustivel_nome || 'Combustível',
                frota_id:         item.frota_id         || '',
                matricula:        item.matricula        || '',
                km_inicio:        item.km_inicio        || 0,
                km_final:         item.km_final         || 0,
                km_total:         item.km_total         || 0,
                litro:            item.litro            || 0,
                valor_litro:      item.valor_litro      || 0,
                valor_total:      item.valor_total      || 0,
            }));

            // Carregar itens de manutenção
            App.itensManutencao = (data.itens_manutencao || []).map(item => ({
                frota_id:    item.frota_id   || '',
                matricula:   item.matricula  || '',
                descricao:   item.descricao  || 'Manutenção',
                km_inicio:   item.km_inicio  || 0,
                km_final:    item.km_final   || 0,
                km_total:    item.km_total   || 0,
                litro:       item.litro      || 0,
                valor_litro: item.valor_litro|| 0,
                valor:       item.valor      || 0,
                observacao:  item.observacao || '',
            }));

            // Carregar itens de revisão
            App.itensRevisao = (data.itens_revisao || []).map(item => ({
                frota_id:            item.frota_id            || '',
                matricula:           item.matricula           || '',
                marca:               item.marca               || '',
                modelo:              item.modelo              || '',
                data_ultima_revisao: item.data_ultima_revisao || '',
                km_ultima_revisao:   item.km_ultima_revisao   || 0,
                km_rodados:          item.km_rodados          || 0,
                kms_previsao:        item.kms_previsao        || 0,
                km_para_revisao:     item.km_para_revisao     || 0,
                funcionario_id:      item.funcionario_id      || '',
                funcionario:         item.funcionario         || '',
                observacao:          item.observacao          || '',
            }));

            // Renderizar grades
            try { renderItensCombustivelGrid();   } catch(e) { console.error('grid comb:', e); }
            try { renderItensManutencaoGrid();    } catch(e) { console.error('grid man:',  e); }
            try { renderItensRevisaoGrid();       } catch(e) { console.error('grid rev:',  e); }
            try { renderLancamentoPreviewTable(); } catch(e) { console.error('preview:',   e); }

            // Activar painel correcto
            if (App.itensCombustivel.length) {
                const ult = App.itensCombustivel[App.itensCombustivel.length - 1];
                if (ult && ult.combustivel_id) {
                    selecionarCombustivel(ult.combustivel_id, ult.combustivel_nome || 'Combustível');
                }
            } else if (App.itensManutencao.length) {
                ativarPainelLancamento('manutencao');
            } else if (App.itensRevisao.length) {
                ativarPainelLancamento('revisao');
            } else {
                if (typeof selecionarNenhumCombustivel === 'function') selecionarNenhumCombustivel();
            }

            try { atualizarResumoLancamento(); } catch(e) {}
            try { carregarUltimosLancamentos(); } catch(e) {}

            showToast('Lançamento #' + data.id + ' pronto para edição.', 'info');

        } catch (error) {
            showToast(error.message || 'Erro ao carregar lançamento.', 'error');
        }
    }

    async function excluirLancamento(id) {
        if (!confirm('Confirma a exclusão deste lançamento?')) return;

        try {
            await apiFetch(`/lancamentos/${id}/excluir/`, {
                method: 'POST'
            });

            showToast('Lançamento excluído com sucesso.');
            carregarConsulta();
            carregarUltimosLancamentos();
            carregarRelatorioFaturas();
            carregarRelatorioFinanceiro();
        } catch (error) {
            showToast(error.message || 'Erro ao excluir lançamento.', 'error');
        }
    }

    function atualizarResumoLancamento() {
        const valorFatura = toNumber($('lancamento-valor-fatura')?.value);
        const totalPago = toNumber($('lancamento-total')?.value);
        const saldoAberto = toNumber($('lancamento-saldo-aberto')?.value);
        const status = ($('lancamento-status-pagamento')?.value || (saldoAberto <= 0 && valorFatura > 0 ? 'Paga' : totalPago > 0 ? 'Parcial' : 'Em aberto'));
        if ($('resumo-valor-fatura')) $('resumo-valor-fatura').textContent = formatCurrency(valorFatura);
        if ($('resumo-total-pago')) $('resumo-total-pago').textContent = formatCurrency(totalPago);
        if ($('resumo-saldo-aberto')) $('resumo-saldo-aberto').textContent = formatCurrency(saldoAberto);
        if ($('resumo-status-lancamento')) $('resumo-status-lancamento').textContent = status || 'Em aberto';
        if ($('elion-total-pago-label')) $('elion-total-pago-label').textContent = formatCurrency(totalPago);
        if ($('elion-saldo-label')) $('elion-saldo-label').textContent = formatCurrency(saldoAberto);
    }

    async function carregarUltimosLancamentos() {
        setLoading('lancamentos-ultimos-lista', 'A carregar últimos lançamentos...');
        try {
            const data = await apiFetch('/consulta/');
            const linhas = (data.linhas || []).slice().sort((a, b) => Number(b.id || b.lancamento_id || 0) - Number(a.id || a.lancamento_id || 0)).slice(0, 12);
            if (!linhas.length) {
                renderEmpty('lancamentos-ultimos-lista', 'Ainda não existem lançamentos registados.');
                return;
            }
            $('lancamentos-ultimos-lista').innerHTML = `
                <div class="table-responsive lancamentos-quick-table">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data</th>
                                <th>Fatura</th>
                                <th>Fornecedor</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Saldo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.map(linha => `
                                <tr>
                                    <td>${escapeHtml(String(linha.id || linha.lancamento_id || ''))}</td>
                                    <td>${escapeHtml(linha.data_emissao || '')}</td>
                                    <td>${escapeHtml(linha.numero_fatura || '')}</td>
                                    <td>${escapeHtml(linha.fornecedor || '')}</td>
                                    <td>${formatCurrency(linha.valor_fatura || 0)}</td>
                                    <td>${formatCurrency(linha.total_pago || 0)}</td>
                                    <td>${formatCurrency(linha.saldo_aberto || 0)}</td>
                                    <td>
                                        <div class="table-actions">
                                            <button type="button" class="btn btn-sm btn-outline" onclick="editarLancamento(${linha.id})">Editar</button>
                                            <button type="button" class="btn btn-sm btn-danger" onclick="excluirLancamento(${linha.id})">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('lancamentos-ultimos-lista', error.message || 'Erro ao carregar últimos lançamentos.');
        }
    }

    function renderConsultaLancamentosHtml(linhas, includeHeader = true) {
        const header = includeHeader ? `${getEmpresaRelatorioHtml('Consulta de Lançamentos', 'Listagem de lançamentos')}` : '';
        return `
            ${header}
            <div class="table-responsive report-wide-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Fatura</th>
                            <th>Fornecedor</th>
                            <th>Valor Fatura</th>
                            <th>Dinheiro</th>
                            <th>Cartão</th>
                            <th>Total Pago</th>
                            <th>Saldo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas.map(linha => `
                            <tr>
                                <td>${escapeHtml(String(linha.id || linha.lancamento_id || ''))}</td>
                                <td>${escapeHtml(linha.data_emissao || '')}</td>
                                <td>${escapeHtml(linha.numero_fatura || '')}</td>
                                <td>${escapeHtml(linha.fornecedor || '')}</td>
                                <td>${formatCurrency(linha.valor_fatura || 0)}</td>
                                <td>${formatCurrency(linha.dinheiro || 0)}</td>
                                <td>${formatCurrency(linha.cartao || 0)}</td>
                                <td>${formatCurrency(linha.total_pago || 0)}</td>
                                <td>${formatCurrency(linha.saldo_aberto || 0)}</td>
                                <td>${renderStatusBadge(linha.status_pagamento || '')}</td>
                                <td>
                                    <div class="table-actions">
                                        <button type="button" class="btn btn-sm btn-outline" onclick="editarLancamento(${linha.id})" title="Editar lançamento">✏️ Editar</button>
                                        <button type="button" class="btn btn-sm btn-danger" onclick="excluirLancamento(${linha.id})" title="Eliminar lançamento">🗑️ Excluir</button>
                                        <button type="button" class="btn btn-sm btn-success" onclick="abrirModalBaixaFatura(${linha.id}, ${toNumber(linha.valor_fatura || 0)}, ${toNumber(linha.total_pago || 0)}, ${toNumber(linha.saldo_aberto || 0)})" title="Dar baixa">✅ Dar baixa</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function carregarConsulta() {
        const query = buildQuery({
            data_inicio: $('consulta-data-inicio')?.value || '',
            data_fim: $('consulta-data-fim')?.value || '',
            fornecedor: $('consulta-fornecedor')?.value || '',
            fatura: $('consulta-fatura')?.value || '',
            ordem: $('consulta-ordem')?.value || 'data',
        });

        setLoading('consulta-lista', 'A carregar lançamentos...');

        try {
            const data = await apiFetch(`/consulta/?${query}`);
            const linhas = data.linhas || [];

            if (!linhas.length) {
                renderEmpty('consulta-lista', 'Nenhum lançamento encontrado.');
                return;
            }

            $('consulta-lista').innerHTML = renderConsultaLancamentosHtml(linhas, true);
        } catch (error) {
            setError('consulta-lista', error.message || 'Erro ao carregar consulta.');
        }
    }

    async function carregarConsultaPopup() {
        const destino = $('launch-consulta-lista');
        if (!destino) return;
        const query = buildQuery({
            data_inicio: $('launch-consulta-data-inicio')?.value || '',
            data_fim: $('launch-consulta-data-fim')?.value || '',
            fornecedor: $('launch-consulta-fornecedor')?.value || '',
            fatura: $('launch-consulta-fatura')?.value || '',
            ordem: $('launch-consulta-ordem')?.value || 'data',
        });
        setLoading('launch-consulta-lista', 'A carregar lançamentos...');
        try {
            const data = await apiFetch(`/consulta/?${query}`);
            const linhas = data.linhas || [];
            if (!linhas.length) {
                renderEmpty('launch-consulta-lista', 'Nenhum lançamento encontrado.');
                return;
            }
            destino.innerHTML = renderConsultaLancamentosHtml(linhas, false);
        } catch (error) {
            setError('launch-consulta-lista', error.message || 'Erro ao carregar consulta.');
        }
    }

    function getEmpresaRelatorioHtml(titulo, subtitulo = '') {
        const chipName = $('company-chip-name')?.textContent?.trim() || 'Elion ERP';
        const chipLogo = $('company-chip-logo')?.getAttribute('src') || '';
        return `
            <div class="report-brand-card">
                <div class="report-brand-main">
                    <div class="report-brand-media">${chipLogo ? `<img src="${chipLogo}" alt="${escapeHtml(chipName)}">` : '<div class="report-brand-placeholder">E</div>'}</div>
                    <div>
                        <div class="report-brand-company">${escapeHtml(chipName)}</div>
                        <div class="report-brand-title">${escapeHtml(titulo || '')}</div>
                        ${subtitulo ? `<div class="report-brand-subtitle">${escapeHtml(subtitulo)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function renderRelatorioTabela(containerId, data, includeActions = true) {
        const el = $(containerId);
        const linhas = data.linhas || [];
        const totais = data.totais || {};

        if (!el) return;
        if (!linhas.length) {
            el.innerHTML = `${getEmpresaRelatorioHtml(containerId === 'baixa-faturas-lista' ? 'Baixa de Faturas' : 'Relatório Financeiro', containerId === 'baixa-faturas-lista' ? 'Rotina de baixa com identificação do lançamento e pesquisa rápida' : 'Mapa profissional com identificação do lançamento')}<div class="empty-state">Nenhum registo encontrado.</div>`;
            return;
        }

        const titulo = containerId === 'baixa-faturas-lista' ? 'Baixa de Faturas' : 'Relatório Financeiro';
        const subtitulo = containerId === 'baixa-faturas-lista'
            ? 'Rotina de baixa com identificação do lançamento e pesquisa rápida'
            : 'Mapa profissional com identificação do lançamento';

        el.innerHTML = `
            ${getEmpresaRelatorioHtml(titulo, subtitulo)}
            <div class="table-responsive report-wide-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data Emissão</th>
                            <th>Vencimento</th>
                            <th>Fatura</th>
                            <th>Fornecedor</th>
                            <th>NIF</th>
                            <th>Valor Fatura</th>
                            <th>Dinheiro</th>
                            <th>Cartão</th>
                            <th>Transferência</th>
                            <th>MBWay</th>
                            <th>Nota de Crédito</th>
                            <th>Total Pago</th>
                            <th>Saldo em Aberto</th>
                            <th>Status</th>
                            ${includeActions ? '<th>Ações</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas.map(linha => `
                            <tr>
                                <td>${escapeHtml(String(linha.id || linha.lancamento_id || ''))}</td>
                                <td>${escapeHtml(linha.data_emissao || '')}</td>
                                <td>${escapeHtml(linha.data_vencimento || '')}</td>
                                <td>${escapeHtml(linha.numero_fatura || '')}</td>
                                <td>${escapeHtml(linha.fornecedor || '')}</td>
                                <td>${escapeHtml(linha.nif || '')}</td>
                                <td>${formatCurrency(linha.valor_fatura || 0)}</td>
                                <td>${formatCurrency(linha.dinheiro || 0)}</td>
                                <td>${formatCurrency(linha.cartao || 0)}</td>
                                <td>${formatCurrency(linha.transferencia || 0)}</td>
                                <td>${formatCurrency(linha.mbway || 0)}</td>
                                <td>${formatCurrency(linha.nota_credito || 0)}</td>
                                <td>${formatCurrency(linha.total_pago || 0)}</td>
                                <td>${formatCurrency(linha.saldo_aberto || 0)}</td>
                                <td>${renderStatusBadge(linha.status_pagamento || '')}</td>
                                ${includeActions ? `
                                <td>
                                    <div class="table-actions">
                                        <button type="button" class="btn btn-sm btn-outline" onclick="editarLancamento(${linha.id})">Editar</button>
                                        <button type="button" class="btn btn-sm btn-danger" onclick="excluirLancamento(${linha.id})">Excluir</button>
                                        <button type="button" class="btn btn-sm btn-success" onclick="abrirModalBaixaFatura(${linha.id}, ${toNumber(linha.valor_fatura || 0)}, ${toNumber(linha.total_pago || 0)}, ${toNumber(linha.saldo_aberto || 0)})">Dar baixa</button>
                                    </div>
                                </td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="6">Totais</th>
                            <th>${formatCurrency(totais.valor_fatura || 0)}</th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th>${formatCurrency(totais.nota_credito || 0)}</th>
                            <th>${formatCurrency(totais.total_pago || 0)}</th>
                            <th>${formatCurrency(totais.saldo_aberto || 0)}</th>
                            <th colspan="${includeActions ? 2 : 1}"></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    async function carregarRelatorioFinanceiro() {
        const query = buildQuery({
            data_inicio: $('rf-data-inicio')?.value || '',
            data_fim: $('rf-data-fim')?.value || '',
            fornecedor: $('rf-fornecedor')?.value || '',
            fatura: $('rf-fatura')?.value || '',
            status: $('rf-status')?.value || '',
            periodo_tipo: $('rf-periodo-tipo')?.value || 'emissao',
        });

        setLoading('relatorio-financeiro-lista', 'A carregar relatório financeiro...');

        try {
            const data = await apiFetch(`/relatorios/financeiro/?${query}`);
            renderRelatorioTabela('relatorio-financeiro-lista', data, true);
        } catch (error) {
            setError('relatorio-financeiro-lista', error.message || 'Erro ao carregar relatório financeiro.');
        }
    }

    function renderRelatorioBaixas(containerId, data) {
        const el = $(containerId);
        const linhas = data.linhas || [];
        const totais = data.totais || {};

        if (!el) return;
        if (!linhas.length) {
            el.innerHTML = `${getEmpresaRelatorioHtml('Relatório de Baixa de Faturas', 'Mapa moderno das baixas registadas')}<div class="empty-state">Nenhuma baixa encontrada.</div>`;
            return;
        }

        el.innerHTML = `
            ${getEmpresaRelatorioHtml('Relatório de Baixa de Faturas', 'Mapa moderno das baixas registadas')}
            <div class="summary-grid report-summary-grid report-summary-grid-spaced">
                <div class="summary-item report-summary-item"><strong>Total baixado</strong><span>${formatCurrency(totais.total_baixado || 0)}</span></div>
                <div class="summary-item report-summary-item"><strong>Dinheiro</strong><span>${formatCurrency(totais.total_dinheiro || 0)}</span></div>
                <div class="summary-item report-summary-item"><strong>Cartão</strong><span>${formatCurrency(totais.total_cartao || 0)}</span></div>
                <div class="summary-item report-summary-item"><strong>Nota de Crédito</strong><span>${formatCurrency(totais.total_nota_credito || 0)}</span></div>
                <div class="summary-item report-summary-item"><strong>Registos</strong><span>${linhas.length}</span></div>
            </div>
            <div class="table-responsive report-wide-wrap">
                <table class="data-table relatorio-baixas-table">
                    <thead>
                        <tr>
                            <th>ID Lançamento</th>
                            <th>Fornecedor</th>
                            <th>Fatura</th>
                            <th>Data da baixa</th>
                            <th>Forma de pagamento</th>
                            <th>Login</th>
                            <th>Valor total</th>
                            <th>Dinheiro</th>
                            <th>Cartão</th>
                            <th>Transferência</th>
                            <th>MBWay</th>
                            <th>Nota de Crédito</th>
                            <th>Valor pago</th>
                            <th>Valor em aberto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas.map(linha => `
                            <tr>
                                <td>${escapeHtml(String(linha.lancamento_id || linha.id || ''))}</td>
                                <td>${escapeHtml(linha.fornecedor || '')}</td>
                                <td>${escapeHtml(linha.numero_fatura || '')}</td>
                                <td>${escapeHtml(linha.data_baixa || '')}</td>
                                <td>${escapeHtml(linha.forma_pagamento || '')}</td>
                                <td>${escapeHtml(linha.usuario || '')}</td>
                                <td>${formatCurrency(linha.valor_total || 0)}</td>
                                <td>${formatCurrency(linha.dinheiro || 0)}</td>
                                <td>${formatCurrency(linha.cartao || 0)}</td>
                                <td>${formatCurrency(linha.transferencia || 0)}</td>
                                <td>${formatCurrency(linha.mbway || 0)}</td>
                                <td>${formatCurrency(linha.nota_credito || 0)}</td>
                                <td>${formatCurrency(linha.valor_baixado || 0)}</td>
                                <td>${formatCurrency(linha.saldo_resultante || linha.em_aberto || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="12">Total baixado</th>
                            <th>${formatCurrency(totais.total_baixado || 0)}</th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    async function carregarRelatorioFornecedor() {
        const query = buildQuery({
            data_inicio: $('rfor-data-inicio')?.value || '',
            data_fim: $('rfor-data-fim')?.value || '',
            fornecedor: $('rfor-fornecedor')?.value || '',
            fatura: $('rfor-fatura')?.value || '',
            status: $('rfor-status')?.value || '',
            periodo_tipo: $('rfor-periodo-tipo')?.value || 'emissao',
        });

        setLoading('relatorio-fornecedor-lista', 'A carregar gastos por fornecedor...');

        try {
            const data = await apiFetch(`/relatorios/financeiro/fornecedor/?${query}`);
            const linhas = data.linhas || [];
            const totais = data.totais || {};

            let html = `
                ${getEmpresaRelatorioHtml('Gastos por Fornecedor', 'Dashboard consolidado por fornecedor com base nos lançamentos do período')}
                <div class="kpi-grid">
                    <div class="kpi-card"><div class="label">Fornecedores</div><div class="value">${formatNumber(totais.total_fornecedores || 0, 0)}</div></div>
                    <div class="kpi-card"><div class="label">Faturas</div><div class="value">${formatNumber(totais.total_faturas || 0, 0)}</div></div>
                    <div class="kpi-card"><div class="label">Nota de Crédito</div><div class="value">${formatCurrency(totais.nota_credito || 0)}</div></div>
                    <div class="kpi-card"><div class="label">Total gasto</div><div class="value">${formatCurrency(totais.valor_total || 0)}</div></div>
                    <div class="kpi-card"><div class="label">Total pago</div><div class="value">${formatCurrency(totais.total_pago || 0)}</div></div>
                    <div class="kpi-card"><div class="label">Em aberto</div><div class="value">${formatCurrency(totais.saldo_aberto || 0)}</div></div>
                    <div class="kpi-card"><div class="label">Vencido</div><div class="value">${formatCurrency(totais.saldo_vencido || 0)}</div></div>
                </div>
                <div class="fuel-chart-grid supplier-chart-grid">
                    <div class="chart-card">
                        <div class="chart-title">Top fornecedores por total gasto</div>
                        <canvas id="fornecedor-chart-total" height="240"></canvas>
                    </div>
                </div>
                <div class="section-subtitle">Listagem consolidada</div>
                <div class="table-responsive report-wide-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fornecedor</th>
                                <th>NIF</th>
                                <th>Qtd. Faturas</th>
                                <th>Primeira Emissão</th>
                                <th>Última Emissão</th>
                                <th>Nota de Crédito</th>
                                <th>Total Gasto</th>
                                <th>Total Pago</th>
                                <th>Em Aberto</th>
                                <th>Vencido</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.length ? linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(l.fornecedor || '')}</td>
                                    <td>${escapeHtml(l.nif || '')}</td>
                                    <td>${formatNumber(l.quantidade_faturas || 0, 0)}</td>
                                    <td>${escapeHtml(l.primeira_emissao || '')}</td>
                                    <td>${escapeHtml(l.ultima_emissao || '')}</td>
                                    <td>${formatCurrency(l.nota_credito || 0)}</td>
                                    <td>${formatCurrency(l.valor_total || 0)}</td>
                                    <td>${formatCurrency(l.total_pago || 0)}</td>
                                    <td>${formatCurrency(l.saldo_aberto || 0)}</td>
                                    <td>${formatCurrency(l.saldo_vencido || 0)}</td>
                                    <td>${renderStatusBadge(l.status_consolidado || '')}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="11" class="text-center">Nenhum registo encontrado.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            $('relatorio-fornecedor-lista').innerHTML = html;
            const topTotal = linhas.slice(0, 8);
            drawSimpleBarChart('fornecedor-chart-total', topTotal.map(i => (i.fornecedor || '-').slice(0, 14)), topTotal.map(i => Number(i.valor_total || 0)), '€');
        } catch (error) {
            setError('relatorio-fornecedor-lista', error.message || 'Erro ao carregar gastos por fornecedor.');
        }
    }

    async function carregarRelatorioFaturas() {
        const query = buildQuery({
            data_inicio: $('rfat-data-inicio')?.value || '',
            data_fim: $('rfat-data-fim')?.value || '',
            fornecedor: $('rfat-fornecedor')?.value || '',
            fatura: $('rfat-fatura')?.value || '',
        });

        setLoading('relatorio-faturas-lista', 'A carregar relatório de baixa de faturas...');

        try {
            const data = await apiFetch(`/relatorios/faturas/?${query}`);
            renderRelatorioBaixas('relatorio-faturas-lista', data);
        } catch (error) {
            setError('relatorio-faturas-lista', error.message || 'Erro ao carregar relatório de baixa de faturas.');
        }
    }

    async function carregarBaixaFaturas() {
        const query = buildQuery({
            data_inicio: $('rbf-data-inicio')?.value || '',
            data_fim: $('rbf-data-fim')?.value || '',
            fornecedor: $('rbf-fornecedor')?.value || '',
            fatura: $('rbf-fatura')?.value || '',
            status: $('rbf-status')?.value || '',
            periodo_tipo: $('rbf-periodo-tipo')?.value || 'vencimento',
        });

        setLoading('baixa-faturas-lista', 'A carregar rotina de baixa de faturas...');

        try {
            const data = await apiFetch(`/relatorios/baixa-faturas/?${query}`);
            renderRelatorioTabela('baixa-faturas-lista', data, true);
        } catch (error) {
            setError('baixa-faturas-lista', error.message || 'Erro ao carregar baixa de faturas.');
        }
    }


    async function carregarRelatorioFrota() {
        const query = buildQuery({
            data_inicio: $('rfr-data-inicio')?.value || '',
            data_fim: $('rfr-data-fim')?.value || '',
            matricula: $('rfr-matricula')?.value || '',
        });

        setLoading('relatorio-frota-lista', 'A carregar relatório de frota...');

        try {
            const data = await apiFetch(`/relatorios/frota/?${query}`);
            const linhas = data.linhas || [];

            if (!linhas.length) {
                $('relatorio-frota-lista').innerHTML = `${getEmpresaRelatorioHtml('Relatório de Frota', 'Listagem da frota com identificação da empresa')}<div class="empty-state">Nenhum registo encontrado.</div>`;
                return;
            }

            $('relatorio-frota-lista').innerHTML = `
                ${getEmpresaRelatorioHtml('Relatório de Frota', 'Listagem da frota com identificação da empresa')}
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Seguradora</th>
                                <th>Seguro</th>
                                <th>Dias p/ Seguro</th>
                                <th>Inspeção</th>
                                <th>Dias p/ Inspeção</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(l.matricula || '')}</td>
                                    <td>${escapeHtml(l.seguradora || '')}</td>
                                    <td>${escapeHtml(l.seguro || '')}</td>
                                    <td>${l.dias_seguro ?? '-'}</td>
                                    <td>${escapeHtml(l.inspecao || '')}</td>
                                    <td>${l.dias_inspecao ?? '-'}</td>
                                    <td>${renderStatusBadge(l.status || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('relatorio-frota-lista', error.message || 'Erro ao carregar relatório de frota.');
        }
    }

    async function carregarRelatorioManutencao() {
        const query = buildQuery({
            data_inicio: $('rm-data-inicio')?.value || '',
            data_fim: $('rm-data-fim')?.value || '',
            matricula: $('rm-matricula')?.value || '',
        });

        setLoading('relatorio-manutencao-lista', 'A carregar relatório de manutenção...');

        try {
            const data = await apiFetch(`/relatorios/manutencao/?${query}`);
            const linhas = data.linhas || [];

            if (!linhas.length) {
                renderEmpty('relatorio-manutencao-lista', 'Nenhum registo encontrado.');
                return;
            }

            $('relatorio-manutencao-lista').innerHTML = `
                ${getEmpresaRelatorioHtml('Relatório de Manutenção', 'Mapa moderno com identificação da empresa e da viatura')}
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Matrícula</th>
                                <th>KM Início</th>
                                <th>KM Final</th>
                                <th>KM Total</th>
                                <th>Valor</th>
                                <th>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(String(l.id || ''))}</td>
                                    <td>${escapeHtml(l.data || '')}</td>
                                    <td>${escapeHtml(l.descricao || 'Manutenção')}</td>
                                    <td>${escapeHtml(l.matricula || '')}</td>
                                    <td>${escapeHtml(l.km_inicio || '')}</td>
                                    <td>${escapeHtml(l.km_final || '')}</td>
                                    <td>${escapeHtml(l.km_total || '')}</td>
                                    <td>${formatCurrency(l.valor || 0)}</td>
                                    <td>${escapeHtml(l.observacao || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('relatorio-manutencao-lista', error.message || 'Erro ao carregar relatório de manutenção.');
        }
    }

    // Filtro rápido por mês/ano na Folha de Caixa: calcula o primeiro e o último dia
    // do mês escolhido (sem risco de erro de digitação manual, ex.: dia 31 em fevereiro)
    // e preenche automaticamente os campos de data de/até antes de pesquisar.
    function aplicarFiltroMesCaixa() {
        const valor = $('rc-mes-ano')?.value || '';
        if (!valor) return;
        const [anoStr, mesStr] = valor.split('-');
        const ano = parseInt(anoStr, 10);
        const mes = parseInt(mesStr, 10);
        if (!ano || !mes) return;
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0);
        const pad = (n) => String(n).padStart(2, '0');
        const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        if ($('rc-data-inicio')) $('rc-data-inicio').value = iso(primeiroDia);
        if ($('rc-data-fim')) $('rc-data-fim').value = iso(ultimoDia);
        carregarRelatorioCaixa();
    }

    function limparFiltroMesCaixa() {
        if ($('rc-mes-ano')) $('rc-mes-ano').value = '';
    }

    async function carregarRelatorioCaixa() {
        const containerId = 'relatorio-caixa-lista';
        const requestToken = beginReportRequest(containerId);
        const query = buildQuery({
            data_inicio: $('rc-data-inicio')?.value || '',
            data_fim: $('rc-data-fim')?.value || '',
            fornecedor: $('rc-fornecedor')?.value || '',
            fatura: $('rc-fatura')?.value || '',
            ordem: $('rc-ordem')?.value || 'data',
        });

        setLoading(containerId, 'A carregar folha de caixa...');

        try {
            const data = await apiFetch(`/relatorios/caixa/?${query}`);
            if (!isCurrentReportRequest(containerId, requestToken)) return;
            const linhas = data.linhas || [];
            const totais = data.totais || {};

            $(containerId).innerHTML = `
                ${getEmpresaRelatorioHtml('Folha de Caixa', 'Resumo contabilístico por período')}
                <div class="summary-grid report-summary-grid report-summary-grid-spaced">
                    <div class="summary-item report-summary-item"><strong>Total em Dinheiro</strong><span>${formatCurrency(totais.dinheiro || 0)}</span></div>
                    <div class="summary-item report-summary-item"><strong>Total em Cartão</strong><span>${formatCurrency(totais.cartao || 0)}</span></div>
                    <div class="summary-item report-summary-item"><strong>Nota de Crédito</strong><span>${formatCurrency(totais.nota_credito || 0)}</span></div>
                    <div class="summary-item report-summary-item"><strong>Total Geral</strong><span>${formatCurrency(totais.total || totais.geral || 0)}</span></div>
                    <div class="summary-item report-summary-item"><strong>Nº de Faturas</strong><span>${Number(totais.quantidade_faturas ?? linhas.length ?? 0)}</span></div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data</th>
                                <th>Fatura</th>
                                <th>Fornecedor</th>
                                <th>Dinheiro €</th>
                                <th>Cartão €</th>
                                <th>Nota de Crédito €</th>
                                <th>Total €</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.length ? linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(String(l.id || ''))}</td>
                                    <td>${escapeHtml(l.data_emissao || l.data || '')}</td>
                                    <td>${escapeHtml(l.fatura || l.descricao || '')}</td>
                                    <td>${escapeHtml(l.fornecedor || '')}</td>
                                    <td>${formatCurrency(l.dinheiro || 0)}</td>
                                    <td>${formatCurrency(l.cartao || 0)}</td>
                                    <td>${formatCurrency(l.nota_credito || 0)}</td>
                                    <td>${formatCurrency(l.total || l.entradas || 0)}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" class="text-center">Nenhum registo encontrado.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            if (!isCurrentReportRequest(containerId, requestToken)) return;
            setError(containerId, error.message || 'Erro ao carregar folha de caixa.');
        }
    }


    async function carregarRelatorioCombustivel() {
        const query = buildQuery({
            data_inicio: $('rcomb-data-inicio')?.value || '',
            data_fim: $('rcomb-data-fim')?.value || '',
            matricula: $('rcomb-matricula')?.value || '',
            fornecedor: $('rcomb-fornecedor')?.value || '',
            combustivel: $('rcomb-combustivel')?.value || '',
        });

        setLoading('relatorio-combustivel-lista', 'A carregar relatório de combustível...');

        try {
            const data = await apiFetch(`/relatorios/combustivel/?${query}`);
            const resumo = data.resumo || {};
            const resumoMatriculas = data.resumo_matriculas || [];
            const linhas = data.linhas || [];

            let html = `
                ${getEmpresaRelatorioHtml('Relatório de Combustível', 'Indicadores profissionais e listagem detalhada por abastecimento')}
                <div class="kpi-grid">
                    <div class="kpi-card"><div class="label">Valor total</div><div class="value">${formatCurrency(resumo.valor_total || 0)}</div></div>
                    <div class="kpi-card"><div class="label">Litros totais</div><div class="value">${formatNumber(resumo.litros_total || 0, 2)} L</div></div>
                    <div class="kpi-card"><div class="label">Km totais</div><div class="value">${formatNumber(resumo.km_total || 0, 0)} km</div></div>
                    <div class="kpi-card"><div class="label">Média km/l</div><div class="value">${formatNumber(resumo.media_km_l || 0, 2)}</div></div>
                    <div class="kpi-card"><div class="label">Média €/km</div><div class="value">€ ${formatNumber(resumo.media_euro_km || 0, 3)}</div></div>
                    <div class="kpi-card"><div class="label">Preço médio €/l</div><div class="value">€ ${formatNumber(resumo.preco_medio_litro || 0, 3)}</div></div>
                </div>
            `;

            html += `
                <div class="fuel-chart-grid">
                    <div class="chart-card">
                        <div class="chart-title">Valor do litro por período</div>
                        <canvas id="fuel-chart-valor" height="220"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Litros por matrícula por período</div>
                        <canvas id="fuel-chart-litros" height="220"></canvas>
                    </div>
                </div>
            `;

            if (resumoMatriculas.length) {
                html += `
                    <div class="section-subtitle">Controle de abastecimento por matrícula</div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>KM Rodada</th>
                                    <th>Matrícula x Valor Abastecido</th>
                                    <th>Matrícula x Litros Abastecidos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resumoMatriculas.map(l => `
                                    <tr>
                                        <td>${escapeHtml(l.matricula || '-')}</td>
                                        <td>${formatNumber(l.km || 0, 0)} km</td>
                                        <td>${formatCurrency(l.valor || 0)}</td>
                                        <td>${formatNumber(l.litros || 0, 2)} L</td>
                                    </tr>
                                `).join('')}
                                <tr>
                                    <td><strong>Total</strong></td>
                                    <td><strong>${formatNumber(resumo.km_total || 0, 0)} km</strong></td>
                                    <td><strong>${formatCurrency(resumo.valor_total || 0)}</strong></td>
                                    <td><strong>${formatNumber(resumo.litros_total || 0, 2)} L</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            html += `
                <div class="section-subtitle">Listagem detalhada</div>
                <div class="table-responsive report-wide-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>KM Início</th>
                                <th>KM Final</th>
                                <th>KM Total</th>
                                <th>Litro (L)</th>
                                <th>Valor</th>
                                <th>Matrícula</th>
                                <th>Fatura</th>
                                <th>Fornecedor</th>
                                <th>Valor (L)</th>
                                <th>Combustível</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.length ? linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(l.data || '')}</td>
                                    <td>${formatNumber(l.km_inicio || 0, 0)}</td>
                                    <td>${formatNumber(l.km_final || 0, 0)}</td>
                                    <td>${formatNumber(l.km_total || 0, 0)}</td>
                                    <td>${formatNumber(l.litros || 0, 2)} L</td>
                                    <td>${formatCurrency(l.valor_total || 0)}</td>
                                    <td>${escapeHtml(l.matricula || '-')}</td>
                                    <td>${escapeHtml(l.fatura || '')}</td>
                                    <td>${escapeHtml(l.fornecedor || '')}</td>
                                    <td>€ ${formatNumber(l.valor_litro || 0, 3)}</td>
                                    <td>${escapeHtml(l.combustivel || '')}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="11" class="text-center">Nenhum registo encontrado.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            $('relatorio-combustivel-lista').innerHTML = html;
            drawSimpleBarChart('fuel-chart-valor', resumoMatriculas.map(i => i.matricula || '-'), resumoMatriculas.map(i => Number(i.valor || 0)), '€');
            drawSimpleBarChart('fuel-chart-litros', resumoMatriculas.map(i => i.matricula || '-'), resumoMatriculas.map(i => Number(i.litros || 0)), 'L');
        } catch (error) {
            setError('relatorio-combustivel-lista', error.message || 'Erro ao carregar relatório de combustível.');
        }
    }

    async function carregarRelatorioDocumentos() {
        const query = buildQuery({
            matricula: $('rd-matricula')?.value || '',
            status: $('rd-status')?.value || '',
        });

        setLoading('relatorio-documentos-lista', 'A carregar documentos da frota...');

        try {
            const data = await apiFetch(`/relatorios/documentos/?${query}`);
            const linhas = data.linhas || [];

            if (!linhas.length) {
                $('relatorio-documentos-lista').innerHTML = `${getEmpresaRelatorioHtml('Documento de Frota', 'Situação documental da frota com identificação da empresa')}<div class="empty-state">Nenhum registo encontrado.</div>`;
                return;
            }

            $('relatorio-documentos-lista').innerHTML = `
                ${getEmpresaRelatorioHtml('Documento de Frota', 'Situação documental da frota com identificação da empresa')}
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Seguradora</th>
                                <th>Seguro</th>
                                <th>Dias p/ Seguro</th>
                                <th>Inspeção</th>
                                <th>Dias p/ Inspeção</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas.map(l => `
                                <tr>
                                    <td>${escapeHtml(l.matricula || '')}</td>
                                    <td>${escapeHtml(l.seguradora || '')}</td>
                                    <td>${escapeHtml(l.seguro || '')}</td>
                                    <td>${l.dias_seguro ?? '-'}</td>
                                    <td>${escapeHtml(l.inspecao || '')}</td>
                                    <td>${l.dias_inspecao ?? '-'}</td>
                                    <td>${renderStatusBadge(l.status || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('relatorio-documentos-lista', error.message || 'Erro ao carregar documentos.');
        }
    }

    function drawSimpleBarChart(canvasId, labels, values, suffix = '') {
        const canvas = $(canvasId);
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 520;
        const width = Math.max(parentWidth - 8, 320);
        const height = 220;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const max = Math.max(...values, 0);
        const left = 44, right = 16, top = 18, bottom = 42;
        const plotW = width - left - right;
        const plotH = height - top - bottom;
        const step = labels.length ? plotW / labels.length : plotW;
        const barW = Math.max(Math.min(step * 0.56, 48), 18);
        ctx.strokeStyle = '#dbe3ef';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + plotH); ctx.lineTo(left + plotW, top + plotH); ctx.stroke();
        ctx.font = '12px Arial';
        ctx.fillStyle = '#64748b';
        for (let i = 0; i < 4; i++) {
            const y = top + (plotH / 3) * i;
            const v = max ? max - (max / 3) * i : 0;
            ctx.fillText(formatNumber(v, suffix === '€' ? 2 : 0), 4, y + 4);
            ctx.strokeStyle = '#eef2f7';
            ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + plotW, y); ctx.stroke();
        }
        values.forEach((value, index) => {
            const x = left + step * index + (step - barW) / 2;
            const barH = max ? (value / max) * plotH : 0;
            const y = top + plotH - barH;
            ctx.fillStyle = '#1f6fd6';
            ctx.fillRect(x, y, barW, barH);
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index] || '-', x + barW / 2, top + plotH + 16);
            const txt = suffix === '€' ? `${formatNumber(value, 2)} €` : `${formatNumber(value, 2)} ${suffix}`.trim();
            ctx.fillText(txt, x + barW / 2, Math.max(y - 8, 12));
            ctx.textAlign = 'start';
        });
    }

    function exportarRelatorio(tipo, formato='excel') {
        const map = {
            financeiro: {
                url: '/relatorios/financeiro/exportar/',
                params: {
                    data_inicio: $('rf-data-inicio')?.value || '',
                    data_fim: $('rf-data-fim')?.value || '',
                    fornecedor: $('rf-fornecedor')?.value || '',
                    fatura: $('rf-fatura')?.value || '',
                    status: $('rf-status')?.value || '',
                    periodo_tipo: $('rf-periodo-tipo')?.value || 'emissao',
                }
            },
            fornecedor: {
                url: '/relatorios/financeiro/fornecedor/exportar/',
                params: {
                    data_inicio: $('rfor-data-inicio')?.value || '',
                    data_fim: $('rfor-data-fim')?.value || '',
                    fornecedor: $('rfor-fornecedor')?.value || '',
                    fatura: $('rfor-fatura')?.value || '',
                    status: $('rfor-status')?.value || '',
                    periodo_tipo: $('rfor-periodo-tipo')?.value || 'emissao',
                }
            },
            faturas: {
                url: '/relatorios/faturas/exportar/',
                params: {
                    data_inicio: $('rfat-data-inicio')?.value || '',
                    data_fim: $('rfat-data-fim')?.value || '',
                    fornecedor: $('rfat-fornecedor')?.value || '',
                    fatura: $('rfat-fatura')?.value || '',
                    status: $('rfat-status')?.value || '',
                    periodo_tipo: $('rfat-periodo-tipo')?.value || 'emissao',
                }
            },
            frota: {
                url: '/relatorios/frota/exportar/',
                params: {
                    data_inicio: $('rfr-data-inicio')?.value || '',
                    data_fim: $('rfr-data-fim')?.value || '',
                    matricula: $('rfr-matricula')?.value || '',
                }
            },
            manutencao: {
                url: '/relatorios/manutencao/exportar/',
                params: {
                    data_inicio: $('rm-data-inicio')?.value || '',
                    data_fim: $('rm-data-fim')?.value || '',
                    matricula: $('rm-matricula')?.value || '',
                }
            },
            revisao: {
                url: '/relatorios/revisao/exportar/',
                params: {
                    matricula: $('revisao-filtro-matricula')?.value || '',
                    data_inicio: $('revisao-filtro-data-inicio')?.value || '',
                    data_fim: $('revisao-filtro-data-fim')?.value || '',
                }
            },
            caixa: {
                url: '/relatorios/caixa/exportar/',
                params: {
                    data_inicio: $('rc-data-inicio')?.value || '',
                    data_fim: $('rc-data-fim')?.value || '',
                    fornecedor: $('rc-fornecedor')?.value || '',
                    fatura: $('rc-fatura')?.value || '',
                    ordem: $('rc-ordem')?.value || 'data',
                }
            },
            combustivel: {
                url: '/relatorios/combustivel/exportar/',
                params: {
                    data_inicio: $('rcomb-data-inicio')?.value || '',
                    data_fim: $('rcomb-data-fim')?.value || '',
                    matricula: $('rcomb-matricula')?.value || '',
                    fornecedor: $('rcomb-fornecedor')?.value || '',
                    combustivel: $('rcomb-combustivel')?.value || '',
                }
            },
            documentos: {
                url: '/relatorios/documentos/exportar/',
                params: {
                    matricula: $('rd-matricula')?.value || '',
                    status: $('rd-status')?.value || '',
                }
            }
        };

        map.rotina_manutencao = { url: '/crm/manutencao-botao/exportar/', params: {} };
        if (!map[tipo]) return;
        const baseUrl = formato === 'pdf' ? `/relatorios/${tipo}/exportar-pdf/` : map[tipo].url;
        const query = buildQuery(map[tipo].params);
        const finalUrl = `${baseUrl}?${query}`;

        if (formato !== 'pdf') {
            window.location.href = finalUrl;
            return;
        }

        fetch(finalUrl, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(async (response) => {
            if (!response.ok) {
                const texto = await response.text().catch(() => '');
                throw new Error(texto || 'Não foi possível gerar o PDF.');
            }
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (!contentType.includes('application/pdf')) {
                const texto = await response.text().catch(() => '');
                throw new Error(texto || 'A exportação não retornou um arquivo PDF válido.');
            }
            const blob = await response.blob();
            const nomeArquivo = `${tipo}.pdf`;
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(urlBlob), 1000);
        })
        .catch((error) => {
            showToast(error.message || 'Erro ao gerar PDF.', 'error');
            window.open(finalUrl, '_blank');
        });
    }

    function imprimirRelatorio(tipo) {
        const map = {
            financeiro: {params:{data_inicio: $('rf-data-inicio')?.value || '', data_fim: $('rf-data-fim')?.value || '', fornecedor: $('rf-fornecedor')?.value || '', fatura: $('rf-fatura')?.value || '', status: $('rf-status')?.value || '', periodo_tipo: $('rf-periodo-tipo')?.value || 'emissao'}},
            fornecedor: {params:{data_inicio: $('rfor-data-inicio')?.value || '', data_fim: $('rfor-data-fim')?.value || '', fornecedor: $('rfor-fornecedor')?.value || '', fatura: $('rfor-fatura')?.value || '', status: $('rfor-status')?.value || '', periodo_tipo: $('rfor-periodo-tipo')?.value || 'emissao'}},
            faturas: {params:{data_inicio: $('rfat-data-inicio')?.value || '', data_fim: $('rfat-data-fim')?.value || '', fornecedor: $('rfat-fornecedor')?.value || '', fatura: $('rfat-fatura')?.value || '', status: $('rfat-status')?.value || '', periodo_tipo: $('rfat-periodo-tipo')?.value || 'emissao'}},
            frota: {params:{data_inicio: $('rfr-data-inicio')?.value || '', data_fim: $('rfr-data-fim')?.value || '', matricula: $('rfr-matricula')?.value || ''}},
            manutencao: {params:{data_inicio: $('rm-data-inicio')?.value || '', data_fim: $('rm-data-fim')?.value || '', matricula: $('rm-matricula')?.value || ''}},
            revisao: {params:{matricula: $('revisao-filtro-matricula')?.value || '', data_inicio: $('revisao-filtro-data-inicio')?.value || '', data_fim: $('revisao-filtro-data-fim')?.value || ''}},
            caixa: {params:{data_inicio: $('rc-data-inicio')?.value || '', data_fim: $('rc-data-fim')?.value || '', fornecedor: $('rc-fornecedor')?.value || '', fatura: $('rc-fatura')?.value || '', ordem: $('rc-ordem')?.value || 'data'}},
            combustivel: {params:{data_inicio: $('rcomb-data-inicio')?.value || '', data_fim: $('rcomb-data-fim')?.value || '', matricula: $('rcomb-matricula')?.value || '', fornecedor: $('rcomb-fornecedor')?.value || '', combustivel: $('rcomb-combustivel')?.value || ''}},
            documentos: {params:{matricula: $('rd-matricula')?.value || '', status: $('rd-status')?.value || ''}},
            rotina_manutencao: {params:{}}
        };
        if (!map[tipo]) return;
        const query = buildQuery(map[tipo].params);
        window.open(`/relatorios/${tipo}/imprimir/?${query}`, '_blank');
    }


    async function carregarClientes() {
        const data = await apiFetch('/clientes/');
        const linhas = data.linhas || [];
        $('clientes-table-body').innerHTML = `
            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nif || '')}</td><td>${escapeHtml(l.nome || '')}</td><td>${escapeHtml(l.email || '')}</td><td>${escapeHtml(l.contato || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarClienteRow(this)" data-id="${l.id}" data-nif="${encodeURIComponent(l.nif || '')}" data-nome="${encodeURIComponent(l.nome || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}" data-email="${encodeURIComponent(l.email || '')}" data-contato="${encodeURIComponent(l.contato || '')}" data-morada="${encodeURIComponent(l.morada || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirCliente(${l.id})">Excluir</button></div></td></tr>`).join('')}
        `;
    }

    let fornecedoresListaAtual = [];

    function renderFornecedoresLista(linhas) {
        if ($('fornecedor-kpi-total')) $('fornecedor-kpi-total').textContent = String(linhas.length);
        if (!linhas.length) return renderEmpty('fornecedor-lista', 'Nenhum fornecedor encontrado.');
        $('fornecedor-lista').innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>NIF</th><th>Nome</th><th>Contato</th><th>Responsável</th><th>E-mail</th><th>Morada</th><th>Conselho</th><th>Caixa Postal</th><th>IBAN</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nif || '')}</td><td>${escapeHtml(l.nome || '')}</td><td>${escapeHtml(l.contato || '')}</td><td>${escapeHtml(l.responsavel || '')}</td><td>${escapeHtml(l.email || '')}</td><td>${escapeHtml(l.morada || '')}</td><td>${escapeHtml(l.conselho || '')}</td><td>${escapeHtml(l.caixa_postal || '')}</td><td>${escapeHtml(l.iban || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarFornecedorRow(this)" data-id="${l.id}" data-nif="${encodeURIComponent(l.nif || '')}" data-nome="${encodeURIComponent(l.nome || '')}" data-iban="${encodeURIComponent(l.iban || '')}" data-contato="${encodeURIComponent(l.contato || '')}" data-responsavel="${encodeURIComponent(l.responsavel || '')}" data-email="${encodeURIComponent(l.email || '')}" data-morada="${encodeURIComponent(l.morada || '')}" data-conselho="${encodeURIComponent(l.conselho || '')}" data-caixa-postal="${encodeURIComponent(l.caixa_postal || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirFornecedor(${l.id})">Excluir</button></div></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function ordenarFornecedoresLista() {
        const modo = $('fornecedor-ordenar')?.value || 'nome_asc';
        const linhas = fornecedoresListaAtual.slice();
        linhas.sort((a, b) => {
            if (modo === 'id_asc') return (a.id || 0) - (b.id || 0);
            if (modo === 'id_desc') return (b.id || 0) - (a.id || 0);
            const nomeA = (a.nome || '').toLowerCase();
            const nomeB = (b.nome || '').toLowerCase();
            if (modo === 'nome_desc') return nomeB.localeCompare(nomeA, 'pt');
            return nomeA.localeCompare(nomeB, 'pt');
        });
        renderFornecedoresLista(linhas);
    }

    async function carregarFornecedores() {
        setLoading('fornecedor-lista', 'A carregar fornecedores...');
        try {
            const data = await apiFetch('/fornecedores/');
            fornecedoresListaAtual = data.linhas || data || [];
            ordenarFornecedoresLista();
        } catch (error) {
            setError('fornecedor-lista', error.message || 'Erro ao carregar fornecedores.');
        }
    }

    async function pesquisarFornecedores() {
        const termo = ($('fornecedor-pesquisa')?.value || '').trim();
        if (!termo) return carregarFornecedores();
        setLoading('fornecedor-lista', 'A pesquisar fornecedores...');
        try {
            const data = await apiFetch(`/fornecedores/busca/?q=${encodeURIComponent(termo)}`);
            fornecedoresListaAtual = data.linhas || data || [];
            ordenarFornecedoresLista();
        } catch (error) {
            setError('fornecedor-lista', error.message || 'Erro ao pesquisar fornecedores.');
        }
    }

    function limparPesquisaFornecedores() {
        if ($('fornecedor-pesquisa')) $('fornecedor-pesquisa').value = '';
        carregarFornecedores();
    }

    function atualizarListaFornecedores() {
        const termo = ($('fornecedor-pesquisa')?.value || '').trim();
        if (termo) return pesquisarFornecedores();
        return carregarFornecedores();
    }


    async function carregarFuncionarios() {
        setLoading('funcionario-lista', 'A carregar funcionários...');
        try {
            const data = await apiFetch('/funcionarios/');
            const linhas = data.linhas || data || [];
            if (!linhas.length) return renderEmpty('funcionario-lista', 'Nenhum funcionário encontrado.');
            $('funcionario-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Nome</th><th>Contato</th><th>Email</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nome || '')}</td><td>${escapeHtml(l.contato || '')}</td><td>${escapeHtml(l.email || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarFuncionarioRow(this)" data-id="${l.id}" data-nome="${encodeURIComponent(l.nome || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}" data-contato="${encodeURIComponent(l.contato || '')}" data-email="${encodeURIComponent(l.email || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirFuncionario(${l.id})">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('funcionario-lista', error.message || 'Erro ao carregar funcionários.');
        }
    }


    async function carregarFrota() {
        setLoading('frota-lista', 'A carregar frota...');
        try {
            const data = await apiFetch('/frota/');
            const linhas = data.linhas || data || [];
            if (!linhas.length) return renderEmpty('frota-lista', 'Nenhum veículo encontrado.');
            $('frota-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Seguro</th><th>Seguradora</th><th>Inspeção</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.matricula || '')}</td><td>${escapeHtml(l.marca || '')}</td><td>${escapeHtml(l.modelo || '')}</td><td>${escapeHtml(l.seguro || '')}</td><td>${escapeHtml(l.seguradora || '')}</td><td>${escapeHtml(l.inspecao || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarFrotaRow(this)" data-id="${l.id}" data-matricula="${encodeURIComponent(l.matricula || '')}" data-marca="${encodeURIComponent(l.marca || '')}" data-modelo="${encodeURIComponent(l.modelo || '')}" data-seguro="${encodeURIComponent(l.seguro || '')}" data-seguradora="${encodeURIComponent(l.seguradora || '')}" data-inspecao="${encodeURIComponent(l.inspecao || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirFrota(${l.id})">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('frota-lista', error.message || 'Erro ao carregar frota.');
        }
    }


    async function carregarCombustiveis() {
        setLoading('combustivel-lista', 'A carregar combustíveis...');
        try {
            const data = await apiFetch('/combustiveis/');
            const linhas = data.linhas || data || [];
            App.combustiveisMenu = linhas;
            renderFuelButtons();
            if (!linhas.length) { return renderEmpty('combustivel-lista', 'Nenhum combustível encontrado.'); }
            $('combustivel-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Nome</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nome || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarCombustivelRow(this)" data-id="${l.id}" data-nome="${encodeURIComponent(l.nome || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirCombustivel(${l.id})">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('combustivel-lista', error.message || 'Erro ao carregar combustíveis.');
        }
    }




    async function carregarManutencaoTipos() {
        setLoading('manutencao-lista', 'A carregar tipos de manutenção...');
        try {
            const data = await apiFetch('/crm/manutencao-botao/');
            const linhas = data.tipos || [];
            App.manutencaoTipos = linhas;
            renderMaintenanceButton();
            if (!linhas.length) return renderEmpty('manutencao-lista', 'Nenhum tipo de manutenção encontrado.');
            $('manutencao-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>Tipo</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(l.nome || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarTipoManutencao('${encodeURIComponent(l.key || '')}','${encodeURIComponent(l.nome || '')}')">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirTipoManutencao('${encodeURIComponent(l.key || '')}')">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
        } catch (error) {
            setError('manutencao-lista', error.message || 'Erro ao carregar manutenção.');
        }
    }

    function editarTipoManutencao(key, nome) {
        if ($('manutencao-botao-key')) $('manutencao-botao-key').value = decodeValue(key);
        if ($('manutencao-botao-nome')) $('manutencao-botao-nome').value = decodeValue(nome);
    }

    function limparTipoManutencao() {
        if ($('manutencao-botao-key')) $('manutencao-botao-key').value = '';
        if ($('manutencao-botao-nome')) $('manutencao-botao-nome').value = 'Manutenção';
    }

    async function excluirTipoManutencao(keyEnc) {
        const key = decodeValue(keyEnc);
        try {
            const data = await apiFetch(`/crm/manutencao-botao/${encodeURIComponent(key)}/excluir/`, { method: 'POST', headers: { 'X-CSRFToken': getCsrfToken() } });
            App.manutencaoTipos = data.tipos || [];
            renderMaintenanceButton();
            limparTipoManutencao();
            carregarManutencaoTipos();
            showToast('Tipo de manutenção excluído com sucesso.');
        } catch (error) {
            showToast(error.message || 'Erro ao excluir tipo de manutenção.', 'error');
        }
    }
    async function carregarRevisaoFrota() {
        setLoading('revisao-frota-lista', 'A carregar revisões de frota...');
        try {
            const query = new URLSearchParams({
                matricula: $('revisao-filtro-matricula')?.value || '',
                data_inicio: $('revisao-filtro-data-inicio')?.value || '',
                data_fim: $('revisao-filtro-data-fim')?.value || ''
            }).toString();
            const data = await apiFetch(`/revisao-frota/?${query}`);
            const linhas = data.linhas || [];
            if (!linhas.length) return renderEmpty('revisao-frota-lista', 'Nenhuma revisão encontrada.');
            $('revisao-frota-lista').innerHTML = `<div class="table-responsive"><table class="data-table"><thead><tr><th>ID</th><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Data Últ. Revisão</th><th>KM Últ. Revisão</th><th>KM Rodados</th><th>KM Previsão</th><th>KM para revisão</th><th>Funcionário</th><th>Observação</th><th>Ações</th></tr></thead><tbody>${linhas.map(l=>`<tr><td>${l.id}</td><td>${escapeHtml(l.matricula||'')}</td><td>${escapeHtml(l.marca||'')}</td><td>${escapeHtml(l.modelo||'')}</td><td>${escapeHtml(l.data_ultima_revisao||'')}</td><td>${l.km_ultima_revisao||0}</td><td>${l.km_rodados||0}</td><td>${l.kms_previsao||0}</td><td>${l.km_para_revisao||0}</td><td>${escapeHtml(l.funcionario||'')}</td><td>${escapeHtml(l.observacao||'')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" data-id="${l.id}" data-frota="${l.frota_id||''}" data-matricula="${encodeURIComponent(l.matricula||'')}" data-marca="${encodeURIComponent(l.marca||'')}" data-modelo="${encodeURIComponent(l.modelo||'')}" data-data="${encodeURIComponent(l.data_ultima_revisao||'')}" data-km-ultima="${l.km_ultima_revisao||0}" data-km-rodados="${l.km_rodados||0}" data-km-prev="${l.kms_previsao||0}" data-km-para="${l.km_para_revisao||0}" data-funcionario-id="${l.funcionario_id||''}" data-funcionario="${encodeURIComponent(l.funcionario||'')}" data-observacao="${encodeURIComponent(l.observacao||'')}" onclick="editarRevisaoFrotaRow(this)">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirRevisaoFrota(${l.id})">Excluir</button></div></td></tr>`).join('')}</tbody></table></div>`;
        } catch (error) {
            setError('revisao-frota-lista', error.message || 'Erro ao carregar revisões de frota.');
        }
    }

    function editarRevisaoFrotaRow(button){
        if ($('revisao-id')) $('revisao-id').value = button.dataset.id || '';
        if ($('revisao-frota-id')) $('revisao-frota-id').value = button.dataset.frota || '';
        if ($('revisao-matricula')) $('revisao-matricula').value = decodeValue(button.dataset.matricula);
        if ($('revisao-marca')) $('revisao-marca').value = decodeValue(button.dataset.marca);
        if ($('revisao-modelo')) $('revisao-modelo').value = decodeValue(button.dataset.modelo);
        if ($('revisao-data-ultima')) $('revisao-data-ultima').value = decodeValue(button.dataset.data);
        if ($('revisao-km-ultima')) $('revisao-km-ultima').value = button.dataset.kmUltima || '';
        if ($('revisao-km-rodados')) $('revisao-km-rodados').value = button.dataset.kmRodados || '';
        if ($('revisao-kms-previsao')) $('revisao-kms-previsao').value = button.dataset.kmPrev || '';
        if ($('revisao-km-para')) $('revisao-km-para').value = button.dataset.kmPara || '';
        if ($('revisao-funcionario-id')) $('revisao-funcionario-id').value = button.dataset.funcionarioId || '';
        if ($('revisao-funcionario')) $('revisao-funcionario').value = decodeValue(button.dataset.funcionario);
        if ($('revisao-observacao')) $('revisao-observacao').value = decodeValue(button.dataset.observacao);
        showSection('revisao-frota-section');
    }

    async function salvarRevisaoFrota(){
        try {
            await apiFetch('/revisao-frota/salvar/', { method:'POST', json: {
                id: $('revisao-id')?.value || '',
                frota_id: $('revisao-frota-id')?.value || '',
                matricula: $('revisao-matricula')?.value || '',
                data_ultima_revisao: $('revisao-data-ultima')?.value || '',
                km_ultima_revisao: $('revisao-km-ultima')?.value || 0,
                km_rodados: $('revisao-km-rodados')?.value || 0,
                kms_previsao: $('revisao-kms-previsao')?.value || 0,
                funcionario_id: $('revisao-funcionario-id')?.value || '',
                observacao: $('revisao-observacao')?.value || ''
            }});
            showToast('Revisão de frota salva com sucesso.');
            limparRevisaoFrota();
            carregarRevisaoFrota();
        } catch (error) { showToast(error.message || 'Erro ao salvar revisão.', 'error'); }
    }

    async function excluirRevisaoFrota(id){ if(!confirm('Confirma a exclusão desta revisão?')) return; await apiFetch(`/revisao-frota/${id}/excluir/`, {method:'POST'}); carregarRevisaoFrota(); showToast('Revisão excluída com sucesso.'); }
    function limparRevisaoFrota(){ ['revisao-id','revisao-frota-id','revisao-matricula','revisao-marca','revisao-modelo','revisao-data-ultima','revisao-km-ultima','revisao-km-rodados','revisao-kms-previsao','revisao-km-para','revisao-funcionario-id','revisao-funcionario','revisao-observacao'].forEach(id=>{ if($(id)) $(id).value=''; }); }

    function calcularRevisaoFrotaFormulario(){ const rod = toNumber($('revisao-km-rodados')?.value); const prev = toNumber($('revisao-kms-previsao')?.value); if($('revisao-km-para')) $('revisao-km-para').value = rod + prev; }

    async function autocompleteFuncionario(inputId, listId, hiddenId=null){ const input=$(inputId); const list=$(listId); if(!input||!list) return; const term=input.value.trim(); try{ const data=await apiFetch('/funcionarios/'); const linhas=(data.linhas||[]).filter(i=>!term || (i.nome||'').toLowerCase().includes(term.toLowerCase())).slice(0,20); if(!linhas.length){ list.innerHTML=''; toggleSuggestionList(list,false); return; } list.innerHTML=linhas.map(i=>`<button type="button" class="autocomplete-item" data-id="${i.id}" data-nome="${escapeHtml(i.nome||'')}">${escapeHtml(i.nome||'')}</button>`).join(''); toggleSuggestionList(list,true); qsa(`#${listId} .autocomplete-item`).forEach(btn=>btn.addEventListener('click',()=>{ input.value=btn.dataset.nome||''; if(hiddenId && $(hiddenId)) $(hiddenId).value=btn.dataset.id||''; hideSuggestionListById(listId); })); }catch(_){ list.innerHTML=''; toggleSuggestionList(list,false);} }

    async function carregarEmpresas() {
        setLoading('empresa-lista', 'A carregar empresas...');
        try {
            const data = await apiFetch('/empresas/');
            const linhas = data.linhas || data || [];
            if (!linhas.length) return renderEmpty('empresa-lista', 'Nenhuma empresa encontrada.');
            $('empresa-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>NIF</th><th>Nome</th><th>Cidade</th><th>Contato</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nif || '')}</td><td>${escapeHtml(l.nome || '')}</td><td>${escapeHtml(l.cidade || '')}</td><td>${escapeHtml(l.contato || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarEmpresaRow(this)" data-id="${l.id}" data-nif="${encodeURIComponent(l.nif || '')}" data-nome="${encodeURIComponent(l.nome || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}" data-cidade="${encodeURIComponent(l.cidade || '')}" data-contato="${encodeURIComponent(l.contato || '')}">Editar</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirEmpresa(${l.id})">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('empresa-lista', error.message || 'Erro ao carregar empresas.');
        }
    }


    async function carregarUsuarios() {
        setLoading('usuario-lista', 'A carregar utilizadores...');
        try {
            const data = await apiFetch('/usuarios/');
            const linhas = data.linhas || data || [];
            if (!linhas.length) return renderEmpty('usuario-lista', 'Nenhum utilizador encontrado.');
            $('usuario-lista').innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Nome</th><th>Contato</th><th>Email</th><th>Usuário</th><th>Empresas</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${linhas.map(l => `<tr><td>${escapeHtml(String(l.id || ''))}</td><td>${escapeHtml(l.nome || '')}</td><td>${escapeHtml(l.contato || '')}</td><td>${escapeHtml(l.email_recuperacao || '')}</td><td>${escapeHtml(l.username || '')}</td><td>${l.administrador_geral ? 'Todas' : escapeHtml(l.empresa_nome || '')}</td><td><div class="table-actions"><button type="button" class="btn btn-sm btn-outline" onclick="editarUsuarioRow(this)" data-id="${l.id}" data-nome="${encodeURIComponent(l.nome || '')}" data-imagem="${encodeURIComponent(l.imagem_url || '')}" data-contato="${encodeURIComponent(l.contato || '')}" data-email="${encodeURIComponent(l.email_recuperacao || '')}" data-username="${encodeURIComponent(l.username || '')}" data-empresa="${l.empresa || ''}" data-admin="${l.administrador_geral ? '1' : '0'}" data-permissoes="${encodeURIComponent(JSON.stringify(l.permissoes || {}))}">Editar</button><button type="button" class="btn btn-sm btn-secondary" onclick="abrirModalAlterarSenha(${l.id}, '${escapeHtml((l.nome || '').replace(/'/g, "\'"))}')">Alterar senha</button><button type="button" class="btn btn-sm btn-danger" onclick="excluirUsuario(${l.id})">Excluir</button></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            setError('usuario-lista', error.message || 'Erro ao carregar utilizadores.');
        }
    }


    function editarClienteRow(button) {
        editarCliente(button.dataset.id, decodeValue(button.dataset.nif), decodeValue(button.dataset.nome), decodeValue(button.dataset.email), decodeValue(button.dataset.contato), decodeValue(button.dataset.morada));
    }

    function editarFornecedorRow(button) {
        editarFornecedor(
            button.dataset.id,
            decodeValue(button.dataset.nif),
            decodeValue(button.dataset.nome),
            decodeValue(button.dataset.iban),
            decodeValue(button.dataset.contato),
            decodeValue(button.dataset.responsavel),
            decodeValue(button.dataset.email),
            decodeValue(button.dataset.morada),
            decodeValue(button.dataset.conselho),
            decodeValue(button.dataset.caixaPostal)
        );
    }

    function editarFuncionarioRow(button) {
        editarFuncionario(button.dataset.id, decodeValue(button.dataset.nome), decodeValue(button.dataset.contato), decodeValue(button.dataset.email));
    }

    function editarFrotaRow(button) {
        editarFrota(button.dataset.id, decodeValue(button.dataset.matricula), decodeValue(button.dataset.marca), decodeValue(button.dataset.modelo), decodeValue(button.dataset.seguro), decodeValue(button.dataset.seguradora), decodeValue(button.dataset.inspecao));
    }

    function editarCombustivelRow(button) {
        editarCombustivel(button.dataset.id, decodeValue(button.dataset.nome), decodeValue(button.dataset.imagem));
    }

    function editarEmpresaRow(button) {
        editarEmpresa(button.dataset.id, decodeValue(button.dataset.nif), decodeValue(button.dataset.nome), decodeValue(button.dataset.cidade), decodeValue(button.dataset.contato));
    }

    function editarUsuarioRow(button) {
        editarUsuario(button.dataset.id, decodeValue(button.dataset.nome), decodeValue(button.dataset.contato), decodeValue(button.dataset.email), decodeValue(button.dataset.username), button.dataset.empresa || '', button.dataset.admin === '1', JSON.parse(decodeURIComponent(button.dataset.permissoes || '%7B%7D')));
    }


    function editarCliente(id, nif, nome, email, contato, morada) {
        $('cliente-id').value = id || '';
        $('cliente-nif').value = nif || '';
        $('cliente-nome').value = nome || '';
        $('cliente-email').value = email || '';
        $('cliente-contato').value = contato || '';
        $('cliente-morada').value = morada || '';
        showSection('cliente-section');
    }

    async function excluirCliente(id) {
        if (!confirm('Pretende excluir este cliente?')) return;
        await apiFetch(`/clientes/${id}/excluir/`, { method: 'POST' });
        limparCliente();
        carregarClientes();
        showToast('Cliente excluído com sucesso.');
    }

    function editarFornecedor(id, nif, nome, iban, contato, responsavel, email, morada, conselho, caixaPostal) {
        showSection('fornecedor-section');
        if ($('fornecedor-id')) $('fornecedor-id').value = id || '';
        if ($('fornecedor-nif')) $('fornecedor-nif').value = nif || '';
        if ($('fornecedor-nome')) $('fornecedor-nome').value = nome || '';
        if ($('fornecedor-iban')) $('fornecedor-iban').value = iban || '';
        if ($('fornecedor-contato')) $('fornecedor-contato').value = contato || '';
        if ($('fornecedor-responsavel')) $('fornecedor-responsavel').value = responsavel || '';
        if ($('fornecedor-email')) $('fornecedor-email').value = email || '';
        if ($('fornecedor-morada')) $('fornecedor-morada').value = morada || '';
        if ($('fornecedor-conselho')) $('fornecedor-conselho').value = conselho || '';
        if ($('fornecedor-caixa-postal')) $('fornecedor-caixa-postal').value = caixaPostal || '';
        const card = $('fornecedor-form-card');
        if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if ($('fornecedor-nome')) $('fornecedor-nome').focus();
    }

    async function excluirFornecedor(id) {
        if (!confirm('Confirma a exclusão deste fornecedor?')) return;
        await apiFetch(`/fornecedores/${id}/excluir/`, { method: 'POST' });
        limparFornecedor();
        atualizarListaFornecedores();
        showToast('Fornecedor excluído com sucesso.');
    }

    function editarFuncionario(id, nome, contato, email) {
        if ($('funcionario-id')) $('funcionario-id').value = id || '';
        if ($('funcionario-nome')) $('funcionario-nome').value = nome || '';
        if ($('funcionario-contato')) $('funcionario-contato').value = contato || '';
        if ($('funcionario-email')) $('funcionario-email').value = email || '';
        showSection('funcionario-section');
    }

    async function excluirFuncionario(id) {
        if (!confirm('Confirma a exclusão deste funcionário?')) return;
        await apiFetch(`/funcionarios/${id}/excluir/`, { method: 'POST' });
        limparFuncionario();
        carregarFuncionarios();
        showToast('Funcionário excluído com sucesso.');
    }

    function editarFrota(id, matricula, marca, modelo, seguro, seguradora, inspecao) {
        if ($('frota-id')) $('frota-id').value = id || '';
        if ($('frota-matricula')) $('frota-matricula').value = matricula || '';
        if ($('frota-marca')) $('frota-marca').value = marca || '';
        if ($('frota-modelo')) $('frota-modelo').value = modelo || '';
        if ($('frota-seguro')) $('frota-seguro').value = seguro || '';
        if ($('frota-seguradora')) $('frota-seguradora').value = seguradora || '';
        if ($('frota-inspecao')) $('frota-inspecao').value = inspecao || '';
        showSection('frota-section');
    }

    async function excluirFrota(id) {
        if (!confirm('Confirma a exclusão deste registo de frota?')) return;
        await apiFetch(`/frota/${id}/excluir/`, { method: 'POST' });
        limparFrota();
        carregarFrota();
        showToast('Registo de frota excluído com sucesso.');
    }

    function editarCombustivel(id, nome, imagemUrl) {
        if ($('combustivel-id')) $('combustivel-id').value = id || '';
        if ($('combustivel-nome')) $('combustivel-nome').value = nome || '';
        setImagePreview('combustivel-imagem-preview', imagemUrl || '');
        showSection('combustivel-section');
    }

    async function excluirCombustivel(id) {
        if (!confirm('Confirma a exclusão deste combustível?')) return;
        await apiFetch(`/combustiveis/${id}/excluir/`, { method: 'POST' });
        limparCombustivel();
        carregarCombustiveis();
        carregarManutencaoTipos();
        showToast('Combustível excluído com sucesso.');
    }

    function editarEmpresa(id, nif, nome, cidade, contato) {
        if ($('empresa-id')) $('empresa-id').value = id || '';
        if ($('empresa-nif')) $('empresa-nif').value = nif || '';
        if ($('empresa-nome')) $('empresa-nome').value = nome || '';
        if ($('empresa-cidade')) $('empresa-cidade').value = cidade || '';
        if ($('empresa-contato')) $('empresa-contato').value = contato || '';
        showSection('empresa-section');
    }

    async function excluirEmpresa(id) {
        if (!confirm('Confirma a exclusão desta empresa?')) return;
        await apiFetch(`/empresas/${id}/excluir/`, { method: 'POST' });
        limparEmpresa();
        carregarEmpresas();
        showToast('Empresa excluída com sucesso.');
    }

    function editarUsuario(id, nome, contato, email, username, empresa, administradorGeral, permissoes) {
        if ($('usuario-id')) $('usuario-id').value = id || '';
        if ($('usuario-nome')) $('usuario-nome').value = nome || '';
        if ($('usuario-contato')) $('usuario-contato').value = contato || '';
        if ($('usuario-email-recuperacao')) $('usuario-email-recuperacao').value = email || '';
        if ($('usuario-username')) $('usuario-username').value = username || '';
        if ($('usuario-password')) $('usuario-password').value = '';
        if ($('usuario-empresa')) $('usuario-empresa').value = empresa || '';
        if ($('usuario-administrador-geral')) $('usuario-administrador-geral').checked = !!administradorGeral;
        usuarioPermissoesSelecionadas = permissoes || {};
        atualizarResumoPermissoes();
        showSection('usuario-section');
    }

    async function excluirUsuario(id) {
        if (!confirm('Confirma a exclusão deste utilizador?')) return;
        await apiFetch(`/usuarios/${id}/excluir/`, { method: 'POST' });
        limparUsuario();
        carregarUsuarios();
        showToast('Utilizador excluído com sucesso.');
    }



    async function salvarCliente() {
        const fornecedorId = $('lancamento-fornecedor-id')?.value || '';
        const fornecedorBusca = ($('lancamento-fornecedor-busca')?.value || '').trim();
        if (!fornecedorId && !fornecedorBusca) {
            showToast('Selecione um fornecedor antes de salvar.', 'error');
                $('lancamento-fornecedor-busca')?.focus();
            return;
        }

        const payload = {
            id: $('cliente-id').value || null,
            nif: $('cliente-nif').value,
            nome: $('cliente-nome').value,
            email: $('cliente-email').value,
            contato: $('cliente-contato').value,
            morada: $('cliente-morada').value,
        };
        const resp = await apiFetch('/clientes/salvar/', { method: 'POST', json: payload });
        if (resp && !resp.error) {
            showToast('Cliente salvo com sucesso.');
            limparCliente();
            carregarClientes();
        }
    }

    async function salvarFornecedor() {
        const idExistente = $('fornecedor-id')?.value || '';
        const nome = $('fornecedor-nome')?.value || '';
        try {
            await apiFetch('/fornecedores/salvar/', {
                method: 'POST',
                json: {
                    id: idExistente,
                    nif: $('fornecedor-nif')?.value || '',
                    nome: nome,
                    iban: $('fornecedor-iban')?.value || '',
                    contato: $('fornecedor-contato')?.value || '',
                    responsavel: $('fornecedor-responsavel')?.value || '',
                    email: $('fornecedor-email')?.value || '',
                    morada: $('fornecedor-morada')?.value || '',
                    conselho: $('fornecedor-conselho')?.value || '',
                    caixa_postal: $('fornecedor-caixa-postal')?.value || '',
                }
            });
            if (idExistente) {
                showToast(`As alterações de "${nome}" foram guardadas e já refletem em todos os relatórios e lançamentos.`, 'success', { title: 'Fornecedor atualizado', duration: 3800 });
            } else {
                showToast(`"${nome}" foi adicionado à listagem de fornecedores.`, 'success', { title: 'Fornecedor cadastrado' });
            }
            limparFornecedor();
            atualizarListaFornecedores();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar fornecedor.', 'error', { title: 'Não foi possível salvar' });
        }
    }

    async function salvarFuncionario() {
        try {
            await apiFetch('/funcionarios/salvar/', {
                method: 'POST',
                json: {
                    id: $('funcionario-id')?.value || '',
                    nome: $('funcionario-nome')?.value || '',
                    contato: $('funcionario-contato')?.value || '',
                    email: $('funcionario-email')?.value || '',
                }
            });
            showToast('Funcionário salvo com sucesso.');
            limparFuncionario();
            carregarFuncionarios();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar funcionário.', 'error');
        }
    }

    async function salvarFrota() {
        try {
            await apiFetch('/frota/salvar/', {
                method: 'POST',
                json: {
                    id: $('frota-id')?.value || '',
                    matricula: $('frota-matricula')?.value || '',
                    marca: $('frota-marca')?.value || '',
                    modelo: $('frota-modelo')?.value || '',
                    seguro: $('frota-seguro')?.value || '',
                    seguradora: $('frota-seguradora')?.value || '',
                    inspecao: $('frota-inspecao')?.value || '',
                }
            });
            showToast('Frota salva com sucesso.');
            limparFrota();
            carregarFrota();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar frota.', 'error');
        }
    }

    async function salvarCombustivel() {
        try {
            const formData = new FormData();
            formData.append('id', $('combustivel-id')?.value || '');
            formData.append('nome', $('combustivel-nome')?.value || '');

            await apiFetch('/combustiveis/salvar/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            showToast('Combustível salvo com sucesso.');
            limparCombustivel();
            await carregarCombustiveis();
            renderFuelButtons();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar combustível.', 'error');
        }
    }

    async function salvarBotaoManutencao() {
        try {
            const formData = new FormData();
            formData.append('key', $('manutencao-botao-key')?.value || '');
            formData.append('nome', $('manutencao-botao-nome')?.value || 'Manutenção');
            const data = await apiFetch('/crm/manutencao-botao/salvar/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            App.manutencaoTipos = data.tipos || [];
            renderMaintenanceButton();
            limparTipoManutencao();
            carregarManutencaoTipos();
            showToast('Tipo de manutenção salvo com sucesso.');
        } catch (error) {
            showToast(error.message || 'Erro ao salvar botão de manutenção.', 'error');
        }
    }

    async function salvarUsuario() {
        try {
            await apiFetch('/usuarios/salvar/', {
                method: 'POST',
                json: {
                    id: $('usuario-id')?.value || '',
                    nome: $('usuario-nome')?.value || '',
                    contato: $('usuario-contato')?.value || '',
                    email_recuperacao: $('usuario-email-recuperacao')?.value || '',
                    empresa: $('usuario-empresa')?.value || '',
                    administrador_geral: $('usuario-administrador-geral')?.checked || false,
                    username: $('usuario-username')?.value || '',
                    password: $('usuario-password')?.value || '',
                    permissoes: usuarioPermissoesSelecionadas || {},
                }
            });
            showToast('Utilizador salvo com sucesso.');
            limparUsuario();
            carregarUsuarios();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar utilizador.', 'error');
        }
    }

    async function salvarEmpresa() {
        try {
            const formData = new FormData();
            formData.append('id', $('empresa-id')?.value || '');
            formData.append('nif', $('empresa-nif')?.value || '');
            formData.append('nome', $('empresa-nome')?.value || '');
            formData.append('morada', $('empresa-morada')?.value || '');
            formData.append('caixa_postal', $('empresa-caixa-postal')?.value || '');
            formData.append('cidade', $('empresa-cidade')?.value || '');
            formData.append('contato', $('empresa-contato')?.value || '');
            formData.append('email', $('empresa-email')?.value || '');
            formData.append('remover_logo', $('empresa-remover-logo')?.checked ? '1' : '0');

            const file = $('empresa-logo')?.files?.[0];
            if (file) formData.append('logo', file);

            await apiFetch('/empresas/salvar/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': getCsrfToken() }
            });

            showToast('Empresa salva com sucesso.');
            limparEmpresa();
            carregarEmpresas();
        } catch (error) {
            showToast(error.message || 'Erro ao salvar empresa.', 'error');
        }
    }


    function limparCliente() {
        $('cliente-id').value = '';
        $('cliente-nif').value = '';
        $('cliente-nome').value = '';
        $('cliente-email').value = '';
        $('cliente-contato').value = '';
        $('cliente-morada').value = '';
    }

    function limparFornecedor() {
        ['fornecedor-id', 'fornecedor-nif', 'fornecedor-nome', 'fornecedor-iban', 'fornecedor-contato', 'fornecedor-responsavel', 'fornecedor-email', 'fornecedor-morada', 'fornecedor-conselho', 'fornecedor-caixa-postal'].forEach(id => { if ($(id)) $(id).value = ''; });
    }

    function limparFuncionario() {
        ['funcionario-id', 'funcionario-nome', 'funcionario-contato', 'funcionario-email'].forEach(id => { if ($(id)) $(id).value = ''; });
    }

    function limparFrota() {
        ['frota-id', 'frota-matricula', 'frota-marca', 'frota-modelo', 'frota-seguro', 'frota-seguradora', 'frota-inspecao'].forEach(id => { if ($(id)) $(id).value = ''; });
    }

    function limparCombustivel() {
        ['combustivel-id', 'combustivel-nome'].forEach(id => { if ($(id)) $(id).value = ''; });
    }

    async function carregarConfigBotaoManutencao() {
        try {
            const data = await apiFetch('/crm/manutencao-botao/');
            App.manutencaoTipos = data.tipos || App.manutencaoTipos || [];
        } catch (_) {
            App.manutencaoTipos = App.manutencaoTipos || [];
        }
        renderMaintenanceButton();
    }

    function bindCrmButtonUploads() {
    }

    function limparEmpresa() {
        ['empresa-id', 'empresa-nif', 'empresa-nome', 'empresa-morada', 'empresa-caixa-postal', 'empresa-cidade', 'empresa-contato', 'empresa-email']
            .forEach(id => { if ($(id)) $(id).value = ''; });

        if ($('empresa-logo')) $('empresa-logo').value = '';
        if ($('empresa-remover-logo')) $('empresa-remover-logo').checked = false;
        if ($('empresa-logo-preview')) $('empresa-logo-preview').classList.add('hidden');
        if ($('empresa-logo-placeholder')) $('empresa-logo-placeholder').classList.remove('hidden');
    }

    function limparUsuario() {
        ['usuario-id', 'usuario-nome', 'usuario-contato', 'usuario-email-recuperacao', 'usuario-username', 'usuario-password']
            .forEach(id => { if ($(id)) $(id).value = ''; });
        if ($('usuario-empresa')) { $('usuario-empresa').value = ''; $('usuario-empresa').disabled = false; }
        if ($('usuario-administrador-geral')) $('usuario-administrador-geral').checked = false;
        usuarioPermissoesSelecionadas = {};
        atualizarResumoPermissoes();
    }

    function debounce(fn, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function toggleSuggestionList(list, visible) {
        if (!list) return;
        list.style.display = visible ? 'block' : 'none';
    }

    function hideSuggestionListById(listId) {
        if (!listId) return;
        const list = $(listId);
        if (list) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
        }
    }

    async function autocompleteFornecedor(inputId, listId, hiddenId = null) {
        const input = $(inputId);
        const list = $(listId);
        if (!input || !list) return;

        const term = input.value.trim();

        if (!term) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
            return;
        }

        try {
            const data = await apiFetch(`/fornecedores/busca/?q=${encodeURIComponent(term)}&limit=15`);
            const linhas = data.linhas || data || [];

            if (hiddenId && $(hiddenId) && input.dataset.selectedLabel !== term) $(hiddenId).value = '';

            if (!linhas.length) {
                list.innerHTML = '';
                toggleSuggestionList(list, false);
                return;
            }

            const termoNormalizado = term.toLowerCase();
            const termoNif = String(term || '').replace(/\D/g, '');
            const correspondenciaExata = linhas.find(item => ((item.nome || '').toLowerCase() === termoNormalizado) || ((item.nif || '').toLowerCase() === termoNormalizado) || (termoNif && String(item.nif || '').replace(/\D/g, '') === termoNif));
            if (correspondenciaExata && hiddenId && $(hiddenId)) {
                $(hiddenId).value = correspondenciaExata.id || '';
            } else if (linhas.length === 1 && term.length >= 1 && hiddenId && $(hiddenId)) {
                $(hiddenId).value = linhas[0].id || '';
            }

            list.innerHTML = linhas.map(item => {
                const nome = escapeHtml(item.nome || '');
                const nif = escapeHtml(item.nif || '');
                const codigo = escapeHtml(item.codigo || '');
                return `
                <button type="button" class="autocomplete-item autocomplete-item-rich" data-id="${item.id}" data-nome="${nome}" data-nif="${nif}">
                    <span class="autocomplete-main">${nome}</span>
                    <span class="autocomplete-meta">${nif ? `NIF ${nif}` : 'Sem contribuinte'}${codigo ? ` • Código ${codigo}` : ''}</span>
                </button>`;
            }).join('');
            toggleSuggestionList(list, true);

            qsa(`#${listId} .autocomplete-item`).forEach(btn => {
                btn.addEventListener('click', () => {
                    input.value = btn.dataset.nome || '';
                    input.dataset.selectedId = btn.dataset.id || '';
                    input.dataset.selectedLabel = btn.dataset.nome || '';
                    if (hiddenId && $(hiddenId)) $(hiddenId).value = btn.dataset.id || '';
                    hideSuggestionListById(listId);
                });
            });
        } catch (_) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
        }
    }

    async function resolverFornecedorCampo(inputId, listId, hiddenId = null) {
        const input = $(inputId);
        if (!input) return;
        const termo = (input.value || '').trim();
        if (!termo) return;
        try {
            const data = await apiFetch(`/fornecedores/busca/?q=${encodeURIComponent(termo)}&limit=15`);
            const linhas = data.linhas || [];
            if (!linhas.length) return;
            const termoNif = String(termo).replace(/\D/g, '');
            const exact = linhas.find(item => (item.nome || '').toLowerCase() === termo.toLowerCase() || (item.nif || '').toLowerCase() === termo.toLowerCase() || (termoNif && String(item.nif || '').replace(/\D/g, '') === termoNif)) || (linhas.length === 1 ? linhas[0] : null);
            if (exact) {
                input.value = exact.nome || termo;
                input.dataset.selectedId = exact.id || '';
                input.dataset.selectedLabel = exact.nome || termo;
                if (hiddenId && $(hiddenId)) $(hiddenId).value = exact.id || '';
            } else if (hiddenId && $(hiddenId)) {
                $(hiddenId).value = input.dataset.selectedId || '';
            }
            hideSuggestionListById(listId);
        } catch (_) {}
    }

    async function autocompleteFrota(inputId, listId, hiddenId = null) {
        const input = $(inputId);
        const list = $(listId);
        if (!input || !list) return;

        const term = input.value.trim();

        try {
            const data = await apiFetch(`/frota/busca/?q=${encodeURIComponent(term)}`);
            const linhas = data.linhas || data || [];

            if (!linhas.length) {
                list.innerHTML = '';
                toggleSuggestionList(list, false);
                return;
            }

            list.innerHTML = linhas.map(item => `
                <button type="button" class="autocomplete-item" data-id="${item.id}" data-matricula="${escapeHtml(item.matricula || '')}" data-marca="${escapeHtml(item.marca || '')}" data-modelo="${escapeHtml(item.modelo || '')}">
                    ${escapeHtml(item.matricula || '')}
                </button>
            `).join('');
            toggleSuggestionList(list, true);

            qsa(`#${listId} .autocomplete-item`).forEach(btn => {
                btn.addEventListener('click', () => {
                    input.value = btn.dataset.matricula || '';
                    if (hiddenId && $(hiddenId)) $(hiddenId).value = btn.dataset.id || '';
                    const marcaField = $(inputId.replace('matricula', 'marca'));
                    const modeloField = $(inputId.replace('matricula', 'modelo'));
                    if (marcaField) marcaField.value = btn.dataset.marca || '';
                    if (modeloField) modeloField.value = btn.dataset.modelo || '';
                    hideSuggestionListById(listId);
                });
            });
        } catch (_) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
        }
    }

    async function autocompleteFatura(inputId, listId) {
        const input = $(inputId);
        const list = $(listId);
        if (!input || !list) return;
        const term = input.value.trim();
        try {
            const data = await apiFetch(`/faturas/busca/?q=${encodeURIComponent(term)}`);
            const linhas = data.linhas || [];
            if (!linhas.length) {
                list.innerHTML = '';
                toggleSuggestionList(list, false);
                return;
            }
            list.innerHTML = linhas.map(item => `
                <button type="button" class="autocomplete-item" data-fatura="${escapeHtml(item.numero_fatura || '')}">
                    <strong>${escapeHtml(item.numero_fatura || '')}</strong>${item.fornecedor ? `<span class="muted"> — ${escapeHtml(item.fornecedor || '')}</span>` : ''}
                </button>
            `).join('');
            toggleSuggestionList(list, true);
            qsa(`#${listId} .autocomplete-item`).forEach(btn => {
                btn.addEventListener('click', () => {
                    input.value = btn.dataset.fatura || '';
                    hideSuggestionListById(listId);
                });
            });
        } catch (_) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
        }
    }

    function autocompleteCombustivelLista(inputId, listId) {
        const input = $(inputId);
        const list = $(listId);
        if (!input || !list) return;
        const term = (input.value || '').trim().toLowerCase();
        const linhas = (App.combustiveisMenu || []).filter(item => !term || (item.nome || '').toLowerCase().includes(term)).slice(0, 20);
        if (!linhas.length) {
            list.innerHTML = '';
            toggleSuggestionList(list, false);
            return;
        }
        list.innerHTML = linhas.map(item => `
            <button type="button" class="autocomplete-item" data-nome="${escapeHtml(item.nome || '')}">
                ${escapeHtml(item.nome || '')}
            </button>
        `).join('');
        toggleSuggestionList(list, true);
        qsa(`#${listId} .autocomplete-item`).forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.nome || '';
                hideSuggestionListById(listId);
            });
        });
    }

    function preencherSelectEmpresas() {

        const select = $('usuario-empresa');
        if (!select) return;
        const opcoes = ['<option value="">Selecione</option>'].concat((App.empresasUsuario || []).map(item => `<option value="${item.id}">${escapeHtml(item.nome || '')}</option>`));
        select.innerHTML = opcoes.join('');
    }

    function preencherDatalistCombustiveis() {
        const datalist = $('combustiveis-menu-list');
        if (!datalist) return;
        datalist.innerHTML = (App.combustiveisMenu || []).map(item => `<option value="${escapeHtml(item.nome || '')}"></option>`).join('');
    }

    function preencherSelectFrotaCombustivel() {
        const select = $('item-frota-id');
        if (!select) return;
        const opcoes = ['<option value="">Selecione</option>'].concat((App.frotaMenu || []).map(item => `<option value="${item.id}">${escapeHtml(item.matricula || '')}</option>`));
        select.innerHTML = opcoes.join('');
    }

    function fecharMenusNavegacao() {
        qsa('.nav-group').forEach(group => group.classList.remove('open'));
        const userDropdown = $('user-dropdown-menu');
        if (userDropdown) userDropdown.classList.add('hidden');
    }

    function bindMenu() {
        qsa('.menu-item').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (btn.dataset.section) showSection(btn.dataset.section);
                if (!btn.closest('.nav-home-item')) {
                    qsa('.nav-group').forEach(group => group.classList.remove('open'));
                }
            });
        });

        qsa('.nav-group-toggle').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const group = btn.closest('.nav-group');
                const isOpen = group.classList.contains('open');
                qsa('.nav-group').forEach(item => item.classList.remove('open'));
                if (!isOpen) group.classList.add('open');
            });
        });

        const userToggle = $('user-menu-toggle');
        const userDropdown = $('user-dropdown-menu');
        if (userToggle && userDropdown) {
            userToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                qsa('.nav-group').forEach(group => group.classList.remove('open'));
                userDropdown.classList.toggle('hidden');
            });
        }

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.nav-group') && !event.target.closest('.user-menu-wrap')) {
                fecharMenusNavegacao();
            }
        });
    }

    function bindAutocomplete() {
        const fornecedor1 = debounce(() => autocompleteFornecedor('lancamento-fornecedor-busca', 'fornecedor-sugestoes', 'lancamento-fornecedor-id'));
        const fornecedor2 = debounce(() => autocompleteFornecedor('consulta-fornecedor', 'consulta-fornecedor-sugestoes'));
        const fornecedorPopup = debounce(() => autocompleteFornecedor('launch-consulta-fornecedor', 'launch-consulta-fornecedor-sugestoes'));
        const fornecedorFinanceiro = debounce(() => autocompleteFornecedor('rf-fornecedor', 'rf-fornecedor-sugestoes'));
        const fornecedor3 = debounce(() => autocompleteFornecedor('rfat-fornecedor', 'rfat-fornecedor-sugestoes'));
        const fornecedor4 = debounce(() => autocompleteFornecedor('rbf-fornecedor', 'rbf-fornecedor-sugestoes'));
        const fornecedor5 = debounce(() => autocompleteFornecedor('rcomb-fornecedor', 'rcomb-fornecedor-sugestoes'));
        const fornecedor6 = debounce(() => autocompleteFornecedor('rfor-fornecedor', 'rfor-fornecedor-sugestoes'));
        const fatura1 = debounce(() => autocompleteFatura('consulta-fatura', 'consulta-fatura-sugestoes'));
        const faturaPopup = debounce(() => autocompleteFatura('launch-consulta-fatura', 'launch-consulta-fatura-sugestoes'));
        const fatura2 = debounce(() => autocompleteFatura('rf-fatura', 'rf-fatura-sugestoes'));
        const fatura4 = debounce(() => autocompleteFatura('rfat-fatura', 'rfat-fatura-sugestoes'));
        const fatura5 = debounce(() => autocompleteFatura('rfor-fatura', 'rfor-fatura-sugestoes'));
        const combustivelFiltro = debounce(() => autocompleteCombustivelLista('rcomb-combustivel', 'rcomb-combustivel-sugestoes'));
        const frota0 = debounce(() => autocompleteFrota('item-combustivel-matricula', 'combustivel-frota-sugestoes', 'item-frota-id'));
        if ($('item-combustivel-matricula')) $('item-combustivel-matricula').addEventListener('input', frota0);

        const frota1 = debounce(() => autocompleteFrota('item-manutencao-matricula', 'manutencao-frota-sugestoes', 'item-manutencao-frota-id'));
        const frotaItemRevisao = debounce(() => autocompleteFrota('item-revisao-matricula', 'revisao-frota-sugestoes', 'item-revisao-frota-id'));
        const frotaRevisaoMain = debounce(() => autocompleteFrota('revisao-matricula', 'revisao-frota-sugestoes-main', 'revisao-frota-id'));
        const frota2 = debounce(() => autocompleteFrota('rm-matricula', 'rm-matricula-sugestoes'));
        const frota3 = debounce(() => autocompleteFrota('rcomb-matricula', 'rcomb-matricula-sugestoes'));
        const funcionarioItemRevisao = debounce(() => autocompleteFuncionario('item-revisao-funcionario', 'revisao-funcionario-sugestoes', 'item-revisao-funcionario-id'));
        const funcionarioRevisaoMain = debounce(() => autocompleteFuncionario('revisao-funcionario', 'revisao-funcionario-sugestoes-main', 'revisao-funcionario-id'));

        if ($('lancamento-fornecedor-busca')) {
            $('lancamento-fornecedor-busca').addEventListener('input', fornecedor1);
                        $('lancamento-fornecedor-busca').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('lancamento-fornecedor-busca', 'fornecedor-sugestoes', 'lancamento-fornecedor-id'), 150));
        }
        if ($('consulta-fornecedor')) {
            $('consulta-fornecedor').addEventListener('input', fornecedor2);
                        $('consulta-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('consulta-fornecedor', 'consulta-fornecedor-sugestoes'), 150));
        }
        if ($('launch-consulta-fornecedor')) {
            $('launch-consulta-fornecedor').addEventListener('input', fornecedorPopup);
                        $('launch-consulta-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('launch-consulta-fornecedor', 'launch-consulta-fornecedor-sugestoes'), 150));
        }
        if ($('rf-fornecedor')) {
            $('rf-fornecedor').addEventListener('input', fornecedorFinanceiro);
                        $('rf-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('rf-fornecedor', 'rf-fornecedor-sugestoes'), 150));
        }
        if ($('rfat-fornecedor')) {
            $('rfat-fornecedor').addEventListener('input', fornecedor3);
                        $('rfat-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('rfat-fornecedor', 'rfat-fornecedor-sugestoes'), 150));
        }
        if ($('rbf-fornecedor')) {
            $('rbf-fornecedor').addEventListener('input', fornecedor4);
                        $('rbf-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('rbf-fornecedor', 'rbf-fornecedor-sugestoes'), 150));
        }
        if ($('rcomb-fornecedor')) {
            $('rcomb-fornecedor').addEventListener('input', fornecedor5);
                        $('rcomb-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('rcomb-fornecedor', 'rcomb-fornecedor-sugestoes'), 150));
        }
        if ($('rfor-fornecedor')) {
            $('rfor-fornecedor').addEventListener('input', fornecedor6);
                        $('rfor-fornecedor').addEventListener('blur', () => setTimeout(() => resolverFornecedorCampo('rfor-fornecedor', 'rfor-fornecedor-sugestoes'), 150));
        }
        if ($('consulta-fatura')) { $('consulta-fatura').addEventListener('input', fatura1); $('consulta-fatura').addEventListener('focus', fatura1); $('consulta-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('consulta-fatura-sugestoes'), 150)); }
        if ($('launch-consulta-fatura')) { $('launch-consulta-fatura').addEventListener('input', faturaPopup); $('launch-consulta-fatura').addEventListener('focus', faturaPopup); $('launch-consulta-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('launch-consulta-fatura-sugestoes'), 150)); }
        if ($('rf-fatura')) { $('rf-fatura').addEventListener('input', fatura2); $('rf-fatura').addEventListener('focus', fatura2); $('rf-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('rf-fatura-sugestoes'), 150)); }
        if ($('rbf-fatura')) { $('rbf-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('rbf-fatura-sugestoes'), 150)); }
        if ($('rfat-fatura')) { $('rfat-fatura').addEventListener('input', fatura4); $('rfat-fatura').addEventListener('focus', fatura4); $('rfat-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('rfat-fatura-sugestoes'), 150)); }
        if ($('rfor-fatura')) { $('rfor-fatura').addEventListener('input', fatura5); $('rfor-fatura').addEventListener('focus', fatura5); $('rfor-fatura').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('rfor-fatura-sugestoes'), 150)); }
        if ($('rcomb-combustivel')) { $('rcomb-combustivel').addEventListener('input', combustivelFiltro); $('rcomb-combustivel').addEventListener('focus', combustivelFiltro); $('rcomb-combustivel').addEventListener('blur', () => setTimeout(() => hideSuggestionListById('rcomb-combustivel-sugestoes'), 150)); }
        if ($('item-manutencao-matricula')) { $('item-manutencao-matricula').addEventListener('input', frota1); $('item-manutencao-matricula').addEventListener('focus', frota1); }
        if ($('item-revisao-matricula')) { $('item-revisao-matricula').addEventListener('input', frotaItemRevisao); $('item-revisao-matricula').addEventListener('focus', frotaItemRevisao); }
        if ($('revisao-matricula')) { $('revisao-matricula').addEventListener('input', frotaRevisaoMain); $('revisao-matricula').addEventListener('focus', frotaRevisaoMain); }
        if ($('rm-matricula')) { $('rm-matricula').addEventListener('input', frota2); $('rm-matricula').addEventListener('focus', frota2); }
        if ($('rcomb-matricula')) { $('rcomb-matricula').addEventListener('input', frota3); $('rcomb-matricula').addEventListener('focus', frota3); }
        if ($('item-revisao-funcionario')) { $('item-revisao-funcionario').addEventListener('input', funcionarioItemRevisao); $('item-revisao-funcionario').addEventListener('focus', funcionarioItemRevisao); }
        if ($('revisao-funcionario')) { $('revisao-funcionario').addEventListener('input', funcionarioRevisaoMain); $('revisao-funcionario').addEventListener('focus', funcionarioRevisaoMain); }
    }


    function bindInputs() {
        if ($('lancamento-dinheiro')) $('lancamento-dinheiro').addEventListener('input', () => {
            calcularTotalLancamento();
            calcularParcelamentoLancamento();
        });
        if ($('lancamento-cartao')) $('lancamento-cartao').addEventListener('input', () => {
            calcularTotalLancamento();
            calcularParcelamentoLancamento();
        });
        if ($('lancamento-nota-credito')) {
            $('lancamento-nota-credito').addEventListener('input', () => {
                calcularTotalLancamento();
                calcularParcelamentoLancamento();
            });
            $('lancamento-nota-credito').addEventListener('change', () => {
                calcularTotalLancamento();
                calcularParcelamentoLancamento();
            });
        }
        if ($('lancamento-valor-fatura')) $('lancamento-valor-fatura').addEventListener('input', () => {
            calcularTotalLancamento();
            calcularParcelamentoLancamento();
        });
        if ($('lancamento-parcelas')) $('lancamento-parcelas').addEventListener('change', calcularParcelamentoLancamento);

        ['lancamento-dinheiro','lancamento-cartao','lancamento-nota-credito','lancamento-valor-fatura','lancamento-data-vencimento'].forEach(id => {
            if ($(id)) $(id).addEventListener('input', atualizarResumoLancamento);
            if ($(id)) $(id).addEventListener('change', atualizarResumoLancamento);
        });

        document.addEventListener('keydown', (event) => {
            const secaoAtiva = document.querySelector('#lancamentos-section.active');
            if (!secaoAtiva) return;
            const target = event.target;
            if (event.key === 'Enter' && target && !target.closest('.autocomplete-list') && target.tagName !== 'TEXTAREA' && !target.classList.contains('btn')) {
                event.preventDefault();
                salvarLancamento();
            }
        });

        if ($('item-km-inicio')) $('item-km-inicio').addEventListener('input', calcularKmTotalItem);
        if ($('item-km-final')) $('item-km-final').addEventListener('input', calcularKmTotalItem);
        if ($('item-litro')) $('item-litro').addEventListener('input', calcularValorTotalItemCombustivel);
        if ($('item-valor-litro')) $('item-valor-litro').addEventListener('input', calcularValorTotalItemCombustivel);
        if ($('item-valor-total')) $('item-valor-total').addEventListener('input', () => { $('item-valor-total').dataset.manual = $('item-valor-total').value ? '1' : ''; });
        if ($('item-manutencao-km-inicio')) $('item-manutencao-km-inicio').addEventListener('input', calcularKmTotalManutencao);
        if ($('item-manutencao-km-final')) $('item-manutencao-km-final').addEventListener('input', calcularKmTotalManutencao);
        if ($('item-revisao-km-inicio')) $('item-revisao-km-inicio').addEventListener('input', calcularKmTotalRevisao);
        if ($('item-revisao-km-final')) $('item-revisao-km-final').addEventListener('input', calcularKmTotalRevisao);
        if ($('item-revisao-kms-previsao')) $('item-revisao-kms-previsao').addEventListener('input', calcularKmParaRevisao);
        if ($('revisao-kms-previsao')) $('revisao-kms-previsao').addEventListener('input', calcularRevisaoFrotaFormulario);
        if ($('item-manutencao-litro')) $('item-manutencao-litro').addEventListener('input', recalcularValorManutencaoItem);
        if ($('item-manutencao-valor-litro')) $('item-manutencao-valor-litro').addEventListener('input', recalcularValorManutencaoItem);

        ['baixa-dinheiro', 'baixa-cartao', 'baixa-mbway', 'baixa-transferencia', 'baixa-nota-credito'].forEach(id => {
            if ($(id)) $(id).addEventListener('input', calcularTotaisBaixaFatura);
        });

        if ($('usuario-administrador-geral')) { $('usuario-administrador-geral').addEventListener('change', () => { if ($('usuario-empresa')) $('usuario-empresa').disabled = $('usuario-administrador-geral').checked; }); }

        if ($('empresa-logo')) {
            $('empresa-logo').addEventListener('change', () => {
                const file = $('empresa-logo').files?.[0];
                const preview = $('empresa-logo-preview');
                const placeholder = $('empresa-logo-placeholder');

                if (!file || !preview || !placeholder) return;

                const reader = new FileReader();
                reader.onload = e => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function abrirModalAlterarSenha(id, nome = '') {
        if ($('alterar-senha-usuario-id')) $('alterar-senha-usuario-id').value = id || '';
        if ($('alterar-senha-password')) $('alterar-senha-password').value = '';
        if ($('alterar-senha-titulo')) $('alterar-senha-titulo').textContent = nome ? `Alterar senha - ${nome}` : 'Alterar senha';
        if ($('alterar-senha-modal')) $('alterar-senha-modal').classList.remove('hidden');
    }

    function abrirModalAlterarSenhaPropria() {
        abrirModalAlterarSenha('', 'Minha senha');
    }

    function fecharModalAlterarSenha() {
        if ($('alterar-senha-modal')) $('alterar-senha-modal').classList.add('hidden');
        if ($('alterar-senha-usuario-id')) $('alterar-senha-usuario-id').value = '';
        if ($('alterar-senha-password')) $('alterar-senha-password').value = '';
    }

    async function salvarAlteracaoSenha() {
        const id = $('alterar-senha-usuario-id')?.value || '';
        const password = $('alterar-senha-password')?.value || '';
        if (!password) {
            showToast('Informe a nova senha.', 'error');
            return;
        }
        const url = id ? `/usuarios/${id}/alterar-senha/` : '/usuarios/alterar-senha/';
        try {
            await apiFetch(url, { method: 'POST', json: { password } });
            showToast('Senha alterada com sucesso.');
            fecharModalAlterarSenha();
        } catch (error) {
            showToast(error.message || 'Erro ao alterar senha.', 'error');
        }
    }

    function exposeGlobals() {
        window.showSection = showSection;
        window.ativarPainelLancamento = ativarPainelLancamento;
        window.fecharLancamentosPOS = fecharLancamentosPOS;
        window.trocarEmpresaAtiva = trocarEmpresaAtiva;
        window.abrirModalFornecedor = abrirModalFornecedor;
        window.fecharModalFornecedor = fecharModalFornecedor;
        window.salvarFornecedorModal = salvarFornecedorModal;
        window.fecharAlertaFrota = fecharAlertaFrota;

        window.calcularTotalLancamento = calcularTotalLancamento;
        window.calcularParcelamentoLancamento = calcularParcelamentoLancamento;
        window.calcularKmTotalItem = calcularKmTotalItem;
        window.calcularKmTotalManutencao = calcularKmTotalManutencao;

        window.abrirModalBaixaFatura = abrirModalBaixaFatura;
        window.fecharModalBaixaFatura = fecharModalBaixaFatura;
        window.calcularTotaisBaixaFatura = calcularTotaisBaixaFatura;
        window.salvarBaixaFatura = salvarBaixaFatura;
        window.abrirModalAlterarSenha = abrirModalAlterarSenha;
        window.abrirModalAlterarSenhaPropria = abrirModalAlterarSenhaPropria;
        window.fecharModalAlterarSenha = fecharModalAlterarSenha;
        window.salvarAlteracaoSenha = salvarAlteracaoSenha;

        window.selecionarNenhumCombustivel = selecionarNenhumCombustivel;
        window.selecionarCombustivel = selecionarCombustivel;
        window.renderLancamentoPreviewTable = renderLancamentoPreviewTable;
        window.limparItemCombustivel = limparItemCombustivel;
        window.limparItemManutencao = limparItemManutencao;
        window.adicionarItemCombustivelNaGrade = adicionarItemCombustivelNaGrade;
        window.adicionarItemManutencaoNaGrade = adicionarItemManutencaoNaGrade;
        window.removerItemCombustivel = removerItemCombustivel;
        window.editarItemCombustivel = editarItemCombustivel;
        window.editarItemManutencao = editarItemManutencao;
        window.removerItemManutencao = removerItemManutencao;
        window.removerItemLancamento = removerItemLancamento;

        window.salvarLancamento = salvarLancamento;
        window.limparLancamento = limparLancamento;
        window.editarLancamento = editarLancamento;
        window.excluirLancamento = excluirLancamento;

        window.carregarConsulta = carregarConsulta;
        window.carregarBaixaFaturas = carregarBaixaFaturas;
        window.carregarRelatorioFinanceiro = carregarRelatorioFinanceiro;
        window.carregarRelatorioFornecedor = carregarRelatorioFornecedor;
        window.carregarRelatorioFaturas = carregarRelatorioFaturas;
        window.carregarRelatorioFrota = carregarRelatorioFrota;
        window.carregarRelatorioManutencao = carregarRelatorioManutencao;
        window.carregarRelatorioCaixa = carregarRelatorioCaixa;
        window.carregarRelatorioCombustivel = carregarRelatorioCombustivel;
        window.carregarRelatorioDocumentos = carregarRelatorioDocumentos;
        window.exportarRelatorio = exportarRelatorio;
        window.imprimirRelatorio = imprimirRelatorio;
        window.aplicarFiltroMesCaixa = aplicarFiltroMesCaixa;
        window.limparFiltroMesCaixa = limparFiltroMesCaixa;

        window.salvarFornecedor = salvarFornecedor;
        window.salvarFuncionario = salvarFuncionario;
        window.salvarFrota = salvarFrota;
        window.salvarRevisaoFrota = salvarRevisaoFrota;
        window.carregarRevisaoFrota = carregarRevisaoFrota;
        window.excluirRevisaoFrota = excluirRevisaoFrota;
        window.editarRevisaoFrotaRow = editarRevisaoFrotaRow;
        window.limparRevisaoFrota = limparRevisaoFrota;
        window.adicionarItemRevisaoNaGrade = adicionarItemRevisaoNaGrade;
        window.removerItemRevisao = removerItemRevisao;
        window.salvarCombustivel = salvarCombustivel;
        window.salvarBotaoManutencao = salvarBotaoManutencao;
        window.editarTipoManutencao = editarTipoManutencao;
        window.excluirTipoManutencao = excluirTipoManutencao;
        window.limparTipoManutencao = limparTipoManutencao;
        window.salvarEmpresa = salvarEmpresa;
        window.salvarUsuario = salvarUsuario;

        window.carregarFornecedores = carregarFornecedores;
        window.pesquisarFornecedores = pesquisarFornecedores;
        window.limparPesquisaFornecedores = limparPesquisaFornecedores;
        window.ordenarFornecedoresLista = ordenarFornecedoresLista;
        window.carregarFuncionarios = carregarFuncionarios;
        window.carregarFrota = carregarFrota;
        window.carregarCombustiveis = carregarCombustiveis;
        window.carregarEmpresas = carregarEmpresas;
        window.carregarUsuarios = carregarUsuarios;
        window.abrirModalPermissoes = abrirModalPermissoes;
        window.fecharModalPermissoes = fecharModalPermissoes;
        window.aplicarPermissoesDoModal = aplicarPermissoesDoModal;

        window.editarClienteRow = editarClienteRow;
        window.editarFornecedorRow = editarFornecedorRow;
        window.editarFuncionarioRow = editarFuncionarioRow;
        window.editarFrotaRow = editarFrotaRow;
        window.editarCombustivelRow = editarCombustivelRow;
        window.editarEmpresaRow = editarEmpresaRow;
        window.editarUsuarioRow = editarUsuarioRow;

        window.editarCliente = editarCliente;
        window.excluirCliente = excluirCliente;
        window.editarFornecedor = editarFornecedor;
        window.excluirFornecedor = excluirFornecedor;
        window.editarFuncionario = editarFuncionario;
        window.excluirFuncionario = excluirFuncionario;
        window.editarFrota = editarFrota;
        window.excluirFrota = excluirFrota;
        window.editarCombustivel = editarCombustivel;
        window.excluirCombustivel = excluirCombustivel;
        window.editarEmpresa = editarEmpresa;
        window.excluirEmpresa = excluirEmpresa;
        window.editarUsuario = editarUsuario;
        window.excluirUsuario = excluirUsuario;

        window.salvarCliente = salvarCliente;
        window.limparCliente = limparCliente;
        window.limparFornecedor = limparFornecedor;
        window.limparFuncionario = limparFuncionario;
        window.limparFrota = limparFrota;
        window.limparCombustivel = limparCombustivel;
        window.limparEmpresa = limparEmpresa;
        window.limparUsuario = limparUsuario;
    }

    function abrirModalPermissoes() {
        const modal = $('modal-permissoes');
        const grid = $('permissoes-grid');
        if (!modal || !grid) return;
        const admin = $('usuario-administrador-geral')?.checked;
        const perms = usuarioPermissoesSelecionadas || {};
        const actions = ['view', 'create', 'edit', 'delete', 'export'];
        const labels = {
            view: 'Acesso',
            create: 'Criar',
            edit: 'Editar',
            delete: 'Excluir',
            export: 'Exportar'
        };

        grid.innerHTML = `
            <div class="perm-routine-row header">
                <div>Rotina</div>
                ${actions.map(a => `<div>${labels[a]}</div>`).join('')}
            </div>
            ${ROTINAS_PERMISSOES_UI.map(({ key, label, grupo }) => {
                const liberado = admin || (perms[key] && perms[key].view);
                return `
                    <div class="perm-routine-row" data-rotina-row="${key}">
                        <div class="perm-routine-title"><strong>${label}</strong><span class="perm-routine-group">${grupo}</span></div>
                        ${actions.map(a => {
                            const checked = admin || (perms[key] && perms[key][a]) ? 'checked' : '';
                            const disabled = admin ? 'disabled' : '';
                            const extra = a !== 'view' && !liberado ? 'perm-disabled' : '';
                            return `<div class="${extra}"><input type="checkbox" class="perm-check" data-rotina="${key}" data-acao="${a}" ${checked} ${disabled}></div>`;
                        }).join('')}
                    </div>`;
            }).join('')}`;
        modal.classList.remove('hidden');

        if (!admin) {
            grid.querySelectorAll('input[data-acao="view"]').forEach(input => {
                input.addEventListener('change', function() {
                    const rotina = this.dataset.rotina;
                    const row = grid.querySelector(`[data-rotina-row="${rotina}"]`);
                    if (!row) return;
                    const enabled = this.checked;
                    row.querySelectorAll('input.perm-check').forEach(el => {
                        if (el.dataset.acao !== 'view') {
                            el.disabled = !enabled;
                            if (!enabled) el.checked = false;
                            el.parentElement?.classList.toggle('perm-disabled', !enabled);
                        }
                    });
                });
                input.dispatchEvent(new Event('change'));
            });
        }
    }

    function fecharModalPermissoes() {
        $('modal-permissoes')?.classList.add('hidden');
    }

    function aplicarPermissoesDoModal() {
        const admin = $('usuario-administrador-geral')?.checked;
        const actions = ['view', 'create', 'edit', 'delete', 'export'];
        if (admin) {
            usuarioPermissoesSelecionadas = Object.fromEntries(ROTINAS_PERMISSOES_UI.map((item) => [item.key, Object.fromEntries(actions.map(a => [a, true]))]));
        } else {
            const payload = {};
            ROTINAS_PERMISSOES_UI.forEach((item) => payload[item.key] = Object.fromEntries(actions.map(a => [a, false])));
            document.querySelectorAll('.perm-check').forEach(el => {
                const r = el.dataset.rotina; const a = el.dataset.acao;
                if (!payload[r]) payload[r] = {};
                payload[r][a] = el.checked;
            });
            Object.keys(payload).forEach(rotina => {
                if (!payload[rotina].view) {
                    actions.forEach(a => { if (a !== 'view') payload[rotina][a] = false; });
                }
            });
            usuarioPermissoesSelecionadas = payload;
        }
        atualizarResumoPermissoes();
        fecharModalPermissoes();
        showToast('Permissões aplicadas ao utilizador.');
    }

    function init() {
        exposeGlobals();
        qsa('.menu-item[data-section]').forEach(btn => {
            const rotina = SECTION_TO_ROTINA[btn.dataset.section];
            if (rotina && !rotinaLiberada(rotina, 'view')) btn.style.display = 'none';
        });
        preencherSelectEmpresas();
        preencherSelectFrotaCombustivel();
        preencherDatalistCombustiveis();
        bindMenu();
        bindAutocomplete();
        bindInputs();
        bindCrmButtonUploads();
        carregarConfigBotaoManutencao();
        carregarCombustiveis().then(() => { App.combustiveisMenu = App.combustiveisMenu?.length ? App.combustiveisMenu : []; renderFuelButtons(); preencherDatalistCombustiveis(); });
        carregarManutencaoTipos();
        renderFuelButtons();
        renderItensCombustivelGrid();
        renderItensManutencaoGrid();
        renderItensRevisaoGrid();
        atualizarResumoPermissoes();
        calcularTotalLancamento();
        calcularParcelamentoLancamento();
        atualizarResumoLancamento();

        const initialSection = `${App.secaoAtiva}-section`;
        if ($(initialSection)) {
            showSection(initialSection);
        } else {
            showSection('dashboard-section');
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
