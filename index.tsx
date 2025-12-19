import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Changed import to './App' to match the root filename and resolve casing conflicts on case-insensitive systems. */
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
