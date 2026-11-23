import { useState } from 'react';
import { relativeTime } from '../../lib/dates';
import { CATEGORIES, bumpQuantity } from '../../shopping/catalog';
import type { ItemInput, ShoppingItem } from '../../shopping/types';
import { CartIcon, CheckIcon, MinusIcon, NoteIcon, PlusIcon, TagIcon, TrashIcon, XIcon } from '../icons';

interface Props {
  item: ShoppingItem;
  onUpdate: (patch: Partial<ItemInput>) => void;
  onToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Item details — same panel pattern as Todo. */
export default function ItemPanel({ item, onUpdate, onToggle, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name);

  const commitName = () => {
    const n = name.trim();
    if (n && n !== item.name) onUpdate({ name: n });
    else setName(item.name);
  };

  return (
    <aside className="task-panel" aria-label="Item details">
      <div className="panel-header">
        <button
          type="button"
          className={`btn btn-sm ${item.checked ? 'btn-success-soft' : 'btn-secondary'}`}
          onClick={onToggle}
          aria-pressed={item.checked}
        >
          <CheckIcon width={14} height={14} />
          {item.checked ? 'In cart' : 'Put in cart'}
        </button>
        <div className="panel-header-actions">
          <button type="button" className="icon-btn danger-hover" onClick={onDelete} aria-label="Remove item" title="Remove item">
            <TrashIcon width={17} height={17} />
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details" title="Close (Esc)">
            <XIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <input
          className={`panel-title${item.checked ? ' is-done' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Item name"
        />

        <div className="field">
          <span className="field-label">
            <CartIcon width={14} height={14} /> Quantity
          </span>
          <div className="qty-stepper">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onUpdate({ quantity: bumpQuantity(item.quantity, -1) })}
              aria-label="Decrease quantity"
            >
              <MinusIcon width={16} height={16} />
            </button>
            <input
              className="input input-sm qty-input"
              value={item.quantity}
              placeholder="e.g. 2 kg"
              onChange={(e) => onUpdate({ quantity: e.target.value })}
              aria-label="Quantity"
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => onUpdate({ quantity: bumpQuantity(item.quantity, 1) })}
              aria-label="Increase quantity"
            >
              <PlusIcon width={16} height={16} />
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">
            <TagIcon width={14} height={14} /> Section
          </span>
          <div className="category-grid" role="radiogroup" aria-label="Section">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={item.category === c.id}
                className={`pill category-option${item.category === c.id ? ' active' : ''}`}
                onClick={() => onUpdate({ category: c.id })}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">
            <NoteIcon width={14} height={14} /> Note
          </span>
          <textarea
            className="input textarea"
            rows={3}
            value={item.note}
            placeholder="Brand, size, “the organic one”…"
            onChange={(e) => onUpdate({ note: e.target.value })}
          />
        </label>
      </div>

      <div className="panel-footer">
        Added {relativeTime(item.createdAt)}
        {item.checkedAt && ` · in cart ${relativeTime(item.checkedAt)}`}
      </div>
    </aside>
  );
}
