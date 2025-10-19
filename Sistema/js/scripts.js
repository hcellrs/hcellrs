// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

// COLOQUE A URL DA API DE QA GERADA PELO GOOGLE APPS SCRIPT AQUI!
const API_URL = "https://script.google.com/macros/s/AKfycbwWe2ZELb68fH9sT_GrntYhYWXYvMiMeld_GFDPvHLim1wTJEFCmpFc6fcj__W8CSsX6Q/exec"; 
const LOGIN_TOKEN_KEY = 'hcell_auth_token';


// -----------------------------------------------------------------
// FUNÇÃO DE UTILIDADE PARA ENVIAR DADOS AO APPS SCRIPT
// -----------------------------------------------------------------

async function sendDataToAPI(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors', // Necessário para Apps Script
            cache: 'no-cache',
            headers: { 
                'Content-Type': 'text/plain', // Requerido pelo Apps Script
                // Adicionamos um Origin fictício para evitar que o navegador bloqueie requisições 'file://'
                'Origin': 'https://hcell.com.br' 
            }, 
            body: JSON.stringify(data)
        });
        
        // O Apps Script retorna um texto que deve ser convertido para JSON
        const text = await response.text();
        return JSON.parse(text);

    } catch (error) {
        console.error('Erro na comunicação com a API:', error);
        return { sucesso: false, mensagem: 'Erro de rede ou servidor.' };
    }
}
// (O RESTO DO SEU scripts.js CONTINUA IGUAL)


// -----------------------------------------------------------------
// 1. LÓGICA DE LOGIN (ARQUIVO: login.html)
// -----------------------------------------------------------------

// Verifica se a página é a de login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const usuario = document.getElementById('inputUsuario').value;
        const senha = document.getElementById('inputSenha').value;
        const loginMessage = document.getElementById('loginMessage');
        const btnLogin = document.getElementById('btn-login');
        
        // Limpa a mensagem e desabilita o botão
        loginMessage.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Acessando...';

        // Dados para enviar ao Apps Script (Action: 'login')
        const data = {
            action: 'login',
            usuario: usuario,
            senha: senha
        };

        const result = await sendDataToAPI(data);

        if (result.sucesso) {
            // LOGIN BEM-SUCEDIDO: Salva o token e redireciona
            localStorage.setItem(LOGIN_TOKEN_KEY, result.token);
            window.location.href = 'index.html'; 
        } else {
            // LOGIN FALHOU
            loginMessage.textContent = result.mensagem || 'Erro desconhecido.';
            loginMessage.style.display = 'block';
            
            // Habilita o botão novamente
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Entrar no Sistema';
        }
    });
}


// -----------------------------------------------------------------
// 2. VERIFICAÇÃO DE AUTENTICAÇÃO (Para todas as páginas do sistema)
// -----------------------------------------------------------------

// Função para verificar se o usuário está logado
function checkAuth() {
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const currentPage = window.location.pathname.split('/').pop();

    // Se estiver na tela de login, mas já tem token, vai para o dashboard
    if (token && currentPage === 'login.html') {
        window.location.href = 'index.html';
        return;
    }

    // Se NÃO estiver na tela de login e NÃO tem token, volta para o login
    if (!token && currentPage !== 'login.html') {
        window.location.href = 'login.html';
        return;
    }
    
    // Se estiver logado e não for a tela de login, tudo certo!
    // A tela de login não precisa desta verificação, então a ignoramos aqui.
    if (currentPage !== 'login.html') {
        console.log("Usuário autenticado. Token presente.");
    }
}

// Executa a checagem de login assim que a página é carregada
checkAuth();


// -----------------------------------------------------------------
// 3. LÓGICA DE CADASTRO DE CLIENTE (ARQUIVO: cadastrar_cliente.html)
// -----------------------------------------------------------------


// (ESTA PARTE SERÁ IMPLEMENTADA NO PRÓXIMO PASSO, APÓS TESTARMOS O LOGIN)
