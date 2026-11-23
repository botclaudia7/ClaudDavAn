import { useState } from 'react';
import { relativeTime } from '../../lib/dates';
import type { Todo, TodoInput } from '../../todo/types';
import TagInput from '../TagInput';
import { CalendarIcon, CheckIcon, FlagIcon, NoteIcon, TagIcon, TrashIcon, XIcon } from '../icons';
import DuePicker from './DuePicker';
import PriorityPicker from './PriorityPicker';

interface Props {
  todo: Todo;
  tagSuggestions: string[];
  onUpdate: (patch: Partial<TodoInput>) => void;
  onToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Task details. Docked on the right on wide screens, a slide-over sheet on smaller ones. */
export default function TaskPanel({ todo, tagSuggestions, onUpdate, onToggle, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(todo.title);

  const commitTitle = () => {
    const t = title.trim();
    if (t && t !== todo.title) onUpdate({ title: t });
    else setTitle(todo.title);
  };

  return (
    <aside className="task-panel" aria-label="Task details">
      <div className="panel-header">
        <button
          type="button"
          className={`btn btn-sm ${todo.completed ? 'btn-success-soft' : 'btn-secondary'}`}
          onClick={onToggle}
          aria-pressed={todo.completed}
        >
          <CheckIcon width={14} height={14} />
          {todo.completed ? 'Completed' : 'Mark complete'}
        </button>
        <div className="panel-header-actions">
          <button type="button" className="icon-btn danger-hover" onClick={onDelete} aria-label="Delete task" title="Delete task">
            <TrashIcon width={17} height={17} />
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details" title="Close (Esc)">
            <XIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <input
          className={`panel-title${todo.completed ? ' is-done' : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Task title"
        />

        <div className="field">
          <span className="field-label">
            <CalendarIcon width={14} height={14} /> Due date
          </span>
          <DuePicker value={todo.due} onChange={(due) => onUpdate({ due })} />
        </div>

        <div className="field">
          <span className="field-label">
            <FlagIcon width={14} height={14} /> Priority
          </span>
          <PriorityPicker value={todo.priority} onChange={(priority) => onUpdate({ priority })} />
        </div>

        <div className="field">
          <span className="field-label">
            <TagIcon width={14} height={14} /> Tags
          </span>
          <TagInput value={todo.tags} onChange={(tags) => onUpdate({ tags })} suggestions={tagSuggestions} />
        </div>

        <label className="field">
          <span className="field-label">
            <NoteIcon width={14} height={14} /> Notes
          </span>
          <textarea
            className="input textarea"
            rows={6}
            value={todo.notes}
            placeholder="Add details, links, steps…"
            onChange={(e) => onUpdate({ notes: e.target.value })}
          />
        </label>
      </div>

      <div className="panel-footer">
        Created {relativeTime(todo.createdAt)}
        {todo.updatedAt !== todo.createdAt && ` · edited ${relativeTime(todo.updatedAt)}`}
        {todo.completedAt && ` · completed ${relativeTime(todo.completedAt)}`}
      </div>
    </aside>
  );
}
