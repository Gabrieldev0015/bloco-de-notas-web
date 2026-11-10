import { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:3000/api/tarefas';
const STATUS = {
  pendente: { label: 'A fazer', icon: '○' },
  andamento: { label: 'Em andamento', icon: '◐' },
  concluida: { label: 'Concluída', icon: '✓' }
};
const PRIORIDADES = {
  baixa: { label: 'Baixa', className: 'prioridade-baixa' },
  media: { label: 'Média', className: 'prioridade-media' },
  alta: { label: 'Alta', className: 'prioridade-alta' }
};

const emptyDraft = {
  titulo: '',
  descricao: '',
  status: 'pendente',
  prioridade: 'media',
  tags: [],
  prazo: '',
  horario: '',
  recorrencia: 'nenhuma',
  lembrete: 'nenhum',
  favorita: false
};

function prazoDate(tarefa) {
  if (!tarefa.prazo) return null;
  return new Date(`${tarefa.prazo}T${tarefa.horario || '23:59'}`);
}

function prazoExpirado(tarefa) {
  return tarefa.status !== 'concluida' && prazoDate(tarefa) && prazoDate(tarefa) < new Date();
}

function prazoHoje(tarefa) {
  return tarefa.prazo === dataHoje();
}

function formatarPrazo(tarefa) {
  if (!tarefa.prazo) return 'Sem prazo';
  const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${tarefa.prazo}T12:00:00`));
  return `${data}${tarefa.horario ? ` às ${tarefa.horario}` : ''}`;
}

function dataHoje() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - offset).toISOString().slice(0, 10);
}

function dataHojeFormatada() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
}

function Sidebar({ pagina, navegar, tarefas, onNova }) {
  const concluidas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><strong>NotaFácil</strong></div>
      <button className="nova-nota" onClick={onNova}><span>＋</span> Nova tarefa <kbd>⌘ N</kbd></button>
      <div className="sidebar-group">
        <p className="sidebar-label">Workspace</p>
        <button className={pagina === 'inicio' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('inicio')}><span>⌂</span> Visão geral</button>
        <button className={pagina === 'tarefas' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('tarefas')}><span>☷</span> Todas as tarefas <b>{tarefas.length}</b></button>
        <button className={pagina === 'hoje' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('hoje')}><span>◷</span> Para hoje</button>
        <button className={pagina === 'favoritas' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('favoritas')}><span>☆</span> Favoritas</button>
        <button className={pagina === 'atrasadas' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('atrasadas')}><span>!</span> Atrasadas <b>{tarefas.filter(prazoExpirado).length}</b></button>
        <button className={pagina === 'concluidas' ? 'sidebar-link ativo' : 'sidebar-link'} onClick={() => navegar('concluidas')}><span>✓</span> Concluídas <b>{concluidas}</b></button>
      </div>
      <div className="sidebar-group sidebar-bottom">
        <p className="sidebar-label">Atalhos</p>
        <button className="sidebar-link" onClick={() => navegar('tarefas')}><span>⚙</span> Configurações</button>
        <div className="profile"><span className="avatar">G</span><div><strong>Gabriel</strong><small>Meu workspace</small></div><span className="more">•••</span></div>
      </div>
    </aside>
  );
}

function Topbar({ pagina, setBusca, busca, onNova, setView, view }) {
  const titles = { inicio: 'Visão geral', tarefas: 'Todas as tarefas', hoje: 'Para hoje', favoritas: 'Favoritas', atrasadas: 'Atrasadas', concluidas: 'Concluídas' };
  return (
    <div className="topbar">
      <div className="breadcrumb"><span>Meu workspace</span><b>/</b><strong>{titles[pagina] || 'Tarefas'}</strong></div>
      <div className="topbar-actions">
        <label className="search"><span>⌕</span><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar tarefas..." /><kbd>⌘ K</kbd></label>
        <button className="icon-button notification" title="Notificações">♢<i /></button>
        <button className="top-new" onClick={onNova}>＋ Nova tarefa</button>
      </div>
      {pagina !== 'inicio' && <div className="view-switcher"><button className={view === 'lista' ? 'selected' : ''} onClick={() => setView('lista')}>☷ Lista</button><button className={view === 'quadro' ? 'selected' : ''} onClick={() => setView('quadro')}>▦ Quadro</button></div>}
    </div>
  );
}

function Stat({ icon, label, value, hint, color }) {
  return <article className={`stat-card ${color}`}><div className="stat-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div></article>;
}

function Dashboard({ tarefas, navegar, onNova }) {
  const concluidas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
  const andamento = tarefas.filter((tarefa) => tarefa.status === 'andamento').length;
  const hoje = tarefas.filter(prazoHoje).filter((tarefa) => tarefa.status !== 'concluida');
  const atrasadas = tarefas.filter(prazoExpirado);
  const proximas = tarefas.filter((tarefa) => tarefa.status !== 'concluida').sort((a, b) => (prazoDate(a) || Infinity) - (prazoDate(b) || Infinity)).slice(0, 3);
  return (
    <main className="content">
      <section className="welcome"><div><p className="eyebrow">{dataHojeFormatada().toUpperCase()}</p><h1>Bom dia, Gabriel <span>✦</span></h1><p className="welcome-copy">Tenha um ótimo dia. Aqui está um resumo do seu workspace.</p></div><button className="secondary-button" onClick={onNova}>＋ Criar tarefa</button></section>
      <section className="stats"><Stat icon="☷" label="Total de tarefas" value={tarefas.length} hint="no workspace" color="purple" /><Stat icon="◷" label="Para hoje" value={hoje.length} hint="organize seu dia" color="blue" /><Stat icon="!" label="Atrasadas" value={atrasadas.length} hint="precisam de atenção" color="orange" /><Stat icon="✓" label="Concluídas" value={`${tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0}%`} hint={`${concluidas} tarefas concluídas`} color="green" /></section>
      <section className="dashboard-grid">
        <article className="panel progress-panel"><div className="panel-heading"><div><p className="eyebrow">SEU PROGRESSO</p><h2>Foco da semana</h2></div><button className="plain-button">•••</button></div><div className="progress-ring" style={{ '--progress': `${tarefas.length ? (concluidas / tarefas.length) * 360 : 0}deg` }}><div><strong>{tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0}%</strong><small>completo</small></div></div><p className="center-note">{concluidas} de {tarefas.length} tarefas concluídas</p></article>
        <article className="panel upcoming-panel"><div className="panel-heading"><div><p className="eyebrow">PRÓXIMOS PASSOS</p><h2>Suas tarefas</h2></div><button className="link-button" onClick={() => navegar('tarefas')}>Ver todas <span>→</span></button></div>{proximas.map((tarefa) => <TaskRow key={tarefa.id} tarefa={tarefa} compact />)}{!proximas.length && <EmptyState text="Tudo em dia por aqui!" />}</article>
      </section>
      <section className="panel tips-panel"><div className="tip-icon">✦</div><div><strong>Dica para organizar melhor</strong><p>Use tags e prioridades para encontrar suas tarefas rapidamente. Experimente o quadro para visualizar seu fluxo.</p></div><button className="plain-button">Entendi</button></section>
      <section className="routine-panel"><div><p className="eyebrow">ROTINA INTELIGENTE</p><h2>Pequenos passos, todos os dias</h2><p className="welcome-copy">Crie um hábito de planejamento: escolha 3 prioridades para hoje e reserve horários realistas.</p></div><button className="secondary-button" onClick={() => navegar('hoje')}>Planejar meu dia →</button></section>
    </main>
  );
}

function EmptyState({ text = 'Nenhuma tarefa encontrada.' }) {
  return <div className="empty-state"><span>✧</span><strong>{text}</strong><p>Crie uma nova tarefa para começar.</p></div>;
}

function TaskRow({ tarefa, onToggle, compact, onEdit, onDelete, onFavorite }) {
  return <article className={`task-row ${tarefa.status === 'concluida' ? 'is-done' : ''}`}>
    <button className={`check ${tarefa.status}`} onClick={() => onToggle?.(tarefa)} title="Alterar status">{tarefa.status === 'concluida' ? '✓' : ''}</button>
    <div className="task-main"><h3>{tarefa.titulo}</h3>{tarefa.descricao && <p>{tarefa.descricao}</p>}<div className="task-meta"><span className={`status-pill ${tarefa.status}`}>{STATUS[tarefa.status]?.icon} {STATUS[tarefa.status]?.label}</span><span className={`priority ${PRIORIDADES[tarefa.prioridade]?.className}`}>{PRIORIDADES[tarefa.prioridade]?.label}</span>{tarefa.prazo && <span className={`due-date ${prazoExpirado(tarefa) ? 'overdue' : prazoHoje(tarefa) ? 'today' : ''}`}>◷ {formatarPrazo(tarefa)}</span>}{tarefa.recorrencia && tarefa.recorrencia !== 'nenhuma' && <span className="recurrence">↻ {tarefa.recorrencia}</span>}{tarefa.tags?.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div></div>
    {!compact && <div className="task-actions"><button onClick={() => onFavorite?.(tarefa)} className={tarefa.favorita ? 'favorite active' : 'favorite'} title="Favoritar">{tarefa.favorita ? '★' : '☆'}</button><button onClick={() => onEdit?.(tarefa)} title="Editar">✎</button><button onClick={() => onDelete?.(tarefa)} title="Excluir">⌫</button></div>}
  </article>;
}

function TaskBoard({ tarefas, onToggle, onEdit, onDelete, onFavorite }) {
  return <div className="board">{Object.entries(STATUS).map(([status, info]) => <section className="board-column" key={status}><div className="column-heading"><span className={`column-dot ${status}`} /> <strong>{info.label}</strong><b>{tarefas.filter((tarefa) => tarefa.status === status).length}</b><button>＋</button></div><div className="column-tasks">{tarefas.filter((tarefa) => tarefa.status === status).map((tarefa) => <article className="board-card" key={tarefa.id}><div className="board-card-title"><button className={`check ${tarefa.status}`} onClick={() => onToggle(tarefa)}>{tarefa.status === 'concluida' ? '✓' : ''}</button><strong>{tarefa.titulo}</strong><button className="card-menu" onClick={() => onEdit(tarefa)}>•••</button></div>{tarefa.descricao && <p>{tarefa.descricao}</p>}<div className="task-meta">{tarefa.tags?.slice(0, 2).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}{tarefa.prazo && <span className={`due-date ${prazoExpirado(tarefa) ? 'overdue' : ''}`}>◷ {formatarPrazo(tarefa)}</span>}</div><button className={tarefa.favorita ? 'card-star active' : 'card-star'} onClick={() => onFavorite(tarefa)}>★</button></article>)}</div></section>)}</div>;
}

function EditorModal({ tarefa, onClose, onSave }) {
  const [draft, setDraft] = useState(tarefa || emptyDraft);
  const [tagInput, setTagInput] = useState('');
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  function adicionarTag(event) {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      if (!draft.tags.includes(tagInput.trim().toLowerCase())) update('tags', [...draft.tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="editor-modal"><div className="modal-top"><span className="modal-label">{tarefa ? 'EDITAR TAREFA' : 'NOVA TAREFA'}</span><button onClick={onClose}>×</button></div><input className="title-input" autoFocus value={draft.titulo} onChange={(event) => update('titulo', event.target.value)} placeholder="Nome da tarefa" /><textarea value={draft.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Adicione uma descrição..." rows="3" /><div className="editor-fields"><label>Status<select value={draft.status} onChange={(event) => update('status', event.target.value)}>{Object.entries(STATUS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><label>Prioridade<select value={draft.prioridade} onChange={(event) => update('prioridade', event.target.value)}>{Object.entries(PRIORIDADES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><label>Data do prazo<input type="date" value={draft.prazo} onChange={(event) => update('prazo', event.target.value)} /></label><label>Horário<input type="time" value={draft.horario} onChange={(event) => update('horario', event.target.value)} /></label><label>Repetir<select value={draft.recorrencia} onChange={(event) => update('recorrencia', event.target.value)}><option value="nenhuma">Não repetir</option><option value="diaria">Todos os dias</option><option value="semanal">Toda semana</option><option value="mensal">Todo mês</option></select></label><label>Lembrete<select value={draft.lembrete} onChange={(event) => update('lembrete', event.target.value)}><option value="nenhum">Sem lembrete</option><option value="na_hora">Na hora</option><option value="15_min">15 minutos antes</option><option value="1_hora">1 hora antes</option><option value="1_dia">1 dia antes</option></select></label></div><label className="tag-field">Tags <div className="tag-editor">{draft.tags.map((tag) => <span className="tag" key={tag}>#{tag}<button onClick={() => update('tags', draft.tags.filter((item) => item !== tag))}>×</button></span>)}<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={adicionarTag} placeholder="Digite e pressione Enter" /></div></label><label className="favorite-check"><input type="checkbox" checked={draft.favorita} onChange={(event) => update('favorita', event.target.checked)} /> Marcar como favorita</label><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!draft.titulo.trim()} onClick={() => onSave(draft)}>Salvar tarefa</button></div></section></div>;
}

function TaskWorkspace({ pagina, tarefas, onNova, onEdit, onToggle, onDelete, onFavorite, busca, setBusca, view, setView }) {
  const [filtro, setFiltro] = useState('todas');
  const filtered = useMemo(() => tarefas.filter((tarefa) => {
    const matchesSearch = `${tarefa.titulo} ${tarefa.descricao} ${tarefa.tags?.join(' ')}`.toLowerCase().includes(busca.toLowerCase());
    const matchesPage = pagina === 'hoje' ? prazoHoje(tarefa) : pagina === 'favoritas' ? tarefa.favorita : pagina === 'atrasadas' ? prazoExpirado(tarefa) : pagina === 'concluidas' ? tarefa.status === 'concluida' : true;
    const matchesFilter = filtro === 'todas' || tarefa.status === filtro || tarefa.prioridade === filtro;
    return matchesSearch && matchesPage && matchesFilter;
  }), [tarefas, busca, pagina, filtro]);
  return <main className="content workspace-content"><section className="workspace-heading"><div><p className="eyebrow">WORKSPACE</p><h1>{pagina === 'hoje' ? 'Tarefas para hoje' : pagina === 'favoritas' ? 'Tarefas favoritas' : pagina === 'atrasadas' ? 'Tarefas atrasadas' : pagina === 'concluidas' ? 'Tarefas concluídas' : 'Todas as tarefas'}</h1><p className="welcome-copy">{filtered.length} {filtered.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'} no seu workspace</p></div><button className="primary-button" onClick={onNova}>＋ Nova tarefa</button></section><div className="toolbar"><div className="filter-tabs"><button className={filtro === 'todas' ? 'active' : ''} onClick={() => setFiltro('todas')}>Todas</button><button className={filtro === 'pendente' ? 'active' : ''} onClick={() => setFiltro('pendente')}>A fazer</button><button className={filtro === 'andamento' ? 'active' : ''} onClick={() => setFiltro('andamento')}>Em andamento</button><button className={filtro === 'alta' ? 'active' : ''} onClick={() => setFiltro('alta')}>Alta prioridade</button></div><button className="sort-button">↕ Mais recentes</button></div>{view === 'quadro' ? <TaskBoard tarefas={filtered} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onFavorite={onFavorite} /> : <section className="task-list">{filtered.map((tarefa) => <TaskRow key={tarefa.id} tarefa={tarefa} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onFavorite={onFavorite} />)}{!filtered.length && <EmptyState text={busca ? 'Nenhum resultado para sua busca.' : 'Nenhuma tarefa nesta visão.'} />}</section>}</main>;
}

export default function App() {
  const [pagina, setPagina] = useState('inicio');
  const [tarefas, setTarefas] = useState([]);
  const [busca, setBusca] = useState('');
  const [view, setView] = useState('lista');
  const [editor, setEditor] = useState(null);
  const [erro, setErro] = useState('');

  async function carregarTarefas() {
    try { const resposta = await fetch(API_URL); if (!resposta.ok) throw new Error('Falha ao carregar'); setTarefas(await resposta.json()); setErro(''); } catch (error) { console.error(error); setErro('Não foi possível conectar ao backend.'); }
  }
  useEffect(() => { carregarTarefas(); const shortcut = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector('.search input')?.focus(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); setEditor(emptyDraft); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, []);
  async function salvarTarefa(draft) {
    try { const editando = Boolean(draft.id); const resposta = await fetch(editando ? `${API_URL}/${draft.id}` : API_URL, { method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); if (!resposta.ok) throw new Error('Falha ao salvar'); const salva = await resposta.json(); setTarefas((current) => editando ? current.map((tarefa) => tarefa.id === salva.id ? salva : tarefa) : [...current, salva]); setEditor(null); setErro(''); } catch (error) { console.error(error); setErro('Não foi possível salvar a tarefa.'); }
  }
  async function atualizarTarefa(tarefa, changes) {
    try { const resposta = await fetch(`${API_URL}/${tarefa.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tarefa, ...changes }) }); if (!resposta.ok) throw new Error('Falha ao atualizar'); const atualizada = await resposta.json(); setTarefas((current) => current.map((item) => item.id === atualizada.id ? atualizada : item)); } catch (error) { console.error(error); setErro('Não foi possível atualizar a tarefa.'); }
  }
  async function excluirTarefa(tarefa) { if (!window.confirm(`Excluir "${tarefa.titulo}"?`)) return; try { const resposta = await fetch(`${API_URL}/${tarefa.id}`, { method: 'DELETE' }); if (!resposta.ok) throw new Error('Falha ao excluir'); setTarefas((current) => current.filter((item) => item.id !== tarefa.id)); } catch (error) { console.error(error); setErro('Não foi possível excluir a tarefa.'); } }
  const conteudo = pagina === 'inicio' ? <Dashboard tarefas={tarefas} navegar={setPagina} onNova={() => setEditor(emptyDraft)} /> : <TaskWorkspace pagina={pagina} tarefas={tarefas} onNova={() => setEditor(emptyDraft)} onEdit={setEditor} onToggle={(tarefa) => atualizarTarefa(tarefa, { status: tarefa.status === 'concluida' ? 'pendente' : tarefa.status === 'pendente' ? 'andamento' : 'concluida' })} onDelete={excluirTarefa} onFavorite={(tarefa) => atualizarTarefa(tarefa, { favorita: !tarefa.favorita })} busca={busca} setBusca={setBusca} view={view} setView={setView} />;
  return <div className="app-shell"><Sidebar pagina={pagina} navegar={setPagina} tarefas={tarefas} onNova={() => setEditor(emptyDraft)} /><div className="app-main"><Topbar pagina={pagina} setBusca={setBusca} busca={busca} onNova={() => setEditor(emptyDraft)} setView={setView} view={view} />{erro && <div className="error-banner">{erro}<button onClick={() => setErro('')}>×</button></div>}{conteudo}</div>{editor && <EditorModal tarefa={editor.id ? editor : null} onClose={() => setEditor(null)} onSave={salvarTarefa} />}</div>;
}
