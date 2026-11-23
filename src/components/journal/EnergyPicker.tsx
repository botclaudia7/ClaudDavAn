import { ENERGY_LABELS } from '../../journal/moods';

interface Props {
  value: number | null;
  onChange: (energy: number | null) => void;
}

export default function EnergyPicker({ value, onChange }: Props) {
  return (
    <div className="energy-picker">
      <div className="energy-bars" role="radiogroup" aria-label="Energy level">
        {ENERGY_LABELS.map((label, i) => {
          const level = i + 1;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={value === level}
              aria-label={`${level} of 5 – ${label}`}
              title={label}
              className={`energy-bar${value !== null && level <= value ? ' filled' : ''}`}
              style={{ height: 10 + level * 5 }}
              onClick={() => onChange(value === level ? null : level)}
            />
          );
        })}
      </div>
      <span className="energy-caption">{value ? ENERGY_LABELS[value - 1] : 'Not set'}</span>
    </div>
  );
}
