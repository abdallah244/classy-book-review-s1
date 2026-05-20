import { Injectable, signal, computed, effect } from '@angular/core';

interface StateConfig<T> {
  key: string;
  defaultValue: T;
  persist?: boolean;
  ttl?: number; // Time to live in milliseconds
}

interface StoredState<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

@Injectable({
  providedIn: 'root',
})
export class StateStoreService {
  private stores = new Map<string, ReturnType<typeof signal>>();

  /**
   * إنشاء أو الحصول على store
   */
  createStore<T>(config: StateConfig<T>) {
    const { key, defaultValue, persist = false, ttl } = config;

    // التحقق من وجود store مسبقاً
    if (this.stores.has(key)) {
      return this.stores.get(key) as ReturnType<typeof signal<T>>;
    }

    // استرجاع القيمة المحفوظة
    let initialValue = defaultValue;
    if (persist) {
      const stored = this.loadFromStorage<T>(key);
      if (stored !== null) {
        initialValue = stored;
      }
    }

    // إنشاء signal
    const store = signal<T>(initialValue);
    this.stores.set(key, store);

    // حفظ التغييرات تلقائياً
    if (persist) {
      effect(() => {
        this.saveToStorage(key, store(), ttl);
      });
    }

    return store;
  }

  /**
   * الحصول على store موجود
   */
  getStore<T>(key: string): ReturnType<typeof signal<T>> | undefined {
    return this.stores.get(key) as ReturnType<typeof signal<T>> | undefined;
  }

  /**
   * تحديث قيمة store
   */
  update<T>(key: string, updater: (current: T) => T): void {
    const store = this.stores.get(key);
    if (store) {
      (store as ReturnType<typeof signal<T>>).update(updater as (value: T) => T);
    }
  }

  /**
   * تعيين قيمة جديدة
   */
  set<T>(key: string, value: T): void {
    const store = this.stores.get(key);
    if (store) {
      store.set(value);
    }
  }

  /**
   * الحصول على القيمة الحالية
   */
  get<T>(key: string): T | undefined {
    const store = this.stores.get(key);
    return store ? (store() as T) : undefined;
  }

  /**
   * إعادة تعيين store للقيمة الافتراضية
   */
  reset(key: string, defaultValue: any): void {
    const store = this.stores.get(key);
    if (store) {
      store.set(defaultValue);
    }
  }

  /**
   * حذف store
   */
  remove(key: string): void {
    this.stores.delete(key);
    localStorage.removeItem(`state_${key}`);
    sessionStorage.removeItem(`state_${key}`);
  }

  /**
   * مسح جميع الـ stores
   */
  clear(): void {
    this.stores.forEach((_, key) => {
      localStorage.removeItem(`state_${key}`);
      sessionStorage.removeItem(`state_${key}`);
    });
    this.stores.clear();
  }

  /**
   * إنشاء selector (computed)
   */
  select<T, R>(key: string, selector: (state: T) => R) {
    const store = this.stores.get(key);
    if (!store) {
      throw new Error(`Store "${key}" not found`);
    }
    return computed(() => selector(store() as T));
  }

  /**
   * حفظ في Storage
   */
  private saveToStorage<T>(key: string, value: T, ttl?: number): void {
    const data: StoredState<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    try {
      localStorage.setItem(`state_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  /**
   * استرجاع من Storage
   */
  private loadFromStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`state_${key}`);
      if (!stored) return null;

      const data: StoredState<T> = JSON.parse(stored);

      // التحقق من انتهاء الصلاحية
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        localStorage.removeItem(`state_${key}`);
        return null;
      }

      return data.value;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }

  /**
   * إنشاء store مع actions
   */
  createStoreWithActions<T, A extends Record<string, (state: T, ...args: any[]) => T>>(
    config: StateConfig<T>,
    actions: A,
  ) {
    const store = this.createStore(config);

    const boundActions = {} as {
      [K in keyof A]: (
        ...args: Parameters<A[K]> extends [T, ...infer Rest] ? Rest : never[]
      ) => void;
    };

    for (const [name, action] of Object.entries(actions)) {
      (boundActions as any)[name] = (...args: any[]) => {
        store.update((state) => action(state, ...args));
      };
    }

    return {
      state: store.asReadonly(),
      actions: boundActions,
      update: store.update.bind(store),
      set: store.set.bind(store),
    };
  }
}
