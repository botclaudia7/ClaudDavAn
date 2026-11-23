import { Outlet, useMatch } from 'react-router-dom';
import JournalList from '../components/journal/JournalList';

/** Two panes: entry list + the open entry (or the overview). On phones, one pane at a time. */
export default function JournalLayout() {
  const detailOpen = !!useMatch('/journal/:id');
  return (
    <div className={`split${detailOpen ? ' has-detail' : ''}`}>
      <JournalList />
      <section className="split-detail">
        <Outlet />
      </section>
    </div>
  );
}
