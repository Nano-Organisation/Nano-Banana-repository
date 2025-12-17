import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use 'App.tsx' to match the root file casing and avoid conflict with 'app.tsx'.
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