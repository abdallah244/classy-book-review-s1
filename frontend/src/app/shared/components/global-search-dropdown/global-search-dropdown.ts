import { Component, inject, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../core/services/search.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-global-search-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (isVisible && (results().users.length || results().groups.length || results().posts.length)) {
      <div class="search-dropdown-container">
        <!-- Users Section -->
        @if (results().users.length) {
          <div class="search-section">
            <h4 class="section-title">الأشخاص</h4>
            @for (user of results().users; track user._id) {
              <a [routerLink]="['/social/profile', user._id]" class="result-item">
                <img [src]="user.avatar || 'assets/default-avatar.png'" class="avatar">
                <div class="info">
                  <span class="name">{{ user.name }}</span>
                  <span class="meta">{{ user.role }}</span>
                </div>
              </a>
            }
          </div>
        }

        <!-- Groups Section -->
        @if (results().groups.length) {
          <div class="search-section">
            <h4 class="section-title">المجموعات</h4>
            @for (group of results().groups; track group._id) {
              <a [routerLink]="['/social/groups', group._id]" class="result-item">
                <div class="group-icon">👥</div>
                <div class="info">
                  <span class="name">{{ group.name }}</span>
                  <span class="meta">{{ group.membersCount }} عضو</span>
                </div>
              </a>
            }
          </div>
        }

        <!-- Posts Section -->
        @if (results().posts.length) {
          <div class="search-section">
            <h4 class="section-title">المنشورات</h4>
            @for (post of results().posts; track post._id) {
              <a [routerLink]="['/social/post', post._id]" class="result-item">
                <div class="post-preview">
                  <p class="content">{{ post.content | slice:0:50 }}...</p>
                  <span class="meta">بواسطة {{ post.author?.name }}</span>
                </div>
              </a>
            }
          </div>
        }

        <div class="search-footer">
          <button class="view-all">عرض كل النتائج</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .search-dropdown-container {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      margin-top: 10px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      z-index: 1000;
      max-height: 500px;
      overflow-y: auto;
      padding: 10px 0;
      animation: fadeIn 0.2s ease-out;
    }

    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 10px 20px 5px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      text-decoration: none;
      color: var(--text-primary);
      transition: 0.2s;
    }

    .result-item:hover {
      background: rgba(var(--green-rgb), 0.1);
      padding-right: 25px;
    }

    .avatar { width: 40px; height: 40px; border-radius: 12px; object-fit: cover; }
    .group-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--bg-page); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }

    .info { display: flex; flex-direction: column; }
    .name { font-weight: 700; font-size: 0.95rem; }
    .meta { font-size: 0.75rem; color: var(--text-muted); }

    .post-preview .content { font-size: 0.9rem; margin: 0; color: var(--text-secondary); }

    .search-footer { padding: 10px 20px; border-top: 1px solid var(--border-light); margin-top: 5px; }
    .view-all { width: 100%; padding: 8px; border: none; background: none; color: var(--green); font-weight: 700; cursor: pointer; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class GlobalSearchDropdownComponent implements OnChanges {
  @Input() query: string = '';
  @Input() isVisible: boolean = false;

  private searchService = inject(SearchService);
  private searchSubject = new Subject<string>();

  results = signal<{ users: any[], groups: any[], posts: any[] }>({ users: [], groups: [], posts: [] });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.searchService.socialSearch(q) : [])
    ).subscribe(res => {
      if (res && res.data) {
        this.results.set(res.data);
      } else {
        this.results.set({ users: [], groups: [], posts: [] });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query'] && this.query) {
      this.searchSubject.next(this.query);
    }
  }
}
