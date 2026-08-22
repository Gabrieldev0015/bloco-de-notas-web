document.addEventListener('DOMContentLoaded', () => { // espera o DOM carregar antes de executar o script
	const lista = document.getElementById('lista-tarefas');
	if (!lista) return; // se o container não existir, sai silenciosamente

	fetch('js/dados.json') // busca o arquivo JSON com as tarefas
		.then(response => { // trata a resposta da requisição
			if (!response.ok) throw new Error('Falha ao carregar dados.json'); // lança erro para ser capturado no catch
			return response.json(); // converte o corpo da resposta para objeto JS
		})
		.then(data => renderTarefas(data.tarefas || [])) // passa o array de tarefas para renderTarefas
		.catch(err => { // captura erros de rede ou parsing
			console.error(err); // log para depuração
			lista.innerHTML = '<p>Não foi possível carregar as tarefas.</p>'; // mensagem amigável na UI
		});

	function renderTarefas(tarefas) { // função que cria os elementos DOM a partir do array de tarefas
		lista.innerHTML = ''; // limpa conteúdo anterior
		if (tarefas.length === 0) {
			lista.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
			return; // sai se não houver tarefas
		}

		tarefas.forEach(t => { // itera sobre cada objeto tarefa (t)
			const article = document.createElement('article'); // cria o elemento do card
			article.className = 'card'; // aplica a classe CSS do card

			const h3 = document.createElement('h3'); // cria elemento de título
			h3.textContent = t.titulo || 'Sem título'; // define texto do título com fallback

			const p = document.createElement('p'); // cria elemento de descrição
			p.textContent = t.descricao || ''; // define texto da descrição com fallback

			article.appendChild(h3); // adiciona título ao card
			article.appendChild(p); // adiciona descrição ao card

			lista.appendChild(article); // insere o card no container de lista
		});
	}
});
