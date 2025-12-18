// Fix: Re-exporting from lowercase app.tsx to resolve casing conflicts 
// between physical files and module resolution in case-insensitive environments.
export { default } from './app.tsx';