// 🌗 Ativa modo escuro automático
(function aplicarModoEscuro() {
	const hora = new Date().getHours();
	if (hora >= 18 || hora < 6) document.body.classList.add('dark-mode');
})();

// 🔗 Planilhas
const planilhas = {
	lidercell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZn563fJoYnFQa2569Tj4aFmBdxmxmKQF3wUlPKEOeY1tQTOoHj18cMflnPx2ea4Q2cQeW13QShzHh/pub?gid=0&single=true&output=csv",
	goldcell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0GfwlmUazjTIO8LDmn9XMnThhgbKdlqwFgHHvO4oCzUNPlebYbRjZRhv2iCRujK37P4KklsitoS--/pub?gid=0&single=true&output=csv",
	eletrocell: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVODR_ZxfbJPiwXyXvTQLFboPiDvwy_32oUnLApVSxqNP_TIO4_tAELsBHELnQL4RXZlBOxkjp8Z-j/pub?gid=0&single=true&output=csv",
	novapecas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRCX7SYJFFUdD8QI3zPaq4QqSkzapv5y2R7KrXmqkYle-NqL_6n8bh9WatrzvhR_-aNW9jsj-Df2G-/pub?gid=0&single=true&output=csv"
};

let produtos = [];
const cachePlanilhas = {};

const resultadosDiv = document.getElementById('resultados');
const fornecedorAtual = document.getElementById('fornecedorAtual');
const searchInput = document.getElementById('searchInput');

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
	return isNaN(n) ? '' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Carrega produtos da planilha
async function carregarProdutos(url) {
	try {
		if (cachePlanilhas[url]) {
			produtos = cachePlanilhas[url];
			renderizarProdutos();
			return;
		}
		const resp = await fetch(url);
		const csv = await resp.text();
		const linhas = csv.split(/\r?\n/).filter(l => l.trim());
		const dados = linhas.slice(1).map(l => {
			const [modelo, preco, custo] = parseCSVLine(l); // pega coluna C
			return { 
				modelo, 
				preco_venda: formatBRL(parsePrice(preco)),
				preco_custo: formatBRL(parsePrice(custo))
			};
		});
		cachePlanilhas[url] = dados;
		produtos = dados;
		renderizarProdutos();
	} catch {
		resultadosDiv.innerHTML = '<p class="sem-resultados">Erro ao carregar planilha.</p>';
	}
}

// Renderiza produtos na tela
function renderizarProdutos(termoBusca = '') {
	const filtrados = produtos.filter(p => p.modelo.toLowerCase().includes(termoBusca.toLowerCase()));
	resultadosDiv.innerHTML = filtrados.length ? 
		filtrados.map(p => `
			<div class="produto-item">
				<span>📌 ${p.modelo} – ${p.preco_venda}</span>
				<p class="preco-custo">💰 Custo: ${p.preco_custo}</p>
			</div>
		`).join('') :
		'<p class="sem-resultados">Nenhum produto encontrado.</p>';
}

// Seleciona fornecedor
function selecionarFornecedor(nome, botao) {
	document.querySelectorAll('.btn-fornecedor').forEach(b => b.classList.remove('btn-ativo'));
	botao.classList.add('btn-ativo');
	fornecedorAtual.textContent = "Consulta atual: " + botao.innerText;
	carregarProdutos(planilhas[nome]);
	searchInput.value = '';
}

// Busca dinâmica
searchInput.addEventListener('input', e => {
	renderizarProdutos(e.target.value);
});

// Busca por voz
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
