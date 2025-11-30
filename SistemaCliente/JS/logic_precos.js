// =================================================================
// HCELL - LÓGICA DE CARREGAMENTO E BUSCA DE PREÇOS (SISTEMA CLIENTE)
// =================================================================

// 🔗 Mapeamento da Planilha de Preços ÚNICA (Planilha Cliente)
const planilhas = {
	// ⚠️ SUBSTITUA ESTE URL PELO LINK DA SUA PLANILHA CLIENTE EXPORTADA EM CSV PÚBLICO!
	// O nome 'cliente' será exibido como fornecedor na busca.
	cliente: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbXYx0-LHvNIOmnRo4cXRzFtZgXQG50K9dU1fr7K3A-0SMwSo2xg1uPdiWn2areIf9kJRJoIMYfMuE/pub?gid=0&single=true&output=csv"
};

let produtos = []; // Lista unificada de todos os produtos
const cachePlanilhas = {};

const resultadosDiv = document.getElementById('resultados');
const searchInput = document.getElementById('searchInput');

// =================================================================
// FUNÇÕES DE UTILIDADE
// =================================================================
// Mantidas as mesmas funções de utilidade (parseCSVLine, parsePrice, formatBRL)

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

function parsePrice(raw) {
	if (!raw) return NaN;
	let s = raw.replace(/[^\d,.-]/g, '').replace(',', '.');
	return parseFloat(s);
}

function formatBRL(n) {
	return isNaN(n) ? 'N/A' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// =================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// =================================================================

async function fetchCatalogo(nomeFornecedor, url) {
    try {
        if (cachePlanilhas[url]) {
            return cachePlanilhas[url];
        }

        const resp = await fetch(url);
        const csv = await resp.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim());
        
        // Assumimos Coluna A (Modelo) e Coluna B (Preco)
        const dados = linhas.slice(1).map(l => {
            // A função parseCSVLine retorna um array de campos
            const [modelo, preco] = parseCSVLine(l); 
            return {
                modelo,
                preco_venda: formatBRL(parsePrice(preco)),
                // O custo será vazio, pois não é necessário para o Cliente.
                custo: '', 
                fornecedor: nomeFornecedor 
            };
        }).filter(p => p.modelo && p.modelo.trim() !== '');

        cachePlanilhas[url] = dados;
        return dados;

    } catch (error) {
        console.error(`Erro ao carregar planilha de ${nomeFornecedor}:`, error);
        return []; 
    }
}

async function carregarTodosProdutos() {
    resultadosDiv.innerHTML = `
        <p class="sem-resultados">
            <i class="fas fa-spinner fa-spin"></i> Carregando lista de preços...
        </p>
    `;
    
    // Mapeia e executa a busca de todas as planilhas definidas (agora, só uma)
    const promessas = Object.entries(planilhas).map(([nome, url]) => fetchCatalogo(nome, url));
    
    const resultadosPorFornecedor = await Promise.all(promessas);

    produtos = resultadosPorFornecedor.flat(); 

    // Limpa a mensagem de carregamento se houver produtos
    if (produtos.length > 0) {
        resultadosDiv.innerHTML = '<p class="sem-resultados">Pronto para buscar. Digite o nome do produto.</p>';
    } else {
        resultadosDiv.innerHTML = '<p class="sem-resultados text-danger">Falha ao carregar lista. Verifique o link CSV.</p>';
    }
}


// =================================================================
// LÓGICA DE BUSCA E EXIBIÇÃO
// =================================================================

searchInput.addEventListener('input', e => {
	const termo = e.target.value.toLowerCase();
	
	const filtrados = produtos.filter(p => 
        p.modelo && p.modelo.toLowerCase().includes(termo)
    ); 

	resultadosDiv.innerHTML = '';

	if (termo.length < 2) { 
        // Não exibe nada se o termo for muito curto
        return; 
    }
    
	if (filtrados.length === 0) {
		resultadosDiv.innerHTML = '<p class="sem-resultados">Nenhum produto encontrado.</p>';
		return;
	}

	filtrados.forEach(p => {
		const div = document.createElement('div');
		div.classList.add('produto-item');
        
        // Exibe apenas o produto e o preço (sem o custo)
		div.innerHTML = `
			<span>
                ${p.modelo} 
            </span>
			<strong class="preco-venda">${p.preco_venda}</strong>
		`;
        
        // Remove a lógica de mostrar/esconder o custo, pois ele não será exibido.
        
		resultadosDiv.appendChild(div);
	});
});

// Busca por voz (Mantida)
const voiceBtn = document.getElementById('voiceBtn');
if ('webkitSpeechRecognition' in window) {
	const rec = new webkitSpeechRecognition();
	rec.lang = 'pt-BR';
	rec.continuous = false;

	voiceBtn.addEventListener('click', () => {
		rec.start();
		voiceBtn.style.background = '#0f5ad8'; 
	});

	rec.onresult = event => {
		const texto = event.results[0][0].transcript;
		searchInput.value = texto;
		searchInput.dispatchEvent(new Event('input'));
		voiceBtn.style.background = '#1a73e8'; 
	};

	rec.onerror = () => {
		voiceBtn.style.background = '#e84545';
		setTimeout(() => (voiceBtn.style.background = '#1a73e8'), 1000);
	};
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================

window.addEventListener('load', carregarTodosProdutos);
