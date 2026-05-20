import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../security/auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  async handleConnection(client: Socket) {
    try {
      // In handleConnection, guards aren't automatically called in Socket.io
      // We'll do a manual check if needed, or rely on client sending user info
      const user = client.data.user;
      if (user) {
        this.connectedUsers.set(user.id || user._id, client.id);
        console.log(`Authenticated User connected: ${user.id || user._id}`);
      }
    } catch (e) {}
  }

  handleDisconnect(client: Socket) {
    // Find and remove user
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User disconnected: ${userId}`);
        break;
      }
    }
  }

  /**
   * Emit notification to a specific user
   */
  sendNotification(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new_notification', notification);
    }
  }

  /**
   * Emit message to a specific user
   */
  sendMessage(userId: string, message: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new_message', message);
    }
  }

  /**
   * Broadcast social event (new post, etc.)
   */
  broadcastEvent(event: string, data: any) {
    this.server.emit(event, data);
  }
}
