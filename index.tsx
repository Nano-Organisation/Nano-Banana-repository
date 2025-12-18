import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Using uppercase 'App' to resolve casing conflict where both 'App.tsx' and 'app.tsx' are identified as root files. */
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