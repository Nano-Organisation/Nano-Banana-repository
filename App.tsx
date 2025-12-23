// Fix: Changed App.tsx (uppercase) to be a proxy for app.tsx (lowercase) to resolve casing collision errors since app.tsx is a root file for compilation.
export { default } from './app';