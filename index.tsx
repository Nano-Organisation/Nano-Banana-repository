import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Use uppercase 'App' to resolve naming conflicts between app.tsx and App.tsx in case-insensitive environments. */
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