import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSocialService } from '../../core/services/admin-social.service';
import { I18nService } from '../../core/services/i18n.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.css',
})
export class AdminModerationComponent implements OnInit {
  private adminSocial = inject(AdminSocialService);
  private i18n = inject(I18nService);
  private destroyRef = inject(DestroyRef);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly activeTab = signal<'stats' | 'reports' | 'posts'>('stats');
  
  readonly stats = signal<any>(null);
  readonly reports = signal<any[]>([]);
  readonly posts = signal<any[]>([]);
  readonly isLoading = signal(false);
  
  // Filtering
  readonly postSearch = signal('');
  readonly reportStatus = signal('pending');

  ngOnInit() {
    this.loadStats();
  }

  setTab(tab: 'stats' | 'reports' | 'posts') {
    this.activeTab.set(tab);
    if (tab === 'stats') this.loadStats();
    if (tab === 'reports') this.loadReports();
    if (tab === 'posts') this.loadPosts();
  }

  loadStats() {
    this.adminSocial.getStats().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {}
    });
  }

  loadReports() {
    this.isLoading.set(true);
    this.adminSocial.getReports(1, this.reportStatus()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.reports.set(res.data.reports);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadPosts() {
    this.isLoading.set(true);
    this.adminSocial.getPosts(1, this.postSearch()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.posts.set(res.data.posts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  resolveReport(reportId: string, action: 'dismissed' | 'reviewed') {
    this.adminSocial.resolveReport(reportId, action).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadReports(),
      error: () => {}
    });
  }

  deletePost(postId: string) {
    if (!confirm(this.isAr() ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) return;
    this.adminSocial.deletePost(postId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadPosts();
        this.loadReports(); // Refresh reports if it was a reported post
      },
      error: () => {}
    });
  }

  toggleBan(userId: string) {
    this.adminSocial.toggleBan(userId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadReports();
      },
      error: () => {}
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString(this.isAr() ? 'ar-EG' : 'en-US');
  }
}
