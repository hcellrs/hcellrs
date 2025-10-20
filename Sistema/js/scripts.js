// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

// URL DA API DE QA GERADA PELO GOOGLE APPS SCRIPT (MANTENHA ESTA)
const API_URL = "https://script.google.com/macros/s/AKfycbwWe2ZELb68fH9sT_GrntYhYWXYvMiMeld_GFDPvHLim1wTJEFCmpFc6fcj__W8CSsX6Q/exec"; 
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
// 4. LÓGICA DE CADASTRO DE CLIENTE (CRUD - CREATE)
// -----------------------------------------------------------------

if (document.getElementById('cadastroClienteForm')) {
    document.getElementById('cadastroClienteForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem(LOGIN_TOKEN_KEY);
        const btnCadastrar = document.getElementById('btn-cadastrar');
        const cadastroMessage = document.getElementById('cadastroMessage');
        const form = e.target;

        const clienteData = {
            nome: document.getElementById('inputNome').value.trim(),
            telefone: document.getElementById('inputTelefone').value.trim(),
            email: document.getElementById('inputEmail').value.trim(),
            documento: document.getElementById('inputDocumento').value.trim(),
            endereco: document.getElementById('inputEndereco').value.trim()
        };

        const dataToSend = { action: 'cadastrarCliente', token: token, cliente: clienteData };

        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cadastrando...';
        cadastroMessage.style.display = 'none';

        const result = await sendDataToAPI(dataToSend);

        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i> Cadastrar Cliente';
        
        cadastroMessage.textContent = result.mensagem;
        cadastroMessage.style.display = 'block';

        if (result.sucesso) {
            cadastroMessage.classList.remove('alert-danger');
            cadastroMessage.classList.add('alert-success');
            form.reset(); 
        } else {
            cadastroMessage.classList.remove('alert-success');
            cadastroMessage.classList.add('alert-danger');
        }
    });
}
