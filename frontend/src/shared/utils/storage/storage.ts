/**
 * ブラウザストレージの型安全なラッパー
 */
class Storage {
  private storage: globalThis.Storage;

  constructor(storage: globalThis.Storage) {
    this.storage = storage;
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      // ストレージへの書き込み失敗（容量超過等）
    }
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// サーバーサイドレンダリング対応
const isBrowser = typeof window !== 'undefined';

export const localStorage = isBrowser ? new Storage(window.localStorage) : null;
export const sessionStorage = isBrowser
  ? new Storage(window.sessionStorage)
  : null;
