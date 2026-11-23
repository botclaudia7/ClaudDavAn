import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TagInput from '../components/TagInput';
import {
  CalendarIcon,
  ChevronLeftIcon,
  HeartIcon,
  SmileIcon,
  TagIcon,
  TrashIcon,
  ZapIcon,
} from '../components/icons';
import EnergyPicker from '../components/journal/EnergyPicker';
import MoodPicker from '../components/journal/MoodPicker';
import { useJournal } from '../journal/JournalContext';
import { emptyInput, isBlank, toInput } from '../journal/entry';
import { WRITING_PROMPTS } from '../journal/moods';
import { tagsByFrequency } from '../journal/stats';
import type { EntryInput } from '../journal/types';
import { formatLongDate, relativeTime, toISODate } from '../lib/dates';

const AUTOSAVE_DELAY = 700;

/**
 * Existing entries save automatically as you type.
 * New entries are kept as a draft until "Save entry" is pressed.
 */
export default function JournalEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { entries, getEntry, saveEntry, deleteEntry, draft, setDraft } = useJournal();
  const existing = id ? getEntry(id) : undefined;

  const [form, setForm] = useState<EntryInput>(() =>
    existing ? toInput(existing) : { ...emptyInput(), ...draft },
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length));
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<EntryInput | null>(null);

  const tagSuggestions = useMemo(() => tagsByFrequency(entries), [entries]);
  const canSave = !isBlank(form);

  const flush = () => {
    const f = pending.current;
    if (!f) return;
    pending.current = null;
    if (isNew) setDraft(isBlank(f) ? null : f);
    else if (id) saveEntry(f, id);
    setSaving(false);
    setSavedAt(new Date());
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  // Save anything pending when leaving the editor.
  useEffect(() => () => flushRef.current(), []);

  // Debounced autosave.
  useEffect(() => {
    if (!saving) return;
    const t = setTimeout(() => flushRef.current(), AUTOSAVE_DELAY);
    return () => clearTimeout(t);
  }, [form, saving]);

  const update = (patch: Partial<EntryInput>) => {
    const next = { ...form, ...patch };
    pending.current = next;
    setForm(next);
    setSaving(true);
  };

  // Grow the writing area with its content.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [form.body]);

  const handleSaveNew = () => {
    if (!canSave) return;
    pending.current = null;
    const newId = saveEntry({ ...form, title: form.title.trim(), gratitude: form.gratitude.trim() });
    setDraft(null);
    navigate(`/journal/${newId}`, { replace: true, state: { flash: 'Entry saved' } });
  };

  const handleDelete = () => {
    pending.current = null;
    if (isNew) {
      setDraft(null);
      navigate('/journal', { state: { flash: 'Draft discarded' } });
    } else if (id) {
      deleteEntry(id);
      navigate('/journal', { state: { flash: 'Entry deleted' } });
    }
  };

  // Ctrl/Cmd + Enter: save the new entry, or save edits right away.
  const shortcutRef = useRef(() => {});
  useEffect(() => {
    shortcutRef.current = isNew ? handleSaveNew : () => flushRef.current();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        shortcutRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (id && !existing) {
    return (
      <div className="detail-empty">
        <h2>Entry not found</h2>
        <p className="muted">It may have been deleted.</p>
        <Link to="/journal" className="btn btn-secondary btn-sm">
          Back to journal
        </Link>
      </div>
    );
  }

  const words = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;
  const status = isNew
    ? saving
      ? 'Saving draft…'
      : savedAt
        ? 'Draft saved'
        : 'New entry'
    : saving
      ? 'Saving…'
      : savedAt
        ? 'Saved'
        : `Edited ${relativeTime(existing!.updatedAt)}`;

  return (
    <div className="detail">
      <div className="detail-toolbar">
        <Link to="/journal" className="icon-btn mobile-back" aria-label="Back to journal">
          <ChevronLeftIcon width={20} height={20} />
        </Link>

        <label className="date-chip">
          <CalendarIcon width={14} height={14} />
          <span>{formatLongDate(form.date)}</span>
          <input
            type="date"
            value={form.date}
            max={toISODate()}
            onChange={(e) => e.target.value && update({ date: e.target.value })}
            aria-label="Entry date"
          />
        </label>

        <span className={`save-status${saving ? ' is-saving' : ''}`} aria-live="polite">
          {status}
        </span>

        <div className="toolbar-actions">
          {confirming ? (
            <>
              <span className="confirm-text">{isNew ? 'Discard draft?' : 'Delete entry?'}</span>
              <button type="button" className="btn btn-sm btn-danger" onClick={handleDelete}>
                {isNew ? 'Discard' : 'Delete'}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {(!isNew || canSave) && (
                <button
                  type="button"
                  className="icon-btn danger-hover"
                  onClick={() => setConfirming(true)}
                  aria-label={isNew ? 'Discard draft' : 'Delete entry'}
                  title={isNew ? 'Discard draft' : 'Delete entry'}
                >
                  <TrashIcon width={17} height={17} />
                </button>
              )}
              {isNew && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveNew}
                  disabled={!canSave}
                  title="Save (Ctrl+Enter)"
                >
                  Save entry
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="detail-scroll">
        <article className="doc">
          <input
            className="doc-title"
            placeholder="Untitled"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            aria-label="Title"
          />

          <div className="doc-props">
            <div className="prop">
              <span className="prop-label">
                <SmileIcon width={15} height={15} />
                Mood
              </span>
              <MoodPicker value={form.mood} onChange={(mood) => update({ mood })} />
            </div>
            <div className="prop">
              <span className="prop-label">
                <ZapIcon width={15} height={15} />
                Energy
              </span>
              <EnergyPicker value={form.energy} onChange={(energy) => update({ energy })} />
            </div>
            <div className="prop">
              <span className="prop-label">
                <HeartIcon width={15} height={15} />
                Grateful for
              </span>
              <input
                className="prop-input"
                placeholder="One good thing from today"
                value={form.gratitude}
                onChange={(e) => update({ gratitude: e.target.value })}
                aria-label="Grateful for"
              />
            </div>
            <div className="prop">
              <span className="prop-label">
                <TagIcon width={15} height={15} />
                Tags
              </span>
              <TagInput value={form.tags} onChange={(tags) => update({ tags })} suggestions={tagSuggestions} />
            </div>
          </div>

          <textarea
            ref={bodyRef}
            className="doc-body"
            placeholder={WRITING_PROMPTS[promptIndex]}
            value={form.body}
            onChange={(e) => update({ body: e.target.value })}
            aria-label="Entry"
            autoFocus={isNew}
          />

          <div className="doc-footer">
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setPromptIndex((i) => (i + 1) % WRITING_PROMPTS.length)}
            >
              ↻ New prompt
            </button>
            <span>
              {words} {words === 1 ? 'word' : 'words'}
              <span className="desktop-only">
                {' · '}
                <kbd>Ctrl</kbd> <kbd>Enter</kbd> {isNew ? 'to save' : 'to save now'}
              </span>
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
