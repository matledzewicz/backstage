import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/state/app.store';
import { SeedService } from '../../core/storage/seed.service';
import { Meetup, MeetupStatus } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge';
import { ActivityLogComponent } from '../../shared/ui/activity-log';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, ActivityLogComponent],
  template: `
    <div class="min-h-screen p-4 md:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-green-400 tracking-wider">
            🎛️ BACKSTAGE MISSION CONTROL
          </h1>
          <p class="text-gray-500 text-sm mt-1">ngWarsaw organizator dashboard</p>
        </div>
        <div class="flex gap-2">
          <button
            (click)="seedData()"
            class="px-4 py-2 bg-green-900 hover:bg-green-700 text-green-300 border border-green-600 text-sm font-mono transition-colors cursor-pointer"
          >
            🌱 Seed Data
          </button>
          <button
            (click)="resetData()"
            class="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-sm font-mono transition-colors cursor-pointer"
          >
            💣 Reset
          </button>
        </div>
      </div>

      <!-- KPI Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-gray-900 border border-gray-700 p-4 rounded">
          <div class="text-gray-500 text-xs mb-1">AKTYWNE MEETUPY</div>
          <div class="text-3xl font-bold text-blue-400">{{ store.activeMeetups().length }}</div>
          <div class="flex mt-2 gap-1">
            @for (_ of store.activeMeetups(); track $index) {
              <div class="w-2 h-2 rounded-full bg-blue-500 pulse-dot" [style.animation-delay]="($index * 0.3) + 's'"></div>
            }
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-700 p-4 rounded">
          <div class="text-gray-500 text-xs mb-1">TALKI DO REVIEW</div>
          <div class="text-3xl font-bold" [class]="store.unreviewedTalks().length > 0 ? 'text-yellow-400' : 'text-gray-600'">
            {{ store.unreviewedTalks().length }}
          </div>
          @if (store.unreviewedTalks().length > 0) {
            <div class="text-xs text-yellow-600 mt-2">⚠️ ogarnij już</div>
          }
        </div>
        <div class="bg-gray-900 border border-gray-700 p-4 rounded">
          <div class="text-gray-500 text-xs mb-1">BLOCKED TASKI</div>
          <div class="text-3xl font-bold" [class]="store.blockedTasks().length > 0 ? 'text-red-400' : 'text-gray-600'">
            {{ store.blockedTasks().length }}
          </div>
          @if (store.blockedTasks().length > 0) {
            <div class="text-xs text-red-600 mt-2">🚨 pilne</div>
          }
        </div>
        <div class="bg-gray-900 border border-gray-700 p-4 rounded">
          <div class="text-gray-500 text-xs mb-1">DNI DO MEETUPU</div>
          <div class="text-3xl font-bold" [class]="daysClass()">
            @if (store.daysToNext() !== null) {
              {{ store.daysToNext() === 0 ? 'DZIŚ!' : store.daysToNext() }}
            } @else {
              —
            }
          </div>
          @if (store.nextMeetup()) {
            <div class="text-xs text-gray-600 mt-2 truncate">{{ store.nextMeetup()!.name }}</div>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Meetups List -->
        <div class="xl:col-span-2">
          <h2 class="text-sm font-mono text-gray-400 mb-3 uppercase tracking-widest">
            📋 Wszystkie meetupy
          </h2>
          @if (store.meetups().length === 0) {
            <div class="bg-gray-900 border border-dashed border-gray-700 p-12 text-center rounded">
              <div class="text-4xl mb-3">🌵</div>
              <div class="text-gray-500">Pusto jak po meetupie o 23:00</div>
              <div class="text-gray-600 text-sm mt-2">Kliknij "Seed Data" żeby zacząć</div>
            </div>
          }
          <div class="space-y-3">
            @for (meetup of store.meetups(); track meetup.id) {
              <a [routerLink]="['/meetup', meetup.id]" class="block">
                <div class="bg-gray-900 border border-gray-800 hover:border-gray-600 p-4 rounded transition-colors slide-in cursor-pointer group">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="font-bold text-white group-hover:text-green-400 transition-colors">
                        {{ meetup.name }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        📅 {{ formatDate(meetup.date) }} &nbsp;|&nbsp; 📍 {{ meetup.venue }}
                      </div>
                    </div>
                    <app-status-badge [status]="meetup.status" type="meetup" />
                  </div>

                  <!-- Progress bar -->
                  <div class="mb-3">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Taski</span>
                      <span>{{ doneTaskCount(meetup) }}/{{ meetup.tasks.length }}</span>
                    </div>
                    <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-green-500 rounded-full transition-all duration-500"
                        [style.width]="taskProgress(meetup) + '%'"
                      ></div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>👥 {{ meetup.registered }}/{{ meetup.capacity }}</span>
                    <span>🎤 {{ meetup.talkIds.length }} talk{{ meetup.talkIds.length !== 1 ? 'i' : '' }}</span>
                    <span>💰 {{ meetup.sponsors.length }} sponsor{{ meetup.sponsors.length !== 1 ? 'ów' : '' }}</span>
                    @if (blockedCount(meetup) > 0) {
                      <span class="text-red-500">🚫 {{ blockedCount(meetup) }} blocked</span>
                    }
                  </div>

                  <!-- Registration bar -->
                  <div class="mt-2">
                    <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [class]="registrationBarClass(meetup)"
                        [style.width]="registrationPct(meetup) + '%'"
                      ></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-0.5">Rejestracja: {{ registrationPct(meetup) }}%</div>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-4">
          <!-- Requires attention -->
          <div>
            <h2 class="text-sm font-mono text-gray-400 mb-3 uppercase tracking-widest">
              🔥 Wymaga uwagi
            </h2>
            @if (store.blockedTasks().length === 0 && store.unreviewedTalks().length === 0) {
              <div class="bg-gray-900 border border-gray-800 p-4 rounded text-center">
                <div class="text-2xl">✅</div>
                <div class="text-gray-500 text-sm mt-1">Wszystko ogarnięte</div>
              </div>
            }
            <div class="space-y-2">
              @for (item of store.blockedTasks(); track item.task.id) {
                <div class="bg-red-950 border border-red-900 p-3 rounded glow-red fade-in">
                  <div class="text-xs text-red-400 font-mono mb-1">🚫 BLOCKED TASK — {{ item.meetup.name }}</div>
                  <div class="text-sm text-white">{{ item.task.title }}</div>
                  @if (item.task.blocker) {
                    <div class="text-xs text-red-400 mt-1">→ {{ item.task.blocker }}</div>
                  }
                  <a [routerLink]="['/meetup', item.meetup.id]" class="text-xs text-red-300 hover:text-red-100 mt-1 inline-block">
                    Idź do meetupu →
                  </a>
                </div>
              }
              @for (talk of store.unreviewedTalks().slice(0, 3); track talk.id) {
                <div class="bg-yellow-950 border border-yellow-900 p-3 rounded fade-in">
                  <div class="text-xs text-yellow-500 font-mono mb-1">📨 TALK DO REVIEW</div>
                  <div class="text-sm text-white truncate">{{ talk.title }}</div>
                  <app-status-badge [status]="talk.status" type="talk" class="mt-1 inline-block" />
                </div>
              }
              @if (store.unreviewedTalks().length > 3) {
                <a routerLink="/pipeline" class="block text-xs text-yellow-600 hover:text-yellow-400 text-center py-2">
                  + {{ store.unreviewedTalks().length - 3 }} więcej w pipeline →
                </a>
              }
            </div>
          </div>

          <!-- Activity log -->
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
    if (d === null) return 'text-gray-600';
    if (d === 0) return 'text-red-400';
    if (d <= 7) return 'text-yellow-400';
    return 'text-green-400';
  });

  seedData(): void {
    this.seedService.seed();
  }

  resetData(): void {
    if (confirm('Naprawdę czyścimy? Stracisz wszystkie dane.')) {
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
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
