export interface SecurityMetrics {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: number;
  activeSessions: number;
  successRate: number;
  failureRate: number;
  blockRate: number;
}
