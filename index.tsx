import React from 'react';
import ReactDOM from 'react-dom/client';
// Standardizing on app.tsx to resolve collision with App.tsx.
// Fix: Importing from lowercase './app' to match root file casing and resolve collision.
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