import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupsService, SocialGroup } from '../../../core/services/groups.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.css',
})
export class GroupsListComponent implements OnInit {
  private groupsService = inject(GroupsService);
  private i18n = inject(I18nService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly activeTab = signal<'discover' | 'myGroups'>('discover');
  
  readonly discoverGroups = signal<SocialGroup[]>([]);
  readonly myGroups = signal<SocialGroup[]>([]);
  readonly isLoading = signal(false);
  readonly searchQuery = signal('');
  
  readonly showCreateModal = signal(false);
  newGroup = { name: '', description: '', privacy: 'public' };

  ngOnInit() {
    this.loadMyGroups();
    this.loadDiscoverGroups();
  }

  setTab(tab: 'discover' | 'myGroups') {
    this.activeTab.set(tab);
  }

  loadMyGroups() {
    this.groupsService.getMyGroups().subscribe({
      next: (res: any) => this.myGroups.set(res.data || []),
    });
  }

  loadDiscoverGroups() {
    this.isLoading.set(true);
    this.groupsService.getAllGroups(1, 20, this.searchQuery()).subscribe({
      next: (res: any) => {
        this.discoverGroups.set(res.data.groups || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch() {
    this.loadDiscoverGroups();
  }

  joinGroup(groupId: string) {
    this.groupsService.joinGroup(groupId).subscribe({
      next: (res) => {
        alert(this.isAr() ? 'تم إرسال الطلب أو الانضمام بنجاح!' : 'Joined or request sent successfully!');
        this.loadDiscoverGroups();
        this.loadMyGroups();
      },
      error: (err) => alert(err.error?.message || 'Error joining group')
    });
  }

  createGroup() {
    if (!this.newGroup.name) return;
    this.groupsService.createGroup(this.newGroup).subscribe({
      next: (res) => {
        this.showCreateModal.set(false);
        this.newGroup = { name: '', description: '', privacy: 'public' };
        this.loadMyGroups();
        this.setTab('myGroups');
      }
    });
  }
}
