import { 
  React, 
  useContext, 
  useEffect, 
  ThemeProvider, 
  ThemeContext,
} from 'resources/cake_ui/ui.rollup.js';
import { Card } from './components/Card.js';

const Content = () => {
  const { theme } = useContext(ThemeContext);

  // Theme updates.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
  }, [theme]);

  return (
    <div>
      <h1>Hello Ben!</h1>
      <Card />
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <Content />
    </ThemeProvider>
  );
};