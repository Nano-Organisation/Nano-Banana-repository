// Fix: Re-exporting from capitalized App.tsx to resolve casing conflicts 
// between physical files and module resolution in case-insensitive environments.
export { default } from './App.tsx';