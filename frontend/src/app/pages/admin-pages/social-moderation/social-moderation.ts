import { Component, inject, signal, OnInit, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiClientService } from '../../../core/services/api-client.service';
import { I18nService } from '../../../core/services/i18n.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface AdminPost {
  id: string;
  content: string;
  author: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isDeleted: boolean;
  isPinned: boolean;
  visibility: string;
  isSocialBanned?: boolean;
}

interface Report {
  _id: string;
  reporterId: { name: string; email: string };
  postId: { _id: string; content: string; authorId: { _id: string; name: string; isSocialBanned: boolean }; isDeleted: boolean };
  reason: string;
  details: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-social-moderation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-moderation.html',
  styleUrl: './social-moderation.css',
})
export class SocialModerationComponent implements OnInit {
  private api = inject(ApiClientService);
  readonly i18n = inject(I18nService);
  private destroyRef = inject(DestroyRef);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly posts = signal<AdminPost[]>([]);
  readonly reports = signal<Report[]>([]);
  readonly stats = signal({ totalPosts: 0, todayPosts: 0, totalComments: 0, totalLikes: 0 });
  readonly isLoading = signal(false);
  readonly activeTab = signal<'posts' | 'reports'>('posts');

  ngOnInit() {
    this.loadStats();
    this.loadPosts();
    this.loadReports();
  }

  setTab(tab: 'posts' | 'reports') {
    this.activeTab.set(tab);
    if (tab === 'posts') this.loadPosts();
    if (tab === 'reports') this.loadReports();
  }

  loadStats() {
    this.api.get<any>('/admin/social/stats').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => this.stats.set(res),
      error: () => {}
    });
  }

  loadPosts() {
    this.isLoading.set(true);
    this.api.get<any>('/admin/social/posts?limit=50').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadReports() {
    this.isLoading.set(true);
    this.api.get<any>('/admin/social/reports?limit=50').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.reports.set(res.reports);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  deletePost(postId: string) {
    if (!confirm(this.isAr() ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) return;
    
    this.api.delete(`/admin/social/posts/${postId}`).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.posts.update(posts => posts.map(p => p.id === postId ? { ...p, isDeleted: true } : p));
        this.loadStats();
      },
      error: () => {}
    });
  }

  togglePin(postId: string) {
    this.api.post<any>(`/admin/social/posts/${postId}/pin`, {}).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.posts.update(posts => posts.map(p => p.id === postId ? { ...p, isPinned: res.isPinned } : p));
      },
      error: () => {}
    });
  }

  toggleBanUser(userId: string) {
    if (!confirm(this.isAr() ? 'هل أنت متأكد من تغيير حالة حظر هذا المستخدم؟' : 'Are you sure you want to toggle ban for this user?')) return;
    
    this.api.post<any>(`/admin/social/users/${userId}/ban`, {}).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        // Update reports list visually to reflect the ban status
        this.reports.update(reports => reports.map(r => {
          if (r.postId?.authorId?._id === userId) {
            r.postId.authorId.isSocialBanned = res.isSocialBanned;
          }
          return r;
        }));
      },
      error: () => {}
    });
  }

  resolveReport(reportId: string, action: 'reviewed' | 'dismissed') {
    this.api.post<any>(`/admin/social/reports/${reportId}/resolve`, { action }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.reports.update(reports => reports.map(r => r._id === reportId ? { ...r, status: action } : r));
      },
      error: () => {}
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
