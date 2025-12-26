
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use lowercase app.tsx import to resolve casing conflict with the existing app.tsx file and satisfy build environment module resolution.
import App from './app.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
