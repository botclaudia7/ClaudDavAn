import { useState, type FormEvent, type RefObject } from 'react';
import { parseTags } from '../../todo/logic';
import type { Priority, TodoInput } from '../../todo/types';
import { PlusIcon } from '../icons';
import DuePicker from './DuePicker';
import PriorityPicker from './PriorityPicker';

interface Props {
  onAdd: (input: TodoInput) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function QuickAdd({ onAdd, inputRef }: Props) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [due, setDue] = useState<string | null>(null);
  const parsed = parseTags(text);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!parsed.title) return;
    onAdd({ title: parsed.title, notes: '', priority, due, tags: parsed.tags });
    setText('');
    setPriority('none');
    setDue(null);
    inputRef.current?.focus();
  };

  return (
    <form className="quick-add" onSubmit={submit}>
      <div className="quick-add-row">
        <span className="quick-add-icon">
          <PlusIcon width={18} height={18} />
        </span>
        <input
          ref={inputRef}
          className="quick-add-input"
          placeholder="Add a task…"
          title="Tip: type #tag to label a task"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New task"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!parsed.title}>
          Add task
        </button>
      </div>
      <div className="quick-add-options">
        <DuePicker value={due} onChange={setDue} />
        <span className="divider" aria-hidden="true" />
        <PriorityPicker value={priority} onChange={setPriority} />
        {parsed.tags.length > 0 && (
          <>
            <span className="divider" aria-hidden="true" />
            <span className="quick-add-tags">
              {parsed.tags.map((t) => (
                <span className="tag tag-sm" key={t}>
                  #{t}
                </span>
              ))}
            </span>
          </>
        )}
        {parsed.tags.length === 0 && (
          <span className="quick-add-hint desktop-only">
            Tip: type <strong>#tag</strong> to label
          </span>
        )}
      </div>
    </form>
  );
}
