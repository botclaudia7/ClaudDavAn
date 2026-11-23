import { MOODS, type MoodId } from '../../journal/moods';

interface Props {
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
}

export default function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="mood-picker" role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => {
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`mood-option mood-${m.id}${selected ? ' selected' : ''}`}
            onClick={() => onChange(selected ? null : m.id)}
          >
            <span className="mood-emoji" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="mood-label">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
