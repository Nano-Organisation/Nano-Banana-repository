import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use 'App.tsx' to resolve casing conflicts with 'app.tsx' where both exist in the program.
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
