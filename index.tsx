import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Updated import to use lowercase 'app' to match the Root file specified for compilation and resolve casing collision.
import App from './app';

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
