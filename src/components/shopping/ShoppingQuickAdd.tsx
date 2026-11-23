import { useState, type FormEvent, type RefObject } from 'react';
import { CATEGORIES, categoryMeta, guessCategory, parseItemText } from '../../shopping/catalog';
import type { CategoryId, ItemInput } from '../../shopping/types';
import { CartIcon } from '../icons';

interface Props {
  onAdd: (input: ItemInput) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function ShoppingQuickAdd({ onAdd, inputRef }: Props) {
  const [text, setText] = useState('');
  /** Set when the user picks a section by hand; otherwise we guess from the name. */
  const [manualCategory, setManualCategory] = useState<CategoryId | null>(null);

  const parsed = parseItemText(text);
  const guessed = guessCategory(parsed.name);
  const category = manualCategory ?? guessed;
  const meta = categoryMeta(category);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!parsed.name) return;
    onAdd({ name: parsed.name, quantity: parsed.quantity, category, note: '' });
    setText('');
    setManualCategory(null);
    inputRef.current?.focus();
  };

  return (
    <form className="quick-add" onSubmit={submit}>
      <div className="quick-add-row">
        <span className="quick-add-icon">
          <CartIcon width={17} height={17} />
        </span>
        <input
          ref={inputRef}
          className="quick-add-input"
          placeholder="Add an item… e.g. 2 lapte"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New item"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!parsed.name}>
          Add
        </button>
      </div>
      <div className="quick-add-options">
        <label className="category-select">
          <span className="category-emoji" aria-hidden="true">
            {meta.emoji}
          </span>
          <span className="select-wrap">
            <select
              value={category}
              onChange={(e) => setManualCategory(e.target.value as CategoryId)}
              aria-label="Section"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </span>
          {!manualCategory && parsed.name && guessed !== 'other' && <span className="auto-badge">auto</span>}
        </label>
        {parsed.quantity && (
          <>
            <span className="divider" aria-hidden="true" />
            <span className="qty-preview">
              Qty <strong>{parsed.quantity}</strong>
            </span>
          </>
        )}
        <span className="quick-add-hint desktop-only">
          Tip: start with a number — <strong>3 mere</strong>, <strong>500g făină</strong>
        </span>
      </div>
    </form>
  );
}
