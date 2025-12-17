import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Changed import to './App' to resolve the casing ambiguity conflict with app.tsx.
// Points to the root-specified App.tsx which now contains the application logic.
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
