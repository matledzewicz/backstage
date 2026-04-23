import { Component, Input, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivityEntry } from '../../core/models';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  template: `
    <div class="bg-gray-900 border border-gray-800 rounded p-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
        <h3 class="text-xs font-mono text-gray-400 uppercase tracking-widest">Activity Log</h3>
      </div>
      <div class="space-y-1.5 max-h-64 overflow-y-auto">
        @if (entries.length === 0) {
          <div class="text-gray-600 text-xs text-center py-4">
            Brak aktywności. Zrób coś!
          </div>
        }
        @for (entry of entries.slice(0, 20); track entry.id) {
          <div class="flex items-start gap-2 text-xs fade-in">
            <span class="text-gray-600 shrink-0 tabular-nums">{{ formatTime(entry.timestamp) }}</span>
            <span [class]="typeColor(entry.type)">{{ entry.message }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class ActivityLogComponent {
  @Input() entries: ActivityEntry[] = [];

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  typeColor(type: ActivityEntry['type']): string {
    switch (type) {
      case 'task': return 'text-blue-400';
      case 'talk': return 'text-purple-400';
      case 'meetup': return 'text-green-400';
      case 'speaker': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  }
}
