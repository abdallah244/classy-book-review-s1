import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminSocialService {
  private api = inject(ApiClientService);

  getStats(): Observable<any> {
    return this.api.get('/admin/social/stats');
  }

  getPosts(page = 1, search = ''): Observable<any> {
    return this.api.get(`/admin/social/posts?page=${page}&search=${search}`);
  }

  deletePost(id: string): Observable<any> {
    return this.api.delete(`/admin/social/posts/${id}`);
  }

  togglePin(id: string): Observable<any> {
    return this.api.post(`/admin/social/posts/${id}/pin`, {});
  }

  getReports(page = 1, status?: string): Observable<any> {
    let url = `/admin/social/reports?page=${page}`;
    if (status) url += `&status=${status}`;
    return this.api.get(url);
  }

  resolveReport(id: string, action: 'dismissed' | 'reviewed'): Observable<any> {
    return this.api.post(`/admin/social/reports/${id}/resolve`, { action });
  }

  toggleBan(userId: string): Observable<any> {
    return this.api.post(`/admin/social/users/${userId}/ban`, {});
  }
}
