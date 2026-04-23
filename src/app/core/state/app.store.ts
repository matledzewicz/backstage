import { Injectable, inject, signal, computed } from '@angular/core';
import { Meetup, Talk, Speaker, Task, TaskStatus, TalkStatus, ActivityEntry } from '../models';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private ls = inject(LocalStorageService);

  private _meetups = signal<Meetup[]>(this.ls.get<Meetup[]>('meetups') ?? []);
  private _talks = signal<Talk[]>(this.ls.get<Talk[]>('talks') ?? []);
  private _speakers = signal<Speaker[]>(this.ls.get<Speaker[]>('speakers') ?? []);
  private _activity = signal<ActivityEntry[]>(this.ls.get<ActivityEntry[]>('activity') ?? []);

  meetups = this._meetups.asReadonly();
  talks = this._talks.asReadonly();
  speakers = this._speakers.asReadonly();
  activity = this._activity.asReadonly();

  activeMeetups = computed(() => this._meetups().filter(m => m.status !== 'odbyty'));

  blockedTasks = computed(() =>
    this._meetups().flatMap(m => m.tasks.filter(t => t.status === 'blocked').map(t => ({ task: t, meetup: m })))
  );

  unreviewedTalks = computed(() =>
    this._talks().filter(t => t.status === 'submitted' || t.status === 'reviewing')
  );

  nextMeetup = computed(() => {
    const upcoming = this._meetups()
      .filter(m => m.status !== 'odbyty')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] ?? null;
  });

  daysToNext = computed(() => {
    const next = this.nextMeetup();
    if (!next) return null;
    const diff = new Date(next.date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  getMeetup(id: string) {
    return computed(() => this._meetups().find(m => m.id === id) ?? null);
  }

  getSpeaker(id: string) {
    return computed(() => this._speakers().find(s => s.id === id) ?? null);
  }

  getTalksForMeetup(meetupId: string) {
    return computed(() => this._talks().filter(t => t.meetupId === meetupId));
  }

  updateTaskStatus(meetupId: string, taskId: string, status: TaskStatus): void {
    const meetup = this._meetups().find(m => m.id === meetupId);
    const task = meetup?.tasks.find(t => t.id === taskId);
    if (!meetup || !task) return;

    const updated = this._meetups().map(m =>
      m.id === meetupId
        ? { ...m, tasks: m.tasks.map(t => t.id === taskId ? { ...t, status } : t) }
        : m
    );
    this._meetups.set(updated);
    this.persist();
    this.addActivity(`Task "${task.title}" → ${status}`, 'task');
  }

  updateTalkStatus(talkId: string, status: TalkStatus): void {
    const talk = this._talks().find(t => t.id === talkId);
    if (!talk) return;

    const updated = this._talks().map(t =>
      t.id === talkId ? { ...t, status } : t
    );
    this._talks.set(updated);
    this.persist();
    this.addActivity(`Talk "${talk.title}" → ${status}`, 'talk');
  }

  rateTalk(talkId: string, rating: number): void {
    const talk = this._talks().find(t => t.id === talkId);
    if (!talk) return;

    const updated = this._talks().map(t =>
      t.id === talkId ? { ...t, rating } : t
    );
    this._talks.set(updated);
    this.persist();
    this.addActivity(`Talk "${talk.title}" oceniony na ${rating}/5 ⭐`, 'talk');
  }

  updateTask(meetupId: string, task: Partial<Task> & { id: string }): void {
    const updated = this._meetups().map(m =>
      m.id === meetupId
        ? { ...m, tasks: m.tasks.map(t => t.id === task.id ? { ...t, ...task } : t) }
        : m
    );
    this._meetups.set(updated);
    this.persist();
  }

  seedData(meetups: Meetup[], talks: Talk[], speakers: Speaker[]): void {
    this._meetups.set(meetups);
    this._talks.set(talks);
    this._speakers.set(speakers);
    this._activity.set([]);
    this.persist();
    this.addActivity('Seed data załadowany 🚀', 'meetup');
  }

  reset(): void {
    this.ls.clear();
    this._meetups.set([]);
    this._talks.set([]);
    this._speakers.set([]);
    this._activity.set([]);
  }

  private addActivity(message: string, type: ActivityEntry['type']): void {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      type,
    };
    const current = this._activity();
    const updated = [entry, ...current].slice(0, 50);
    this._activity.set(updated);
    this.ls.set('activity', updated);
  }

  private persist(): void {
    this.ls.set('meetups', this._meetups());
    this.ls.set('talks', this._talks());
    this.ls.set('speakers', this._speakers());
  }
}
