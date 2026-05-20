import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private realtimeService: RealtimeService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Join user's personal room
      void client.join(`user:${payload.sub}`);

      // Join role room
      void client.join(`role:${payload.role}`);

      // If there is a tenant
      if (payload.tenantId) {
        void client.join(`tenant:${payload.tenantId}`);
      }

      this.realtimeService.addConnection(payload.sub, client.id);

      console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.realtimeService.removeConnection(client.data.userId, client.id);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:course')
  handleJoinCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() courseId: string,
  ) {
    void client.join(`course:${courseId}`);
    return { success: true, room: `course:${courseId}` };
  }

  @SubscribeMessage('leave:course')
  handleLeaveCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() courseId: string,
  ) {
    void client.leave(`course:${courseId}`);
    return { success: true };
  }

  @SubscribeMessage('join:lesson')
  handleJoinLesson(
    @ConnectedSocket() client: Socket,
    @MessageBody() lessonId: string,
  ) {
    void client.join(`lesson:${lessonId}`);
    return { success: true, room: `lesson:${lessonId}` };
  }

  @SubscribeMessage('leave:lesson')
  handleLeaveLesson(
    @ConnectedSocket() client: Socket,
    @MessageBody() lessonId: string,
  ) {
    void client.leave(`lesson:${lessonId}`);
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; isTyping: boolean },
  ) {
    client.to(data.room).emit('user:typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to all users in a specific role
  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Send to all users in a specific course
  sendToCourse(courseId: string, event: string, data: any) {
    this.server.to(`course:${courseId}`).emit(event, data);
  }

  // Send to everyone
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // ===================== MONITORING EVENTS =====================

  /**
   * Join admin monitoring room
   */
  @SubscribeMessage('join:monitoring')
  handleJoinMonitoring(@ConnectedSocket() client: Socket) {
    // Only admins can join monitoring
    if (client.data.role === 'admin' || client.data.role === 'super_admin') {
      void client.join('monitoring');
      return { success: true, room: 'monitoring' };
    }
    return { success: false, error: 'Access denied' };
  }

  /**
   * Leave monitoring room
   */
  @SubscribeMessage('leave:monitoring')
  handleLeaveMonitoring(@ConnectedSocket() client: Socket) {
    void client.leave('monitoring');
    return { success: true };
  }

  /**
   * Emit new login attempt to monitoring room
   */
  emitLoginAttempt(data: {
    email: string;
    ipAddress: string;
    success: boolean;
    timestamp: Date;
    failureReason?: string;
    sessionId?: string;
    deviceInfo?: string;
  }) {
    this.server.to('monitoring').emit('monitoring:login-attempt', data);
  }

  /**
   * Emit IP blocked event
   */
  emitIPBlocked(data: {
    ipAddress: string;
    reason: string;
    blockedUntil: Date;
    attempts: number;
  }) {
    this.server.to('monitoring').emit('monitoring:ip-blocked', data);
  }

  /**
   * Emit IP unblocked event
   */
  emitIPUnblocked(data: { ipAddress: string }) {
    this.server.to('monitoring').emit('monitoring:ip-unblocked', data);
  }

  /**
   * Emit security metrics update
   */
  emitSecurityMetrics(data: {
    successfulLogins: number;
    failedLogins: number;
    blockedIPs: number;
    activeSessions: number;
  }) {
    this.server.to('monitoring').emit('monitoring:metrics-update', data);
  }

  /**
   * Emit session update (new session, session ended)
   */
  emitSessionUpdate(data: {
    type: 'new' | 'ended';
    userId: string;
    sessionId: string;
    timestamp: Date;
  }) {
    this.server.to('monitoring').emit('monitoring:session-update', data);
  }

  /**
   * Emit admin session extended event
   */
  emitAdminSessionExtended(data: {
    sessionId: string;
    email: string;
    additionalMinutes: number;
    newExpiresAt: Date;
    remainingMinutes: number;
  }) {
    this.server.to('monitoring').emit('monitoring:session-extended', data);
  }

  /**
   * Emit admin sessions list update
   */
  emitAdminSessionsUpdate(data: {
    count: number;
    sessions: Array<{
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
    }>;
  }) {
    this.server.to('monitoring').emit('monitoring:admin-sessions-update', data);
  }
}
