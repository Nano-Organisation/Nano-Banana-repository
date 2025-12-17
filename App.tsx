// Fix: Moved main application logic to app.tsx to resolve casing ambiguity in the build environment.
// App.tsx is now maintained as a delegating shell to ensure consistent casing across system platforms.
export { default } from './app';