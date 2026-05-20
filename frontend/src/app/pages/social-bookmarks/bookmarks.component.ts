import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarksService } from '../../core/services/bookmarks.service';
import { I18nService } from '../../core/services/i18n.service';
import { SocialService, Post } from '../../core/services/social.service';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.css',
})
export class BookmarksComponent implements OnInit {
  private bookmarksService = inject(BookmarksService);
  private socialService = inject(SocialService);
  private i18n = inject(I18nService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly savedPosts = signal<Post[]>([]);
  readonly isLoading = signal(false);

  ngOnInit() {
    this.loadBookmarks();
  }

  loadBookmarks() {
    this.isLoading.set(true);
    this.bookmarksService.getMyBookmarks().subscribe({
      next: (res: any) => {
        this.savedPosts.set(res.data.posts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleLike(post: Post) {
    this.socialService.toggleReaction(post.id, 'like').subscribe();
  }

  removeBookmark(post: Post) {
    this.bookmarksService.toggleBookmark(post.id).subscribe({
      next: () => {
        this.savedPosts.update(posts => posts.filter(p => p.id !== post.id));
      }
    });
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  }
}
