import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Import from './App' (PascalCase) to match the root file casing specified for compilation and resolve casing conflicts. */
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