// =================================================================
// 1. LÓGICA DE LOGIN (ARQUIVO: login.html, AGORA RENOMEADO PARA index.html)
// =================================================================

// ... (cerca da linha 96)
        if (result.sucesso) {
            // LOGIN BEM-SUCEDIDO: Salva o token e redireciona
            localStorage.setItem(LOGIN_TOKEN_KEY, result.token);
            // REDIRECIONAMENTO CORRIGIDO: Agora vai para o dashboard.html
            window.location.href = 'dashboard.html'; 
        } 
// ...

// =================================================================
// 2. VERIFICAÇÃO DE AUTENTICAÇÃO (Para todas as páginas do sistema)
// =================================================================

// Função para verificar se o usuário está logado
function checkAuth() {
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    const currentPage = window.location.pathname.split('/').pop();

    // Novo nome do arquivo de login é 'index.html'
    const loginPage = 'index.html';
    // Novo nome do arquivo do dashboard é 'dashboard.html'
    const dashboardPage = 'dashboard.html';

    // Se estiver na tela de login, mas já tem token, vai para o dashboard
    if (token && currentPage === loginPage) {
        window.location.href = dashboardPage;
        return;
    }

    // Se NÃO estiver na tela de login e NÃO tem token, volta para o login
    // Verifica se a página atual é alguma página do sistema (e não a pasta raiz do seu site principal)
    if (!token && currentPage !== loginPage) {
        // Redireciona para o arquivo index.html (que agora é o login)
        window.location.href = loginPage; 
        return;
    }
    
    // O resto da checagem
    if (currentPage !== loginPage) {
        console.log("Usuário autenticado. Token presente.");
    }
}
// Executa a checagem de login assim que a página é carregada
checkAuth();