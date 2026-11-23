import { relativeTime, toISODate } from '../../lib/dates';
import { dueLabel, isOverdue, priorityLabel } from '../../todo/logic';
import type { Todo } from '../../todo/types';
import { CalendarIcon, CheckIcon, FlagIcon, NoteIcon, TrashIcon } from '../icons';

interface Props {
  todo: Todo;
  /** True during the short animation between ticking a task and it moving to Completed. */
  completing: boolean;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

export default function TodoItem({ todo, completing, selected, onToggle, onDelete, onSelect }: Props) {
  const done = todo.completed || completing;
  const today = toISODate();
  const overdue = !done && isOverdue(todo, today);
  const dueToday = !done && todo.due === today;

  const classes = ['todo-item', `priority-${todo.priority}`];
  if (done) classes.push('completed');
  if (completing) classes.push('completing');
  if (selected) classes.push('selected');

  return (
    <li className={classes.join(' ')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark “${todo.title}” as not done` : `Mark “${todo.title}” as done`}
        className="todo-check"
        onClick={onToggle}
      >
        <CheckIcon width={12} height={12} strokeWidth={3.4} />
      </button>

      <button type="button" className="todo-main" onClick={onSelect} aria-pressed={selected}>
        <span className="todo-title">
          <span className="todo-title-text">{todo.title}</span>
        </span>
        <span className="todo-meta">
          {todo.completed && todo.completedAt && (
            <span className="meta-done">
              <CheckIcon width={12} height={12} /> Done {relativeTime(todo.completedAt)}
            </span>
          )}
          {todo.due !== null && (
            <span className={`due-badge${overdue ? ' overdue' : dueToday ? ' today' : ''}`}>
              <CalendarIcon width={12} height={12} />
              {overdue ? `Overdue · ${dueLabel(todo.due, today)}` : dueLabel(todo.due, today)}
            </span>
          )}
          {todo.priority !== 'none' && (
            <span className={`prio-badge priority-${todo.priority}`}>
              <FlagIcon width={12} height={12} />
              {priorityLabel(todo.priority)}
            </span>
          )}
          {todo.tags.map((t) => (
            <span className="tag tag-sm" key={t}>
              #{t}
            </span>
          ))}
          {todo.notes.trim() !== '' && (
            <span className="meta-note" title="Has notes" aria-label="Has notes">
              <NoteIcon width={12} height={12} />
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        className="icon-btn todo-delete danger-hover"
        onClick={onDelete}
        aria-label={`Delete “${todo.title}”`}
      >
        <TrashIcon width={15} height={15} />
      </button>
    </li>
  );
}
