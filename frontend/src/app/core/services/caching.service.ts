import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🗄️ Caching Service
 * خدمة التخزين المؤقت للبيانات (Memory + LocalStorage + IndexedDB)
 */
@Injectable({
  providedIn: 'root',
})
export class CachingService {
  private isBrowser: boolean;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private dbName = 'ClassyBookCache';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initIndexedDB();
    }
  }

  // ==========================================
  // 🧠 Memory Cache (الأسرع - للبيانات المؤقتة)
  // ==========================================

  /**
   * تخزين في الذاكرة
   */
  setMemory<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const item: CacheItem<T> = {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
      timestamp: Date.now(),
    };
    this.memoryCache.set(key, item);
  }

  /**
   * استرجاع من الذاكرة
   */
  getMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * حذف من الذاكرة
   */
  deleteMemory(key: string): void {
    this.memoryCache.delete(key);
  }

  /**
   * مسح كل الذاكرة
   */
  clearMemory(): void {
    this.memoryCache.clear();
  }

  // ==========================================
  // 💾 LocalStorage (للبيانات الصغيرة الدائمة)
  // ==========================================

  /**
   * تخزين في LocalStorage
   */
  setLocal<T>(key: string, value: T, ttlSeconds?: number): void {
    if (!this.isBrowser) return;

    const item: CacheItem<T> = {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      // التخزين ممتلئ - حذف العناصر القديمة
      this.cleanupLocalStorage();
      try {
        localStorage.setItem(key, JSON.stringify(item));
      } catch {
        console.warn('LocalStorage is full');
      }
    }
  }

  /**
   * استرجاع من LocalStorage
   */
  getLocal<T>(key: string): T | null {
    if (!this.isBrowser) return null;

    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const item: CacheItem<T> = JSON.parse(data);

      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  }

  /**
   * حذف من LocalStorage
   */
  deleteLocal(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }

  /**
   * مسح LocalStorage
   */
  clearLocal(): void {
    if (!this.isBrowser) return;
    localStorage.clear();
  }

  /**
   * تنظيف العناصر المنتهية
   */
  private cleanupLocalStorage(): void {
    if (!this.isBrowser) return;

    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const item = JSON.parse(data);
            if (item.expiry && Date.now() > item.expiry) {
              keysToDelete.push(key);
            }
          }
        } catch {
          // تجاهل العناصر غير الصالحة
        }
      }
    }

    keysToDelete.forEach((key) => localStorage.removeItem(key));
  }

  // ==========================================
  // 🗃️ IndexedDB (للبيانات الكبيرة)
  // ==========================================

  /**
   * تهيئة IndexedDB
   */
  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser || !('indexedDB' in window)) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * تخزين في IndexedDB
   */
  async setIndexedDB<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.db) return;

    const item: IndexedDBItem<T> = {
      key,
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * استرجاع من IndexedDB
   */
  async getIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as IndexedDBItem<T>;
        if (!item) {
          resolve(null);
          return;
        }

        if (item.expiry && Date.now() > item.expiry) {
          this.deleteIndexedDB(key);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * حذف من IndexedDB
   */
  async deleteIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * مسح IndexedDB
   */
  async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // 🔄 Smart Cache (اختيار تلقائي للمخزن)
  // ==========================================

  /**
   * تخزين ذكي - يختار المخزن المناسب تلقائياً
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300, persist = false, size = 'auto' } = options;

    // تخزين في الذاكرة دائماً للسرعة
    this.setMemory(key, value, ttl);

    if (persist) {
      const dataSize = JSON.stringify(value).length;

      // أقل من 5KB -> LocalStorage
      // أكثر من 5KB -> IndexedDB
      if (size === 'small' || (size === 'auto' && dataSize < 5000)) {
        this.setLocal(key, value, ttl);
      } else {
        await this.setIndexedDB(key, value, ttl);
      }
    }
  }

  /**
   * استرجاع ذكي
   */
  async get<T>(key: string): Promise<T | null> {
    // أولاً: الذاكرة (الأسرع)
    const memoryResult = this.getMemory<T>(key);
    if (memoryResult !== null) return memoryResult;

    // ثانياً: LocalStorage
    const localResult = this.getLocal<T>(key);
    if (localResult !== null) {
      // إعادة التخزين في الذاكرة
      this.setMemory(key, localResult);
      return localResult;
    }

    // ثالثاً: IndexedDB
    const indexedDBResult = await this.getIndexedDB<T>(key);
    if (indexedDBResult !== null) {
      // إعادة التخزين في الذاكرة
      this.setMemory(key, indexedDBResult);
      return indexedDBResult;
    }

    return null;
  }

  /**
   * حذف من كل المخازن
   */
  async delete(key: string): Promise<void> {
    this.deleteMemory(key);
    this.deleteLocal(key);
    await this.deleteIndexedDB(key);
  }

  /**
   * مسح كل المخازن
   */
  async clearAll(): Promise<void> {
    this.clearMemory();
    this.clearLocal();
    await this.clearIndexedDB();
  }

  /**
   * الحصول على حجم الكاش
   */
  getCacheStats(): CacheStats {
    return {
      memoryItems: this.memoryCache.size,
      localStorageItems: this.isBrowser ? localStorage.length : 0,
      localStorageSize: this.isBrowser ? new Blob(Object.values(localStorage)).size : 0,
    };
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface CacheItem<T> {
  value: T;
  expiry: number | null;
  timestamp: number;
}

interface IndexedDBItem<T> extends CacheItem<T> {
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live بالثواني
  persist?: boolean; // تخزين دائم؟
  size?: 'small' | 'large' | 'auto';
}

interface CacheStats {
  memoryItems: number;
  localStorageItems: number;
  localStorageSize: number;
}
