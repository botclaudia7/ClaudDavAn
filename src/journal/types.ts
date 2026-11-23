import type { MoodId } from './moods';

export interface JournalEntry {
  id: string;
  /** Day the entry is about, as YYYY-MM-DD (local time). */
  date: string;
  title: string;
  body: string;
  mood: MoodId | null;
  /** 1–5, or null when not recorded. */
  energy: number | null;
  tags: string[];
  gratitude: string;
  createdAt: string;
  updatedAt: string;
}

export type EntryInput = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
