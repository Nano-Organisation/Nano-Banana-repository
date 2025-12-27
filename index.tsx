import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Standardizing on capitalized 'App' to ensure consistency with the App.tsx file name
// and resolving the casing collision error reported in the build logs.
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