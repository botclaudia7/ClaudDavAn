import { Link } from 'react-router-dom';
import { moodById } from '../../journal/moods';
import type { JournalEntry } from '../../journal/types';
import { formatShortDate } from '../../lib/dates';

export default function EntryCard({ entry, selected }: { entry: JournalEntry; selected: boolean }) {
  const mood = moodById(entry.mood);
  const snippet = entry.body.trim().replace(/\s+/g, ' ');

  return (
    <Link
      to={`/journal/${entry.id}`}
      className={`note-item${selected ? ' selected' : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      <div className="note-item-top">
        <span className="note-title">{entry.title || 'Untitled entry'}</span>
        {mood && (
          <span className="note-mood" title={mood.label} aria-label={`Mood: ${mood.label}`}>
            {mood.emoji}
          </span>
        )}
      </div>
      {snippet && <p className="note-snippet">{snippet}</p>}
      <div className="note-item-meta">
        <span>{formatShortDate(entry.date)}</span>
        {entry.tags.slice(0, 3).map((t) => (
          <span className="tag tag-sm" key={t}>
            #{t}
          </span>
        ))}
        {entry.tags.length > 3 && <span>+{entry.tags.length - 3}</span>}
      </div>
    </Link>
  );
}
