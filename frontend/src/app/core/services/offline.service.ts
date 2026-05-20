import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type NetworkStatus = 'online' | 'offline' | 'slow';

interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  private platformId = inject(PLATFORM_ID);

  // Signals
  public networkInfo = signal<NetworkInfo>({ status: 'online' });
  public isOnline = signal(true);
  public pendingRequests = signal<PendingRequest[]>([]);

  private dbName = 'ClassyBookOfflineDB';
  private storeName = 'pendingRequests';
  private db: IDBDatabase | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initNetworkListeners();
      this.initDatabase();
    }
  }

  /**
   * تخزين بيانات للاستخدام دون اتصال
   */
  async cacheData(key: string, data: any): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * استرجاع البيانات المخزنة
   */
  getCachedData<T>(key: string, maxAge?: number): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);

      if (maxAge && Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * إضافة طلب للقائمة المعلقة
   */
  async queueRequest(request: Omit<PendingRequest, 'id' | 'timestamp'>): Promise<string> {
    const pendingRequest: PendingRequest = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...request,
    };

    // حفظ في IndexedDB
    await this.saveToDatabase(pendingRequest);

    // تحديث Signal
    this.pendingRequests.update((requests) => [...requests, pendingRequest]);

    return pendingRequest.id;
  }

  /**
   * تنفيذ الطلبات المعلقة عند العودة للاتصال
   */
  async processPendingRequests(): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    const pending = this.pendingRequests();

    for (const request of pending) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          results.success.push(request.id);
          await this.removeFromDatabase(request.id);
        } else {
          results.failed.push(request.id);
        }
      } catch (error) {
        results.failed.push(request.id);
      }
    }

    // تحديث القائمة
    this.pendingRequests.update((requests) =>
      requests.filter((r) => !results.success.includes(r.id)),
    );

    return results;
  }

  /**
   * التحقق من جودة الاتصال
   */
  getConnectionQuality(): 'good' | 'moderate' | 'poor' | 'offline' {
    const info = this.networkInfo();

    if (info.status === 'offline') return 'offline';
    if (info.effectiveType === '4g' && (info.downlink || 0) > 5) return 'good';
    if (info.effectiveType === '4g' || info.effectiveType === '3g') return 'moderate';
    return 'poor';
  }

  /**
   * تهيئة مستمعي الشبكة
   */
  private initNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.updateNetworkInfo();
      this.processPendingRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.networkInfo.update((info) => ({ ...info, status: 'offline' }));
    });

    // Network Information API
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => this.updateNetworkInfo());
      this.updateNetworkInfo();
    }
  }

  /**
   * تحديث معلومات الشبكة
   */
  private updateNetworkInfo(): void {
    const connection = (navigator as any).connection;

    if (connection) {
      const status: NetworkStatus = !navigator.onLine
        ? 'offline'
        : connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
          ? 'slow'
          : 'online';

      this.networkInfo.set({
        status,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    } else {
      this.networkInfo.set({
        status: navigator.onLine ? 'online' : 'offline',
      });
    }
  }

  /**
   * تهيئة قاعدة البيانات
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        this.loadPendingRequests();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * حفظ في قاعدة البيانات
   */
  private async saveToDatabase(request: PendingRequest): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const req = store.add(request);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  /**
   * حذف من قاعدة البيانات
   */
  private async removeFromDatabase(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const req = store.delete(id);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  /**
   * تحميل الطلبات المعلقة
   */
  private async loadPendingRequests(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      this.pendingRequests.set(request.result);
    };
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
