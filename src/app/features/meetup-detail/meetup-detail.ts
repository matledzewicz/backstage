import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { Task, TaskStatus, Talk, TalkStatus } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';

type Tab = 'overview' | 'talks' | 'tasks' | 'speakers' | 'sponsors';

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: '⬜ Todo' },
  { status: 'doing', label: '🔄 Doing' },
  { status: 'blocked', label: '🚫 Blocked' },
  { status: 'done', label: '✅ Done' },
];

const TASK_NEXT: Record<TaskStatus, TaskStatus> = {
  todo: 'doing',
  doing: 'done',
  blocked: 'todo',
  done: 'todo',
};

@Component({
  selector: 'app-meetup-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    @if (meetup()) {
      <div class="min-h-screen p-4 md:p-6">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <a routerLink="/dashboard" class="text-gray-500 hover:text-white text-sm">← Dashboard</a>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold text-white">{{ meetup()!.name }}</h1>
              <app-status-badge [status]="meetup()!.status" type="meetup" />
            </div>
            <div class="text-xs text-gray-500 mt-1">
              📅 {{ formatDate(meetup()!.date) }} &nbsp;|&nbsp; 📍 {{ meetup()!.venue }}
              &nbsp;|&nbsp; 👥 {{ meetup()!.registered }}/{{ meetup()!.capacity }}
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="px-4 py-2 text-sm font-mono whitespace-nowrap transition-colors cursor-pointer"
              [class]="activeTab() === tab.id
                ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                : 'text-gray-500 hover:text-gray-300'"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab Content -->
        @switch (activeTab()) {
          @case ('overview') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Stats -->
              <div class="bg-gray-900 border border-gray-800 p-4 rounded">
                <h3 class="text-sm text-gray-400 font-mono mb-3">📊 Statystyki</h3>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-400">Rejestracja</span>
                      <span class="text-white">{{ meetup()!.registered }}/{{ meetup()!.capacity }}</span>
                    </div>
                    <div class="h-2 bg-gray-800 rounded-full">
                      <div class="h-full bg-blue-500 rounded-full" [style.width]="regPct() + '%'"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-400">Taski done</span>
                      <span class="text-white">{{ doneTasks() }}/{{ meetup()!.tasks.length }}</span>
                    </div>
                    <div class="h-2 bg-gray-800 rounded-full">
                      <div class="h-full bg-green-500 rounded-full" [style.width]="taskPct() + '%'"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 pt-2">
                    <div class="text-center p-2 bg-gray-800 rounded">
                      <div class="text-lg font-bold text-purple-400">{{ meetup()!.talkIds.length }}</div>
                      <div class="text-xs text-gray-500">talki</div>
                    </div>
                    <div class="text-center p-2 bg-gray-800 rounded">
                      <div class="text-lg font-bold text-yellow-400">{{ meetup()!.sponsors.length }}</div>
                      <div class="text-xs text-gray-500">sponsorzy</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Blocked tasks quick view -->
              <div class="bg-gray-900 border border-gray-800 p-4 rounded">
                <h3 class="text-sm text-gray-400 font-mono mb-3">🚫 Blocked taski</h3>
                @if (blockedTasks().length === 0) {
                  <div class="text-gray-600 text-sm">Nic nie jest blocked 🎉</div>
                }
                <div class="space-y-2">
                  @for (task of blockedTasks(); track task.id) {
                    <div class="bg-red-950 border border-red-900 p-3 rounded text-sm">
                      <div class="font-mono text-white">{{ task.title }}</div>
                      @if (task.blocker) {
                        <div class="text-red-400 text-xs mt-1">→ {{ task.blocker }}</div>
                      }
                      @if (task.assignee) {
                        <div class="text-gray-500 text-xs mt-1">👤 {{ task.assignee }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Timeline for scheduled/later -->
              @if (['scheduled', 'za-tydzien', 'dzis', 'odbyty'].includes(meetup()!.status)) {
                <div class="md:col-span-2 bg-gray-900 border border-gray-800 p-4 rounded">
                  <h3 class="text-sm text-gray-400 font-mono mb-3">🕐 Timeline dnia</h3>
                  <div class="space-y-2">
                    <div class="flex gap-3 items-start">
                      <span class="text-xs text-gray-500 font-mono w-12 shrink-0">17:30</span>
                      <div class="text-sm text-gray-300">Drzwi otwarte, networking, kawa ☕</div>
                    </div>
                    <div class="flex gap-3 items-start">
                      <span class="text-xs text-gray-500 font-mono w-12 shrink-0">18:00</span>
                      <div class="text-sm text-gray-300">Powitanie organizatorów, ogłoszenia sponsorów</div>
                    </div>
                    @for (talk of meetupTalks(); track talk.id; let i = $index) {
                      <div class="flex gap-3 items-start">
                        <span class="text-xs text-green-500 font-mono w-12 shrink-0">{{ talkTime(i) }}</span>
                        <div>
                          <div class="text-sm text-white">{{ talk.title }}</div>
                          <div class="text-xs text-gray-500">{{ speakerName(talk.speakerId) }} · {{ talk.duration }} min</div>
                        </div>
                      </div>
                    }
                    <div class="flex gap-3 items-start">
                      <span class="text-xs text-gray-500 font-mono w-12 shrink-0">20:30</span>
                      <div class="text-sm text-gray-300">After party 🍺 — lokalizacja TBD</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          @case ('tasks') {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (col of taskColumns; track col.status) {
                <div class="bg-gray-900 border border-gray-800 rounded p-3">
                  <h3 class="text-xs font-mono text-gray-400 mb-3">{{ col.label }} ({{ tasksByStatus(col.status).length }})</h3>
                  <div class="space-y-2 min-h-24">
                    @for (task of tasksByStatus(col.status); track task.id) {
                      <div
                        class="p-3 rounded border text-sm cursor-pointer transition-all"
                        [class]="taskCardClass(task.status)"
                        (click)="advanceTask(task)"
                      >
                        <div class="font-mono text-xs text-gray-400 mb-1">
                          {{ task.assignee ? '👤 ' + task.assignee : '' }}
                          {{ task.dueDate ? '📅 ' + shortDate(task.dueDate) : '' }}
                        </div>
                        <div class="text-white">{{ task.title }}</div>
                        @if (task.blocker && task.status === 'blocked') {
                          <div class="text-red-400 text-xs mt-1">🚧 {{ task.blocker }}</div>
                        }
                        <div class="text-xs text-gray-600 mt-2">
                          klik → {{ TASK_NEXT[task.status] }}
                        </div>
                      </div>
                    }
                    @if (tasksByStatus(col.status).length === 0) {
                      <div class="text-gray-700 text-xs text-center py-4 border border-dashed border-gray-800 rounded">
                        puste
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @case ('talks') {
            <div>
              <div class="flex gap-2 mb-4 flex-wrap">
                @for (f of talkFilters; track f.value) {
                  <button
                    (click)="talkFilter.set(f.value)"
                    class="px-3 py-1 text-xs font-mono border rounded transition-colors cursor-pointer"
                    [class]="talkFilter() === f.value
                      ? 'bg-green-900 text-green-300 border-green-700'
                      : 'bg-gray-900 text-gray-500 border-gray-700 hover:border-gray-500'"
                  >
                    {{ f.label }}
                  </button>
                }
              </div>
              <div class="space-y-3">
                @for (talk of filteredTalks(); track talk.id) {
                  <div class="bg-gray-900 border border-gray-800 p-4 rounded">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <div class="font-bold text-white">{{ talk.title }}</div>
                        <div class="text-xs text-gray-500 mt-1">
                          🎤 {{ speakerName(talk.speakerId) }} · {{ talk.duration }} min · {{ talk.level }}
                        </div>
                      </div>
                      <app-status-badge [status]="talk.status" type="talk" />
                    </div>
                    <p class="text-sm text-gray-400 mt-2">{{ talk.abstract }}</p>
                    @if (talk.rating) {
                      <div class="text-xs text-yellow-400 mt-2">{{ '⭐'.repeat(talk.rating) }} {{ talk.rating }}/5</div>
                    }
                    <div class="flex gap-2 mt-3 flex-wrap">
                      @if (talk.status === 'submitted' || talk.status === 'reviewing') {
                        <button (click)="approveTalk(talk.id)" class="px-3 py-1 text-xs bg-green-900 hover:bg-green-800 text-green-300 border border-green-700 rounded cursor-pointer">
                          ✅ Approve
                        </button>
                        <button (click)="rejectTalk(talk.id)" class="px-3 py-1 text-xs bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded cursor-pointer">
                          ❌ Reject
                        </button>
                        @if (talk.status === 'submitted') {
                          <button (click)="reviewTalk(talk.id)" class="px-3 py-1 text-xs bg-blue-950 hover:bg-blue-900 text-blue-400 border border-blue-800 rounded cursor-pointer">
                            👀 Reviewing
                          </button>
                        }
                      }
                    </div>
                  </div>
                }
                @if (filteredTalks().length === 0) {
                  <div class="text-gray-600 text-sm text-center py-8">Brak talków dla tego filtru</div>
                }
              </div>
            </div>
          }

          @case ('speakers') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (speaker of meetupSpeakers(); track speaker.id) {
                <div class="bg-gray-900 border border-gray-800 p-4 rounded">
                  <div class="flex items-center gap-3 mb-3">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                      [style.background]="avatarColor(speaker.avatarSeed)"
                    >
                      {{ speaker.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-white text-sm">{{ speaker.name }}</div>
                      @if (speaker.twitter) {
                        <div class="text-xs text-blue-400">@{{ speaker.twitter }}</div>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-gray-400">{{ speaker.bio }}</p>
                  <div class="text-xs text-gray-500 mt-2">
                    🎤 {{ speaker.previousTalks }} poprzednich talków
                  </div>
                </div>
              }
              @if (meetupSpeakers().length === 0) {
                <div class="col-span-3 text-gray-600 text-center py-8">
                  Brak speakerów. Ogarnij CFP!
                </div>
              }
            </div>
          }

          @case ('sponsors') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (sponsor of meetup()!.sponsors; track sponsor) {
                <div class="bg-gray-900 border border-gray-700 p-6 rounded flex items-center gap-4">
                  <div class="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-xl">
                    💰
                  </div>
                  <div>
                    <div class="font-bold text-white">{{ sponsor }}</div>
                    <div class="text-xs text-gray-500 mt-1">Gold Sponsor</div>
                  </div>
                </div>
              }
              @if (meetup()!.sponsors.length === 0) {
                <div class="col-span-2 text-gray-600 text-center py-8">
                  Brak sponsorów. Śmierć aplikacji 💸
                </div>
              }
            </div>
          }
        }
      </div>
    } @else {
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-4">🤷</div>
          <div class="text-gray-400">Meetup nie istnieje</div>
          <a routerLink="/dashboard" class="text-green-400 hover:text-green-300 text-sm mt-2 inline-block">← Wróć do dashboardu</a>
        </div>
      </div>
    }
  `,
})
export class MeetupDetailComponent {
  private route = inject(ActivatedRoute);
  private store = inject(AppStore);

  readonly TASK_NEXT = TASK_NEXT;
  readonly taskColumns = TASK_COLUMNS;

  tabs = [
    { id: 'overview' as Tab, label: '📊 Overview' },
    { id: 'talks' as Tab, label: '🎤 Talks' },
    { id: 'tasks' as Tab, label: '✅ Tasks' },
    { id: 'speakers' as Tab, label: '👤 Speakers' },
    { id: 'sponsors' as Tab, label: '💰 Sponsors' },
  ];

  talkFilters = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Reviewing', value: 'reviewing' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Delivered', value: 'delivered' },
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
      case 'todo': return 'bg-gray-800 border-gray-700 hover:border-gray-500';
      case 'doing': return 'bg-blue-950 border-blue-900 hover:border-blue-700';
      case 'blocked': return 'bg-red-950 border-red-900 hover:border-red-700';
      case 'done': return 'bg-green-950 border-green-900 hover:border-green-700 opacity-70';
      default: return 'bg-gray-800 border-gray-700';
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
    const colors = ['#1e3a5f', '#3d1a5f', '#1a3d1a', '#5f3d1a', '#1a3a5f', '#5f1a3a'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
