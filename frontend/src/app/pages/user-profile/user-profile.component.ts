import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SocialService, Post } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private socialService = inject(SocialService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly currentUser = this.auth.user;
  
  readonly profileUser = signal<any>(null);
  readonly userPosts = signal<Post[]>([]);
  readonly isFollowing = signal(false);
  readonly isLoading = signal(true);
  
  readonly stats = signal({ followers: 0, following: 0, posts: 0 });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'] || this.currentUser()?._id;
      if (userId) {
        this.loadProfile(userId);
        this.loadUserPosts(userId);
      }
    });
  }

  loadProfile(userId: string) {
    this.isLoading.set(true);
    // In a real app, you'd have a getUserProfile API
    // For now, we'll use a placeholder or the auth user if it's self
    if (userId === this.currentUser()?._id) {
      this.profileUser.set(this.currentUser());
      this.isLoading.set(false);
    } else {
      // Fetch other user profile
      this.socialService.getUserProfile(userId).subscribe((res: any) => {
        this.profileUser.set(res);
        this.stats.update(s => ({ 
          ...s, 
          followers: res.followersCount || 0,
          following: res.followingCount || 0
        }));
        this.isFollowing.set(res.isFollowing);
        this.isLoading.set(false);
      });
    }
  }

  loadUserPosts(userId: string) {
    this.socialService.getUserPosts(userId).subscribe(res => {
      this.userPosts.set(res.posts);
      this.stats.update(s => ({ ...s, posts: res.total }));
    });
  }

  toggleFollow() {
    if (!this.profileUser()) return;
    this.socialService.toggleFollow(this.profileUser()._id).subscribe({
      next: () => {
        this.isFollowing.update(v => !v);
        this.loadProfile(this.profileUser()._id);
      }
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
  }
}
