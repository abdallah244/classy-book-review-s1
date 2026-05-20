import { Injectable } from '@nestjs/common';

interface Connection {
  socketIds: Set<string>;
  lastSeen: Date;
}

@Injectable()
export class RealtimeService {
  private connections = new Map<string, Connection>();

  /**
   * Add connection
   */
  addConnection(userId: string, socketId: string) {
    const existing = this.connections.get(userId);
    if (existing) {
      existing.socketIds.add(socketId);
      existing.lastSeen = new Date();
    } else {
      this.connections.set(userId, {
        socketIds: new Set([socketId]),
        lastSeen: new Date(),
      });
    }
  }

  /**
   * Remove connection
   */
  removeConnection(userId: string, socketId: string) {
    const existing = this.connections.get(userId);
    if (existing) {
      existing.socketIds.delete(socketId);
      if (existing.socketIds.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Check if user is connected
   */
  isOnline(userId: string): boolean {
    const connection = this.connections.get(userId);
    return connection ? connection.socketIds.size > 0 : false;
  }

  /**
   * List connected users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Number of connected users
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * User's last seen
   */
  getLastSeen(userId: string): Date | null {
    return this.connections.get(userId)?.lastSeen || null;
  }

  /**
   * Connection statistics
   */
  getStats(): {
    totalUsers: number;
    totalConnections: number;
  } {
    let totalConnections = 0;
    for (const conn of this.connections.values()) {
      totalConnections += conn.socketIds.size;
    }

    return {
      totalUsers: this.connections.size,
      totalConnections,
    };
  }
}
