import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { Talk, TalkStatus } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';

const PIPELINE_COLS: { status: TalkStatus; label: string; col: string; dot: string }[] = [
  { status: 'submitted', label: 'Zgłoszone', col: 'bg-stone-100/70 border-stone-200', dot: 'bg-stone-400' },
  { status: 'reviewing', label: 'W review', col: 'bg-indigo-50/80 border-indigo-200', dot: 'bg-indigo-500' },
  { status: 'approved', label: 'Zaakceptowane', col: 'bg-emerald-50/80 border-emerald-200', dot: 'bg-emerald-500' },
  { status: 'scheduled', label: 'Zaplanowane', col: 'bg-violet-50/80 border-violet-200', dot: 'bg-violet-500' },
  { status: 'delivered', label: 'Wygłoszone', col: 'bg-teal-50/80 border-teal-200', dot: 'bg-teal-500' },
];

const LEVEL_COLOR: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-800 border-amber-200',
  advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <div class="max-w-[1400px] mx-auto px-6 py-8">
      <div class="flex items-end gap-4 mb-8 flex-wrap">
        <a routerLink="/dashboard" class="text-stone-500 hover:text-stone-900 text-sm mb-1">← Panel</a>
        <div>
          <h1 class="text-3xl font-semibold text-stone-900 tracking-tight">Pipeline talków</h1>
          <p class="text-stone-500 text-sm mt-1.5">Od zgłoszenia do sceny</p>
        </div>
      </div>

      <div class="flex gap-3 mb-6 flex-wrap items-center bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <label class="text-sm text-stone-500">Meetup</label>
          <select
            (change)="meetupFilter.set($any($event.target).value)"
            class="bg-stone-50 border border-stone-200 text-stone-800 text-sm px-3 py-1.5 rounded-full focus:outline-none focus:border-indigo-400"
          >
            <option value="all">Wszystkie</option>
            @for (m of store.meetups(); track m.id) {
              <option [value]="m.id">{{ m.name }}</option>
            }
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-stone-500">Poziom</label>
          <select
            (change)="levelFilter.set($any($event.target).value)"
            class="bg-stone-50 border border-stone-200 text-stone-800 text-sm px-3 py-1.5 rounded-full focus:outline-none focus:border-indigo-400"
          >
            <option value="all">Wszystkie</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div class="text-sm text-stone-500 ml-auto tabular-nums">
          {{ filteredTalks().length }} talków
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
        @for (col of pipelineCols; track col.status) {
          <div class="border rounded-3xl p-4 min-w-48 {{ col.col }}">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full {{ col.dot }}"></span>
                {{ col.label }}
              </h3>
              <span class="text-xs text-stone-500 bg-white/70 px-2 py-0.5 rounded-full tabular-nums">
                {{ talksByStatus(col.status).length }}
              </span>
            </div>
            <div class="space-y-2 min-h-32">
              @for (talk of talksByStatus(col.status); track talk.id) {
                <div
                  class="bg-white border border-stone-200 hover:border-indigo-300 hover:shadow-md p-3 rounded-2xl cursor-pointer transition-all shadow-sm"
                  (click)="openModal(talk)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border {{ levelClass(talk.level) }}">
                      {{ talk.level }}
                    </span>
                  </div>
                  <div class="text-sm text-stone-900 font-medium leading-snug">{{ talk.title }}</div>
                  <div class="text-xs text-stone-500 mt-2">{{ speakerName(talk.speakerId) }}</div>
                  <div class="text-xs text-stone-400 mt-0.5">{{ meetupName(talk.meetupId) }} &middot; {{ talk.duration }} min</div>
                  @if (talk.rating) {
                    <div class="text-xs text-amber-600 mt-1 tabular-nums">{{ '★'.repeat(talk.rating) }}{{ '☆'.repeat(5 - talk.rating) }}</div>
                  }
                </div>
              }
              @if (talksByStatus(col.status).length === 0) {
                <div class="text-stone-400 text-xs text-center py-8 border border-dashed border-stone-300 rounded-2xl">
                  pusto
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (selectedTalk()) {
        <div class="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in" (click)="closeModal()">
          <div class="bg-white border border-stone-200 rounded-3xl p-6 max-w-lg w-full slide-in shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between mb-4 gap-3">
              <div>
                <app-status-badge [status]="selectedTalk()!.status" type="talk" />
                <h2 class="text-xl font-semibold text-stone-900 mt-2 tracking-tight">{{ selectedTalk()!.title }}</h2>
                <div class="text-sm text-stone-500 mt-1">
                  {{ speakerName(selectedTalk()!.speakerId) }} &middot;
                  {{ selectedTalk()!.duration }} min &middot;
                  <span class="px-2 py-0.5 rounded-full border text-xs {{ levelClass(selectedTalk()!.level) }}">
                    {{ selectedTalk()!.level }}
                  </span>
                </div>
              </div>
              <button (click)="closeModal()" class="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 text-lg cursor-pointer leading-none flex items-center justify-center transition-colors">✕</button>
            </div>

            <p class="text-sm text-stone-700 mb-4 leading-relaxed">{{ selectedTalk()!.abstract }}</p>

            <div class="text-xs text-stone-500 mb-4">
              Meetup: {{ meetupName(selectedTalk()!.meetupId) }}
            </div>

            <div class="flex gap-2 flex-wrap">
              @if (selectedTalk()!.status === 'submitted') {
                <button (click)="moveTalk('reviewing')" class="px-3.5 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full cursor-pointer transition-colors">
                  W review
                </button>
              }
              @if (['submitted', 'reviewing'].includes(selectedTalk()!.status)) {
                <button (click)="moveTalk('approved')" class="px-3.5 py-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full cursor-pointer transition-colors">
                  Zaakceptuj
                </button>
                <button (click)="moveTalk('rejected')" class="px-3.5 py-1.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full cursor-pointer transition-colors">
                  Odrzuć
                </button>
              }
              @if (selectedTalk()!.status === 'approved') {
                <button (click)="moveTalk('scheduled')" class="px-3.5 py-1.5 text-sm bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-full cursor-pointer transition-colors">
                  Zaplanuj
                </button>
                <button (click)="moveTalk('rejected')" class="px-3.5 py-1.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full cursor-pointer transition-colors">
                  Odrzuć
                </button>
              }
              @if (selectedTalk()!.status === 'scheduled') {
                <button (click)="moveTalk('delivered')" class="px-3.5 py-1.5 text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-full cursor-pointer transition-colors">
                  Wygłoszone
                </button>
              }
              @if (selectedTalk()!.status === 'delivered' && !selectedTalk()!.rating) {
                <div class="flex gap-1 items-center">
                  <span class="text-sm text-stone-500 mr-1">Oceń:</span>
                  @for (star of [1,2,3,4,5]; track star) {
                    <button (click)="rateTalk(star)" class="text-xl text-amber-400 hover:text-amber-500 hover:scale-125 transition-transform cursor-pointer leading-none">★</button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
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

  levelClass(level: string): string {
    return LEVEL_COLOR[level] ?? 'bg-stone-50 text-stone-700 border-stone-200';
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
