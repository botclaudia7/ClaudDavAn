export type MoodId = 'great' | 'good' | 'okay' | 'low' | 'rough';

export interface Mood {
  id: MoodId;
  label: string;
  emoji: string;
  score: number;
}

export const MOODS: Mood[] = [
  { id: 'great', label: 'Great', emoji: '😄', score: 5 },
  { id: 'good', label: 'Good', emoji: '🙂', score: 4 },
  { id: 'okay', label: 'Okay', emoji: '😐', score: 3 },
  { id: 'low', label: 'Low', emoji: '😔', score: 2 },
  { id: 'rough', label: 'Rough', emoji: '😣', score: 1 },
];

export const moodById = (id: MoodId | null | undefined) => MOODS.find((m) => m.id === id);

export const moodByScore = (score: number) =>
  MOODS.find((m) => m.score === Math.min(5, Math.max(1, Math.round(score))));

export const ENERGY_LABELS = ['Drained', 'Tired', 'Steady', 'Energized', 'Buzzing'];

export const WRITING_PROMPTS = [
  'What happened today?',
  'What’s on your mind right now?',
  'What made you smile today?',
  'What challenged you, and how did you handle it?',
  'What did you learn today?',
  'What would make tomorrow great?',
  'Describe a moment you want to remember.',
  'What are you looking forward to?',
];
