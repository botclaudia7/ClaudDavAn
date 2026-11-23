import { priorityLabel } from '../../todo/logic';
import type { Priority } from '../../todo/types';
import { FlagIcon } from '../icons';

const ORDER: Priority[] = ['none', 'low', 'medium', 'high'];

interface Props {
  value: Priority;
  onChange: (p: Priority) => void;
}

export default function PriorityPicker({ value, onChange }: Props) {
  return (
    <div className="priority-picker" role="radiogroup" aria-label="Priority">
      {ORDER.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          className={`pill priority-option priority-${p}${value === p ? ' selected' : ''}`}
          onClick={() => onChange(p)}
        >
          {p !== 'none' && <FlagIcon width={12} height={12} />}
          {priorityLabel(p)}
        </button>
      ))}
    </div>
  );
}
