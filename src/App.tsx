import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import JournalEditorPage from './pages/JournalEditorPage';
import JournalLayout from './pages/JournalLayout';
import JournalOverview from './pages/JournalOverview';
import ShoppingPage from './pages/ShoppingPage';
import TodoPage from './pages/TodoPage';

/** Remount the editor per entry so switching entries never carries state over. */
function JournalEditorRoute() {
  const { id } = useParams();
  return <JournalEditorPage key={id ?? 'new'} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/journal" replace />} />
        <Route path="journal" element={<JournalLayout />}>
          <Route index element={<JournalOverview />} />
          <Route path="new" element={<JournalEditorRoute />} />
          <Route path=":id" element={<JournalEditorRoute />} />
        </Route>
        <Route path="todo" element={<TodoPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="*" element={<Navigate to="/journal" replace />} />
      </Route>
    </Routes>
  );
}
