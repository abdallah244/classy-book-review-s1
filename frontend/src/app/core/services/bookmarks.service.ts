import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookmarksService {
  private api = inject(ApiClientService);

  toggleBookmark(postId: string): Observable<any> {
    return this.api.post(`/social/bookmarks/${postId}`, {});
  }

  getMyBookmarks(page = 1): Observable<any> {
    return this.api.get(`/social/bookmarks?page=${page}`);
  }
}
