import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Standardized on lowercase 'app.tsx' to resolve casing conflicts 
// between physical files and module resolution in case-insensitive environments.
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