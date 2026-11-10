# NotaFácil

Aplicação de tarefas dividida em frontend React e backend Express.

O workspace inclui dashboard de rotina, prazos com data e horário, tarefas
recorrentes, lembretes, busca, filtros, favoritos e quadro Kanban. Tarefas
atrasadas aparecem automaticamente na seção **Atrasadas**.

## Executar o backend

```bash
cd backend
npm install
npm run dev
```

A API estará disponível em `http://localhost:3000/api/tarefas`.

## Executar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.

### Atalhos

- `Ctrl/Cmd + N`: criar tarefa rapidamente.
- `Ctrl/Cmd + K`: focar na busca.

Ao criar uma tarefa, use os campos de data, horário, recorrência e lembrete
para planejar sua rotina.