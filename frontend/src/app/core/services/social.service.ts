import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, tap } from 'rxjs';
import { StateStoreService } from './state-store.service';

export interface Comment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    email?: string;
  };
  content: string;
  createdAt: string;
}

export interface Trend {
  hashtag: string;
  count: number;
}

export interface SuggestedUser {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
  email?: string;
}

export interface Post {
  id: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
    email: string;
    role: string;
  };
  content: string;
  media: string[];
  type: string;
  hashtags: string[];
  mentions: string[];
  visibility: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isOwn: boolean;
  createdAt: string;
  repostCount: number;
  originalPost?: {
    id: string;
    author: {
      name: string;
      avatar?: string;
      role: string;
    };
    content: string;
    media: string[];
    createdAt: string;
  };
  comments: Comment[];
}

export interface SocialState {
  feed: Post[];
  trending: Trend[];
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private api = inject(ApiClientService);
  private stateStore = inject(StateStoreService);

  private socialStore = this.stateStore.createStore<SocialState>({
    key: 'social',
    defaultValue: {
      feed: [],
      trending: [],
      isLoading: false
    }
  });

  public feed = this.stateStore.select<SocialState, Post[]>('social', s => s.feed);
  public trending = this.stateStore.select<SocialState, Trend[]>('social', s => s.trending);
  public isLoading = this.stateStore.select<SocialState, boolean>('social', s => s.isLoading);

  // ═══════════════════════ POSTS ═══════════════════════

  createPost(content: string, media: string[] = [], type: string = 'text', visibility: string = 'public'): Observable<Post> {
    return this.api.post<Post>('/social/posts', { content, media, type, visibility }).pipe(
      tap(post => {
        const currentFeed = this.socialStore().feed;
        this.socialStore.update(state => ({ ...state, feed: [post, ...currentFeed] }));
      })
    );
  }

  uploadMedia(files: File[]): Observable<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.api.post<{ urls: string[] }>('/social/upload', formData);
  }

  getFeed(page = 1, limit = 20): Observable<{ posts: Post[]; total: number; pages: number }> {
    this.socialStore.update(state => ({ ...state, isLoading: true }));
    return this.api.get<{ posts: Post[]; total: number; pages: number }>(`/social/feed?page=${page}&limit=${limit}`).pipe(
      tap(response => {
        if (page === 1) {
          this.socialStore.update(state => ({ ...state, feed: response.posts, isLoading: false }));
        } else {
          const currentFeed = this.socialStore().feed;
          this.socialStore.update(state => ({ ...state, feed: [...currentFeed, ...response.posts], isLoading: false }));
        }
      })
    );
  }

  deletePost(postId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.delete<{ success: boolean; message?: string }>(`/social/posts/${postId}`).pipe(
      tap(() => {
        const currentFeed = this.socialStore().feed;
        this.socialStore.update(state => ({ ...state, feed: currentFeed.filter(p => p.id !== postId) }));
      })
    );
  }

  // ═══════════════════════ LIKES ═══════════════════════

  // ═══════════════════════ REACTIONS ═══════════════════════

  toggleReaction(postId: string, type: string = 'like'): Observable<any> {
    return this.api.post<any>(`/social/posts/${postId}/react`, { type }).pipe(
      tap(result => {
        // تحديث الحالة المحلية بدون إعادة تحميل الـ feed بالكامل
        const feed = this.socialStore().feed;
        const index = feed.findIndex(p => p.id === postId);
        if (index !== -1) {
          const updatedFeed = [...feed];
          updatedFeed[index] = {
            ...updatedFeed[index],
            isLiked: !updatedFeed[index].isLiked,
            likesCount: updatedFeed[index].isLiked
              ? Math.max(0, updatedFeed[index].likesCount - 1)
              : updatedFeed[index].likesCount + 1,
          };
          this.socialStore.update(state => ({ ...state, feed: updatedFeed }));
        }
      })
    );
  }

  // ═══════════════════════ COMMENTS ═══════════════════════

  addComment(postId: string, content: string): Observable<Post> {
    return this.api.post<Post>(`/social/posts/${postId}/comments`, { content }).pipe(
      tap(updatedPost => {
        const currentFeed = this.socialStore().feed;
        const postIndex = currentFeed.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const newFeed = [...currentFeed];
          newFeed[postIndex] = updatedPost;
          this.socialStore.update(state => ({ ...state, feed: newFeed }));
        }
      })
    );
  }

  // ═══════════════════════ FOLLOWS ═══════════════════════

  toggleFollow(userId: string): Observable<{ following: boolean }> {
    return this.api.post<{ following: boolean }>(`/social/follow/${userId}`, {});
  }

  getUserProfile(userId: string): Observable<SuggestedUser & { followersCount: number; followingCount: number; isFollowing: boolean }> {
    return this.api.get<SuggestedUser & { followersCount: number; followingCount: number; isFollowing: boolean }>(`/social/user/${userId}/profile`);
  }

  getUserPosts(userId: string, page = 1, limit = 20): Observable<{ posts: Post[]; total: number; pages: number }> {
    return this.api.get<{ posts: Post[]; total: number; pages: number }>(`/social/user/${userId}/posts?page=${page}&limit=${limit}`);
  }

  repost(postId: string, content?: string): Observable<{ success: boolean; data?: Post }> {
    return this.api.post<{ success: boolean; data?: Post }>(`/social/posts/${postId}/repost`, { content }).pipe(
      tap(() => this.getFeed(1, 20).subscribe())
    );
  }

  // ═══════════════════════ TRENDING & SEARCH ═══════════════════════

  getTrending(): Observable<Trend[]> {
    return this.api.get<Trend[]>('/social/trending').pipe(
      tap(trending => {
        this.socialStore.update(state => ({ ...state, trending }));
      })
    );
  }

  getSuggestedUsers(): Observable<SuggestedUser[]> {
    return this.api.get<SuggestedUser[]>('/social/suggested-users');
  }
}
