import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PartnersService, PartnerPage } from '../../../core/services/partners.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-partners-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partners-list.component.html',
  styleUrl: './partners-list.component.css',
})
export class PartnersListComponent implements OnInit {
  private partnersService = inject(PartnersService);
  private i18n = inject(I18nService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly activeTab = signal<'discover' | 'myPages'>('discover');
  
  readonly discoverPages = signal<PartnerPage[]>([]);
  readonly myPages = signal<PartnerPage[]>([]);
  readonly isLoading = signal(false);
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('');

  readonly categories = [
    { value: '', labelAr: 'الكل', labelEn: 'All' },
    { value: 'Education', labelAr: 'تعليم', labelEn: 'Education' },
    { value: 'Technology', labelAr: 'تكنولوجيا', labelEn: 'Technology' },
    { value: 'Public Figure', labelAr: 'شخصية عامة', labelEn: 'Public Figure' },
    { value: 'Business', labelAr: 'بيزنس', labelEn: 'Business' }
  ];

  readonly showCreateModal = signal(false);
  newPage = { name: '', username: '', bio: '', category: 'Education' };

  ngOnInit() {
    this.loadMyPages();
    this.loadDiscoverPages();
  }

  setTab(tab: 'discover' | 'myPages') {
    this.activeTab.set(tab);
    if (tab === 'discover') this.loadDiscoverPages();
    else this.loadMyPages();
  }

  loadMyPages() {
    this.partnersService.getMyPages().subscribe({
      next: (res: any) => this.myPages.set(res.data || []),
    });
  }

  loadDiscoverPages() {
    this.isLoading.set(true);
    this.partnersService.getAllPages(1, 20, this.searchQuery(), this.selectedCategory()).subscribe({
      next: (res: any) => {
        this.discoverPages.set(res.data.pages || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleFollow(page: PartnerPage) {
    this.partnersService.followPage(page._id).subscribe({
      next: (res) => {
        page.isFollowing = res.isFollowing;
        page.followersCount += res.isFollowing ? 1 : -1;
      }
    });
  }

  createPage() {
    if (!this.newPage.name || !this.newPage.username) return;
    this.partnersService.createPage(this.newPage).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newPage = { name: '', username: '', bio: '', category: 'Education' };
        this.loadMyPages();
        this.setTab('myPages');
      },
      error: (err) => alert(err.error?.message || 'Error creating page')
    });
  }
}
