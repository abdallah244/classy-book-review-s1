import { Component, inject, computed, signal, ChangeDetectionStrategy, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { SocialService, Post, SuggestedUser } from '../../core/services/social.service';
import { FormsModule } from '@angular/forms';
import { StoriesComponent } from './stories/stories.component';
import { ToastService } from '../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StoriesComponent],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboard implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiClientService);
  public socialService = inject(SocialService);
  readonly i18n = inject(I18nService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly user = this.auth.user;
  readonly statusText = signal('');
  readonly statusFocused = signal(false);
  readonly isPosting = signal(false);
  
  // Track open comment sections
  readonly openCommentSections = signal<Record<string, boolean>>({});
  readonly commentInputs = signal<Record<string, string>>({});

  readonly userInitial = computed(() => {
    const name = this.user()?.name || 'U';
    return name.charAt(0).toUpperCase();
  });

  readonly userBio = computed(() => {
    const bio = this.user()?.profile?.bio;
    if (bio) return bio;
    return this.isAr()
      ? 'طالب شغوف بالتكنولوجيا والتعلم المستمر 🚀 | أبني مستقبلي مع Classy Book'
      : 'Passionate learner & tech enthusiast 🚀 | Building my future with Classy Book';
  });

  readonly memberSince = computed(() => {
    const date = this.user()?.createdAt;
    if (!date) return '';
    const d = new Date(date);
    return this.isAr()
      ? `عضو منذ ${d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}`
      : `Member since ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
  });

  readonly profileStats = computed(() => [
    { labelEn: 'Courses', labelAr: 'الدورات', value: '0', icon: 'book' },
    { labelEn: 'Certificates', labelAr: 'الشهادات', value: '0', icon: 'award' },
    { labelEn: 'Hours', labelAr: 'الساعات', value: '0', icon: 'clock' },
    { labelEn: 'Streak', labelAr: 'سلسلة', value: '0', icon: 'fire' },
  ]);

  readonly quickActions = computed(() => [
    { labelEn: 'Browse Courses', labelAr: 'تصفح الدورات', icon: 'compass', color: '#166534', route: '/dashboard/courses' },
    { labelEn: 'My Progress', labelAr: 'تقدمي', icon: 'chart', color: '#0ea5e9', route: '/dashboard/progress' },
    { labelEn: 'Certificates', labelAr: 'شهاداتي', icon: 'award', color: '#f59e0b', route: '/dashboard/certificates' },
    { labelEn: 'Settings', labelAr: 'الإعدادات', icon: 'settings', color: '#8b5cf6', route: '/dashboard/settings' },
  ]);

  readonly recentActivity = signal<{ icon: string; textEn: string; textAr: string; time: string; color: string }[]>([
    { icon: 'play', textEn: 'Continue learning "Web Development"', textAr: 'أكمل تعلم "تطوير الويب"', time: '2h', color: '#166534' },
    { icon: 'check', textEn: 'Completed lesson: HTML Basics', textAr: 'أكملت درس: أساسيات HTML', time: '5h', color: '#10b981' },
    { icon: 'star', textEn: 'Earned a new badge!', textAr: 'حصلت على شارة جديدة!', time: '1d', color: '#f59e0b' },
  ]);

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.user()?.name?.split(' ')[0] || 'User';
    if (hour < 12) return this.isAr() ? `صباح الخير، ${name}` : `Good morning, ${name}`;
    if (hour < 18) return this.isAr() ? `مساء الخير، ${name}` : `Good afternoon, ${name}`;
    return this.isAr() ? `مساء الخير، ${name}` : `Good evening, ${name}`;
  });

  readonly motivationalQuote = computed(() => {
    const quotes = this.isAr() ? [
      'كل خبير كان مبتدئاً يوماً ما 🌱',
      'المعرفة قوة، والتعلم رحلة لا تنتهي 📚',
      'استثمر في نفسك، فهو أفضل استثمار 💡',
    ] : [
      'Every expert was once a beginner 🌱',
      'Knowledge is power, learning never stops 📚',
      'Invest in yourself, it\'s the best investment 💡',
    ];
    return quotes[new Date().getDate() % quotes.length];
  });

  // Engagement signals
  readonly suggestedUsers = signal<SuggestedUser[]>([]);
  readonly profileCompletion = computed(() => {
    const user = this.user();
    if (!user) return 0;
    let score = 20; // Base score for having an account
    if (user.avatar) score += 20;
    if (user.profile?.bio) score += 20;
    if (user.profile?.city || user.profile?.country) score += 20;
    if (user.profile?.education?.length) score += 20;
    return score;
  });

  ngOnInit(): void {
    this.api.get('/auth/me').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ error: () => {} });

    this.socialService.getFeed(1, 20).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ error: () => {} });

    this.socialService.getTrending().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ error: () => {} });

    this.socialService.getSuggestedUsers().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: res => this.suggestedUsers.set(res),
      error: () => {},
    });
  }

  onStatusInput(event: Event): void {
    this.statusText.set((event.target as HTMLInputElement).value);
  }

  // Media Upload state
  readonly selectedFiles = signal<File[]>([]);
  readonly imagePreviews = signal<string[]>([]);
  readonly isUploading = signal(false);

  createPost(): void {
    const text = this.statusText().trim();
    if (!text && this.selectedFiles().length === 0) return;

    this.isPosting.set(true);
    
    // 1. Upload images if any
    if (this.selectedFiles().length > 0) {
      this.isUploading.set(true);
      this.socialService.uploadMedia(this.selectedFiles()).subscribe({
        next: (res) => {
          this.submitPost(text, res.urls);
        },
        error: (err) => {
          this.isPosting.set(false);
          this.isUploading.set(false);
          this.toast.error({
            title: this.isAr() ? 'خطأ' : 'Error',
            message: err.message || (this.isAr() ? 'فشل رفع الصور' : 'Failed to upload images')
          });
        }
      });
    } else {
      this.submitPost(text, []);
    }
  }

  private submitPost(text: string, media: string[]): void {
    this.socialService.createPost(text, media, media.length > 0 ? 'image' : 'text').subscribe({
      next: () => {
        this.statusText.set('');
        this.selectedFiles.set([]);
        this.imagePreviews.set([]);
        this.isPosting.set(false);
        this.isUploading.set(false);
        this.statusFocused.set(false);
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم نشر منشورك بنجاح' : 'Your post was published successfully'
        });
      },
      error: (err) => {
        this.isPosting.set(false);
        this.isUploading.set(false);
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل نشر المنشور' : 'Failed to publish post')
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement || !inputElement.files) return;
    const files = Array.from(inputElement.files);
    this.selectedFiles.update(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.imagePreviews.update(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedFiles.update(prev => prev.filter((_, i) => i !== index));
    this.imagePreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  // Reaction Picker state
  readonly activeReactionPicker = signal<string | null>(null);

  toggleReaction(post: Post, type: string = 'like'): void {
    this.socialService.toggleReaction(post.id, type).subscribe({
      next: () => this.activeReactionPicker.set(null),
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل تحديث التفاعل' : 'Failed to update reaction')
        });
      }
    });
  }

  repost(postId: string): void {
    const comment = prompt(this.isAr() ? 'أضف تعليقاً على إعادة النشر (اختياري):' : 'Add a comment to your repost (optional):');
    if (comment === null) return; // User cancelled

    this.socialService.repost(postId, comment).subscribe({
      next: () => {
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تمت إعادة النشر بنجاح' : 'Post reposted successfully'
        });
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل إعادة النشر' : 'Failed to repost')
        });
      }
    });
  }

  showReactionPicker(postId: string): void {
    this.activeReactionPicker.set(postId);
  }

  hideReactionPicker(): void {
    this.activeReactionPicker.set(null);
  }

  toggleComments(postId: string): void {
    const current = this.openCommentSections();
    this.openCommentSections.set({
      ...current,
      [postId]: !current[postId]
    });
  }

  onCommentInput(postId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.commentInputs();
    this.commentInputs.set({
      ...current,
      [postId]: value
    });
  }

  submitComment(postId: string): void {
    const text = this.commentInputs()[postId]?.trim();
    if (!text) return;

    this.socialService.addComment(postId, text).subscribe({
      next: () => {
        const current = this.commentInputs();
        this.commentInputs.set({
          ...current,
          [postId]: ''
        });
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل إضافة التعليق' : 'Failed to add comment')
        });
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return this.isAr() ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return this.isAr() ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return this.isAr() ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
    
    return date.toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  }

  toggleFollow(userId: string): void {
    this.socialService.toggleFollow(userId).subscribe({
      next: (res) => {
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: res.following 
            ? (this.isAr() ? 'تمت المتابعة بنجاح' : 'Followed successfully')
            : (this.isAr() ? 'تم إلغاء المتابعة' : 'Unfollowed successfully')
        });
        // Refresh suggested users or local state if needed
        this.socialService.getSuggestedUsers().subscribe(users => this.suggestedUsers.set(users));
      }
    });
  }
}
