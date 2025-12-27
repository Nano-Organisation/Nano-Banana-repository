import React from 'react';
import ReactDOM from 'react-dom/client';
// Standardizing on App.tsx to resolve collision with app.tsx
// Fix: Removed .tsx extension to allow standard resolution and avoid casing conflict.
import App from './App';

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