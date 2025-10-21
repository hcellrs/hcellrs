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
