import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, tap } from 'rxjs';

export interface SocialNotification {
  _id: string;
  recipientId: string;
  senderId: { _id: string; name: string; avatar?: string };
  type: 'like' | 'comment' | 'follow' | 'group_invite' | 'group_request' | 'message' | 'admin_alert';
  relatedId?: string;
  content?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private api = inject(ApiClientService);
  
  readonly unreadCount = signal(0);
  readonly notifications = signal<SocialNotification[]>([]);

  loadNotifications(page = 1): Observable<any> {
    return this.api.get(`/social/notifications?page=${page}`).pipe(
      tap((res: any) => {
        this.notifications.set(res.data.notifications);
        this.unreadCount.set(res.data.unreadCount);
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.api.patch('/social/notifications/read', {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  markOneAsRead(id: string): Observable<any> {
    return this.api.patch(`/social/notifications/read/${id}`, {}).pipe(
      tap(() => {
        const current = this.unreadCount();
        if (current > 0) this.unreadCount.set(current - 1);
      })
    );
  }
}
