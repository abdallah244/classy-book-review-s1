import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

export interface SocialGroup {
  _id: string;
  name: string;
  description: string;
  creatorId: string;
  privacy: 'public' | 'private' | 'secret';
  coverImage?: string;
  avatarImage?: string;
  membersCount: number;
  isMember?: boolean;
  isAdmin?: boolean;
  hasRequested?: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private api = inject(ApiClientService);

  createGroup(data: any): Observable<any> {
    return this.api.post('/social/groups', data);
  }

  getAllGroups(page = 1, limit = 20, search = ''): Observable<{groups: SocialGroup[], total: number}> {
    return this.api.get(`/social/groups?page=${page}&limit=${limit}&search=${search}`);
  }

  getMyGroups(): Observable<SocialGroup[]> {
    return this.api.get('/social/groups/my');
  }

  getGroupDetails(id: string): Observable<SocialGroup> {
    return this.api.get(`/social/groups/${id}`);
  }

  getGroupPosts(id: string, page = 1, limit = 20): Observable<any> {
    return this.api.get(`/social/groups/${id}/posts?page=${page}&limit=${limit}`);
  }

  joinGroup(id: string): Observable<any> {
    return this.api.post(`/social/groups/${id}/join`, {});
  }

  leaveGroup(id: string): Observable<any> {
    return this.api.delete(`/social/groups/${id}/leave`);
  }

  handleJoinRequest(groupId: string, requesterId: string, action: 'approve' | 'reject'): Observable<any> {
    return this.api.post(`/social/groups/${groupId}/requests/${requesterId}`, { action });
  }
}
