import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartIcon, ChevronIcon, SearchIcon } from '../components/icons';
import ItemPanel from '../components/shopping/ItemPanel';
import ShoppingItemRow from '../components/shopping/ShoppingItemRow';
import ShoppingQuickAdd from '../components/shopping/ShoppingQuickAdd';
import SuggestionsCard from '../components/shopping/SuggestionsCard';
import ProgressRing from '../components/todo/ProgressRing';
import { readJSON, writeJSON } from '../lib/storage';
import { useShopping } from '../shopping/ShoppingContext';
import { CATEGORIES, categoryMeta, categoryRank, type Suggestion } from '../shopping/catalog';
import type { CategoryId, ItemInput, ShoppingItem } from '../shopping/types';

type StatusFilter = 'all' | 'tobuy' | 'incart';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tobuy', label: 'To buy' },
  { id: 'incart', label: 'In cart' },
];

const CHECK_DELAY = 400;
const SUGGESTIONS_OPEN_KEY = 'daybook.shopping.suggestionsOpen';

interface UndoState {
  id: number;
  message: string;
  /** Omit for a plain notice without an Undo button. */
  undo?: () => void;
}

const byName = (a: ShoppingItem, b: ShoppingItem) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

export default function ShoppingPage() {
  const { items, history, isOnList, addItems, updateItem, toggleItem, deleteItems, restoreItems, finishTrip, forgetPurchases } =
    useShopping();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checking, setChecking] = useState<Set<string>>(() => new Set());
  const [showCart, setShowCart] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(() => readJSON<boolean | null>(SUGGESTIONS_OPEN_KEY, null) ?? items.length === 0);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const addRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Map<string, number>());

  // "New → Shopping item" from the sidebar lands here with ?new=1.
  useEffect(() => {
    if (!searchParams.has('new')) return;
    addRef.current?.focus();
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('new');
        return p;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

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
        addRef.current?.focus();
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

  const toggleSuggestions = () =>
    setSuggestionsOpen((o) => {
      writeJSON(SUGGESTIONS_OPEN_KEY, !o);
      return !o;
    });

  /* ---------- Actions ---------- */

  const showUndo = (message: string, fn: () => void) => setUndo({ id: Date.now(), message, undo: fn });

  const handleAdd = (inputs: ItemInput[]) => {
    const ids = addItems(inputs);
    if (inputs.length === 1 && ids.length === 0) {
      setUndo({ id: Date.now(), message: `${inputs[0].name} is already on your list` });
    } else if (ids.length > 1) {
      showUndo(`Added ${ids.length} items`, () => deleteItems(ids));
    }
  };

  const addSuggestions = (list: Suggestion[]) =>
    handleAdd(list.map((s) => ({ name: s.name, quantity: s.quantity ?? '', category: s.category, note: '' })));

  const stopChecking = (id: string) =>
    setChecking((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });

  const handleToggle = (item: ShoppingItem) => {
    if (item.checked) {
      toggleItem(item.id);
      return;
    }
    const pending = timers.current.get(item.id);
    if (pending !== undefined) {
      clearTimeout(pending);
      timers.current.delete(item.id);
      stopChecking(item.id);
      return;
    }
    setChecking((s) => new Set(s).add(item.id));
    const t = window.setTimeout(() => {
      timers.current.delete(item.id);
      toggleItem(item.id);
      stopChecking(item.id);
    }, CHECK_DELAY);
    timers.current.set(item.id, t);
  };

  const handleDelete = (item: ShoppingItem) => {
    deleteItems([item.id]);
    if (selectedId === item.id) setSelectedId(null);
    showUndo(`Removed ${item.name}`, () => restoreItems([item]));
  };

  const handleFinish = () => {
    const bought = finishTrip();
    if (!bought.length) return;
    if (bought.some((i) => i.id === selectedId)) setSelectedId(null);
    showUndo(`Trip done · ${bought.length} ${bought.length === 1 ? 'item' : 'items'} cleared`, () => {
      restoreItems(bought);
      forgetPurchases(bought);
    });
  };

  /* ---------- Derived data ---------- */

  const toBuyCount = items.filter((i) => !i.checked).length;
  const inCartCount = items.length - toBuyCount;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!categoryFilter || i.category === categoryFilter) &&
        (!q || [i.name, i.note].some((s) => s.toLowerCase().includes(q))),
    );
  }, [items, query, categoryFilter]);

  const toBuy = visible.filter((i) => !i.checked);
  const inCart = [...visible.filter((i) => i.checked)].sort((a, b) =>
    (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''),
  );

  const groups = useMemo(() => {
    const map = new Map<CategoryId, ShoppingItem[]>();
    for (const i of toBuy) map.set(i.category, [...(map.get(i.category) ?? []), i]);
    return [...map.entries()]
      .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
      .map(([id, list]) => ({ meta: categoryMeta(id), items: list.sort(byName) }));
  }, [toBuy]);

  const presentCategories = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));
  const filtering = query.trim() !== '' || categoryFilter !== null;
  const selected = items.find((i) => i.id === selectedId);

  const tabCounts: Record<StatusFilter, number> = {
    all: visible.length,
    tobuy: toBuy.length,
    incart: inCart.length,
  };

  const renderRow = (i: ShoppingItem, showCategory = false) => (
    <ShoppingItemRow
      key={i.id}
      item={i}
      checking={checking.has(i.id)}
      selected={selectedId === i.id}
      showCategory={showCategory}
      onToggle={() => handleToggle(i)}
      onDelete={() => handleDelete(i)}
      onSelect={() => setSelectedId(selectedId === i.id ? null : i.id)}
    />
  );

  const clearFilters = () => {
    setQuery('');
    setCategoryFilter(null);
  };

  const noMatches = (
    <div className="todo-empty">
      <p className="todo-empty-title">Nothing matches</p>
      <button type="button" className="btn btn-sm btn-secondary" onClick={clearFilters}>
        Clear filters
      </button>
    </div>
  );

  return (
    <div className={`tasks${selected ? ' has-panel' : ''}`}>
      <div className="tasks-main">
        <div className="page-container">
          <header className="page-header">
            <div>
              <h1 className="page-title">Shopping</h1>
              <p className="page-subtitle">
                {items.length === 0
                  ? 'Your shopping list'
                  : toBuyCount === 0
                    ? 'Everything is in the cart'
                    : `${toBuyCount} ${toBuyCount === 1 ? 'item' : 'items'} to buy`}
              </p>
            </div>
          </header>

          {items.length > 0 && (
            <div className="todo-summary">
              <ProgressRing value={inCartCount / items.length} size={56} stroke={5} />
              <div className="summary-text">
                <strong>
                  {inCartCount} of {items.length} in cart
                </strong>
                <span>
                  {toBuyCount === 0
                    ? 'All set. Finish the trip to clear your list.'
                    : `Across ${new Set(items.filter((i) => !i.checked).map((i) => i.category)).size} sections`}
                </span>
              </div>
              <div className="summary-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleFinish}
                  disabled={inCartCount === 0}
                  title="Clear everything in the cart and remember it for “Buy again”"
                >
                  <CartIcon width={15} height={15} />
                  Finish shopping
                </button>
              </div>
            </div>
          )}

          <ShoppingQuickAdd onAdd={(input) => handleAdd([input])} inputRef={addRef} />

          <SuggestionsCard
            history={history}
            isOnList={isOnList}
            onAdd={addSuggestions}
            open={suggestionsOpen}
            onToggle={toggleSuggestions}
          />

          {items.length === 0 ? (
            <div className="todo-empty is-large">
              <div className="empty-icon" aria-hidden="true">🛒</div>
              <p className="todo-empty-title">Your shopping list is empty</p>
              <p className="muted">
                Type what you need above, or tap a few <strong>Fridge staples</strong> in Suggestions to get started.
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
                        aria-selected={status === s.id}
                        className={`segment${status === s.id ? ' active' : ''}`}
                        onClick={() => setStatus(s.id)}
                      >
                        {s.label}
                        <span className="segment-count">{tabCounts[s.id]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="search">
                  <SearchIcon className="search-icon" />
                  <input
                    ref={searchRef}
                    type="search"
                    className="input input-sm"
                    placeholder="Search your list"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search shopping list"
                  />
                </div>

                {presentCategories.length > 1 && (
                  <div className="filter-row" role="group" aria-label="Filter by section">
                    <button
                      type="button"
                      className={`chip chip-sm${categoryFilter === null ? ' active' : ''}`}
                      onClick={() => setCategoryFilter(null)}
                    >
                      All sections
                    </button>
                    {presentCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`chip chip-sm${categoryFilter === c.id ? ' active' : ''}`}
                        aria-pressed={categoryFilter === c.id}
                        onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                      >
                        <span aria-hidden="true">{c.emoji}</span>
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {status !== 'incart' &&
                (groups.length > 0 ? (
                  groups.map((g) => (
                    <div className="todo-group" key={g.meta.id}>
                      <h2 className="group-label shop-group-label">
                        <span className="shop-group-emoji" aria-hidden="true">
                          {g.meta.emoji}
                        </span>
                        {g.meta.label}
                        <span className="group-count">{g.items.length}</span>
                      </h2>
                      <ul className="todo-list">{g.items.map((i) => renderRow(i))}</ul>
                    </div>
                  ))
                ) : filtering ? (
                  noMatches
                ) : (
                  <div className="todo-empty">
                    <span className="all-done-icon" aria-hidden="true">✅</span>
                    <p className="todo-empty-title">Everything is in the cart</p>
                    <p className="muted">Tap “Finish shopping” when you’re done to clear the list.</p>
                  </div>
                ))}

              {status === 'all' && inCart.length > 0 && (
                <div className="completed-section">
                  <div className="completed-header">
                    <button
                      type="button"
                      className="completed-toggle"
                      onClick={() => setShowCart((v) => !v)}
                      aria-expanded={showCart}
                    >
                      <ChevronIcon width={14} height={14} className={showCart ? 'open' : ''} />
                      In cart
                      <span className="group-count">{inCart.length}</span>
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={handleFinish}>
                      Finish shopping
                    </button>
                  </div>
                  {showCart && <ul className="todo-list is-completed">{inCart.map((i) => renderRow(i, true))}</ul>}
                </div>
              )}

              {status === 'incart' &&
                (inCart.length > 0 ? (
                  <div className="todo-group">
                    <ul className="todo-list is-completed">{inCart.map((i) => renderRow(i, true))}</ul>
                  </div>
                ) : filtering ? (
                  noMatches
                ) : (
                  <div className="todo-empty">
                    <p className="muted">Nothing in the cart yet. Tick items off as you pick them up.</p>
                  </div>
                ))}

              <p className="shortcut-hint desktop-only">
                <kbd>N</kbd> add item · <kbd>/</kbd> search · <kbd>Esc</kbd> close details
              </p>
            </>
          )}
        </div>
      </div>

      {selected && (
        <>
          <div className="panel-scrim" onClick={() => setSelectedId(null)} aria-hidden="true" />
          <ItemPanel
            key={selected.id}
            item={selected}
            onUpdate={(patch) => updateItem(selected.id, patch)}
            onToggle={() => handleToggle(selected)}
            onDelete={() => handleDelete(selected)}
            onClose={() => setSelectedId(null)}
          />
        </>
      )}

      {undo && (
        <div className="snackbar" role="status" key={undo.id}>
          <span>{undo.message}</span>
          {undo.undo && (
            <button
              type="button"
              className="snackbar-action"
              onClick={() => {
                undo.undo?.();
                setUndo(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
