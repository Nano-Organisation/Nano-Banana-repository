import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Use uppercase 'App' to match the main component file 'App.tsx' and resolve naming conflicts in case-insensitive environments. */
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