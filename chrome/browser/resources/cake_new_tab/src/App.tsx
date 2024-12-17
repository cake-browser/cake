import { ThemeProvider } from 'resources/cake_ui/ui.rollup.js';
import { PageManager } from './pages/PageManager.js'

export const App = () => {
  return (
    <ThemeProvider>
      <PageManager />
    </ThemeProvider>
  );
};