import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SocialService, Post } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private socialService = inject(SocialService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private toast = inject(ToastService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly currentUser = this.auth.user;
  
  readonly profileUser = signal<any>(null);
  readonly userPosts = signal<Post[]>([]);
  readonly isFollowing = signal(false);
  readonly isLoading = signal(true);
  
  readonly stats = signal({ followers: 0, following: 0, posts: 0 });

  // Tab State
  readonly activeTab = signal<'posts' | 'about' | 'media' | 'followers' | 'following'>('posts');

  // Followers & Following Lists
  readonly followers = signal<any[]>([]);
  readonly following = signal<any[]>([]);
  readonly isLoadingFollowers = signal(false);
  readonly isLoadingFollowing = signal(false);

  // Edit Profile Dialog State
  readonly isEditing = signal(false);
  readonly editForm = signal({
    name: '',
    bio: '',
    coverPhoto: '',
    avatar: '',
    city: '',
    country: '',
    education: '',
    occupation: ''
  });

  // Post Comment & Reaction states (dashboard consistency)
  readonly openCommentSections = signal<Record<string, boolean>>({});
  readonly commentInputs = signal<Record<string, string>>({});
  readonly activeReactionPicker = signal<string | null>(null);

  // Computed Gallery Media
  readonly mediaPosts = computed(() => 
    this.userPosts().filter(p => p.media && p.media.length > 0)
  );

  readonly userInitial = computed(() => {
    const name = this.profileUser()?.name || 'U';
    return name.charAt(0).toUpperCase();
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'] || this.currentUser()?._id;
      if (userId) {
        this.activeTab.set('posts');
        this.loadProfile(userId);
        this.loadUserPosts(userId);
      }
    });
  }

  loadProfile(userId: string) {
    this.isLoading.set(true);
    this.socialService.getUserProfile(userId).subscribe({
      next: (res: any) => {
        this.profileUser.set(res);
        this.stats.set({
          followers: res.followersCount || 0,
          following: res.followingCount || 0,
          posts: res.postsCount || 0
        });
        this.isFollowing.set(res.isFollowing);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Fallback to current user if error and it's self
        if (userId === this.currentUser()?._id) {
          this.profileUser.set(this.currentUser());
        } else {
          this.toast.error({
            title: this.isAr() ? 'خطأ' : 'Error',
            message: this.isAr() ? 'تعذر تحميل بيانات المستخدم' : 'Could not load user profile details'
          });
        }
      }
    });
  }

  loadUserPosts(userId: string) {
    this.socialService.getUserPosts(userId).subscribe({
      next: res => {
        this.userPosts.set(res.posts);
        this.stats.update(s => ({ ...s, posts: res.total }));
      },
      error: () => {}
    });
  }

  setTab(tab: 'posts' | 'about' | 'media' | 'followers' | 'following') {
    this.activeTab.set(tab);
    if (!this.profileUser()) return;
    const userId = this.profileUser()._id;
    if (tab === 'followers') {
      this.loadFollowers(userId);
    } else if (tab === 'following') {
      this.loadFollowing(userId);
    }
  }

  loadFollowers(userId: string) {
    this.isLoadingFollowers.set(true);
    this.socialService.getFollowers(userId).subscribe({
      next: (res: any) => {
        this.followers.set(res.users || []);
        this.isLoadingFollowers.set(false);
      },
      error: () => this.isLoadingFollowers.set(false)
    });
  }

  loadFollowing(userId: string) {
    this.isLoadingFollowing.set(true);
    this.socialService.getFollowing(userId).subscribe({
      next: (res: any) => {
        this.following.set(res.users || []);
        this.isLoadingFollowing.set(false);
      },
      error: () => this.isLoadingFollowing.set(false)
    });
  }

  toggleFollow() {
    if (!this.profileUser()) return;
    const targetId = this.profileUser()._id;
    this.socialService.toggleFollow(targetId).subscribe({
      next: (res) => {
        this.isFollowing.set(res.following);
        this.loadProfile(targetId);
        this.toast.success({
          title: this.isAr() ? 'نجاح' : 'Success',
          message: res.following 
            ? (this.isAr() ? 'تمت المتابعة بنجاح' : 'Followed successfully')
            : (this.isAr() ? 'تم إلغاء المتابعة' : 'Unfollowed successfully')
        });
      }
    });
  }

  toggleFollowUserInList(userId: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.socialService.toggleFollow(userId).subscribe({
      next: (res) => {
        this.toast.success({
          title: this.isAr() ? 'نجاح' : 'Success',
          message: res.following 
            ? (this.isAr() ? 'تمت المتابعة' : 'Followed')
            : (this.isAr() ? 'تم إلغاء المتابعة' : 'Unfollowed')
        });
        if (this.profileUser()) {
          this.loadProfile(this.profileUser()._id);
          if (this.activeTab() === 'followers') this.loadFollowers(this.profileUser()._id);
          if (this.activeTab() === 'following') this.loadFollowing(this.profileUser()._id);
        }
      }
    });
  }

  openEditModal() {
    const user = this.profileUser();
    if (!user) return;
    this.editForm.set({
      name: user.name || '',
      bio: user.profile?.bio || '',
      coverPhoto: user.profile?.coverPhoto || '',
      avatar: user.avatar || '',
      city: user.profile?.city || '',
      country: user.profile?.country || '',
      education: user.profile?.education || '',
      occupation: user.profile?.occupation || ''
    });
    this.isEditing.set(true);
  }

  closeEditModal() {
    this.isEditing.set(false);
  }

  saveProfile() {
    const form = this.editForm();
    const updateData = {
      name: form.name,
      avatar: form.avatar,
      profile: {
        bio: form.bio,
        coverPhoto: form.coverPhoto,
        city: form.city,
        country: form.country,
        education: form.education,
        occupation: form.occupation
      }
    };

    this.auth.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.toast.success({
          title: this.isAr() ? 'نجاح' : 'Success',
          message: this.isAr() ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
        });
        this.isEditing.set(false);
        if (updatedUser) {
          // Force update local Auth state user image/cover reference and reload local views
          this.loadProfile(updatedUser._id || updatedUser.id);
        }
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile')
        });
      }
    });
  }

  // ═══════════════════════ INTERACTIVE FEED POSTS ═══════════════════════

  toggleReaction(post: Post, type: string = 'like'): void {
    this.socialService.toggleReaction(post.id, type).subscribe({
      next: () => {
        this.activeReactionPicker.set(null);
        if (this.profileUser()) {
          this.loadUserPosts(this.profileUser()._id);
        }
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل التفاعل' : 'Failed to react')
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

  repost(postId: string): void {
    const comment = prompt(this.isAr() ? 'أضف تعليقاً على إعادة النشر (اختياري):' : 'Add a comment to your repost (optional):');
    if (comment === null) return;

    this.socialService.repost(postId, comment).subscribe({
      next: () => {
        this.toast.success({
          title: this.isAr() ? 'نجاح' : 'Success',
          message: this.isAr() ? 'تمت إعادة النشر بنجاح' : 'Post reposted successfully'
        });
        if (this.profileUser()) {
          this.loadUserPosts(this.profileUser()._id);
          this.loadProfile(this.profileUser()._id);
        }
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل إعادة النشر' : 'Failed to repost')
        });
      }
    });
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
        if (this.profileUser()) {
          this.loadUserPosts(this.profileUser()._id);
        }
      },
      error: (err) => {
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: err.message || (this.isAr() ? 'فشل إضافة التعليق' : 'Failed to add comment')
        });
      }
    });
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return this.isAr() ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return this.isAr() ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return this.isAr() ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;

    return date.toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
  }
}
