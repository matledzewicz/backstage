import { Component, Input } from '@angular/core';
import { ActivityEntry } from '../../core/models';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  template: `
    <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm">
      <h3 class="text-sm font-medium text-stone-700 mb-4">Ostatnia aktywność</h3>
      <div class="space-y-2 max-h-72 overflow-y-auto">
        @if (entries.length === 0) {
          <div class="text-stone-400 text-sm text-center py-6">
            Tu pojawi się historia zmian
          </div>
        }
        @for (entry of entries.slice(0, 20); track entry.id) {
          <div class="flex items-start gap-3 text-sm fade-in">
            <span class="text-stone-400 shrink-0 tabular-nums text-xs mt-0.5">{{ formatTime(entry.timestamp) }}</span>
            <span class="flex-1">
              <span [class]="typeDot(entry.type)" class="inline-block w-1.5 h-1.5 rounded-full mr-2 -mt-0.5 align-middle"></span>
              <span class="text-stone-700">{{ entry.message }}</span>
            </span>
          </div>
        }
      </div>
    </div>
  `,
})
export class ActivityLogComponent {
  @Input() entries: ActivityEntry[] = [];

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  typeDot(type: ActivityEntry['type']): string {
    switch (type) {
      case 'task': return 'bg-indigo-400';
      case 'talk': return 'bg-violet-400';
      case 'meetup': return 'bg-emerald-400';
      case 'speaker': return 'bg-amber-400';
      default: return 'bg-stone-400';
    }
  }
}
