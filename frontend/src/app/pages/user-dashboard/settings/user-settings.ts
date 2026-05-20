import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiClientService } from '../../../core/services/api-client.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';

interface Session {
  sessionId: string;
  deviceInfo?: { userAgent?: string; ip?: string; platform?: string };
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettings implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiClientService);
  readonly i18n = inject(I18nService);
  private toast = inject(ToastService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly user = this.auth.user;
  readonly activeTab = signal<'profile' | 'password' | 'sessions'>('profile');

  // Profile form
  readonly profileName = signal('');
  readonly profilePhone = signal('');
  readonly profileBio = signal('');
  readonly profileCountry = signal('');
  readonly profileCity = signal('');
  readonly profileEducation = signal('');
  readonly profileOccupation = signal('');
  readonly profileGender = signal<'male' | 'female' | ''>('');
  readonly profileSaving = signal(false);

  // Password form
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly passwordSaving = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  // Sessions
  readonly sessions = signal<Session[]>([]);
  readonly sessionsLoading = signal(false);

  // Avatar
  readonly avatarUploading = signal(false);

  readonly userInitial = computed(() => {
    const name = this.user()?.name || 'U';
    return name.charAt(0).toUpperCase();
  });

  readonly passwordStrength = computed(() => {
    const pw = this.newPassword();
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[@$!%*?&]/.test(pw)) s++;
    return s;
  });

  readonly passwordsMatch = computed(() => {
    const np = this.newPassword();
    const cp = this.confirmPassword();
    return np && cp && np === cp;
  });

  ngOnInit(): void {
    this.loadProfileData();
    this.loadSessions();
  }

  setTab(tab: 'profile' | 'password' | 'sessions'): void {
    this.activeTab.set(tab);
    if (tab === 'sessions') this.loadSessions();
  }

  private loadProfileData(): void {
    const u = this.user();
    if (u) {
      this.profileName.set(u.name || '');
      this.profilePhone.set(u.phone || '');
      this.profileBio.set(u.profile?.bio || '');
      this.profileCountry.set(u.profile?.country || '');
      this.profileCity.set(u.profile?.city || '');
      this.profileEducation.set(u.profile?.education || '');
      this.profileOccupation.set(u.profile?.occupation || '');
      this.profileGender.set(u.profile?.gender || '');
    }
  }

  saveProfile(): void {
    this.profileSaving.set(true);
    const data = {
      name: this.profileName(),
      phone: this.profilePhone() || undefined,
      profile: {
        bio: this.profileBio() || undefined,
        country: this.profileCountry() || undefined,
        city: this.profileCity() || undefined,
        education: this.profileEducation() || undefined,
        occupation: this.profileOccupation() || undefined,
        gender: this.profileGender() || undefined,
      },
    };

    this.auth.updateProfile(data).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم تحديث البروفايل' : 'Profile updated successfully',
        });
      },
      error: () => {
        this.profileSaving.set(false);
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: this.isAr() ? 'فشل تحديث البروفايل' : 'Failed to update profile',
        });
      },
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error({
        title: this.isAr() ? 'خطأ' : 'Error',
        message: this.isAr() ? 'حجم الصورة أكبر من 5 ميجا' : 'Image must be under 5MB',
      });
      return;
    }

    this.avatarUploading.set(true);

    this.api.upload<{ url: string }>('/upload/avatar', file).subscribe({
      next: (res) => {
        this.auth.updateProfile({ avatar: res.url } as any).subscribe({
          next: () => {
            this.avatarUploading.set(false);
            this.toast.success({
              title: this.isAr() ? 'تم بنجاح' : 'Success',
              message: this.isAr() ? 'تم تحديث الصورة' : 'Avatar updated',
            });
          },
          error: () => this.avatarUploading.set(false),
        });
      },
      error: () => {
        this.avatarUploading.set(false);
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: this.isAr() ? 'فشل رفع الصورة' : 'Failed to upload avatar',
        });
      },
    });
  }

  changePassword(): void {
    if (!this.passwordsMatch()) return;
    this.passwordSaving.set(true);

    this.auth.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم تغيير كلمة المرور' : 'Password changed successfully',
        });
      },
      error: () => {
        this.passwordSaving.set(false);
        this.toast.error({
          title: this.isAr() ? 'خطأ' : 'Error',
          message: this.isAr() ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect',
        });
      },
    });
  }

  loadSessions(): void {
    this.sessionsLoading.set(true);
    this.api.get<{ data: Session[] }>('/sessions').subscribe({
      next: (res) => {
        this.sessions.set((res as any)?.data || []);
        this.sessionsLoading.set(false);
      },
      error: () => this.sessionsLoading.set(false),
    });
  }

  revokeSession(sessionId: string): void {
    this.api.delete(`/sessions/${sessionId}`).subscribe({
      next: () => {
        this.sessions.update((s) => s.filter((x) => x.sessionId !== sessionId));
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم إنهاء الجلسة' : 'Session revoked',
        });
      },
    });
  }

  revokeAllOtherSessions(): void {
    this.api.delete('/sessions').subscribe({
      next: () => {
        this.sessions.update((s) => s.filter((x) => x.isCurrent));
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم إنهاء جميع الجلسات الأخرى' : 'All other sessions revoked',
        });
      },
    });
  }

  getDeviceName(session: Session): string {
    const ua = session.deviceInfo?.userAgent || '';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return this.isAr() ? 'متصفح غير معروف' : 'Unknown Browser';
  }

  getDeviceIcon(session: Session): string {
    const ua = session.deviceInfo?.userAgent || '';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'mobile';
    return 'desktop';
  }

  getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return this.isAr() ? 'الآن' : 'Just now';
    if (mins < 60) return this.isAr() ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return this.isAr() ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return this.isAr() ? `منذ ${days} يوم` : `${days}d ago`;
  }
}
