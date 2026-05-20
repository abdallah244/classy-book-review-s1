import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface LoginAttemptEvent {
  email: string;
  ipAddress: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
  sessionId?: string;
  deviceInfo?: string;
}

export interface IPBlockedEvent {
  ipAddress: string;
  reason: string;
  blockedUntil: Date;
  attempts: number;
}

export interface SecurityMetricsEvent {
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: number;
  activeSessions: number;
}

export interface SessionUpdateEvent {
  type: 'new' | 'ended';
  userId: string;
  sessionId: string;
  timestamp: Date;
}

export interface AdminSession {
  sessionId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userId: string;
  loginAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  remainingMinutes: number;
  deviceInfo: any;
  ipAddress: string;
}

export interface AdminSessionsUpdateEvent {
  count: number;
  sessions: AdminSession[];
}

export interface SessionExtendedEvent {
  sessionId: string;
  email: string;
  additionalMinutes: number;
  newExpiresAt: Date;
  remainingMinutes: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;

  // Connection state
  readonly isConnected = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);

  // Real-time data signals
  readonly lastLoginAttempt = signal<LoginAttemptEvent | null>(null);
  readonly lastIPBlocked = signal<IPBlockedEvent | null>(null);
  readonly lastIPUnblocked = signal<{ ipAddress: string } | null>(null);
  readonly securityMetrics = signal<SecurityMetricsEvent | null>(null);
  readonly lastSessionUpdate = signal<SessionUpdateEvent | null>(null);

  // Admin sessions signals
  readonly adminSessions = signal<AdminSession[]>([]);
  readonly adminSessionsCount = signal<number>(0);
  readonly lastSessionExtended = signal<SessionExtendedEvent | null>(null);

  // Login attempts history (last 50)
  readonly loginAttempts = signal<LoginAttemptEvent[]>([]);

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('🔌 No token available for WebSocket connection');
      return;
    }

    const wsUrl = environment.apiUrl.replace('/api/v1', '');

    this.socket = io(`${wsUrl}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.isConnected.set(true);
      this.connectionError.set(null);

      // Join monitoring room
      this.joinMonitoring();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error.message);
      this.connectionError.set(error.message);
      this.isConnected.set(false);
    });

    // Monitoring events
    this.socket.on('monitoring:login-attempt', (data: LoginAttemptEvent) => {
      console.log('📊 New login attempt:', data);
      this.lastLoginAttempt.set(data);

      // Add to history
      const current = this.loginAttempts();
      this.loginAttempts.set([data, ...current].slice(0, 50));
    });

    this.socket.on('monitoring:ip-blocked', (data: IPBlockedEvent) => {
      console.log('🚫 IP blocked:', data);
      this.lastIPBlocked.set(data);
    });

    this.socket.on('monitoring:ip-unblocked', (data: { ipAddress: string }) => {
      console.log('✅ IP unblocked:', data);
      this.lastIPUnblocked.set(data);
    });

    this.socket.on('monitoring:metrics-update', (data: SecurityMetricsEvent) => {
      console.log('📈 Metrics update:', data);
      this.securityMetrics.set(data);
    });

    this.socket.on('monitoring:session-update', (data: SessionUpdateEvent) => {
      console.log('👤 Session update:', data);
      this.lastSessionUpdate.set(data);
    });

    // Admin sessions events
    this.socket.on('monitoring:admin-sessions-update', (data: AdminSessionsUpdateEvent) => {
      console.log('👥 Admin sessions update:', data);
      this.adminSessions.set(data.sessions);
      this.adminSessionsCount.set(data.count);
    });

    this.socket.on('monitoring:session-extended', (data: SessionExtendedEvent) => {
      console.log('⏱️ Session extended:', data);
      this.lastSessionExtended.set(data);
    });
  }

  /**
   * Join monitoring room
   */
  joinMonitoring(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('join:monitoring', {}, (response: any) => {
      if (response.success) {
        console.log('📊 Joined monitoring room');
      } else {
        console.warn('📊 Failed to join monitoring:', response.error);
      }
    });
  }

  /**
   * Leave monitoring room
   */
  leaveMonitoring(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave:monitoring');
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.leaveMonitoring();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  /**
   * Clear login attempts history
   */
  clearLoginAttempts(): void {
    this.loginAttempts.set([]);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
