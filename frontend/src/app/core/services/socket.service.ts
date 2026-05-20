import { Injectable, inject, signal, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private auth = inject(AuthService);
  private socket: Socket | null = null;
  
  readonly isConnected = signal(false);

  constructor() {
    toObservable(this.auth.user).subscribe((user: any) => {
      if (user) {
        this.connect(user._id);
      } else {
        this.disconnect();
      }
    });
  }

  private connect(userId: string) {
    if (this.socket) return;

    this.socket = io(`${environment.apiBaseUrl}`, {
      query: { userId },
      path: '/socket.io' // Default path
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('Connected to social socket');
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      console.log('Disconnected from social socket');
    });
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}
