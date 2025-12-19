import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Changed import to uppercase './App' to resolve TS1149 casing conflict between 'App.tsx' and 'app.tsx'. */
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