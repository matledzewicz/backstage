import { Component, Input } from '@angular/core';
import { MeetupStatus, TalkStatus, TaskStatus } from '../../core/models';

type AnyStatus = MeetupStatus | TalkStatus | TaskStatus;

const MEETUP_CONFIG: Record<MeetupStatus, { label: string; cls: string }> = {
  'planowanie': { label: '📝 planowanie', cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  'cfp-open': { label: '📣 CFP open', cls: 'bg-blue-950 text-blue-400 border-blue-800' },
  'cfp-closed': { label: '🔒 CFP closed', cls: 'bg-indigo-950 text-indigo-400 border-indigo-800' },
  'scheduled': { label: '📅 zaplanowany', cls: 'bg-purple-950 text-purple-400 border-purple-800' },
  'za-tydzien': { label: '⏰ za tydzień', cls: 'bg-yellow-950 text-yellow-400 border-yellow-800' },
  'dzis': { label: '🔥 DZIŚ', cls: 'bg-red-950 text-red-400 border-red-700 animate-pulse' },
  'odbyty': { label: '✅ odbyty', cls: 'bg-green-950 text-green-600 border-green-900' },
};

const TALK_CONFIG: Record<TalkStatus, { label: string; cls: string }> = {
  'submitted': { label: '📨 submitted', cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  'reviewing': { label: '👀 reviewing', cls: 'bg-blue-950 text-blue-400 border-blue-800' },
  'approved': { label: '✅ approved', cls: 'bg-green-950 text-green-400 border-green-800' },
  'rejected': { label: '❌ rejected', cls: 'bg-red-950 text-red-500 border-red-900' },
  'scheduled': { label: '📅 scheduled', cls: 'bg-purple-950 text-purple-400 border-purple-800' },
  'delivered': { label: '🎤 delivered', cls: 'bg-teal-950 text-teal-400 border-teal-800' },
};

const TASK_CONFIG: Record<TaskStatus, { label: string; cls: string }> = {
  'todo': { label: '⬜ todo', cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  'doing': { label: '🔄 doing', cls: 'bg-blue-950 text-blue-400 border-blue-800' },
  'blocked': { label: '🚫 blocked', cls: 'bg-red-950 text-red-400 border-red-800' },
  'done': { label: '✅ done', cls: 'bg-green-950 text-green-400 border-green-800' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded {{ config.cls }}">
      {{ config.label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status!: AnyStatus;
  @Input() type: 'meetup' | 'talk' | 'task' = 'meetup';

  get config() {
    if (this.type === 'meetup') return MEETUP_CONFIG[this.status as MeetupStatus];
    if (this.type === 'talk') return TALK_CONFIG[this.status as TalkStatus];
    return TASK_CONFIG[this.status as TaskStatus];
  }
}
