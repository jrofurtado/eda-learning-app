import { useSyncExternalStore } from 'react';

/** Minimal hash router: `#/tree/docker` -> ['tree', 'docker']. Works on any static host. */
function read(): string[] {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

let current = read();
const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  current = read();
  listeners.forEach((l) => l());
});

export function useRoute(): string[] {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => current,
  );
}

export function navigate(...parts: (string | number)[]) {
  window.location.hash = '/' + parts.map((p) => encodeURIComponent(String(p))).join('/');
}
