import { parseISODate } from '../../lib/dates';
import { moodByDay } from '../../journal/stats';
import type { JournalEntry } from '../../journal/types';

export default function MoodTrend({ entries, days = 14 }: { entries: JournalEntry[]; days?: number }) {
  const data = moodByDay(entries, days);

  return (
    <div className="mood-trend" role="img" aria-label={`Mood over the last ${days} days`}>
      {data.map((d) => {
        const date = parseISODate(d.date);
        const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const status = d.mood ? `${d.mood.emoji} ${d.mood.label}` : d.count ? 'Entry, no mood' : 'No entry';
        return (
          <div className="trend-day" key={d.date} title={`${label}: ${status}`}>
            <div className="trend-track">
              {d.mood && d.score !== null ? (
                <span
                  className={`trend-bar mood-${d.mood.id}`}
                  style={{ height: `${(d.score / 5) * 100}%` }}
                />
              ) : (
                <span className={`trend-empty${d.count ? ' has-entry' : ''}`} />
              )}
            </div>
            <span className="trend-label">
              {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
