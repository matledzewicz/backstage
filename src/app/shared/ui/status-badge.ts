import { Component, Input } from '@angular/core';
import { MeetupStatus, TalkStatus, TaskStatus } from '../../core/models';

type AnyStatus = MeetupStatus | TalkStatus | TaskStatus;

const MEETUP_CONFIG: Record<MeetupStatus, { label: string; cls: string }> = {
  'planowanie': { label: 'planowanie', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
  'cfp-open': { label: 'CFP otwarty', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'cfp-closed': { label: 'CFP zamknięty', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  'scheduled': { label: 'zaplanowany', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  'za-tydzien': { label: 'za tydzień', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  'dzis': { label: 'dziś', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  'odbyty': { label: 'odbyty', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const TALK_CONFIG: Record<TalkStatus, { label: string; cls: string }> = {
  'submitted': { label: 'zgłoszony', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
  'reviewing': { label: 'w review', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'approved': { label: 'zaakceptowany', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'rejected': { label: 'odrzucony', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  'scheduled': { label: 'zaplanowany', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  'delivered': { label: 'wygłoszony', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const TASK_CONFIG: Record<TaskStatus, { label: string; cls: string }> = {
  'todo': { label: 'do zrobienia', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
  'doing': { label: 'w trakcie', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'blocked': { label: 'zablokowane', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  'done': { label: 'gotowe', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-full {{ config.cls }}">
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
