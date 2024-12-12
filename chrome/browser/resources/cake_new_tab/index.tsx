import { React, ReactDOM } from '//resources/cake_ui/ui.rollup.js';
import App from './app.js';

// @ts-ignore
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);