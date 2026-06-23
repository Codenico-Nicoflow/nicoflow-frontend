import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App.tsx';

// Side-effect import: initialises i18next (detector + RTL <html> sync) before
// the app renders, so the first paint is already in the user's language.
import './lib/i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>
);
