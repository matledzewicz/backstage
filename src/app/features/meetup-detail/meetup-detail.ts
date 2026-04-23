import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { Task, TaskStatus } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';

type Tab = 'overview' | 'talks' | 'tasks' | 'speakers' | 'sponsors';

const TASK_COLUMNS: { status: TaskStatus; label: string; col: string; dot: string }[] = [
  { status: 'todo', label: 'Do zrobienia', col: 'bg-stone-100/70 border-stone-200', dot: 'bg-stone-400' },
  { status: 'doing', label: 'W trakcie', col: 'bg-indigo-50/80 border-indigo-200', dot: 'bg-indigo-500' },
  { status: 'blocked', label: 'Zablokowane', col: 'bg-rose-50/80 border-rose-200', dot: 'bg-rose-500' },
  { status: 'done', label: 'Gotowe', col: 'bg-emerald-50/80 border-emerald-200', dot: 'bg-emerald-500' },
];

const TASK_NEXT: Record<TaskStatus, TaskStatus> = {
  todo: 'doing',
  doing: 'done',
  blocked: 'todo',
  done: 'todo',
};

const TASK_NEXT_LABEL: Record<TaskStatus, string> = {
  todo: 'w trakcie',
  doing: 'gotowe',
  blocked: 'do zrobienia',
  done: 'do zrobienia',
};

@Component({
  selector: 'app-meetup-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    @if (meetup()) {
      <div class="max-w-[1400px] mx-auto px-6 py-8">
        <div class="flex items-start gap-4 mb-8">
          <a routerLink="/dashboard" class="text-stone-500 hover:text-stone-900 text-sm mt-1">← Panel</a>
          <div class="flex-1">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-semibold text-stone-900 tracking-tight">{{ meetup()!.name }}</h1>
              <app-status-badge [status]="meetup()!.status" type="meetup" />
            </div>
            <div class="text-sm text-stone-500 mt-1">
              {{ formatDate(meetup()!.date) }} &middot; {{ meetup()!.venue }}
              &middot; {{ meetup()!.registered }}/{{ meetup()!.capacity }} zapisów
            </div>
          </div>
        </div>

        <div class="flex gap-1 mb-8 border-b border-stone-200 overflow-x-auto">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="px-4 py-2.5 text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2"
              [class]="activeTab() === tab.id
                ? 'text-stone-900 border-indigo-500 font-medium -mb-px'
                : 'text-stone-500 hover:text-stone-800 border-transparent'"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        @switch (activeTab()) {
          @case ('overview') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm">
                <h3 class="text-sm font-medium text-stone-700 mb-4">Statystyki</h3>
                <div class="space-y-4">
                  <div>
                    <div class="flex justify-between text-sm mb-1.5">
                      <span class="text-stone-500">Rejestracja</span>
                      <span class="text-stone-900 tabular-nums">{{ meetup()!.registered }} / {{ meetup()!.capacity }}</span>
                    </div>
                    <div class="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" [style.width]="regPct() + '%'"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-sm mb-1.5">
                      <span class="text-stone-500">Zadania ukończone</span>
                      <span class="text-stone-900 tabular-nums">{{ doneTasks() }} / {{ meetup()!.tasks.length }}</span>
                    </div>
                    <div class="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width]="taskPct() + '%'"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 pt-2">
                    <div class="text-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                      <div class="text-2xl font-semibold text-stone-900">{{ meetup()!.talkIds.length }}</div>
                      <div class="text-xs text-stone-500 mt-0.5">talki</div>
                    </div>
                    <div class="text-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                      <div class="text-2xl font-semibold text-stone-900">{{ meetup()!.sponsors.length }}</div>
                      <div class="text-xs text-stone-500 mt-0.5">sponsorzy</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm">
                <h3 class="text-sm font-medium text-stone-700 mb-4">Zablokowane zadania</h3>
                @if (blockedTasks().length === 0) {
                  <div class="text-stone-500 text-sm">Żadne zadanie nie jest zablokowane.</div>
                }
                <div class="space-y-2">
                  @for (task of blockedTasks(); track task.id) {
                    <div class="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-sm">
                      <div class="text-stone-900 font-medium">{{ task.title }}</div>
                      @if (task.blocker) {
                        <div class="text-rose-700 text-xs mt-1">{{ task.blocker }}</div>
                      }
                      @if (task.assignee) {
                        <div class="text-stone-500 text-xs mt-1">Odpowiedzialny: {{ task.assignee }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              @if (['scheduled', 'za-tydzien', 'dzis', 'odbyty'].includes(meetup()!.status)) {
                <div class="md:col-span-2 bg-white border border-stone-200 p-5 rounded-3xl shadow-sm">
                  <h3 class="text-sm font-medium text-stone-700 mb-4">Plan dnia</h3>
                  <div class="space-y-3">
                    <div class="flex gap-4 items-start">
                      <span class="text-xs text-stone-400 tabular-nums w-12 shrink-0 pt-0.5">17:30</span>
                      <div class="text-sm text-stone-700">Drzwi otwarte, networking, kawa</div>
                    </div>
                    <div class="flex gap-4 items-start">
                      <span class="text-xs text-stone-400 tabular-nums w-12 shrink-0 pt-0.5">18:00</span>
                      <div class="text-sm text-stone-700">Powitanie organizatorów, ogłoszenia sponsorów</div>
                    </div>
                    @for (talk of meetupTalks(); track talk.id; let i = $index) {
                      <div class="flex gap-4 items-start">
                        <span class="text-xs text-indigo-600 tabular-nums w-12 shrink-0 pt-0.5 font-medium">{{ talkTime(i) }}</span>
                        <div>
                          <div class="text-sm text-stone-900 font-medium">{{ talk.title }}</div>
                          <div class="text-xs text-stone-500 mt-0.5">{{ speakerName(talk.speakerId) }} &middot; {{ talk.duration }} min</div>
                        </div>
                      </div>
                    }
                    <div class="flex gap-4 items-start">
                      <span class="text-xs text-stone-400 tabular-nums w-12 shrink-0 pt-0.5">20:30</span>
                      <div class="text-sm text-stone-700">After party — lokalizacja TBD</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          @case ('tasks') {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (col of taskColumns; track col.status) {
                <div class="border rounded-3xl p-4 {{ col.col }}">
                  <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full {{ col.dot }}"></span>
                      {{ col.label }}
                    </span>
                    <span class="text-xs text-stone-500 tabular-nums bg-white/70 px-2 py-0.5 rounded-full">
                      {{ tasksByStatus(col.status).length }}
                    </span>
                  </h3>
                  <div class="space-y-2 min-h-24">
                    @for (task of tasksByStatus(col.status); track task.id) {
                      <div
                        class="p-3 rounded-2xl border text-sm cursor-pointer transition-all bg-white shadow-sm hover:shadow-md"
                        [class]="taskCardClass(task.status)"
                        (click)="advanceTask(task)"
                      >
                        <div class="text-xs text-stone-500 mb-1.5 flex gap-2 flex-wrap">
                          @if (task.assignee) { <span>{{ task.assignee }}</span> }
                          @if (task.dueDate) { <span class="tabular-nums">{{ shortDate(task.dueDate) }}</span> }
                        </div>
                        <div class="text-stone-900 font-medium">{{ task.title }}</div>
                        @if (task.blocker && task.status === 'blocked') {
                          <div class="text-rose-700 text-xs mt-1.5">{{ task.blocker }}</div>
                        }
                        <div class="text-xs text-stone-400 mt-2">
                          kliknij → {{ TASK_NEXT_LABEL[task.status] }}
                        </div>
                      </div>
                    }
                    @if (tasksByStatus(col.status).length === 0) {
                      <div class="text-stone-400 text-xs text-center py-6 border border-dashed border-stone-300 rounded-2xl">
                        pusto
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @case ('talks') {
            <div>
              <div class="flex gap-2 mb-6 flex-wrap">
                @for (f of talkFilters; track f.value) {
                  <button
                    (click)="talkFilter.set(f.value)"
                    class="px-3 py-1.5 text-sm border rounded-full transition-colors cursor-pointer"
                    [class]="talkFilter() === f.value
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'"
                  >
                    {{ f.label }}
                  </button>
                }
              </div>
              <div class="space-y-3">
                @for (talk of filteredTalks(); track talk.id) {
                  <div class="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm">
                    <div class="flex items-start justify-between mb-2 gap-3">
                      <div>
                        <div class="font-semibold text-stone-900">{{ talk.title }}</div>
                        <div class="text-xs text-stone-500 mt-1">
                          {{ speakerName(talk.speakerId) }} &middot; {{ talk.duration }} min &middot; {{ talk.level }}
                        </div>
                      </div>
                      <app-status-badge [status]="talk.status" type="talk" />
                    </div>
                    <p class="text-sm text-stone-700 mt-3 leading-relaxed">{{ talk.abstract }}</p>
                    @if (talk.rating) {
                      <div class="text-sm text-amber-600 mt-3 tabular-nums">
                        {{ '★'.repeat(talk.rating) }}{{ '☆'.repeat(5 - talk.rating) }} &nbsp; {{ talk.rating }}/5
                      </div>
                    }
                    <div class="flex gap-2 mt-4 flex-wrap">
                      @if (talk.status === 'submitted' || talk.status === 'reviewing') {
                        <button (click)="approveTalk(talk.id)" class="px-3 py-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl cursor-pointer transition-colors">
                          Zaakceptuj
                        </button>
                        <button (click)="rejectTalk(talk.id)" class="px-3 py-1.5 text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl cursor-pointer transition-colors">
                          Odrzuć
                        </button>
                        @if (talk.status === 'submitted') {
                          <button (click)="reviewTalk(talk.id)" class="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl cursor-pointer transition-colors">
                            Przejrzyj
                          </button>
                        }
                      }
                    </div>
                  </div>
                }
                @if (filteredTalks().length === 0) {
                  <div class="text-stone-500 text-sm text-center py-10">Brak talków dla tego filtru</div>
                }
              </div>
            </div>
          }

          @case ('speakers') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (speaker of meetupSpeakers(); track speaker.id) {
                <div class="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm">
                  <div class="flex items-center gap-3 mb-3">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      [style.background]="avatarColor(speaker.avatarSeed)"
                    >
                      {{ speaker.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-semibold text-stone-900 text-sm">{{ speaker.name }}</div>
                      @if (speaker.twitter) {
                        <div class="text-xs text-indigo-600">&#64;{{ speaker.twitter }}</div>
                      }
                    </div>
                  </div>
                  <p class="text-sm text-stone-600 leading-relaxed">{{ speaker.bio }}</p>
                  <div class="text-xs text-stone-500 mt-3">
                    {{ speaker.previousTalks }} poprzednich talków
                  </div>
                </div>
              }
              @if (meetupSpeakers().length === 0) {
                <div class="col-span-3 text-stone-500 text-center py-10">
                  Brak speakerów. Czas ogarnąć CFP.
                </div>
              }
            </div>
          }

          @case ('sponsors') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (sponsor of meetup()!.sponsors; track sponsor) {
                <div class="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center text-xl font-semibold">
                    {{ sponsor.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-semibold text-stone-900">{{ sponsor }}</div>
                    <div class="text-xs text-stone-500 mt-0.5">Gold Sponsor</div>
                  </div>
                </div>
              }
              @if (meetup()!.sponsors.length === 0) {
                <div class="col-span-2 text-stone-500 text-center py-10">
                  Brak sponsorów.
                </div>
              }
            </div>
          }
        }
      </div>
    } @else {
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-stone-600 text-lg">Meetup nie istnieje</div>
          <a routerLink="/dashboard" class="text-indigo-600 hover:text-indigo-800 text-sm mt-3 inline-block">← Wróć do panelu</a>
        </div>
      </div>
    }
  `,
})
export class MeetupDetailComponent {
  private route = inject(ActivatedRoute);
  private store = inject(AppStore);

  readonly TASK_NEXT = TASK_NEXT;
  readonly TASK_NEXT_LABEL = TASK_NEXT_LABEL;
  readonly taskColumns = TASK_COLUMNS;

  tabs = [
    { id: 'overview' as Tab, label: 'Przegląd' },
    { id: 'talks' as Tab, label: 'Talki' },
    { id: 'tasks' as Tab, label: 'Zadania' },
    { id: 'speakers' as Tab, label: 'Speakerzy' },
    { id: 'sponsors' as Tab, label: 'Sponsorzy' },
  ];

  talkFilters = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Zgłoszone', value: 'submitted' },
    { label: 'W review', value: 'reviewing' },
    { label: 'Zaakceptowane', value: 'approved' },
    { label: 'Odrzucone', value: 'rejected' },
    { label: 'Zaplanowane', value: 'scheduled' },
    { label: 'Wygłoszone', value: 'delivered' },
  ];

  activeTab = signal<Tab>('overview');
  talkFilter = signal<string>('all');

  private meetupId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  meetup = computed(() => this.store.getMeetup(this.meetupId())());
  meetupTalks = computed(() => this.store.getTalksForMeetup(this.meetupId())());

  filteredTalks = computed(() => {
    const filter = this.talkFilter();
    const talks = this.meetupTalks();
    if (filter === 'all') return talks;
    return talks.filter(t => t.status === filter);
  });

  regPct = computed(() => {
    const m = this.meetup();
    if (!m || m.capacity === 0) return 0;
    return Math.round((m.registered / m.capacity) * 100);
  });

  doneTasks = computed(() => this.meetup()?.tasks.filter(t => t.status === 'done').length ?? 0);

  taskPct = computed(() => {
    const m = this.meetup();
    if (!m || m.tasks.length === 0) return 0;
    return Math.round((this.doneTasks() / m.tasks.length) * 100);
  });

  blockedTasks = computed(() => this.meetup()?.tasks.filter(t => t.status === 'blocked') ?? []);

  meetupSpeakers = computed(() => {
    const speakerIds = new Set(this.meetupTalks().map(t => t.speakerId));
    return this.store.speakers().filter(s => speakerIds.has(s.id));
  });

  tasksByStatus(status: TaskStatus): Task[] {
    return this.meetup()?.tasks.filter(t => t.status === status) ?? [];
  }

  taskCardClass(status: TaskStatus): string {
    switch (status) {
      case 'todo': return 'border-stone-200 hover:border-stone-400';
      case 'doing': return 'border-indigo-200 hover:border-indigo-400';
      case 'blocked': return 'border-rose-200 hover:border-rose-400 bg-rose-50/60';
      case 'done': return 'border-emerald-200 hover:border-emerald-400 opacity-75';
      default: return 'border-stone-200';
    }
  }

  advanceTask(task: Task): void {
    const meetupId = this.meetupId();
    this.store.updateTaskStatus(meetupId, task.id, TASK_NEXT[task.status]);
  }

  approveTalk(talkId: string): void {
    this.store.updateTalkStatus(talkId, 'approved');
  }

  rejectTalk(talkId: string): void {
    this.store.updateTalkStatus(talkId, 'rejected');
  }

  reviewTalk(talkId: string): void {
    this.store.updateTalkStatus(talkId, 'reviewing');
  }

  speakerName(speakerId: string): string {
    return this.store.speakers().find(s => s.id === speakerId)?.name ?? 'Nieznany';
  }

  talkTime(index: number): string {
    const base = 18 * 60 + 15;
    let minutes = base + index * 35;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  }

  avatarColor(seed: string): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#ef4444'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
