// Fix: App.tsx (uppercase) is now a proxy for app.tsx (lowercase) which contains the main application logic.
// This resolves casing collisions in environments where both files are treated as root files.
export { default } from './app.tsx';
