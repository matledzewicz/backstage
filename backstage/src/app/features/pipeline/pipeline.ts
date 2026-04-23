import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { Talk, TalkStatus } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';

const PIPELINE_COLS: { status: TalkStatus; label: string; next?: TalkStatus; prev?: TalkStatus }[] = [
  { status: 'submitted', label: '📨 Submitted', next: 'reviewing' },
  { status: 'reviewing', label: '👀 Reviewing', next: 'approved', prev: 'submitted' },
  { status: 'approved', label: '✅ Approved', next: 'scheduled', prev: 'reviewing' },
  { status: 'scheduled', label: '📅 Scheduled', next: 'delivered', prev: 'approved' },
  { status: 'delivered', label: '🎤 Delivered', prev: 'scheduled' },
];

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <div class="min-h-screen p-4 md:p-6">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/dashboard" class="text-gray-500 hover:text-white text-sm">← Dashboard</a>
        <h1 class="text-xl font-bold text-white">🚀 Talks Pipeline</h1>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 mb-6 flex-wrap items-center">
        <div>
          <label class="text-xs text-gray-500 font-mono mr-2">MEETUP:</label>
          <select
            (change)="meetupFilter.set($any($event.target).value)"
            class="bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded font-mono"
          >
            <option value="all">Wszystkie</option>
            @for (m of store.meetups(); track m.id) {
              <option [value]="m.id">{{ m.name }}</option>
            }
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-mono mr-2">LEVEL:</label>
          <select
            (change)="levelFilter.set($any($event.target).value)"
            class="bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded font-mono"
          >
            <option value="all">Wszystkie</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div class="text-xs text-gray-500 font-mono ml-auto">
          {{ filteredTalks().length }} talków
        </div>
      </div>

      <!-- Pipeline Kanban -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
        @for (col of pipelineCols; track col.status) {
          <div class="bg-gray-900 border border-gray-800 rounded p-3 min-w-48">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-mono text-gray-400">{{ col.label }}</h3>
              <span class="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">
                {{ talksByStatus(col.status).length }}
              </span>
            </div>
            <div class="space-y-2 min-h-32">
              @for (talk of talksByStatus(col.status); track talk.id) {
                <div
                  class="bg-gray-800 border border-gray-700 hover:border-gray-500 p-3 rounded cursor-pointer transition-all"
                  (click)="openModal(talk)"
                >
                  <div class="text-xs text-gray-500 mb-1">{{ levelBadge(talk.level) }}</div>
                  <div class="text-sm text-white font-medium leading-snug">{{ talk.title }}</div>
                  <div class="text-xs text-gray-500 mt-2">
                    🎤 {{ speakerName(talk.speakerId) }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    📅 {{ meetupName(talk.meetupId) }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">{{ talk.duration }} min</div>
                  @if (talk.rating) {
                    <div class="text-xs text-yellow-500 mt-1">{{ '⭐'.repeat(talk.rating) }}</div>
                  }
                </div>
              }
              @if (talksByStatus(col.status).length === 0) {
                <div class="text-gray-700 text-xs text-center py-6 border border-dashed border-gray-800 rounded">
                  pusto
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (selectedTalk()) {
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 fade-in" (click)="closeModal()">
          <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full slide-in" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between mb-4">
              <div>
                <app-status-badge [status]="selectedTalk()!.status" type="talk" />
                <h2 class="text-xl font-bold text-white mt-2">{{ selectedTalk()!.title }}</h2>
                <div class="text-sm text-gray-400 mt-1">
                  🎤 {{ speakerName(selectedTalk()!.speakerId) }} ·
                  {{ selectedTalk()!.duration }} min ·
                  {{ levelBadge(selectedTalk()!.level) }} {{ selectedTalk()!.level }}
                </div>
              </div>
              <button (click)="closeModal()" class="text-gray-500 hover:text-white text-xl cursor-pointer">✕</button>
            </div>

            <p class="text-sm text-gray-400 mb-4 leading-relaxed">{{ selectedTalk()!.abstract }}</p>

            <div class="text-xs text-gray-500 mb-4">
              Meetup: {{ meetupName(selectedTalk()!.meetupId) }}
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-wrap">
              @if (selectedTalk()!.status === 'submitted') {
                <button (click)="moveTalk('reviewing')" class="action-btn bg-blue-950 text-blue-300 border-blue-800 hover:bg-blue-900 cursor-pointer">
                  👀 Reviewing
                </button>
              }
              @if (['submitted', 'reviewing'].includes(selectedTalk()!.status)) {
                <button (click)="moveTalk('approved')" class="action-btn bg-green-950 text-green-300 border-green-800 hover:bg-green-900 cursor-pointer">
                  ✅ Approve
                </button>
                <button (click)="moveTalk('rejected')" class="action-btn bg-red-950 text-red-400 border-red-800 hover:bg-red-900 cursor-pointer">
                  ❌ Reject
                </button>
              }
              @if (selectedTalk()!.status === 'approved') {
                <button (click)="moveTalk('scheduled')" class="action-btn bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900 cursor-pointer">
                  📅 Schedule
                </button>
                <button (click)="moveTalk('rejected')" class="action-btn bg-red-950 text-red-400 border-red-800 hover:bg-red-900 cursor-pointer">
                  ❌ Odreject
                </button>
              }
              @if (selectedTalk()!.status === 'scheduled') {
                <button (click)="moveTalk('delivered')" class="action-btn bg-teal-950 text-teal-300 border-teal-800 hover:bg-teal-900 cursor-pointer">
                  🎤 Delivered
                </button>
              }
              @if (selectedTalk()!.status === 'delivered' && !selectedTalk()!.rating) {
                <div class="flex gap-1">
                  @for (star of [1,2,3,4,5]; track star) {
                    <button (click)="rateTalk(star)" class="text-2xl hover:scale-125 transition-transform cursor-pointer">⭐</button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .action-btn {
      @apply px-3 py-1.5 text-xs font-mono border rounded transition-colors;
    }
  `],
})
export class PipelineComponent {
  store = inject(AppStore);

  readonly pipelineCols = PIPELINE_COLS;

  meetupFilter = signal<string>('all');
  levelFilter = signal<string>('all');
  selectedTalk = signal<Talk | null>(null);

  filteredTalks = computed(() => {
    let talks = this.store.talks();
    if (this.meetupFilter() !== 'all') {
      talks = talks.filter(t => t.meetupId === this.meetupFilter());
    }
    if (this.levelFilter() !== 'all') {
      talks = talks.filter(t => t.level === this.levelFilter());
    }
    return talks;
  });

  talksByStatus(status: TalkStatus): Talk[] {
    return this.filteredTalks().filter(t => t.status === status);
  }

  speakerName(speakerId: string): string {
    return this.store.speakers().find(s => s.id === speakerId)?.name ?? 'Nieznany';
  }

  meetupName(meetupId: string): string {
    return this.store.meetups().find(m => m.id === meetupId)?.name ?? '?';
  }

  levelBadge(level: string): string {
    return { beginner: '🟢', intermediate: '🟡', advanced: '🔴' }[level] ?? '⚪';
  }

  openModal(talk: Talk): void {
    this.selectedTalk.set(talk);
  }

  closeModal(): void {
    this.selectedTalk.set(null);
  }

  moveTalk(status: TalkStatus): void {
    const talk = this.selectedTalk();
    if (!talk) return;
    this.store.updateTalkStatus(talk.id, status);
    this.selectedTalk.set({ ...talk, status });
  }

  rateTalk(rating: number): void {
    const talk = this.selectedTalk();
    if (!talk) return;
    this.store.rateTalk(talk.id, rating);
    this.selectedTalk.set({ ...talk, rating });
  }
}
