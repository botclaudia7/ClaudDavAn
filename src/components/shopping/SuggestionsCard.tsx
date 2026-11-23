import { useState } from 'react';
import { SUGGESTION_SETS, categoryMeta, type Suggestion } from '../../shopping/catalog';
import type { HistoryRecord } from '../../shopping/types';
import { CheckIcon, ChevronIcon, PlusIcon, SparkleIcon } from '../icons';

type TabId = (typeof SUGGESTION_SETS)[number]['id'] | 'again';

interface Props {
  history: Record<string, HistoryRecord>;
  isOnList: (name: string) => boolean;
  onAdd: (items: Suggestion[]) => void;
  open: boolean;
  onToggle: () => void;
}

export default function SuggestionsCard({ history, isOnList, onAdd, open, onToggle }: Props) {
  const buyAgain: Suggestion[] = Object.values(history)
    .sort((a, b) => b.count - a.count || b.lastBought.localeCompare(a.lastBought))
    .slice(0, 16)
    .map((r) => ({ name: r.name, category: r.category, quantity: r.quantity }));

  const [tab, setTab] = useState<TabId>('fridge');

  const tabs: { id: TabId; label: string; emoji: string; items: Suggestion[] }[] = [
    ...SUGGESTION_SETS,
    ...(buyAgain.length ? [{ id: 'again' as const, label: 'Buy again', emoji: '🔁', items: buyAgain }] : []),
  ];
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  const missing = current.items.filter((s) => !isOnList(s.name));

  return (
    <section className={`suggestions${open ? ' open' : ''}`}>
      <button type="button" className="suggestions-toggle" onClick={onToggle} aria-expanded={open}>
        <SparkleIcon width={16} height={16} className="suggestions-icon" />
        <span className="suggestions-title">Suggestions</span>
        <span className="suggestions-sub">Fridge staples, pantry basics and more</span>
        <ChevronIcon width={15} height={15} className="suggestions-chevron" />
      </button>

      {open && (
        <div className="suggestions-body">
          <div className="suggestions-tabs" role="tablist" aria-label="Suggestion lists">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={current.id === t.id}
                className={`chip chip-sm${current.id === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span aria-hidden="true">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="suggestion-grid">
            {current.items.map((s) => {
              const added = isOnList(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`suggestion${added ? ' added' : ''}`}
                  onClick={() => !added && onAdd([s])}
                  disabled={added}
                  aria-label={
                    added
                      ? `${s.name} is on your list`
                      : `Add ${s.name}${s.quantity ? `, ${s.quantity}` : ''}`
                  }
                >
                  <span className="suggestion-emoji" aria-hidden="true">
                    {categoryMeta(s.category).emoji}
                  </span>
                  <span className="suggestion-name">{s.name}</span>
                  {s.quantity && <span className="suggestion-qty">{s.quantity}</span>}
                  {added ? <CheckIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />}
                </button>
              );
            })}
          </div>

          <div className="suggestions-footer">
            <span className="muted">
              {missing.length ? `${missing.length} not on your list yet` : 'Everything here is on your list'}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => onAdd(missing)}
              disabled={!missing.length}
            >
              <PlusIcon width={13} height={13} />
              Add all {missing.length > 0 && missing.length}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
