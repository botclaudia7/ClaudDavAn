import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MoodTrend from '../components/journal/MoodTrend';
import { useJournal } from '../journal/JournalContext';
import { emptyInput } from '../journal/entry';
import { MOODS, type MoodId } from '../journal/moods';
import { averageMood, currentStreak, entriesInLastDays, sortEntries } from '../journal/stats';
import { formatLongDate, greeting, toISODate } from '../lib/dates';

/** Shown in the detail pane when no entry is open (desktop / tablet). */
export default function JournalOverview() {
  const { entries, draft, setDraft } = useJournal();
  const navigate = useNavigate();
  const today = toISODate();
  const todays = sortEntries(entries).filter((e) => e.date === today);
  const avgMood = averageMood(entries);
  const streak = currentStreak(entries);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [entries]);

  const startWithMood = (mood: MoodId) => {
    setDraft({ ...emptyInput(), ...draft, mood });
    navigate('/journal/new');
  };

  return (
    <div className="detail-scroll">
      <div className="overview">
        <header className="overview-head">
          <p className="eyebrow">{greeting()}</p>
          <h2 className="overview-title">{formatLongDate(today)}</h2>
        </header>

        <div className="card checkin">
          <div>
            <h3 className="card-heading">
              {todays.length ? 'Anything else on your mind?' : 'How are you feeling today?'}
            </h3>
            <p className="card-sub">
              {todays.length ? (
                <>
                  You’ve written {todays.length === 1 ? 'once' : `${todays.length} times`} today ·{' '}
                  <Link to={`/journal/${todays[0].id}`}>open latest</Link>
                </>
              ) : (
                'Pick a mood to start today’s entry.'
              )}
            </p>
          </div>
          <div className="checkin-moods">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`checkin-mood mood-${m.id}`}
                onClick={() => startWithMood(m.id)}
              >
                <span className="checkin-emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {entries.length > 0 && (
          <>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{entries.length}</span>
                <span className="stat-label">Total entries</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {streak}
                  {streak > 1 && <span className="stat-suffix"> 🔥</span>}
                </span>
                <span className="stat-label">Day streak</span>
              </div>
              <div className="stat">
                <span className="stat-value">{entriesInLastDays(entries, 7)}</span>
                <span className="stat-label">Last 7 days</span>
              </div>
              <div className="stat">
                <span className="stat-value">{avgMood?.emoji ?? '—'}</span>
                <span className="stat-label">Avg mood{avgMood ? ` · ${avgMood.label}` : ''}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="card-heading">Mood over the last 14 days</h3>
              <MoodTrend entries={entries} />
            </div>

            {topTags.length > 0 && (
              <div className="card">
                <h3 className="card-heading">Top tags</h3>
                <div className="tag-cloud">
                  {topTags.map(([tag, count]) => (
                    <span className="tag" key={tag}>
                      #{tag}
                      <span className="tag-count">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
