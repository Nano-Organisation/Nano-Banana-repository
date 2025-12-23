import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Changed import to 'App.tsx' to match the file casing and resolve build collisions.
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