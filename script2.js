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

// Busca dinâmica
searchInput.addEventListener('input', e => {
	renderizarProdutos(e.target.value);
});
