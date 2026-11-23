import { useEffect, useMemo, useState } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';
import { useJournal } from '../../journal/JournalContext';
import { MOODS, type MoodId } from '../../journal/moods';
import { averageMood, currentStreak, entriesInLastDays, sortEntries } from '../../journal/stats';
import type { JournalEntry } from '../../journal/types';
import { parseISODate } from '../../lib/dates';
import { PlusIcon, SearchIcon } from '../icons';
import EntryCard from './EntryCard';

interface MonthGroup {
  key: string;
  label: string;
  entries: JournalEntry[];
}

function groupByMonth(entries: JournalEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: parseISODate(e.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        entries: [],
      };
      groups.push(group);
    }
    group.entries.push(e);
  }
  return groups;
}

export default function JournalList() {
  const { entries, draft } = useJournal();
  const navigate = useNavigate();
  const activeId = useMatch('/journal/:id')?.params.id;
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodId | null>(null);

  // Press "n" to start a new entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        navigate('/journal/new');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const sorted = useMemo(() => sortEntries(entries), [entries]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (e) =>
        (!moodFilter || e.mood === moodFilter) &&
        (!q || [e.title, e.body, e.gratitude, ...e.tags].some((s) => s.toLowerCase().includes(q))),
    );
  }, [sorted, query, moodFilter]);
  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const filtering = query.trim() !== '' || moodFilter !== null;
  const avgMood = averageMood(entries);
  const streak = currentStreak(entries);

  return (
    <div className="split-list">
      <div className="pane-header">
        <div className="pane-title-row">
          <div>
            <h1 className="pane-title">Journal</h1>
            <p className="pane-subtitle">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <Link to="/journal/new" className="btn btn-primary btn-sm" title="New entry (N)">
            <PlusIcon width={15} height={15} />
            New entry
          </Link>
        </div>

        <div className="search">
          <SearchIcon className="search-icon" />
          <input
            type="search"
            className="input input-sm"
            placeholder="Search entries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search entries"
          />
        </div>

        {entries.length > 0 && (
          <div className="mood-filter" role="group" aria-label="Filter by mood">
            <button
              type="button"
              className={`chip chip-sm${moodFilter === null ? ' active' : ''}`}
              onClick={() => setMoodFilter(null)}
            >
              All
            </button>
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip chip-sm chip-emoji mood-${m.id}${moodFilter === m.id ? ' active' : ''}`}
                onClick={() => setMoodFilter(moodFilter === m.id ? null : m.id)}
                aria-pressed={moodFilter === m.id}
                aria-label={`Show ${m.label} entries`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pane-scroll">
        {entries.length > 0 && (
          <div className="list-insights mobile-only">
            <div className="mini-stat">
              <span className="mini-stat-value">{streak}</span>
              <span className="mini-stat-label">Day streak</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{entriesInLastDays(entries, 7)}</span>
              <span className="mini-stat-label">Last 7 days</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{avgMood?.emoji ?? '—'}</span>
              <span className="mini-stat-label">Avg mood</span>
            </div>
          </div>
        )}

        {draft && (
          <Link to="/journal/new" className={`note-item is-draft${activeId === 'new' ? ' selected' : ''}`}>
            <div className="note-item-top">
              <span className="note-title">{draft.title?.trim() || 'Untitled draft'}</span>
              <span className="draft-badge">Draft</span>
            </div>
            {draft.body?.trim() && <p className="note-snippet">{draft.body.trim()}</p>}
          </Link>
        )}

        {entries.length === 0 && !draft ? (
          <div className="list-empty">
            <p className="list-empty-title">No entries yet</p>
            <p className="muted">Write about your day, how you feel and what went well.</p>
            <Link to="/journal/new" className="btn btn-secondary btn-sm">
              Write your first entry
            </Link>
          </div>
        ) : filtering && groups.length === 0 ? (
          <div className="list-empty">
            <p className="list-empty-title">No matches</p>
            <p className="muted">Try a different search or mood.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div className="list-group" key={g.key}>
              <div className="list-group-label">{g.label}</div>
              {g.entries.map((e) => (
                <EntryCard key={e.id} entry={e} selected={e.id === activeId} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
