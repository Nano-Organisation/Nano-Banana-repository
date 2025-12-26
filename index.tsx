import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Ensured import matches App.tsx casing exactly to avoid conflicts with app.tsx on case-insensitive systems.
import App from './App.tsx';

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