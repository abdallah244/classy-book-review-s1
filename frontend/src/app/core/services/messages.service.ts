import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

export interface SocialMessage {
  _id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'audio' | 'video';
  isRead: boolean;
  createdAt: string;
  sender?: any;
  receiver?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private api = inject(ApiClientService);

  getConversations(): Observable<any[]> {
    return this.api.get('/social/messages/conversations');
  }

  getHistory(otherId: string, page = 1): Observable<SocialMessage[]> {
    return this.api.get(`/social/messages/history/${otherId}?page=${page}`);
  }

  sendMessage(receiverId: string, content: string, messageType: string = 'text'): Observable<any> {
    return this.api.post('/social/messages', { receiverId, content, messageType });
  }

  markAsRead(senderId: string): Observable<any> {
    return this.api.patch(`/social/messages/read/${senderId}`, {});
  }
}
