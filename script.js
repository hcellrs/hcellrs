document.addEventListener('DOMContentLoaded', () => {
    // Função para alternar o menu de navegação em telas menores
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Atualiza o atributo aria-expanded para acessibilidade
            const isExpanded = navMenu.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });

        // Fechar o menu ao clicar em um link (apenas para mobile)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', false);
                }
            });
        });
    }

    // Alerta personalizado para o botão de envio do formulário
    const submitFormBtn = document.getElementById('submitFormBtn');
    if (submitFormBtn) {
        submitFormBtn.addEventListener('click', (event) => {
            // Verifica se o formulário é válido antes de mostrar o alerta
            const form = submitFormBtn.closest('form');
            if (form && form.checkValidity()) {
                alert('Ao clicar em "OK" na próxima janela, escolha o aplicativo do GMAIL ou seu cliente de e-mail padrão para enviar a mensagem.');
            }
            // O envio do formulário via mailto será feito automaticamente após o alerta, se o formulário for válido.
        });
    }
});

// Adiciona um efeito de "scroll-spy" básico para as seções (opcional)
// Isso pode ajudar a destacar o item de menu ativo
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150; // Ajuste para o header fixo
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.href.includes(current)) {
            link.classList.add('active');
        }
    });
});