import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationsService, SocialNotification } from '../../../core/services/notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css',
})
export class NotificationDropdownComponent implements OnInit {
  public notificationsService = inject(NotificationsService);
  private socketService = inject(SocketService);
  private i18n = inject(I18nService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly isOpen = signal(false);

  ngOnInit() {
    this.notificationsService.loadNotifications().subscribe();
    
    // Listen for real-time notifications
    this.socketService.on('new_notification', (notif) => {
      // Update the signal inside the service
      this.notificationsService.notifications.update(prev => [notif, ...prev]);
      this.notificationsService.unreadCount.update(count => count + 1);
    });
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen() && this.notificationsService.unreadCount() > 0) {
      // Potentially mark all as read when opening, or wait for user to click
    }
  }

  markAllRead() {
    this.notificationsService.markAllAsRead().subscribe();
  }

  handleNotificationClick(notif: SocialNotification) {
    this.notificationsService.markOneAsRead(notif._id).subscribe();
    this.isOpen.set(false);
    // Logic to route based on type
  }

  getNotificationText(notif: SocialNotification): string {
    const sender = notif.senderId?.name || 'User';
    if (this.isAr()) {
      switch (notif.type) {
        case 'like': return `قام ${sender} بالإعجاب بمنشورك`;
        case 'comment': return `علق ${sender} على منشورك`;
        case 'follow': return `بدأ ${sender} بمتابعتك`;
        case 'group_invite': return `دعاك ${sender} للانضمام لمجموعة`;
        case 'message': return `أرسل لك ${sender} رسالة جديدة`;
        default: return notif.content || 'إشعار جديد';
      }
    } else {
      switch (notif.type) {
        case 'like': return `${sender} liked your post`;
        case 'comment': return `${sender} commented on your post`;
        case 'follow': return `${sender} started following you`;
        case 'group_invite': return `${sender} invited you to a group`;
        case 'message': return `${sender} sent you a message`;
        default: return notif.content || 'New notification';
      }
    }
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
