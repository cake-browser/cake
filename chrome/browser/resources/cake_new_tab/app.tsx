import { React, useContext, useEffect, themes, ThemeProvider, ThemeContext, Icon } from '//resources/ui/ui.rollup.js';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  // Update the data-theme attribute on the documentElement whenever the theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
  }, [theme]);

  // Handler to change the theme based on user selection
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = themes.find(t => t.value === event.target.value);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor="theme-select">Choose Theme: </label>
      <select id="theme-select" value={theme.value} onChange={handleThemeChange}>
        {themes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const AppContent = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <Icon name="search" />
      <ThemeSwitcher />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;