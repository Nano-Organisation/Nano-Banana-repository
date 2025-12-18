import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Updated import to lowercase './app' to resolve the casing conflict with 'App.tsx'. */
import App from './app';

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