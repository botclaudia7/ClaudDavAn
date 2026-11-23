import { addDays, daysBetween, formatShortDate, parseISODate, toISODate } from '../lib/dates';
import type { Priority, Todo } from './types';

export const PRIORITIES: { id: Priority; label: string; rank: number }[] = [
  { id: 'high', label: 'High', rank: 3 },
  { id: 'medium', label: 'Medium', rank: 2 },
  { id: 'low', label: 'Low', rank: 1 },
  { id: 'none', label: 'None', rank: 0 },
];

export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.id === p)?.label ?? 'None';
const rank = (p: Priority) => PRIORITIES.find((x) => x.id === p)?.rank ?? 0;

/* ---------- Filters ---------- */

export type StatusFilter = 'all' | 'active' | 'completed';
export type DueFilter = 'any' | 'overdue' | 'today' | 'upcoming' | 'nodate';
export type SortMode = 'smart' | 'priority' | 'newest' | 'alpha';

export interface Filters {
  status: StatusFilter;
  due: DueFilter;
  priority: Priority | 'any';
  tag: string | null;
  query: string;
  sort: SortMode;
}

export const DEFAULT_FILTERS: Filters = {
  status: 'all',
  due: 'any',
  priority: 'any',
  tag: null,
  query: '',
  sort: 'smart',
};

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'smart', label: 'Due date' },
  { id: 'priority', label: 'Priority' },
  { id: 'newest', label: 'Newest' },
  { id: 'alpha', label: 'A–Z' },
];

export const DUE_FILTERS: { id: DueFilter; label: string }[] = [
  { id: 'any', label: 'Any time' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Next 7 days' },
  { id: 'nodate', label: 'No date' },
];

export const hasActiveFilters = (f: Filters) =>
  f.due !== 'any' || f.priority !== 'any' || f.tag !== null || f.query.trim() !== '';

export const isOverdue = (t: Todo, today = toISODate()) => !t.completed && !!t.due && t.due < today;

/** Applies every filter except status (status decides which section a task shows in). */
export function matchesFilters(t: Todo, f: Filters, today = toISODate()): boolean {
  if (f.priority !== 'any' && t.priority !== f.priority) return false;
  if (f.tag && !t.tags.includes(f.tag)) return false;

  switch (f.due) {
    case 'overdue':
      if (!isOverdue(t, today)) return false;
      break;
    case 'today':
      if (t.due !== today) return false;
      break;
    case 'upcoming': {
      const limit = toISODate(addDays(parseISODate(today), 7));
      if (!t.due || t.due <= today || t.due > limit) return false;
      break;
    }
    case 'nodate':
      if (t.due) return false;
      break;
  }

  const q = f.query.trim().toLowerCase();
  if (q && ![t.title, t.notes, ...t.tags].some((s) => s.toLowerCase().includes(q))) return false;
  return true;
}

/* ---------- Sorting ---------- */

const byDue = (a: Todo, b: Todo) => {
  if (a.due === b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due.localeCompare(b.due);
};

const COMPARATORS: Record<SortMode, (a: Todo, b: Todo) => number> = {
  smart: (a, b) => byDue(a, b) || rank(b.priority) - rank(a.priority) || a.createdAt.localeCompare(b.createdAt),
  priority: (a, b) => rank(b.priority) - rank(a.priority) || byDue(a, b) || a.createdAt.localeCompare(b.createdAt),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  alpha: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
};

export const sortTodos = (todos: Todo[], mode: SortMode) => [...todos].sort(COMPARATORS[mode]);

export const sortCompleted = (todos: Todo[]) =>
  [...todos].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

/* ---------- Grouping ---------- */

export interface TodoGroup {
  key: string;
  label: string;
  tone?: 'danger' | 'accent';
  todos: Todo[];
}

type Bucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none';

const BUCKETS: { key: Bucket; label: string; tone?: TodoGroup['tone'] }[] = [
  { key: 'overdue', label: 'Overdue', tone: 'danger' },
  { key: 'today', label: 'Today', tone: 'accent' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'later', label: 'Later' },
  { key: 'none', label: 'No due date' },
];

function dueBucket(due: string | null, today: string): Bucket {
  if (!due) return 'none';
  const d = daysBetween(today, due);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d <= 7) return 'week';
  return 'later';
}

/** Groups already-sorted active tasks into due-date buckets. */
export function groupByDue(todos: Todo[], today = toISODate()): TodoGroup[] {
  return BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    tone: b.tone,
    todos: todos.filter((t) => dueBucket(t.due, today) === b.key),
  })).filter((g) => g.todos.length > 0);
}

export function groupByCompletion(todos: Todo[], today = toISODate()): TodoGroup[] {
  const groups: TodoGroup[] = [];
  for (const t of sortCompleted(todos)) {
    const day = t.completedAt ? toISODate(new Date(t.completedAt)) : 'unknown';
    let group = groups[groups.length - 1];
    if (!group || group.key !== day) {
      const diff = day === 'unknown' ? null : daysBetween(day, today);
      const label =
        diff === null ? 'Earlier' : diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : formatShortDate(day);
      group = { key: day, label, todos: [] };
      groups.push(group);
    }
    group.todos.push(t);
  }
  return groups;
}

/* ---------- Display helpers ---------- */

export function dueLabel(due: string, today = toISODate()): string {
  const d = daysBetween(today, due);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1 && d < 7) return parseISODate(due).toLocaleDateString(undefined, { weekday: 'long' });
  return formatShortDate(due);
}

/** Pulls `#tags` out of quick-add text. */
export function parseTags(raw: string): { title: string; tags: string[] } {
  const tags: string[] = [];
  const title = raw
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_match, space: string, tag: string) => {
      tags.push(tag.toLowerCase());
      return space;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { title, tags: [...new Set(tags)] };
}

export function tagsByFrequency(todos: Todo[]): string[] {
  const counts = new Map<string, number>();
  for (const t of todos) for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}
