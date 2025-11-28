// =================================================================
// HCELL - LÓGICA DE CARREGAMENTO E BUSCA DE PREÇOS (ÁREA RESTRITA)
// =================================================================

// 🔗 Mapeamento das Planilhas de Preços (URLs de Exportação CSV Pública)
const planilhas = {
	// ⚠️ MANTENHA ESTES LINKS ATUALIZADOS COM AS SUAS PLANILHAS REAIS
	lidercell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZn563fJoYnFQa2569Tj4aFmBdxmxmKQF3wUlPKEOeY1tQTOoHj18cMflnPx2ea4Q2cQeW13QShzHh/pub?gid=0&single=true&output=csv",
	goldcell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0GfwlmUazjTIO8LDmn9XMnThhgbKdlqwFgHHvO4oCzUNPlebYbRjZRhv2iCRujK37P4KklsitoS--/pub?gid=0&single=true&output=csv",
	eletrocell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVODR_ZxfbJPiwXyXvTQLFboPiDvwy_32oUnLApVSxqNP_TIO4_tAELsBHELnQL4RXZlBOxkjp8Z-j/pub?gid=0&single=true&output=csv",
	prime: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCX7SYJFFUdD8QI3zPaq4QqSkzapv5y2R7KrXmqkYle-NqL_6n8bh9WatrzvhR_-aNW9jsj-Df2G-/pub?gid=0&single=true&output=csv",
	assistec: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQb2h43D1i-ALxU0KYnanJFwQLtWl1dIh6gxEGH52Z3ZXXpiEiSna_L_61aQvjovetp66C0KuD7ZyB1/pub?gid=0&single=true&output=csv"
};

let produtos = []; // Lista unificada de todos os produtos
const cachePlanilhas = {};

const resultadosDiv = document.getElementById('resultados');
const searchInput = document.getElementById('searchInput');

// =================================================================
// FUNÇÕES DE UTILIDADE
// =================================================================

/**
 * Analisa uma linha CSV, tratando vírgulas dentro de aspas.
 * @param {string} line - A linha completa do CSV.
 * @returns {Array<string>} Um array de campos (colunas).
 */
function parseCSVLine(line) {
	const fields = [];
	let cur = '', inQuotes = false;
	for (let ch of line) {
		if (ch === '"') inQuotes = !inQuotes;
		else if (ch === ',' && !inQuotes) { fields.push(cur); cur = ''; }
		else cur += ch;
	}
	fields.push(cur);
	return fields;
}

/**
 * Converte uma string de preço (ex: R$ 1.000,00) em um número float.
 * @param {string} raw - Valor de preço bruto.
 * @returns {number} O preço como float.
 */
function parsePrice(raw) {
	if (!raw) return NaN;
	let s = raw.replace(/[^\d,.-]/g, '').replace(',', '.');
	return parseFloat(s);
}

/**
 * Formata um número como string monetária BRL (R$).
 * @param {number} n - O valor numérico.
 * @returns {string} O valor formatado.
 */
function formatBRL(n) {
	return isNaN(n) ? '' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// =================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// =================================================================

/**
 * Carrega o catálogo de um único fornecedor e retorna os dados formatados.
 * @param {string} nomeFornecedor - Nome do fornecedor (chave do objeto 'planilhas').
 * @param {string} url - URL de exportação CSV.
 * @returns {Promise<Array<Object>>} Lista de produtos do fornecedor.
 */
async function fetchCatalogo(nomeFornecedor, url) {
    try {
        if (cachePlanilhas[url]) {
            return cachePlanilhas[url];
        }

        const resp = await fetch(url);
        const csv = await resp.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim());
        
        // Mapeamento: Coluna 0 (Modelo), Coluna 1 (Preco), Coluna 2 (Custo) - Assume que a linha 1 é o cabeçalho
        const dados = linhas.slice(1).map(l => {
            const [modelo, preco, custo] = parseCSVLine(l);
            return {
                modelo,
                preco_venda: formatBRL(parsePrice(preco)),
                custo: formatBRL(parsePrice(custo)),
                fornecedor: nomeFornecedor // Identifica de qual fornecedor veio o produto
            };
        }).filter(p => p.modelo && p.modelo.trim() !== ''); // Remove linhas vazias ou sem modelo
        
        cachePlanilhas[url] = dados;
        return dados;

    } catch (error) {
        console.error(`Erro ao carregar planilha de ${nomeFornecedor}:`, error);
        return []; // Retorna lista vazia em caso de erro
    }
}

/**
 * Carrega TODOS os catálogos dos fornecedores em uma única lista.
 */
async function carregarTodosProdutos() {
    resultadosDiv.innerHTML = `
        <p class="sem-resultados">
            <i class="fas fa-spinner fa-spin"></i> Carregando catálogos...
        </p>
    `;
    
    // Cria um array de promessas para carregar todos os catálogos em paralelo
    const promessas = Object.entries(planilhas).map(([nome, url]) => fetchCatalogo(nome, url));
    
    // Espera todas as promessas serem resolvidas
    const resultadosPorFornecedor = await Promise.all(promessas);

    // Unifica todos os produtos em uma única lista 'produtos'
    produtos = resultadosPorFornecedor.flat(); 

    // Limpa a mensagem de carregamento, preparando para a busca
    resultadosDiv.innerHTML = ''; 

    // Opcional: Mostra a contagem total de produtos carregados
    // resultadosDiv.innerHTML = `<p class="sem-resultados">Total de ${produtos.length} produtos carregados de ${Object.keys(planilhas).length} fornecedores.</p>`;
}


// =================================================================
// LÓGICA DE BUSCA E EXIBIÇÃO
// =================================================================

// 🧠 Busca dinâmica: Disparada sempre que o usuário digita
searchInput.addEventListener('input', e => {
	const termo = e.target.value.toLowerCase();
	
	// Filtra a lista unificada de produtos
	const filtrados = produtos.filter(p => 
        p.modelo && p.modelo.toLowerCase().includes(termo)
    ); 

	resultadosDiv.innerHTML = '';

	if (termo.length < 2) { // Não exibe resultados para termos muito curtos (melhora performance)
        resultadosDiv.innerHTML = '<p class="sem-resultados">Continue digitando para buscar.</p>';
        return;
    }
    
	if (filtrados.length === 0) {
		resultadosDiv.innerHTML = '<p class="sem-resultados">Nenhum produto encontrado.</p>';
		return;
	}

	// Renderiza os resultados
	filtrados.forEach(p => {
		const div = document.createElement('div');
		div.classList.add('produto-item');
        
		div.innerHTML = `
			<span>
                <i class="fas fa-rocket" style="color: #4CAF50;"></i> ${p.modelo} 
                <span class="fornecedor-tag" style="font-size: 0.8em; color: #888;">(${p.fornecedor.toUpperCase()})</span>
            </span>
			<strong class="preco-venda">${p.preco_venda}</strong>
			<p class="preco-custo">💰 Custo: ${p.custo}</p>
		`;

		// 👇 Lógica de Mostrar/Esconder o Custo ao clicar
        div.addEventListener('click', () => {
            const jaAtivo = div.classList.contains('mostrar-custo');
            // Remove o custo de todos os outros itens
            document.querySelectorAll('.produto-item.mostrar-custo')
                .forEach(el => el.classList.remove('mostrar-custo'));

            // Mostra o custo no item clicado, se ele não estiver ativo
            if (!jaAtivo) {
                div.classList.add('mostrar-custo');
            }
        });
		
		resultadosDiv.appendChild(div);
	});
});

// 🎙️ Busca por voz (Mantida do seu código original)
const voiceBtn = document.getElementById('voiceBtn');
if ('webkitSpeechRecognition' in window) {
	const rec = new webkitSpeechRecognition();
	rec.lang = 'pt-BR';
	rec.continuous = false;

	voiceBtn.addEventListener('click', () => {
		rec.start();
        // Feedback visual (cor azul forte)
		voiceBtn.style.background = '#0f5ad8'; 
	});

	rec.onresult = event => {
		const texto = event.results[0][0].transcript;
		searchInput.value = texto;
		searchInput.dispatchEvent(new Event('input')); // Dispara a busca
        // Restaura a cor
		voiceBtn.style.background = '#1a73e8'; 
	};

	rec.onerror = () => {
		voiceBtn.style.background = '#e84545'; // Feedback de erro (vermelho)
		setTimeout(() => (voiceBtn.style.background = '#1a73e8'), 1000);
	};
}


// =================================================================
// INICIALIZAÇÃO
// =================================================================

// 🚀 Inicia o carregamento dos catálogos assim que a página termina de carregar
window.addEventListener('load', carregarTodosProdutos);
