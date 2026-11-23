import { categoryMeta } from '../../shopping/catalog';
import type { ShoppingItem } from '../../shopping/types';
import { CheckIcon, NoteIcon, TrashIcon } from '../icons';

interface Props {
  item: ShoppingItem;
  /** Short animation between ticking an item and it moving to "In cart". */
  checking: boolean;
  selected: boolean;
  /** Show the section emoji (used in the flat "In cart" list). */
  showCategory?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

export default function ShoppingItemRow({ item, checking, selected, showCategory, onToggle, onDelete, onSelect }: Props) {
  const done = item.checked || checking;
  const classes = ['todo-item', 'shop-item'];
  if (done) classes.push('completed');
  if (checking) classes.push('completing');
  if (selected) classes.push('selected');

  return (
    <li className={classes.join(' ')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Take ${item.name} out of the cart` : `Put ${item.name} in the cart`}
        className="todo-check is-square"
        onClick={onToggle}
      >
        <CheckIcon width={12} height={12} strokeWidth={3.4} />
      </button>

      <button type="button" className="todo-main" onClick={onSelect} aria-pressed={selected}>
        <span className="todo-title shop-title">
          {showCategory && (
            <span className="shop-cat" aria-hidden="true">
              {categoryMeta(item.category).emoji}
            </span>
          )}
          <span className="todo-title-text">{item.name}</span>
          {item.quantity && <span className="qty-badge">{item.quantity}</span>}
        </span>
        {item.note.trim() !== '' && (
          <span className="todo-meta">
            <span className="meta-note">
              <NoteIcon width={12} height={12} />
              {item.note}
            </span>
          </span>
        )}
      </button>

      <button
        type="button"
        className="icon-btn todo-delete danger-hover"
        onClick={onDelete}
        aria-label={`Remove ${item.name}`}
      >
        <TrashIcon width={15} height={15} />
      </button>
    </li>
  );
}
