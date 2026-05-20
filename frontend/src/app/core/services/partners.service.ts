import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

export interface PartnerPage {
  _id: string;
  name: string;
  username: string;
  bio: string;
  ownerId: string;
  category: string;
  websiteUrl?: string;
  logoImage?: string;
  coverImage?: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing?: boolean;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PartnersService {
  private api = inject(ApiClientService);

  createPage(data: any): Observable<any> {
    return this.api.post('/social/partners', data);
  }

  getAllPages(page = 1, limit = 20, search = '', category = ''): Observable<{pages: PartnerPage[], total: number}> {
    return this.api.get(`/social/partners?page=${page}&limit=${limit}&search=${search}&category=${category}`);
  }

  getMyPages(): Observable<PartnerPage[]> {
    return this.api.get('/social/partners/my');
  }

  getPageDetails(usernameOrId: string): Observable<PartnerPage> {
    return this.api.get(`/social/partners/${usernameOrId}`);
  }

  followPage(pageId: string): Observable<any> {
    return this.api.post(`/social/partners/${pageId}/follow`, {});
  }
}
