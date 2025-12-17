import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Changed import to './app' to resolve the casing ambiguity conflict with App.tsx.
// Points to the root-specified app.tsx which now contains the application logic.
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