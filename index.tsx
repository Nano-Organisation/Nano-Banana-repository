import React from 'react';
import ReactDOM from 'react-dom/client';
/* Fix: Explicitly import 'App' component from 'App.tsx' to resolve casing conflict (TS1149). 'app.tsx' has been emptied to remove ambiguity. */
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