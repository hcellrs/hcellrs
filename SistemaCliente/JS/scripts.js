
// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

// MANTENHA ESTA URL ATUALIZADA COM O LINK DO SEU GOOGLE APPS SCRIPT DEPLOYADO!
const API_URL = "https://script.google.com/macros/s/AKfycbykjVOFT741sljV4tJh_F6WtWnXupvvB-wY2kNMYO23rN7kATl8RVZq-hbre0poJbI8iQ/exec";
const LOGIN_TOKEN_KEY = 'hcell_auth_token';

const LOGIN_PAGE_NAME = 'index.html'; 
// 🔑 REDIRECIONAMENTO CORRIGIDO: Agora aponta para a página de consulta de preços
const DASHBOARD_PAGE_NAME = 'lista_de_precos_sistema.html'; 
const CADASTRO_PESSOA_PAGE_NAME = 'cadastro_clientes.html';

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

// Função auxiliar para exibir mensagens de status
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `alert mt-3 alert-${type}`;
    element.style.display = 'block';
}


// -----------------------------------------------------------------
// 1. LÓGICA DE LOGIN (ARQUIVO: index.html)
// -----------------------------------------------------------------

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value; 
        const senha = document.getElementById('senha').value;
        const loginMessage = document.getElementById('loginMessage');
        
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
            // Redireciona para a nova página de consulta de preços
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
    // Redireciona e garante que a página de login não esteja no histórico
    window.location.replace(LOGIN_PAGE_NAME);
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
// (Mantido, pois não há alterações solicitadas)

if (document.getElementById('cadastroClienteForm')) {
    document.getElementById('cadastroClienteForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem(LOGIN_TOKEN_KEY);
        const btnCadastrar = document.getElementById('btn-cadastrar');
        const cadastroMessage = document.getElementById('cadastroMessage');
        const form = e.target;
        
        cadastroMessage.style.display = 'none';

        if (!token) {
            showMessage(cadastroMessage, 'Sessão expirada. Faça login novamente.', 'danger');
            handleLogout();
            return;
        }

        const tiposCadastro = Array.from(document.querySelectorAll('input[name="tipoCadastro"]:checked'))
            .map(checkbox => checkbox.value)
            .join(', '); 
        
        if (tiposCadastro.length === 0) {
            showMessage(cadastroMessage, 'Selecione pelo menos um Tipo de Cadastro (Cliente, Fornecedor ou Funcionário).', 'warning');
            return;
        }

        const tipoPessoa = document.querySelector('input[name="tipoPessoa"]:checked').value;

        const pessoaData = {
            action: 'create_pessoa', 
            token: token,
            tiposCadastro: tiposCadastro, 
            tipoPessoa: tipoPessoa,
            nome: document.getElementById('inputNome').value.trim(),
            documento: document.getElementById('inputDocumento').value.trim(),
            rg_ie: document.getElementById('inputRG').value.trim(),
            telefone1: document.getElementById('inputTelefone1').value.trim(),
            telefone2: document.getElementById('inputTelefone2').value.trim(),
            email: document.getElementById('inputEmail').value.trim(),
            cep: document.getElementById('inputCEP').value.trim(),
            rua: document.getElementById('inputRua').value.trim(),
            numero: document.getElementById('inputNumero').value.trim(),
            bairro: document.getElementById('inputBairro').value.trim(),
            cidade: document.getElementById('inputCidade').value.trim(),
            estado: document.getElementById('inputEstado').value.trim(),
        };

        btnCadastrar.setAttribute('data-original-html', btnCadastrar.innerHTML);
        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

        const result = await sendDataToAPI(pessoaData);

        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = btnCadastrar.getAttribute('data-original-html');

        if (result.sucesso) {
            showMessage(cadastroMessage, result.mensagem || 'Cadastro realizado com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                 window.location.href = 'lista_clientes.html';
            }, 2000);

        } else {
            showMessage(cadastroMessage, result.mensagem || 'Falha ao realizar o cadastro. Tente novamente.', 'danger');
        }
    });
}


// -----------------------------------------------------------------
// 5. LÓGICA DE LISTAGEM DE PESSOAS (CRUD - READ)
// -----------------------------------------------------------------
// (Mantido, pois não há alterações solicitadas)

if (document.getElementById('pessoasTableBody')) {
    
    let listaPessoasCompleta = [];

    async function fetchAndRenderPessoas() {
        const token = localStorage.getItem(LOGIN_TOKEN_KEY);
        const pessoasTableBody = document.getElementById('pessoasTableBody');
        const listagemMessage = document.getElementById('listagemMessage');
        const inputBusca = document.getElementById('inputBusca');

        listagemMessage.style.display = 'none';
        pessoasTableBody.innerHTML = '<tr><td colspan="6"><div class="text-center"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Carregando dados...</div></td></tr>';

        if (!token) {
            showMessage(listagemMessage, 'Sessão expirada. Faça login novamente.', 'danger');
            handleLogout();
            return;
        }

        const data = {
            action: 'read_pessoas', 
            token: token
        };

        const result = await sendDataToAPI(data);

        function renderTable(pessoasList) {
            pessoasTableBody.innerHTML = ''; 
            
            if (pessoasList && pessoasList.length > 0) {
                pessoasList.forEach(pessoa => {
                    const row = pessoasTableBody.insertRow();
                    row.innerHTML = `
                        <td>${pessoa.DataCadastro || ''}</td>
                        <td>${pessoa.Nome || 'N/A'}</td>
                        <td><span class="badge bg-primary">${pessoa.TiposCadastro ? pessoa.TiposCadastro.replace(/, /g, '</span> <span class="badge bg-secondary">') : 'Sem Tipo'}</span></td>
                        <td>${pessoa.Telefone2 || pessoa.Telefone1 || 'N/A'}</td>
                        <td>${pessoa.Documento || 'N/A'}</td>
                        <td>
                            <a href="${CADASTRO_PESSOA_PAGE_NAME}?id=${pessoa.id || ''}" class="btn btn-sm btn-info" title="Detalhes/Editar">
                                <i class="bi bi-eye-fill"></i>
                            </a>
                            <button class="btn btn-sm btn-danger btn-excluir" data-id="${pessoa.id || ''}" title="Excluir">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    `;
                });
            } else {
                pessoasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum registro encontrado.</td></tr>';
            }
        }
        
        if (result.sucesso && result.pessoas) {
            listaPessoasCompleta = result.pessoas; 
            renderTable(listaPessoasCompleta); 
            
            inputBusca.addEventListener('input', function() {
                const termo = this.value.toLowerCase().trim();
                const pessoasFiltradas = listaPessoasCompleta.filter(p => 
                    (p.Nome && p.Nome.toLowerCase().includes(termo)) ||
                    (p.Documento && p.Documento.includes(termo)) ||
                    (p.Telefone2 && p.Telefone2.includes(termo))
                );
                renderTable(pessoasFiltradas);
            });

            document.getElementById('pessoasTableBody').addEventListener('click', async function(e) {
                const btnExcluir = e.target.closest('.btn-excluir');
                if (btnExcluir) {
                    const pessoaId = btnExcluir.dataset.id;
                    if (confirm(`Tem certeza que deseja excluir o registro ID ${pessoaId}? Esta ação é irreversível.`)) {
                         btnExcluir.disabled = true;
                         btnExcluir.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                         
                         const deleteResult = await sendDataToAPI({
                            action: 'delete_pessoa',
                            token: token,
                            id: pessoaId
                         });

                         if (deleteResult.sucesso) {
                            showMessage(listagemMessage, deleteResult.mensagem || `Pessoa ID ${pessoaId} excluída com sucesso.`, 'success');
                            fetchAndRenderPessoas();
                         } else {
                            showMessage(listagemMessage, deleteResult.mensagem || `Falha ao excluir pessoa ID ${pessoaId}.`, 'danger');
                            btnExcluir.disabled = false;
                            btnExcluir.innerHTML = '<i class="bi bi-trash-fill"></i>';
                         }
                    }
                }
            });


        } else {
            showMessage(listagemMessage, result.mensagem || 'Erro ao carregar a lista de pessoas. Verifique sua conexão ou API.', 'danger');
            pessoasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Falha no carregamento.</td></tr>';
        }
    }
    
    fetchAndRenderPessoas();
}

