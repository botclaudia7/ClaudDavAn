import { addDays, toISODate } from '../lib/dates';
import { moodById, moodByScore, type Mood } from './moods';
import type { JournalEntry } from './types';

export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

/** Consecutive days with at least one entry, ending today (or yesterday if today is empty). */
export function currentStreak(entries: JournalEntry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let cursor = new Date();
  if (!days.has(toISODate(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function entriesInLastDays(entries: JournalEntry[], days: number): number {
  const today = toISODate();
  const from = toISODate(addDays(new Date(), -(days - 1)));
  return entries.filter((e) => e.date >= from && e.date <= today).length;
}

function avgScore(entries: JournalEntry[]): number | null {
  const scores = entries.map((e) => moodById(e.mood)?.score).filter((s): s is number => !!s);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function averageMood(entries: JournalEntry[]): Mood | undefined {
  const avg = avgScore(entries);
  return avg === null ? undefined : moodByScore(avg);
}

export interface DayMood {
  date: string;
  count: number;
  score: number | null;
  mood: Mood | undefined;
}

export function moodByDay(entries: JournalEntry[], days: number): DayMood[] {
  const result: DayMood[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = toISODate(addDays(new Date(), -i));
    const dayEntries = entries.filter((e) => e.date === date);
    const score = avgScore(dayEntries);
    result.push({
      date,
      count: dayEntries.length,
      score,
      mood: score === null ? undefined : moodByScore(score),
    });
  }
  return result;
}

/** Tags ordered by how often they are used. */
export function tagsByFrequency(entries: JournalEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}
