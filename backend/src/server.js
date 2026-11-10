import cors from 'cors';
import express from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'tarefas.json');

app.use(cors());
app.use(express.json());

function normalizarTarefa(tarefa) {
  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao || '',
    status: tarefa.status || 'pendente',
    prioridade: tarefa.prioridade || 'media',
    tags: Array.isArray(tarefa.tags) ? tarefa.tags : [],
    prazo: tarefa.prazo || '',
    horario: tarefa.horario || '',
    recorrencia: tarefa.recorrencia || 'nenhuma',
    lembrete: tarefa.lembrete || 'nenhum',
    favorita: Boolean(tarefa.favorita),
    atualizadaEm: tarefa.atualizadaEm || new Date().toISOString()
  };
}

async function lerTarefas() {
  const conteudo = await readFile(dataPath, 'utf8');
  return JSON.parse(conteudo).map(normalizarTarefa);
}

async function salvarTarefas(tarefas) {
  await writeFile(dataPath, `${JSON.stringify(tarefas, null, 2)}\n`, 'utf8');
}

app.get('/api/tarefas', async (_req, res) => {
  try {
    res.json(await lerTarefas());
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Não foi possível carregar as tarefas.' });
  }
});

app.post('/api/tarefas', async (req, res) => {
  const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
  const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';

  if (!titulo) {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }

  try {
    const tarefas = await lerTarefas();
    const tarefa = {
      id: tarefas.length ? Math.max(...tarefas.map(({ id }) => id)) + 1 : 1,
      titulo,
      descricao,
      status: ['pendente', 'andamento', 'concluida'].includes(req.body.status) ? req.body.status : 'pendente',
      prioridade: ['baixa', 'media', 'alta'].includes(req.body.prioridade) ? req.body.prioridade : 'media',
      tags: Array.isArray(req.body.tags) ? req.body.tags.filter((tag) => typeof tag === 'string').slice(0, 5) : [],
      prazo: typeof req.body.prazo === 'string' ? req.body.prazo : '',
      horario: typeof req.body.horario === 'string' ? req.body.horario : '',
      recorrencia: ['nenhuma', 'diaria', 'semanal', 'mensal'].includes(req.body.recorrencia) ? req.body.recorrencia : 'nenhuma',
      lembrete: ['nenhum', 'na_hora', '15_min', '1_hora', '1_dia'].includes(req.body.lembrete) ? req.body.lembrete : 'nenhum',
      favorita: Boolean(req.body.favorita),
      atualizadaEm: new Date().toISOString()
    };

    tarefas.push(tarefa);
    await salvarTarefas(tarefas);
    return res.status(201).json(normalizarTarefa(tarefa));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível adicionar a tarefa.' });
  }
});

app.put('/api/tarefas/:id', async (req, res) => {
  const id = Number(req.params.id);
  const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';

  if (!titulo) {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }

  try {
    const tarefas = await lerTarefas();
    const indice = tarefas.findIndex((tarefa) => tarefa.id === id);

    if (indice === -1) {
      return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    const atualizada = normalizarTarefa({
      ...tarefas[indice],
      ...req.body,
      id,
      titulo,
      descricao: typeof req.body.descricao === 'string' ? req.body.descricao.trim() : tarefas[indice].descricao,
      status: ['pendente', 'andamento', 'concluida'].includes(req.body.status) ? req.body.status : tarefas[indice].status,
      prioridade: ['baixa', 'media', 'alta'].includes(req.body.prioridade) ? req.body.prioridade : tarefas[indice].prioridade,
      tags: Array.isArray(req.body.tags) ? req.body.tags.filter((tag) => typeof tag === 'string').slice(0, 5) : tarefas[indice].tags,
      prazo: typeof req.body.prazo === 'string' ? req.body.prazo : tarefas[indice].prazo,
      horario: typeof req.body.horario === 'string' ? req.body.horario : tarefas[indice].horario,
      recorrencia: ['nenhuma', 'diaria', 'semanal', 'mensal'].includes(req.body.recorrencia) ? req.body.recorrencia : tarefas[indice].recorrencia,
      lembrete: ['nenhum', 'na_hora', '15_min', '1_hora', '1_dia'].includes(req.body.lembrete) ? req.body.lembrete : tarefas[indice].lembrete,
      favorita: typeof req.body.favorita === 'boolean' ? req.body.favorita : tarefas[indice].favorita,
      atualizadaEm: new Date().toISOString()
    });

    tarefas[indice] = atualizada;
    await salvarTarefas(tarefas);
    return res.json(atualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível atualizar a tarefa.' });
  }
});

app.delete('/api/tarefas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const tarefas = await lerTarefas();
    const restantes = tarefas.filter((tarefa) => tarefa.id !== id);

    if (restantes.length === tarefas.length) {
      return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    await salvarTarefas(restantes);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível excluir a tarefa.' });
  }
});

app.listen(port, () => {
  console.log(`Backend executando em http://localhost:${port}`);
});
