import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Using explicit extension to resolve filename casing conflicts between 'App.tsx' and 'app.tsx'. */
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