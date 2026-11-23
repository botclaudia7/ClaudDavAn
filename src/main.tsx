import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { JournalProvider } from './journal/JournalContext';
import { ShoppingProvider } from './shopping/ShoppingContext';
import { ThemeProvider } from './theme/ThemeContext';
import { TodoProvider } from './todo/TodoContext';
import './styles/global.css';
import './styles/shell.css';
import './styles/journal.css';
import './styles/todo.css';
import './styles/shopping.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <JournalProvider>
          <TodoProvider>
            <ShoppingProvider>
              <App />
            </ShoppingProvider>
          </TodoProvider>
        </JournalProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
