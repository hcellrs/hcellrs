// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

// URL DA API DE QA GERADA PELO GOOGLE APPS SCRIPT (MANTENHA ESTA)
const API_URL = "https://script.google.com/macros/s/AKfycbwOMTs3SsTRXvrN0aQipKLbaChad2KocwLAWyoUMZSWyV0xetn_646KnVdrrGuswzUhjQ/exec"; 
const LOGIN_TOKEN_KEY = 'hcell_auth_token';

const LOGIN_PAGE_NAME = 'index.html'; 
const DASHBOARD_PAGE_NAME = 'dashboard.html'; 

// -----------------------------------------------------------------
// FUNÇÃO DE UTILIDADE PARA ENVIAR DADOS AO APPS SCRIPT
// -----------------------------------------------------------------

async function sendDataToAPI(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        });
        
        const text = await response.text();
        
        if (text && text.startsWith('{')) {
            return JSON.parse(text); 
        } else {
            console.error('Resposta inválida da API:', text);
            return { sucesso: false, mensagem: 'Resposta inesperada do servidor Apps Script.' };
        }

    } catch (error) {
        console.error('Erro na comunicação com a API:', error);
        return { sucesso: false, mensagem: 'Erro de rede ou servidor.' };
    }
}


// -----------------------------------------------------------------
// 1. LÓGICA DE LOGIN (ARQUIVO: index.html) - VERSÃO ROBUSTA
// -----------------------------------------------------------------

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value; 
        const senha = document.getElementById('senha').value;
        const loginMessage = document.getElementById('loginMessage');
        
        // Versão robusta para encontrar o botão de login, evitando erros de null
        let btnLogin = document.getElementById('btn-login'); 
        if (!btnLogin) {
            btnLogin = document.querySelector('.btn-login'); 
        }
        
        loginMessage.style.display = 'none';

        if (btnLogin) {
            btnLogin.setAttribute('data-original-html', btnLogin.innerHTML); 
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Acessando...';
        }

        const data = { action: 'login', usuario: usuario, senha: senha };
        const result = await sendDataToAPI(data);

        if (result.sucesso) {
            localStorage.setItem(LOGIN_TOKEN_KEY, result.token);
            window.location.href = DASHBOARD_PAGE_NAME; 
        } else {
            loginMessage.textContent = result.mensagem || 'Falha no Login. Verifique credenciais e URL da API.';
            loginMessage.style.display = 'block';
            
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.innerHTML = btnLogin.getAttribute('data-original-html') || 'Login';
            }
        }
    });
}

// -----------------------------------------------------------------
// 2. LÓGICA DE LOGOUT
// -----------------------------------------------------------------

function handleLogout() {
    localStorage.removeItem(LOGIN_TOKEN_KEY);
    window.location.href = LOGIN_PAGE_NAME;
}

if (document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', function(e) {
        e.preventDefault(); 
        handleLogout();
    });
}


// -----------------------------------------------------------------
// 3. VERIFICAÇÃO DE AUTENTICAÇÃO (Em todas as páginas do sistema)
// -----------------------------------------------------------------

function checkAuth() {
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const currentPage = window.location.pathname.split('/').pop();

    const isLoginPage = currentPage === LOGIN_PAGE_NAME || currentPage === ''; 

    if (token) {
        if (isLoginPage) {
            window.location.href = DASHBOARD_PAGE_NAME;
            return;
        }
    } else {
        if (!isLoginPage) {
            window.location.href = LOGIN_PAGE_NAME; 
            return;
        }
    }
}

checkAuth();


// -----------------------------------------------------------------
// 4. LÓGICA DE CADASTRO DE PESSOAS (CRUD - CREATE)
// -----------------------------------------------------------------

if (document.getElementById('cadastroClienteForm')) {
    document.getElementById('cadastroClienteForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem(LOGIN_TOKEN_KEY);
        const btnCadastrar = document.getElementById('btn-cadastrar');
        const cadastroMessage = document.getElementById('cadastroMessage');
        const form = e.target;

        // 1. Coleta os Tipos de Cadastro marcados (Cliente, Fornecedor, etc.)
        const tiposCadastro = Array.from(document.querySelectorAll('input[name="tipoCadastro"]:checked'))
                                 .map(cb => cb.value)
                                 .join(', '); // Ex: "Cliente, Fornecedor"

        // 2. Coleta os demais dados do formulário
        const pessoaData = {
            // Tipo e Nome
            tipoPessoa: document.querySelector('input[name="tipoPessoa"]:checked').value, // Física ou Jurídica
            tiposCadastro: tiposCadastro, // Cliente, Fornecedor, etc.
            nome: document.getElementById('inputNome').value.trim(),
            documento: document.getElementById('inputDocumento').value.trim(), // CPF/CNPJ
            rg: document.getElementById('inputRG').value.trim(),
            
            // Contato
            telefone1: document.getElementById('inputTelefone1').value.trim(),
            telefone2: document.getElementById('inputTelefone2').value.trim(),
            email: document.getElementById('inputEmail').value.trim(),

            // Endereço
            cep: document.getElementById('inputCEP').value.trim(),
            rua: document.getElementById('inputRua').value.trim(),
            numero: document.getElementById('inputNumero').value.trim(),
            bairro: document.getElementById('inputBairro').value.trim(),
            cidade: document.getElementById('inputCidade').value.trim(),
            estado: document.getElementById('inputEstado').value.trim(),
            
            // Dados de auditoria
            dataCadastro: new Date().toISOString().split('T')[0] // Data atual no formato AAAA-MM-DD
        };

        const dataToSend = { action: 'cadastrarPessoa', token: token, pessoa: pessoaData };

        // Desabilita o botão e mostra o spinner
        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
        cadastroMessage.style.display = 'none';

        const result = await sendDataToAPI(dataToSend);

        // Restaura o botão
        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i> Salvar Cadastro';
        
        cadastroMessage.textContent = result.mensagem;
        cadastroMessage.style.display = 'block';

        if (result.sucesso) {
            cadastroMessage.classList.remove('alert-danger');
            cadastroMessage.classList.add('alert-success');
            form.reset(); // Limpa o formulário após o sucesso
        } else {
            cadastroMessage.classList.remove('alert-success');
            cadastroMessage.classList.add('alert-danger');
        }
    });
}

// -----------------------------------------------------------------
// 5. LÓGICA DE LISTAGEM DE PESSOAS (CRUD - READ)
// -----------------------------------------------------------------

async function carregarPessoas() {
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const dadosContainer = document.getElementById('pessoasTableBody'); // O corpo da sua tabela (TBODY)
    const mensagemElemento = document.getElementById('listagemMessage');
    
    // Limpa a tabela e mostra mensagem de carregamento
    if (dadosContainer) dadosContainer.innerHTML = '<tr><td colspan="6">Carregando dados...</td></tr>';
    if (mensagemElemento) mensagemElemento.style.display = 'none';

    const dataToSend = { action: 'buscarPessoas', token: token };
    const result = await sendDataToAPI(dataToSend);

    if (dadosContainer) dadosContainer.innerHTML = ''; // Limpa o "Carregando"

    if (result.sucesso && result.dados && result.dados.length > 0) {
        // Preenche a tabela
        result.dados.forEach(pessoa => {
            const row = dadosContainer.insertRow();
            
            // Exibindo colunas chave: Nome, Tipo, Telefone e Ações
            row.insertCell().textContent = pessoa.dataCadastro ? new Date(pessoa.dataCadastro).toLocaleDateString() : '';
            row.insertCell().textContent = pessoa.nome || 'N/A';
            row.insertCell().textContent = pessoa.tiposCadastro || 'N/A';
            row.insertCell().textContent = pessoa.telefone1 || 'N/A';
            row.insertCell().textContent = pessoa.documento || 'N/A';

            // Coluna de Ações (Futuro: Edit/Delete)
            const acoesCell = row.insertCell();
            acoesCell.innerHTML = '<button class="btn btn-sm btn-info me-2">Ver</button><button class="btn btn-sm btn-warning">Editar</button>';
        });
        
    } else {
        // Trata falha ou lista vazia
        const mensagem = result.mensagem || 'Nenhum cliente/fornecedor encontrado.';
        if (dadosContainer) dadosContainer.innerHTML = '<tr><td colspan="6">' + mensagem + '</td></tr>';
        
        if (mensagemElemento) {
            mensagemElemento.textContent = mensagem;
            mensagemElemento.classList.remove('alert-success');
            mensagemElemento.classList.add('alert-warning');
            mensagemElemento.style.display = 'block';
        }
    }
}

// Inicia o carregamento quando a página de listagem é carregada
if (window.location.pathname.endsWith('lista_clientes.html') || document.getElementById('pessoasTableBody')) {
    carregarPessoas();
}

// -----------------------------------------------------------------
// 6. AÇÕES DA TABELA (VER, EDITAR)
// -----------------------------------------------------------------

/**
 * Redireciona para a página de detalhes, passando o documento via parâmetro de URL.
 * @param {string} documento - O documento (CPF/CNPJ) da pessoa.
 */
function verDetalhes(documento) {
    if (documento) {
        // Redireciona para a página de detalhes com o documento no URL
        window.location.href = 'detalhes_pessoa.html?doc=' + encodeURIComponent(documento);
    } else {
        alert('Documento não encontrado para visualização.');
    }
}

// Manter a função iniciarEdicao para futura implementação (CRUD - UPDATE)...
function iniciarEdicao(documento) {
    alert('Ação EDITAR: Funcionalidade de edição em desenvolvimento. Documento: ' + documento);
}

// -----------------------------------------------------------------
// 7. LÓGICA DE CARREGAMENTO DE DETALHES (CRUD - READ DETALHADO)
// -----------------------------------------------------------------

/**
 * Obtém um parâmetro da URL.
 * @param {string} name - Nome do parâmetro (ex: 'doc').
 * @returns {string|null} - Valor do parâmetro ou string vazia.
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Carrega os detalhes de uma pessoa usando o documento (CPF/CNPJ) da URL.
 */
async function carregarDetalhesPessoa() {
    const documento = getUrlParameter('doc');
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const form = document.getElementById('cadastroPessoaForm'); // ID do seu formulário na página detalhes_pessoa.html

    // Se não há documento na URL ou o formulário não existe (não está na página certa)
    if (!documento || !form) return; 

    // Mensagem de carregamento
    document.querySelector('h1').textContent = `Carregando detalhes do documento: ${documento}...`;
    
    // Desabilita temporariamente para evitar cliques
    disableForm(form, true); 

    const dataToSend = { action: 'buscarPessoaPorDocumento', token: token, documento: documento };
    const result = await sendDataToAPI(dataToSend);

    if (result.sucesso && result.dados) {
        
        // 1. Atualiza o Título
        document.querySelector('h1').textContent = `Detalhes de ${result.dados.nome || 'Pessoa'}`;
        
        // 2. Preenche o Formulário
        preencherFormulario(form, result.dados);
        
        // 3. Adiciona botões de ação (Voltar e Editar)
        document.querySelector('h1').innerHTML += `
            <a href="lista_clientes.html" class="btn btn-secondary ms-3"><i class="bi bi-arrow-left"></i> Voltar à Lista</a>
            <button class="btn btn-warning ms-2" onclick="iniciarEdicao('${documento}')"><i class="bi bi-pencil"></i> Editar</button>
        `;

    } else {
        document.querySelector('h1').textContent = 'Erro ao carregar detalhes';
        alert(result.mensagem || 'Falha ao buscar detalhes da pessoa. Redirecionando...');
        // Redireciona de volta para a lista em caso de erro
        setTimeout(() => {
             window.location.href = 'lista_clientes.html';
        }, 3000);
    }
}

/**
 * Função utilitária para preencher o formulário.
 * @param {HTMLFormElement} form - O elemento do formulário.
 * @param {Object} data - O objeto com os dados da pessoa.
 */
function preencherFormulario(form, data) {
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            // Cria uma chave limpa (igual ao Apps Script)
            const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');

            // Procura o input pelo nome (usando a chave limpa)
            const input = form.querySelector(`[name="${cleanKey}"]`);

            if (input) {
                if (input.type === 'radio') {
                    // Para radio buttons (ex: tipoPessoa, Masculino/Feminino)
                    form.querySelectorAll(`[name="${cleanKey}"][value="${data[key]}"]`).forEach(radio => {
                        radio.checked = true;
                    });
                } else if (input.type === 'checkbox') {
                    // Para checkboxes (ex: tiposCadastro - Cliente, Fornecedor)
                    const values = String(data[key]).split(',').map(v => v.toString().trim()); // Garante que é string
                    form.querySelectorAll(`[name="${cleanKey}"]`).forEach(checkbox => {
                        if (values.includes(checkbox.value.toString())) {
                            checkbox.checked = true;
                        }
                    });
                } else {
                    // Para inputs de texto, data, etc.
                    input.value = data[key];
                }
            }
        }
    }
}

/**
 * Função utilitária para desabilitar o formulário.
 */
function disableForm(form, disabled) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = disabled;
    });

    // Esconde o botão Salvar/Cadastrar se estiver no modo 'Ver'
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.display = disabled ? 'none' : 'block';
    }
}


// ** ROTEAMENTO/INICIALIZAÇÃO **
// Verifica se estamos na página 'detalhes_pessoa.html' para carregar os dados
if (window.location.pathname.endsWith('detalhes_pessoa.html')) {
    carregarDetalhesPessoa();
}
