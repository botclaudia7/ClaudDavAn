import { addDays, toISODate } from '../../lib/dates';
import { dueLabel } from '../../todo/logic';
import { CalendarIcon, XIcon } from '../icons';

interface Props {
  value: string | null;
  onChange: (due: string | null) => void;
}

export default function DuePicker({ value, onChange }: Props) {
  const today = toISODate();
  const tomorrow = toISODate(addDays(new Date(), 1));
  const isCustom = !!value && value !== today && value !== tomorrow;

  return (
    <div className="due-picker">
      <button
        type="button"
        className={`pill${value === today ? ' active' : ''}`}
        aria-pressed={value === today}
        onClick={() => onChange(value === today ? null : today)}
      >
        Today
      </button>
      <button
        type="button"
        className={`pill${value === tomorrow ? ' active' : ''}`}
        aria-pressed={value === tomorrow}
        onClick={() => onChange(value === tomorrow ? null : tomorrow)}
      >
        Tomorrow
      </button>
      <label className={`pill pill-date${isCustom ? ' active' : ''}`}>
        <CalendarIcon width={13} height={13} />
        {isCustom ? dueLabel(value!, today) : 'Pick date'}
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label="Due date"
        />
      </label>
      {value && (
        <button type="button" className="pill pill-clear" onClick={() => onChange(null)} aria-label="Clear due date">
          <XIcon width={12} height={12} />
        </button>
      )}
    </div>
  );
}
