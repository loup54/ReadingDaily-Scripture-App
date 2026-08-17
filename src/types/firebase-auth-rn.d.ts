/**
 * `getReactNativePersistence` is a real runtime export of `firebase/auth`'s
 * React Native build (`@firebase/auth`'s `"react-native"` package.json field,
 * which Metro resolves to `dist/rn/index.js`) — but the `firebase` umbrella
 * package's own `"./auth"` export map only declares `node`/`browser`/`default`
 * conditions, so `tsc`'s Node-style module resolution always sees the web
 * build's types, which don't include it. This augmentation fills the gap for
 * the type checker only; it doesn't change what actually gets bundled.
 */
export {};

declare module 'firebase/auth' {
  import type { Persistence } from 'firebase/auth';
  export function getReactNativePersistence(storage: unknown): Persistence;
}
