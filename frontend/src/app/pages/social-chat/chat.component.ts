import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService, SocialMessage } from '../../core/services/messages.service';
import { SocketService } from '../../core/services/socket.service';
import { I18nService } from '../../core/services/i18n.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private messagesService = inject(MessagesService);
  private socketService = inject(SocketService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly currentUser = this.auth.user;
  
  readonly conversations = signal<any[]>([]);
  readonly activeChat = signal<any>(null);
  readonly messages = signal<SocialMessage[]>([]);
  readonly isLoadingMessages = signal(false);
  readonly newMessage = signal('');

  ngOnInit() {
    this.loadConversations();
    
    // Listen for real-time messages
    this.socketService.on('new_message', (msg) => {
      // If we are currently chatting with this person, add to messages
      if (this.activeChat() && (msg.senderId === this.activeChat()._id || msg.receiverId === this.activeChat()._id)) {
        this.messages.update(prev => [...prev, msg]);
        setTimeout(() => this.scrollToBottom(), 100);
      }
      // Refresh conversation list to show latest message preview
      this.loadConversations();
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadConversations() {
    this.messagesService.getConversations().subscribe({
      next: (res: any) => {
        this.conversations.set(res.data.map((c: any) => {
          const otherUser = c.senderId === this.currentUser()?._id ? c.receiver : c.sender;
          return { ...c, otherUser };
        }));
      }
    });
  }

  selectChat(conversation: any) {
    this.activeChat.set(conversation.otherUser);
    this.loadHistory(conversation.otherUser._id);
    this.markAsRead(conversation.otherUser._id);
  }

  loadHistory(otherId: string) {
    this.isLoadingMessages.set(true);
    this.messagesService.getHistory(otherId).subscribe({
      next: (res: any) => {
        this.messages.set(res.data);
        this.isLoadingMessages.set(false);
      },
      error: () => this.isLoadingMessages.set(false)
    });
  }

  sendMessage() {
    if (!this.newMessage().trim() || !this.activeChat()) return;
    
    const content = this.newMessage();
    this.newMessage.set('');

    this.messagesService.sendMessage(this.activeChat()._id, content).subscribe({
      next: (res: any) => {
        this.messages.update(msgs => [...msgs, res.data]);
        this.loadConversations(); // Update latest message in sidebar
      }
    });
  }

  markAsRead(senderId: string) {
    this.messagesService.markAsRead(senderId).subscribe();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
