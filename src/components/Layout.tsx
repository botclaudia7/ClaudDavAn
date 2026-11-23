import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ThemeToggleButton } from './ThemeSwitcher';
import { MenuIcon } from './icons';

interface Toast {
  id: number;
  message: string;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  // On phones the journal editor has its own toolbar with a back button.
  const inJournalDetail = !!useMatch('/journal/:id');

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  // Pages pass `{ state: { flash } }` when navigating to show a confirmation.
  useEffect(() => {
    const flash = (location.state as { flash?: string } | null)?.flash;
    if (!flash) return;
    setToast({ id: Date.now(), message: flash });
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const title = location.pathname.startsWith('/todo')
    ? 'Todo'
    : location.pathname.startsWith('/shopping')
      ? 'Shopping'
      : 'Journal';

  const classes = ['shell'];
  if (sidebarOpen) classes.push('sidebar-open');
  if (inJournalDetail) classes.push('hide-mobile-bar');

  return (
    <div className={classes.join(' ')}>
      <Sidebar onClose={() => setSidebarOpen(false)} />
      <div className="scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <div className="workspace">
        <header className="mobile-bar">
          <button type="button" className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon width={20} height={20} />
          </button>
          <span className="mobile-title">{title}</span>
          <ThemeToggleButton />
        </header>
        <main className="workspace-main">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
