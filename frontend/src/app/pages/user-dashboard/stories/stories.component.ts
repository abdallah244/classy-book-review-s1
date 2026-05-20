import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoriesService, StoryGroup } from '../../../core/services/stories.service';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-stories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stories.component.html',
  styleUrl: './stories.component.css',
})
export class StoriesComponent implements OnInit {
  private storiesService = inject(StoriesService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly currentUser = this.auth.user;
  
  readonly storyGroups = signal<StoryGroup[]>([]);
  readonly activeStoryGroup = signal<StoryGroup | null>(null);
  readonly activeStoryIndex = signal(0);
  readonly showViewer = signal(false);

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.storiesService.getFeedStories().subscribe({
      next: (res: any) => this.storyGroups.set(res.data || [])
    });
  }

  openStories(group: StoryGroup) {
    this.activeStoryGroup.set(group);
    this.activeStoryIndex.set(0);
    this.showViewer.set(true);
    this.markCurrentAsSeen();
  }

  nextStory() {
    if (!this.activeStoryGroup()) return;
    const group = this.activeStoryGroup()!;
    if (this.activeStoryIndex() < group.stories.length - 1) {
      this.activeStoryIndex.update(i => i + 1);
      this.markCurrentAsSeen();
    } else {
      this.closeViewer();
    }
  }

  prevStory() {
    if (this.activeStoryIndex() > 0) {
      this.activeStoryIndex.update(i => i - 1);
    }
  }

  markCurrentAsSeen() {
    const group = this.activeStoryGroup();
    if (!group) return;
    const story = group.stories[this.activeStoryIndex()];
    if (story) {
      this.storiesService.viewStory(story._id).subscribe();
    }
  }

  closeViewer() {
    this.showViewer.set(false);
    this.activeStoryGroup.set(null);
    this.loadStories(); // Refresh to update unseen rings
  }

  addStory() {
    const url = prompt(this.isAr() ? 'أدخل رابط الصورة للقصة:' : 'Enter image URL for the story:');
    if (url) {
      this.storiesService.createStory(url).subscribe({
        next: () => this.loadStories()
      });
    }
  }
}
