import { Injectable, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable } from 'rxjs';

export interface StoryGroup {
  user: { _id: string; name: string; avatar?: string };
  stories: any[];
  hasUnseen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StoriesService {
  private api = inject(ApiClientService);

  getFeedStories(): Observable<StoryGroup[]> {
    return this.api.get('/social/stories/feed');
  }

  createStory(mediaUrl: string, mediaType: 'image' | 'video' = 'image'): Observable<any> {
    return this.api.post('/social/stories', { mediaUrl, mediaType });
  }

  viewStory(storyId: string): Observable<any> {
    return this.api.post(`/social/stories/${storyId}/view`, {});
  }
}
