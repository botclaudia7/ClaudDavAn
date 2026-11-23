import { readJSON, removeKey, writeJSON } from '../lib/storage';
import type { EntryInput, JournalEntry } from './types';

const ENTRIES_KEY = 'daybook.journal.entries.v1';
const DRAFT_KEY = 'daybook.journal.draft.v1';

export function loadEntries(): JournalEntry[] {
  const raw = readJSON<Partial<JournalEntry>[]>(ENTRIES_KEY, []);
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  return raw
    .filter((e): e is Partial<JournalEntry> & { id: string; date: string } => !!e?.id && !!e?.date)
    .map((e) => ({
      title: '',
      body: '',
      mood: null,
      energy: null,
      tags: [],
      gratitude: '',
      createdAt: now,
      updatedAt: now,
      ...e,
    }));
}

export const saveEntries = (entries: JournalEntry[]) => writeJSON(ENTRIES_KEY, entries);

export const loadDraft = (): Partial<EntryInput> | null => readJSON<Partial<EntryInput> | null>(DRAFT_KEY, null);

export const saveDraft = (draft: EntryInput) => writeJSON(DRAFT_KEY, draft);

export const clearDraft = () => removeKey(DRAFT_KEY);
