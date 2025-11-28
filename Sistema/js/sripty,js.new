// js/scripts.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageBox = document.getElementById('loginMessage');
    const btnLogin = document.getElementById('btn-login');

    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Impede o recarregamento da página

            // 1. Captura os dados
            const usuario = document.getElementById('usuario').value;
            const senha = document.getElementById('senha').value;

            // Feedback visual (carregando)
            const originalBtnText = btnLogin.innerHTML;
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
            btnLogin.disabled = true;

            // 2. Aqui faremos a conexão com o Back-end (Exemplo simulado)
            // Futuramente substituiremos isso por um 'fetch' real para seu servidor
            console.log("Tentativa de login:", usuario);

            // SIMULAÇÃO DE VALIDAÇÃO (Para testarmos o front-end agora)
            setTimeout(() => {
                if(usuario && senha) {
                    // Sucesso: Redirecionar para a página de consulta
                    // Vamos criar esse arquivo 'dashboard.html' ou 'consulta.php' a seguir
                    window.location.href = 'dashboard.html'; 
                } else {
                    // Erro
                    mostrarErro("Usuário ou senha inválidos.");
                    restaurarBotao();
                }
            }, 1000); 
            
            /* // CÓDIGO REAL (Quando tivermos o backend):
            fetch('api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: usuario, pass: senha })
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    mostrarErro(data.message);
                    restaurarBotao();
                }
            });
            */
        });
    }

    function mostrarErro(msg) {
        messageBox.style.display = 'block';
        messageBox.textContent = msg;
    }

    function restaurarBotao() {
        btnLogin.innerHTML = 'Login';
        btnLogin.disabled = false;
    }
});
