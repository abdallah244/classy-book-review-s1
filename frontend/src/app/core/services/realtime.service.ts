import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { takeUntil, map, filter, share, debounceTime } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface RealtimeConfig {
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

interface RealtimeMessage<T = any> {
  event: string;
  data: T;
  timestamp: number;
  roomId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private platformId = inject(PLATFORM_ID);

  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();

  // Signals
  public isConnected = signal(false);
  public connectionState = signal<'connecting' | 'connected' | 'disconnected' | 'error'>(
    'disconnected',
  );

  // Subjects للأحداث
  private messageSubject = new Subject<RealtimeMessage>();
  public messages$ = this.messageSubject.asObservable().pipe(share());

  /**
   * الاتصال بالخادم
   */
  connect(config: RealtimeConfig = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket?.connected) return;

    this.connectionState.set('connecting');

    this.socket = io((environment as any).wsUrl || environment.apiUrl, {
      reconnection: config.reconnection ?? true,
      reconnectionAttempts: config.reconnectionAttempts ?? 5,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      timeout: config.timeout ?? 20000,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
  }

  /**
   * قطع الاتصال
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.destroy$.next();
    this.isConnected.set(false);
    this.connectionState.set('disconnected');
  }

  /**
   * الانضمام لغرفة
   */
  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  /**
   * مغادرة غرفة
   */
  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  /**
   * إرسال حدث
   */
  emit<T>(event: string, data: T): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * الاستماع لحدث معين
   */
  on<T>(event: string): Observable<T> {
    return this.messages$.pipe(
      filter((msg) => msg.event === event),
      map((msg) => msg.data as T),
    );
  }

  /**
   * الاستماع لحدث مرة واحدة
   */
  once<T>(event: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.once(event, (data: T) => {
        resolve(data);
      });
    });
  }

  /**
   * إعداد المستمعين
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.connectionState.set('connected');
      console.log('Realtime connected');
    });

    this.socket.on('disconnect', (reason: string) => {
      this.isConnected.set(false);
      this.connectionState.set('disconnected');
      console.log('Realtime disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      this.connectionState.set('error');
      console.error('Realtime connection error:', error);
    });

    // الاستماع لجميع الأحداث
    this.socket.onAny((event: string, data: unknown) => {
      this.messageSubject.next({
        event,
        data,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * إرسال رسالة في غرفة
   */
  sendToRoom(roomId: string, event: string, data: any): void {
    this.emit(event, { roomId, ...data });
  }

  /**
   * الاستماع لأحداث Typing
   */
  onTyping(roomId: string): Observable<{ userId: string; isTyping: boolean }> {
    return this.on<{ roomId: string; userId: string; isTyping: boolean }>('typing').pipe(
      filter((msg) => msg.roomId === roomId),
      map(({ userId, isTyping }) => ({ userId, isTyping })),
    );
  }

  /**
   * إرسال حالة Typing
   */
  sendTyping(roomId: string, isTyping: boolean): void {
    this.emit('typing', { roomId, isTyping });
  }

  /**
   * الاستماع لإشعارات المستخدم
   */
  onNotification(): Observable<any> {
    return this.on('notification');
  }

  /**
   * الاستماع لتحديثات التقدم
   */
  onProgress(): Observable<{ courseId: string; lessonId: string; progress: number }> {
    return this.on('progress_update');
  }

  /**
   * إرسال تحديث التقدم
   */
  sendProgress(courseId: string, lessonId: string, progress: number): void {
    this.emit('progress_update', { courseId, lessonId, progress });
  }
}
