export type MeetupStatus = 'planowanie' | 'cfp-open' | 'cfp-closed' | 'scheduled' | 'za-tydzien' | 'dzis' | 'odbyty';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignee?: string;
  blocker?: string;
}

export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done';

export interface Meetup {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: MeetupStatus;
  capacity: number;
  registered: number;
  sponsors: string[];
  talkIds: string[];
  tasks: Task[];
}

export type TalkStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'scheduled' | 'delivered';

export interface Talk {
  id: string;
  title: string;
  abstract: string;
  speakerId: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: TalkStatus;
  meetupId: string;
  rating?: number;
}

export interface Speaker {
  id: string;
  name: string;
  bio: string;
  twitter?: string;
  previousTalks: number;
  avatarSeed: string;
}

export interface ActivityEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'task' | 'talk' | 'meetup' | 'speaker';
}
