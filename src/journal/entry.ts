import { toISODate } from '../lib/dates';
import type { EntryInput, JournalEntry } from './types';

export const emptyInput = (): EntryInput => ({
  date: toISODate(),
  title: '',
  body: '',
  mood: null,
  energy: null,
  tags: [],
  gratitude: '',
});

export const toInput = (e: JournalEntry): EntryInput => ({
  date: e.date,
  title: e.title,
  body: e.body,
  mood: e.mood,
  energy: e.energy,
  tags: e.tags,
  gratitude: e.gratitude,
});

export const isBlank = (f: Partial<EntryInput>) =>
  !f.title?.trim() &&
  !f.body?.trim() &&
  !f.gratitude?.trim() &&
  !f.mood &&
  (f.energy ?? null) === null &&
  (f.tags?.length ?? 0) === 0;
