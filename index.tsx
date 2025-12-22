
import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Changed import to lowercase './app.tsx' to match the root-level included file and resolve casing collisions in strict environments. */
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
