// Fix: Moved main application logic to App.tsx to resolve casing ambiguity in the build environment.
// app.tsx is now maintained as a delegating shell to ensure consistent casing.
export { default } from './App';
