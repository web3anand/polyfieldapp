// Lightweight console & window property filters used by the app.
// Purpose: provide a safe `initConsoleFilters` export so imports in
// `main.tsx` succeed, and to reduce noisy but harmless console output
// during development. This file intentionally keeps behavior minimal
// and defensive to avoid errors like "Cannot redefine property: ethereum".

export function initConsoleFilters(): void {
  if (typeof window === 'undefined') return;

  try {
    // Protect against multiple injection attempts that try to redefine
    // well-known window properties. Many extension/injection scripts
    // call Object.defineProperty(window, 'ethereum', ...) and will throw
    // if the property is already non-configurable. We avoid touching it
    // here and instead define helpers only when safe.
    const safeDefine = (obj: any, prop: string, descriptor: PropertyDescriptor) => {
      try {
        const current = Object.getOwnPropertyDescriptor(obj, prop);
        if (current && !current.configurable) {
          // Don't attempt to redefine non-configurable properties.
          return;
        }
        Object.defineProperty(obj, prop, descriptor);
      } catch (e) {
        // Swallow to avoid breaking page scripts; this keeps behavior
        // resilient if extensions have already locked down properties.
      }
    };

    // Example: if some code expects a read-only flag present, we can add
    // a harmless marker only if it doesn't exist and is safe to add.
    if (!('isZerion' in window)) {
      safeDefine(window, 'isZerion', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: false,
      });
    }

    // Suppress known noisy console messages in development.
    // Wrap console methods to filter messages matching patterns.
    const patterns: RegExp[] = [
      /Pocket Universe is running/i,
      /Backpack couldn't override `window.ethereum`/i,
      /Cannot redefine property: ethereum/i,
      /origins don't match.*localhost.*auth\.privy\.io/i,
      /origins don't match.*auth\.privy\.io.*localhost/i,
      /Skipping API call to.*no backend configured/i,
    ];

    const consoleMethods = ['log', 'info', 'warn', 'error'] as const;
    consoleMethods.forEach((method) => {
      const orig = (console as any)[method];
      if (typeof orig !== 'function') return;
      (console as any)[method] = function (...args: any[]) {
        try {
          const msg = args.map((a) => (typeof a === 'string' ? a : '')) .join(' ');
          for (const p of patterns) {
            if (p.test(msg)) return; // swallow matched message
          }
        } catch (e) {
          // ignore filtering errors
        }
        return orig.apply(console, args);
      };
    });

    // Add global error handlers to prevent noisy injection errors from
    // surfacing as uncaught exceptions in the dev console. We only
    // preventDefault for known harmless messages to avoid hiding real
    // problems.
    const errorPatterns: RegExp[] = [
      /Cannot redefine property:\s*ethereum/i,
      /Cannot redefine property:\s*isZerion/i,
      /Backpack couldn't override `window.ethereum`/i,
      /origins don't match/i,
      /WebSocket connection.*failed/i,
    ];

    const shouldSuppress = (message: string | null | undefined) => {
      if (!message) return false;
      try {
        return errorPatterns.some((p) => p.test(message));
      } catch (e) {
        return false;
      }
    };

    window.addEventListener('error', (ev: ErrorEvent) => {
      if (shouldSuppress(ev.message)) {
        ev.preventDefault();
      }
    });

    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      const msg = typeof reason === 'string' ? reason : (reason && reason.message) ? reason.message : '';
      if (shouldSuppress(msg)) {
        ev.preventDefault();
      }
    });
  } catch (e) {
    // If anything fails, don't break the app. The goal is only to reduce
    // noise and avoid throwing during import.
  }
}

export default initConsoleFilters;

