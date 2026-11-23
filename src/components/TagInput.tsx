import { useState, type KeyboardEvent } from 'react';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

const normalize = (raw: string) =>
  raw.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').replace(/,/g, '');

export default function TagInput({ value, onChange, suggestions }: Props) {
  const [text, setText] = useState('');

  const add = (raw: string) => {
    const tag = normalize(raw);
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setText('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const remaining = suggestions.filter((s) => !value.includes(s)).slice(0, 6);

  return (
    <div>
      <div className="tag-input">
        {value.map((t) => (
          <span className="tag" key={t}>
            #{t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => remove(t)}>
              ×
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => text && add(text)}
          placeholder={value.length ? 'Add another…' : 'Type a tag and press Enter'}
          aria-label="Add tag"
        />
      </div>
      {remaining.length > 0 && (
        <div className="tag-suggestions">
          {remaining.map((s) => (
            <button type="button" className="tag-suggestion" key={s} onClick={() => add(s)}>
              + #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
