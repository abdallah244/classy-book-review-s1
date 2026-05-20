export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: string;
  permissions: string[];
  sessionId?: string;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface TokenResponse extends AuthTokens {
  user: any;
}

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceId?: string;
  platform?: string;
  browser?: string;
  os?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}
