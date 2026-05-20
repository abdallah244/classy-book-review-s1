import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginAttempt {
  _id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  sessionId?: string;
  deviceFingerprint?: string;
}

interface BlockedIP {
  _id: string;
  ipAddress: string;
  attempts: number;
  blockedUntil: Date;
  reason: string;
}

interface SecurityMetrics {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: number;
  activeSessions: number;
  successRate: number;
  failureRate: number;
  blockRate: number;
}

@Injectable({
  providedIn: 'root',
})
export class MonitoringService {
  private readonly API_URL = `${environment.apiUrl}/monitoring`;

  constructor(private http: HttpClient) {}

  async getLoginAttempts(): Promise<LoginAttempt[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: LoginAttempt[] }>(`${this.API_URL}/login-attempts`),
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      return [];
    }
  }

  async getBlockedIPs(): Promise<BlockedIP[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: BlockedIP[] }>(`${this.API_URL}/blocked-ips`),
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      return [];
    }
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: SecurityMetrics }>(`${this.API_URL}/security-metrics`),
      );
      return response.data || this.getDefaultMetrics();
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async unblockIP(ipAddress: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/unblock-ip`, { ipAddress }));
    } catch (error) {
      console.error('Error unblocking IP:', error);
      throw error;
    }
  }

  private getDefaultMetrics(): SecurityMetrics {
    return {
      totalAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      blockedIPs: 0,
      activeSessions: 0,
      successRate: 0,
      failureRate: 0,
      blockRate: 0,
    };
  }
}
