import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronIcon, FlagIcon, SearchIcon } from '../components/icons';
import ProgressRing from '../components/todo/ProgressRing';
import QuickAdd from '../components/todo/QuickAdd';
import TaskPanel from '../components/todo/TaskPanel';
import TodoItem from '../components/todo/TodoItem';
import { toISODate } from '../lib/dates';
import { useTodos } from '../todo/TodoContext';
import {
  DEFAULT_FILTERS,
  DUE_FILTERS,
  PRIORITIES,
  SORT_OPTIONS,
  groupByCompletion,
  groupByDue,
  hasActiveFilters,
  isOverdue,
  matchesFilters,
  sortCompleted,
  sortTodos,
  tagsByFrequency,
  type DueFilter,
  type Filters,
  type SortMode,
  type StatusFilter,
  type TodoGroup,
} from '../todo/logic';
import type { Todo } from '../todo/types';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

/** How long a ticked task stays in place (showing its completed style) before moving. */
const COMPLETE_DELAY = 450;

interface UndoState {
  id: number;
  message: string;
  items: Todo[];
}

export default function TodoPage() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos } = useTodos();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localFilters, setLocalFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Set<string>>(() => new Set());
  const [showCompleted, setShowCompleted] = useState(true);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Map<string, number>());
  const today = toISODate();

  // The due filter lives in the URL so the sidebar can link to Today / Upcoming / Overdue.
  const dueParam = searchParams.get('due');
  const due: DueFilter = DUE_FILTERS.some((d) => d.id === dueParam) ? (dueParam as DueFilter) : 'any';
  const filters: Filters = useMemo(() => ({ ...localFilters, due }), [localFilters, due]);

  const setDue = (d: DueFilter) =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (d === 'any') p.delete('due');
        else p.set('due', d);
        return p;
      },
      { replace: true },
    );

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    if (key === 'due') setDue(value as DueFilter);
    else setLocalFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setLocalFilters((f) => ({ ...DEFAULT_FILTERS, status: f.status, sort: f.sort }));
    setDue('any');
  };

  // "New → Task" from the sidebar lands here with ?new=1.
  useEffect(() => {
    if (!searchParams.has('new')) return;
    quickAddRef.current?.focus();
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('new');
        return p;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  // Keyboard: N = new task, / = search, Esc = close details.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n') {
        e.preventDefault();
        quickAddRef.current?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(t);
  }, [undo]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  const stopCompleting = (id: string) =>
    setCompleting((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });

  const handleToggle = (todo: Todo) => {
    if (todo.completed) {
      toggleTodo(todo.id);
      return;
    }
    const pending = timers.current.get(todo.id);
    if (pending !== undefined) {
      clearTimeout(pending);
      timers.current.delete(todo.id);
      stopCompleting(todo.id);
      return;
    }
    setCompleting((s) => new Set(s).add(todo.id));
    const t = window.setTimeout(() => {
      timers.current.delete(todo.id);
      toggleTodo(todo.id);
      stopCompleting(todo.id);
    }, COMPLETE_DELAY);
    timers.current.set(todo.id, t);
  };

  const handleDelete = (todo: Todo) => {
    deleteTodo(todo.id);
    if (selectedId === todo.id) setSelectedId(null);
    setUndo({ id: Date.now(), message: 'Task deleted', items: [todo] });
  };

  const handleClearCompleted = () => {
    const removed = todos.filter((t) => t.completed);
    if (removed.length === 0) return;
    clearCompleted();
    if (removed.some((t) => t.id === selectedId)) setSelectedId(null);
    setUndo({
      id: Date.now(),
      message: `Cleared ${removed.length} completed ${removed.length === 1 ? 'task' : 'tasks'}`,
      items: removed,
    });
  };

  const stats = useMemo(() => {
    const open = todos.filter((t) => !t.completed);
    return {
      total: todos.length,
      done: todos.length - open.length,
      active: open.length,
      overdue: open.filter((t) => isOverdue(t, today)).length,
      dueToday: open.filter((t) => t.due === today).length,
      high: open.filter((t) => t.priority === 'high').length,
    };
  }, [todos, today]);

  const tagSuggestions = useMemo(() => tagsByFrequency(todos), [todos]);

  const { activeVisible, completedVisible } = useMemo(() => {
    const visible = todos.filter((t) => matchesFilters(t, filters, today));
    return {
      activeVisible: sortTodos(
        visible.filter((t) => !t.completed),
        filters.sort,
      ),
      completedVisible: sortCompleted(visible.filter((t) => t.completed)),
    };
  }, [todos, filters, today]);

  const activeGroups: TodoGroup[] =
    filters.sort === 'smart'
      ? groupByDue(activeVisible, today)
      : activeVisible.length
        ? [{ key: 'all', label: `Sorted by ${SORT_OPTIONS.find((s) => s.id === filters.sort)!.label}`, todos: activeVisible }]
        : [];

  const tabCounts: Record<StatusFilter, number> = {
    all: activeVisible.length + completedVisible.length,
    active: activeVisible.length,
    completed: completedVisible.length,
  };

  const filtering = hasActiveFilters(filters);
  const selected = todos.find((t) => t.id === selectedId);

  const renderItem = (t: Todo) => (
    <TodoItem
      key={t.id}
      todo={t}
      completing={completing.has(t.id)}
      selected={selectedId === t.id}
      onToggle={() => handleToggle(t)}
      onDelete={() => handleDelete(t)}
      onSelect={() => setSelectedId(selectedId === t.id ? null : t.id)}
    />
  );

  const renderGroups = (groups: TodoGroup[], completedList = false) =>
    groups.map((g) => (
      <div className="todo-group" key={g.key}>
        <h2 className={`group-label${g.tone ? ` ${g.tone}` : ''}`}>
          {g.label}
          <span className="group-count">{g.todos.length}</span>
        </h2>
        <ul className={`todo-list${completedList ? ' is-completed' : ''}`}>{g.todos.map(renderItem)}</ul>
      </div>
    ));

  const noMatches = (
    <div className="todo-empty">
      <p className="todo-empty-title">No tasks match these filters</p>
      <button type="button" className="btn btn-sm btn-secondary" onClick={clearFilters}>
        Clear filters
      </button>
    </div>
  );

  const summaryParts = [
    stats.dueToday > 0 && `${stats.dueToday} due today`,
    stats.overdue > 0 && `${stats.overdue} overdue`,
  ].filter(Boolean);

  const dueTitle = DUE_FILTERS.find((d) => d.id === due && d.id !== 'any')?.label;

  return (
    <div className={`tasks${selected ? ' has-panel' : ''}`}>
      <div className="tasks-main">
        <div className="page-container">
          <header className="page-header">
            <div>
              <h1 className="page-title">{dueTitle ? `Todo · ${dueTitle}` : 'Todo'}</h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </header>

          {stats.total > 0 && (
            <div className="todo-summary">
              <ProgressRing value={stats.done / stats.total} size={56} stroke={5} />
              <div className="summary-text">
                <strong>
                  {stats.done} of {stats.total} done
                </strong>
                <span>
                  {stats.active === 0
                    ? 'Everything is done. Nice work!'
                    : summaryParts.length
                      ? summaryParts.join(' · ')
                      : `${stats.active} ${stats.active === 1 ? 'task' : 'tasks'} remaining`}
                </span>
              </div>
              <div className="summary-stats">
                <button
                  type="button"
                  className={`summary-stat tone-danger${filters.due === 'overdue' ? ' active' : ''}`}
                  onClick={() => setFilter('due', filters.due === 'overdue' ? 'any' : 'overdue')}
                  disabled={stats.overdue === 0 && filters.due !== 'overdue'}
                  aria-pressed={filters.due === 'overdue'}
                >
                  <span className="summary-stat-value">{stats.overdue}</span>
                  <span className="summary-stat-label">Overdue</span>
                </button>
                <button
                  type="button"
                  className={`summary-stat tone-accent${filters.due === 'today' ? ' active' : ''}`}
                  onClick={() => setFilter('due', filters.due === 'today' ? 'any' : 'today')}
                  disabled={stats.dueToday === 0 && filters.due !== 'today'}
                  aria-pressed={filters.due === 'today'}
                >
                  <span className="summary-stat-value">{stats.dueToday}</span>
                  <span className="summary-stat-label">Due today</span>
                </button>
                <button
                  type="button"
                  className={`summary-stat tone-high${filters.priority === 'high' ? ' active' : ''}`}
                  onClick={() => setFilter('priority', filters.priority === 'high' ? 'any' : 'high')}
                  disabled={stats.high === 0 && filters.priority !== 'high'}
                  aria-pressed={filters.priority === 'high'}
                >
                  <span className="summary-stat-value">{stats.high}</span>
                  <span className="summary-stat-label">High priority</span>
                </button>
              </div>
            </div>
          )}

          <QuickAdd onAdd={addTodo} inputRef={quickAddRef} />

          {stats.total === 0 ? (
            <div className="todo-empty is-large">
              <div className="empty-icon" aria-hidden="true">✓</div>
              <p className="todo-empty-title">Your list is clear</p>
              <p className="muted">
                Add your first task above. Give it a due date or priority, and type <strong>#tags</strong> to group
                related tasks.
              </p>
            </div>
          ) : (
            <>
              <div className="todo-filters">
                <div className="filters-top">
                  <div className="segmented" role="tablist" aria-label="Status">
                    {STATUS_TABS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={filters.status === s.id}
                        className={`segment${filters.status === s.id ? ' active' : ''}`}
                        onClick={() => setFilter('status', s.id)}
                      >
                        {s.label}
                        <span className="segment-count">{tabCounts[s.id]}</span>
                      </button>
                    ))}
                  </div>
                  <label className="sort-select">
                    <span>Sort</span>
                    <span className="select-wrap">
                      <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value as SortMode)}>
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                </div>

                <div className="search">
                  <SearchIcon className="search-icon" />
                  <input
                    ref={searchRef}
                    type="search"
                    className="input input-sm"
                    placeholder="Search tasks, notes, tags"
                    value={filters.query}
                    onChange={(e) => setFilter('query', e.target.value)}
                    aria-label="Search tasks"
                  />
                </div>

                <div className="filter-row" role="group" aria-label="Filters">
                  {DUE_FILTERS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`chip chip-sm${filters.due === d.id ? ' active' : ''}`}
                      aria-pressed={filters.due === d.id}
                      onClick={() => setFilter('due', d.id === filters.due ? 'any' : d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                  <span className="chip-divider" aria-hidden="true" />
                  {PRIORITIES.filter((p) => p.id !== 'none').map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`chip chip-sm priority-${p.id}${filters.priority === p.id ? ' active' : ''}`}
                      aria-pressed={filters.priority === p.id}
                      onClick={() => setFilter('priority', filters.priority === p.id ? 'any' : p.id)}
                    >
                      <FlagIcon width={12} height={12} className="chip-flag" />
                      {p.label}
                    </button>
                  ))}
                  {tagSuggestions.length > 0 && <span className="chip-divider" aria-hidden="true" />}
                  {tagSuggestions.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`chip chip-sm${filters.tag === tag ? ' active' : ''}`}
                      aria-pressed={filters.tag === tag}
                      onClick={() => setFilter('tag', filters.tag === tag ? null : tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                  {filtering && (
                    <button type="button" className="btn btn-ghost btn-xs clear-filters" onClick={clearFilters}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {filters.status !== 'completed' &&
                (activeGroups.length > 0 ? (
                  renderGroups(activeGroups)
                ) : filtering ? (
                  noMatches
                ) : (
                  <div className="todo-empty">
                    <span className="all-done-icon" aria-hidden="true">🎉</span>
                    <p className="todo-empty-title">All caught up!</p>
                    <p className="muted">Nothing left to do. Enjoy it, or add something new above.</p>
                  </div>
                ))}

              {filters.status === 'all' && completedVisible.length > 0 && (
                <div className="completed-section">
                  <div className="completed-header">
                    <button
                      type="button"
                      className="completed-toggle"
                      onClick={() => setShowCompleted((v) => !v)}
                      aria-expanded={showCompleted}
                    >
                      <ChevronIcon width={14} height={14} className={showCompleted ? 'open' : ''} />
                      Completed
                      <span className="group-count">{completedVisible.length}</span>
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs danger-hover" onClick={handleClearCompleted}>
                      Clear completed
                    </button>
                  </div>
                  {showCompleted && <ul className="todo-list is-completed">{completedVisible.map(renderItem)}</ul>}
                </div>
              )}

              {filters.status === 'completed' &&
                (completedVisible.length > 0 ? (
                  <>
                    <div className="completed-actions">
                      <button type="button" className="btn btn-ghost btn-xs danger-hover" onClick={handleClearCompleted}>
                        Clear completed
                      </button>
                    </div>
                    {renderGroups(groupByCompletion(completedVisible, today), true)}
                  </>
                ) : filtering ? (
                  noMatches
                ) : (
                  <div className="todo-empty">
                    <p className="muted">No completed tasks yet. Tick one off and it will show up here.</p>
                  </div>
                ))}

              <p className="shortcut-hint desktop-only">
                <kbd>N</kbd> new task · <kbd>/</kbd> search · <kbd>Esc</kbd> close details
              </p>
            </>
          )}
        </div>
      </div>

      {selected && (
        <>
          <div className="panel-scrim" onClick={() => setSelectedId(null)} aria-hidden="true" />
          <TaskPanel
            key={selected.id}
            todo={selected}
            tagSuggestions={tagSuggestions}
            onUpdate={(patch) => updateTodo(selected.id, patch)}
            onToggle={() => handleToggle(selected)}
            onDelete={() => handleDelete(selected)}
            onClose={() => setSelectedId(null)}
          />
        </>
      )}

      {undo && (
        <div className="snackbar" role="status" key={undo.id}>
          <span>{undo.message}</span>
          <button
            type="button"
            className="snackbar-action"
            onClick={() => {
              restoreTodos(undo.items);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
