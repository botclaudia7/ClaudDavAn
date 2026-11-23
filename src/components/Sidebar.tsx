import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useJournal } from '../journal/JournalContext';
import { sortEntries } from '../journal/stats';
import { formatShortDate, toISODate } from '../lib/dates';
import { useShopping } from '../shopping/ShoppingContext';
import { useTodos } from '../todo/TodoContext';
import { DEFAULT_FILTERS, isOverdue, matchesFilters } from '../todo/logic';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  AlertIcon,
  BookIcon,
  CalendarIcon,
  CartIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ClockIcon,
  PenIcon,
  PlusIcon,
  XIcon,
} from './icons';

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  sub?: boolean;
  tone?: 'danger';
}

function NavItem({ to, icon, label, count, active, sub, tone }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`sb-link${sub ? ' sb-link-sub' : ''}${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span className="sb-link-label">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`sb-count${tone ? ` ${tone}` : ''}`}>{count}</span>
      )}
    </Link>
  );
}

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { entries } = useJournal();
  const { todos } = useTodos();
  const { items: shoppingItems } = useShopping();
  const toBuy = shoppingItems.filter((i) => !i.checked).length;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const today = toISODate();
  const open = todos.filter((t) => !t.completed);
  const dueToday = open.filter((t) => t.due === today).length;
  const upcoming = open.filter((t) => matchesFilters(t, { ...DEFAULT_FILTERS, due: 'upcoming' }, today)).length;
  const overdue = open.filter((t) => isOverdue(t, today)).length;

  const onJournal = location.pathname.startsWith('/journal');
  const onTodo = location.pathname.startsWith('/todo');
  const due = onTodo ? new URLSearchParams(location.search).get('due') : null;
  const recent = sortEntries(entries).slice(0, 4);

  const create = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sb-header">
        <Link to="/journal" className="sb-brand">
          <span className="brand-mark" aria-hidden="true">D</span>
          Daybook
        </Link>
        <button type="button" className="icon-btn sb-close" onClick={onClose} aria-label="Close menu">
          <XIcon width={18} height={18} />
        </button>
      </div>

      <div className="sb-new" ref={menuRef}>
        <button
          type="button"
          className="sb-new-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <PlusIcon width={18} height={18} />
          New
          <ChevronDownIcon width={15} height={15} className="sb-new-chevron" />
        </button>
        {menuOpen && (
          <div className="menu" role="menu">
            <button type="button" role="menuitem" className="menu-item" onClick={() => create('/journal/new')}>
              <PenIcon width={16} height={16} />
              Journal entry
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={() => create('/todo?new=1')}>
              <CheckSquareIcon width={16} height={16} />
              Task
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={() => create('/shopping?new=1')}>
              <CartIcon width={16} height={16} />
              Shopping item
            </button>
          </div>
        )}
      </div>

      <nav className="sb-nav" aria-label="Main">
        <NavItem
          to="/journal"
          icon={<BookIcon width={17} height={17} />}
          label="Journal"
          count={entries.length}
          active={onJournal}
        />
        <NavItem
          to="/todo"
          icon={<CheckSquareIcon width={17} height={17} />}
          label="Todo"
          count={open.length}
          active={onTodo && !due}
        />
        <NavItem
          sub
          to="/todo?due=today"
          icon={<CalendarIcon width={15} height={15} />}
          label="Today"
          count={dueToday}
          active={due === 'today'}
        />
        <NavItem
          sub
          to="/todo?due=upcoming"
          icon={<ClockIcon width={15} height={15} />}
          label="Upcoming"
          count={upcoming}
          active={due === 'upcoming'}
        />
        <NavItem
          sub
          to="/todo?due=overdue"
          icon={<AlertIcon width={15} height={15} />}
          label="Overdue"
          count={overdue}
          tone="danger"
          active={due === 'overdue'}
        />
        <NavItem
          to="/shopping"
          icon={<CartIcon width={17} height={17} />}
          label="Shopping"
          count={toBuy}
          active={location.pathname.startsWith('/shopping')}
        />
      </nav>

      {recent.length > 0 && (
        <div className="sb-section">
          <div className="sb-section-title">Recent entries</div>
          {recent.map((e) => (
            <Link
              key={e.id}
              to={`/journal/${e.id}`}
              className={`sb-recent${location.pathname === `/journal/${e.id}` ? ' active' : ''}`}
            >
              <span className="sb-recent-title">{e.title || 'Untitled entry'}</span>
              <span className="sb-recent-date">{formatShortDate(e.date)}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="sb-footer">
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
