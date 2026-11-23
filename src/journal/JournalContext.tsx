import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearDraft, loadDraft, loadEntries, saveDraft, saveEntries } from './storage';
import type { EntryInput, JournalEntry } from './types';

interface JournalContextValue {
  entries: JournalEntry[];
  getEntry: (id: string) => JournalEntry | undefined;
  /** Creates an entry, or updates it when `id` is given. Returns the entry id. */
  saveEntry: (input: EntryInput, id?: string) => string;
  deleteEntry: (id: string) => void;
  /** The unsaved new entry, if any. */
  draft: Partial<EntryInput> | null;
  setDraft: (draft: EntryInput | null) => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>(loadEntries);
  const [draft, setDraftState] = useState<Partial<EntryInput> | null>(loadDraft);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const getEntry = useCallback((id: string) => entries.find((e) => e.id === id), [entries]);

  const saveEntry = useCallback((input: EntryInput, id?: string) => {
    const now = new Date().toISOString();
    const entryId = id ?? crypto.randomUUID();
    setEntries((prev) => {
      const existing = prev.find((e) => e.id === entryId);
      const entry: JournalEntry = {
        ...input,
        id: entryId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      return existing ? prev.map((e) => (e.id === entryId ? entry : e)) : [entry, ...prev];
    });
    return entryId;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setDraft = useCallback((d: EntryInput | null) => {
    setDraftState(d);
    if (d) saveDraft(d);
    else clearDraft();
  }, []);

  const value = useMemo(
    () => ({ entries, getEntry, saveEntry, deleteEntry, draft, setDraft }),
    [entries, getEntry, saveEntry, deleteEntry, draft, setDraft],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used inside <JournalProvider>');
  return ctx;
}
