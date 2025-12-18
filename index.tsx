import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Import from lowercase 'app.tsx' to match root file casing and resolve casing conflict.
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