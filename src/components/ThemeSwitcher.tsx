import { useTheme, type ThemeMode } from '../theme/ThemeContext';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const OPTIONS: { id: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
  { id: 'system', label: 'Auto', Icon: MonitorIcon },
];

/** Three-way Light / Dark / Auto switch (sidebar). */
export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          className={mode === id ? 'active' : ''}
          onClick={() => setMode(id)}
          title={id === 'system' ? 'Match system setting' : `${label} theme`}
        >
          <Icon width={14} height={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Single icon button that flips between light and dark (compact headers). */
export function ThemeToggleButton() {
  const { resolved, toggle } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {resolved === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  );
}
