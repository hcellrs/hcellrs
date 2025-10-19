// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

// TESTE DE CARREGAMENTO:
console.log("Sistema HCELL - Scripts carregados com sucesso!");

// URL DA API DE QA GERADA PELO GOOGLE APPS SCRIPT (MANTENHA ESTA)
const API_URL = "https://script.google.com/macros/s/AKfycbwWe2ZELb68fH9sT_GrntYhYWXYvMiMeld_GFDPvHLim1wTJEFCmpFc6fcj__W8CSsX6Q/exec"; 
const LOGIN_TOKEN_KEY = 'hcell_auth_token';

const LOGIN_PAGE_NAME = 'index.html'; // Arquivo de login (agora dentro de /Sistema/)
const DASHBOARD_PAGE_NAME = 'dashboard.html'; // Arquivo do dashboard

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
// 1. LÓGICA DE LOGIN (ARQUIVO: index.html) - VERSÃO FINAL CORRIGIDA
// -----------------------------------------------------------------

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // 1. Captura de Elementos
        const usuario = document.getElementById('usuario').value; 
        const senha = document.getElementById('senha').value;
        const btnLogin = document.getElementById('btn-login'); 
        const loginMessage = document.getElementById('loginMessage');
        
        // 2. Efeitos Visuais (Agora com verificação de existência do botão)
        loginMessage.style.display = 'none';

        if (btnLogin) {
            btnLogin.disabled = true;
            // Use o atributo 'data-original-html' para guardar o texto original
            btnLogin.setAttribute('data-original-html', btnLogin.innerHTML); 
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Acessando...';
        }

        const data = {
            action: 'login',
            usuario: usuario,
            senha: senha
        };

        const result = await sendDataToAPI(data);

        if (result.sucesso) {
            // LOGIN BEM-SUCEDIDO
            localStorage.setItem(LOGIN_TOKEN_KEY, result.token);
            window.location.href = DASHBOARD_PAGE_NAME; 
        } else {
            // LOGIN FALHOU
            loginMessage.textContent = result.mensagem || 'Erro desconhecido. Verifique sua URL da API.';
            loginMessage.style.display = 'block';
            
            // 3. Reverte o Botão
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
    // Redireciona para o login (index.html)
    window.location.href = LOGIN_PAGE_NAME;
}

// Adiciona o listener ao botão "Sair" do Dashboard
if (document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', function(e) {
        e.preventDefault(); // Impede o link de navegar
        handleLogout();
    });
}


// -----------------------------------------------------------------
// 3. VERIFICAÇÃO DE AUTENTICAÇÃO (Em todas as páginas do sistema)
// -----------------------------------------------------------------

function checkAuth() {
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const currentPage = window.location.pathname.split('/').pop();

    // Páginas que NÃO exigem login (apenas a tela de login)
    const isLoginPage = currentPage === LOGIN_PAGE_NAME || currentPage === ''; // Inclui a URL base se for hcellrs.com.br/sistema/

    // SE O USUÁRIO TEM TOKEN
    if (token) {
        // Se está logado e tenta acessar o Login, redireciona para o Dashboard
        if (isLoginPage) {
            window.location.href = DASHBOARD_PAGE_NAME;
            return;
        }
    } else {
        // SE O USUÁRIO NÃO TEM TOKEN (Não está logado)
        // Se está em qualquer página que não seja o Login, redireciona para o Login
        if (!isLoginPage) {
            window.location.href = LOGIN_PAGE_NAME; 
            return;
        }
    }
    
    // Se chegou aqui, está logado e no sistema ou deslogado na tela de login.
    if (!isLoginPage) {
        console.log("Usuário autenticado. Token presente.");
    }
}

// Executa a checagem de login assim que a página é carregada
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

        // 1. Coleta dos dados do formulário
        const clienteData = {
            nome: document.getElementById('inputNome').value.trim(),
            telefone: document.getElementById('inputTelefone').value.trim(),
            email: document.getElementById('inputEmail').value.trim(),
            documento: document.getElementById('inputDocumento').value.trim(),
            endereco: document.getElementById('inputEndereco').value.trim()
        };

        // 2. Monta o payload para a API
        const dataToSend = {
            action: 'cadastrarCliente',
            token: token, // Envia o token para autenticação
            cliente: clienteData
        };

        // 3. Efeitos visuais (Loading)
        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cadastrando...';
        cadastroMessage.style.display = 'none';

        // 4. Envio para a API
        const result = await sendDataToAPI(dataToSend);

        // 5. Resultado
        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i> Cadastrar Cliente';
        
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

