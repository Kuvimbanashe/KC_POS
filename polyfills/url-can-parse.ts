declare global {
  interface URLConstructor {
    canParse(url: string, base?: string): boolean;
  }
}

if (typeof URL !== 'undefined' && typeof URL.canParse !== 'function') {
  Object.defineProperty(URL, 'canParse', {
    value: (input: string, base?: string) => {
      try {
        if (base) {
          // eslint-disable-next-line no-new
          new URL(input, base);
        } else {
          // eslint-disable-next-line no-new
          new URL(input);
        }
        return true;
      } catch {
        return false;
      }
    },
    writable: true,
    configurable: true,
  });
}

export {};

