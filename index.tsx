import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use lowercase app.tsx to match the root file casing and avoid naming collisions on case-insensitive systems.
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