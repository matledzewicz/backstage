import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { SeedService } from '../../core/storage/seed.service';
import { Meetup } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';
import { ActivityLogComponent } from '../../shared/ui/activity-log';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, ActivityLogComponent],
  template: `
    <div class="max-w-[1400px] mx-auto px-6 py-8">
      <div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-semibold text-stone-900 tracking-tight">
            Panel organizatora
          </h1>
          <p class="text-stone-500 text-sm mt-1.5">Co się dzieje w ngWarsaw</p>
        </div>
        <div class="flex gap-2">
          <button
            (click)="seedData()"
            class="px-4 py-2 bg-white hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 border border-stone-200 hover:border-indigo-200 text-sm rounded-full transition-colors cursor-pointer shadow-sm"
          >
            Wczytaj przykłady
          </button>
          <button
            (click)="resetData()"
            class="px-4 py-2 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-200 text-sm rounded-full transition-colors cursor-pointer shadow-sm"
          >
            Wyczyść
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 rounded-2xl shadow-sm">
          <div class="text-indigo-700 text-sm font-medium">Aktywne meetupy</div>
          <div class="text-4xl font-semibold text-stone-900 mt-2 tabular-nums">{{ store.activeMeetups().length }}</div>
          <div class="text-xs text-stone-500 mt-1">w trakcie planowania i nadchodzące</div>
        </div>
        <div
          class="bg-gradient-to-br p-5 rounded-2xl shadow-sm border"
          [class]="store.unreviewedTalks().length > 0
            ? 'from-amber-50 to-white border-amber-200'
            : 'from-stone-50 to-white border-stone-200'"
        >
          <div class="text-sm font-medium" [class]="store.unreviewedTalks().length > 0 ? 'text-amber-700' : 'text-stone-600'">
            Talki do review
          </div>
          <div class="text-4xl font-semibold mt-2 tabular-nums" [class]="store.unreviewedTalks().length > 0 ? 'text-amber-700' : 'text-stone-900'">
            {{ store.unreviewedTalks().length }}
          </div>
          <div class="text-xs text-stone-500 mt-1">
            @if (store.unreviewedTalks().length > 0) { czekają na decyzję }
            @else { wszystko przejrzane }
          </div>
        </div>
        <div
          class="bg-gradient-to-br p-5 rounded-2xl shadow-sm border"
          [class]="store.blockedTasks().length > 0
            ? 'from-rose-50 to-white border-rose-200'
            : 'from-stone-50 to-white border-stone-200'"
        >
          <div class="text-sm font-medium" [class]="store.blockedTasks().length > 0 ? 'text-rose-700' : 'text-stone-600'">
            Zablokowane zadania
          </div>
          <div class="text-4xl font-semibold mt-2 tabular-nums" [class]="store.blockedTasks().length > 0 ? 'text-rose-700' : 'text-stone-900'">
            {{ store.blockedTasks().length }}
          </div>
          <div class="text-xs text-stone-500 mt-1">
            @if (store.blockedTasks().length > 0) { wymaga interwencji }
            @else { nic nie stoi }
          </div>
        </div>
        <div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 rounded-2xl shadow-sm">
          <div class="text-emerald-700 text-sm font-medium">Do najbliższego</div>
          <div class="text-4xl font-semibold mt-2 tabular-nums" [class]="daysClass()">
            @if (store.daysToNext() !== null) {
              {{ store.daysToNext() === 0 ? 'dziś' : store.daysToNext() }}
            } @else {
              —
            }
          </div>
          <div class="text-xs text-stone-500 mt-1 truncate">
            @if (store.nextMeetup()) { {{ store.nextMeetup()!.name }} }
            @else { brak zaplanowanych }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div class="xl:col-span-2">
          <h2 class="text-base font-semibold text-stone-900 mb-4">
            Wszystkie meetupy
          </h2>
          @if (store.meetups().length === 0) {
            <div class="bg-white border border-dashed border-stone-300 p-12 text-center rounded-3xl">
              <div class="text-stone-600">Lista jest pusta</div>
              <div class="text-stone-400 text-sm mt-2">Kliknij „Wczytaj przykłady” żeby zacząć</div>
            </div>
          }
          <div class="space-y-3">
            @for (meetup of store.meetups(); track meetup.id) {
              <a [routerLink]="['/meetup', meetup.id]" class="block">
                <div class="bg-white border border-stone-200 hover:border-indigo-300 hover:shadow-lg p-5 rounded-2xl transition-all slide-in cursor-pointer group shadow-sm">
                  <div class="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <div class="font-semibold text-stone-900 group-hover:text-indigo-700 transition-colors text-[15px]">
                        {{ meetup.name }}
                      </div>
                      <div class="text-xs text-stone-500 mt-1">
                        {{ formatDate(meetup.date) }} &middot; {{ meetup.venue }}
                      </div>
                    </div>
                    <app-status-badge [status]="meetup.status" type="meetup" />
                  </div>

                  <div class="mb-3">
                    <div class="flex justify-between text-xs text-stone-500 mb-1.5">
                      <span>Zadania</span>
                      <span class="tabular-nums">{{ doneTaskCount(meetup) }} / {{ meetup.tasks.length }}</span>
                    </div>
                    <div class="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                        [style.width]="taskProgress(meetup) + '%'"
                      ></div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 text-xs tabular-nums flex-wrap">
                    <span class="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {{ meetup.registered }} / {{ meetup.capacity }} zapisów
                    </span>
                    <span class="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                      {{ meetup.talkIds.length }} {{ meetup.talkIds.length === 1 ? 'talk' : 'talki' }}
                    </span>
                    <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800">
                      {{ meetup.sponsors.length }} {{ meetup.sponsors.length === 1 ? 'sponsor' : 'sponsorów' }}
                    </span>
                    @if (blockedCount(meetup) > 0) {
                      <span class="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                        {{ blockedCount(meetup) }} zablokowane
                      </span>
                    }
                  </div>

                  <div class="mt-4">
                    <div class="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [class]="registrationBarClass(meetup)"
                        [style.width]="registrationPct(meetup) + '%'"
                      ></div>
                    </div>
                    <div class="text-xs text-stone-400 mt-1 tabular-nums">Rejestracja {{ registrationPct(meetup) }}%</div>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <h2 class="text-base font-semibold text-stone-900 mb-4">
              Wymaga uwagi
            </h2>
            @if (store.blockedTasks().length === 0 && store.unreviewedTalks().length === 0) {
              <div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 p-6 rounded-2xl text-center shadow-sm">
                <div class="text-emerald-800 text-sm font-medium">Nic pilnego</div>
                <div class="text-stone-500 text-xs mt-1">Spokojny dzień</div>
              </div>
            }
            <div class="space-y-2">
              @for (item of store.blockedTasks(); track item.task.id) {
                <div class="bg-gradient-to-br from-rose-50 to-white border border-rose-200 p-4 rounded-2xl fade-in">
                  <div class="text-xs text-rose-700 mb-1 font-medium">Zablokowane &middot; {{ item.meetup.name }}</div>
                  <div class="text-sm text-stone-900 font-medium">{{ item.task.title }}</div>
                  @if (item.task.blocker) {
                    <div class="text-xs text-rose-700 mt-1">{{ item.task.blocker }}</div>
                  }
                  <a [routerLink]="['/meetup', item.meetup.id]" class="text-xs text-rose-700 hover:text-rose-900 mt-2 inline-block font-medium">
                    Otwórz meetup →
                  </a>
                </div>
              }
              @for (talk of store.unreviewedTalks().slice(0, 3); track talk.id) {
                <div class="bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-4 rounded-2xl fade-in">
                  <div class="text-xs text-amber-800 mb-1 font-medium">Talk do review</div>
                  <div class="text-sm text-stone-900 font-medium truncate">{{ talk.title }}</div>
                  <app-status-badge [status]="talk.status" type="talk" class="mt-2 inline-block" />
                </div>
              }
              @if (store.unreviewedTalks().length > 3) {
                <a routerLink="/pipeline" class="block text-xs text-amber-800 hover:text-amber-900 text-center py-2 font-medium">
                  + {{ store.unreviewedTalks().length - 3 }} więcej w pipeline →
                </a>
              }
            </div>
          </div>

          <app-activity-log [entries]="store.activity()" />
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  store = inject(AppStore);
  private seedService = inject(SeedService);

  daysClass = computed(() => {
    const d = this.store.daysToNext();
    if (d === null) return 'text-stone-400';
    if (d === 0) return 'text-rose-600';
    if (d <= 7) return 'text-amber-600';
    return 'text-emerald-700';
  });

  seedData(): void {
    this.seedService.seed();
  }

  resetData(): void {
    if (confirm('Na pewno wyczyścić wszystkie dane?')) {
      this.store.reset();
    }
  }

  doneTaskCount(meetup: Meetup): number {
    return meetup.tasks.filter(t => t.status === 'done').length;
  }

  taskProgress(meetup: Meetup): number {
    if (meetup.tasks.length === 0) return 0;
    return Math.round((this.doneTaskCount(meetup) / meetup.tasks.length) * 100);
  }

  blockedCount(meetup: Meetup): number {
    return meetup.tasks.filter(t => t.status === 'blocked').length;
  }

  registrationPct(meetup: Meetup): number {
    if (meetup.capacity === 0) return 0;
    return Math.round((meetup.registered / meetup.capacity) * 100);
  }

  registrationBarClass(meetup: Meetup): string {
    const pct = this.registrationPct(meetup);
    if (pct >= 90) return 'bg-gradient-to-r from-rose-400 to-rose-500';
    if (pct >= 70) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-indigo-400 to-indigo-500';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
