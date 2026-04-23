import { Injectable, inject } from '@angular/core';
import { Meetup, Talk, Speaker, Task } from '../models';
import { AppStore } from '../state/app.store';

@Injectable({ providedIn: 'root' })
export class SeedService {
  private store = inject(AppStore);

  seed(): void {
    const speakers: Speaker[] = [
      { id: 's1', name: 'Minko Gechev', bio: 'Angular team lead @ Google. Tworzy frameworki zamiast pisać CRUD.', twitter: 'mgechev', previousTalks: 42, avatarSeed: 'minko' },
      { id: 's2', name: 'Mark Thompson', bio: 'Angular GDE, evangelizuje signals od zawsze. "Powiedziałem wam."', twitter: 'markthompdev', previousTalks: 28, avatarSeed: 'mark' },
      { id: 's3', name: 'Kent C. Dodds', bio: 'Testing guru który teraz robi Remix, ale chętnie opowie o Angular jeśli zapłacisz.', twitter: 'kentcdodds', previousTalks: 87, avatarSeed: 'kent' },
      { id: 's4', name: 'Manfred Steyer', bio: 'Enterprise Angular czarodziej. Jego aplikacje mają tyle modułów co gwiazd w galaktyce.', twitter: 'manfredsteyer', previousTalks: 55, avatarSeed: 'manfred' },
      { id: 's5', name: 'Sarah Drasner', bio: 'Animacje, Vue, Netlify i teraz śledzi Angular. Jej CSS wygląda jak magia.', twitter: 'sarah_edo', previousTalks: 63, avatarSeed: 'sarah' },
      { id: 's6', name: 'Tomasz Kula', bio: 'Lokalny hero. Prezentował na ngPoland zanim ngPoland wiedział że istnieje.', twitter: 'tomasz_kula', previousTalks: 12, avatarSeed: 'tomasz' },
      { id: 's7', name: 'Alicia Vargas', bio: 'Performance wizard. Jej bundle size to robi wrażenie (jest mały).', twitter: 'aliciavargas', previousTalks: 9, avatarSeed: 'alicia' },
      { id: 's8', name: 'Dawid Nowak', bio: 'Nowy talent. Submit CFP jako żart, a talk wyszedł lepszy niż u seniorów.', twitter: 'dawid_ng', previousTalks: 2, avatarSeed: 'dawid' },
      { id: 's9', name: 'Elena Popova', bio: 'NgRx core contributor. Ma na stole fotkę z reducerem który ją zawiódł.', twitter: 'elena_ngrx', previousTalks: 18, avatarSeed: 'elena' },
      { id: 's10', name: 'Piotr Lewandowski', bio: 'Full-stack dev który "tylko sprawdza" Angular, ale już 3 lata "sprawdza".', twitter: 'piotrl_dev', previousTalks: 7, avatarSeed: 'piotr' },
    ];

    const makeTasks = (prefix: string, active = true): Task[] => {
      if (!active) return [
        { id: `${prefix}-t1`, title: 'Potwierdzić venue', status: 'done' },
        { id: `${prefix}-t2`, title: 'Zamówić catering', status: 'done' },
        { id: `${prefix}-t3`, title: 'Ogłosić na Twitterze', status: 'done' },
      ];
      return [
        { id: `${prefix}-t1`, title: 'Potwierdzić venue', status: 'done', assignee: 'Ania' },
        { id: `${prefix}-t2`, title: 'Zamówić catering', status: 'doing', assignee: 'Marek', dueDate: '2026-04-28' },
        { id: `${prefix}-t3`, title: 'Nagryzmolić agenda', status: 'todo', assignee: 'Kasia' },
        { id: `${prefix}-t4`, title: 'Ogłosić na socials', status: 'blocked', blocker: 'Speaker olał i nie potwierdził slotu', assignee: 'Tomek' },
        { id: `${prefix}-t5`, title: 'Przygotować badges', status: 'todo', dueDate: '2026-04-25' },
        { id: `${prefix}-t6`, title: 'Ustawić streaming', status: 'blocked', blocker: 'Kamera padła, nowa nie doszła z DostaWEY', assignee: 'IT' },
      ];
    };

    const makeCfpTasks = (prefix: string): Task[] => [
      { id: `${prefix}-t1`, title: 'Ogłosić CFP', status: 'done' },
      { id: `${prefix}-t2`, title: 'Rozesłać call do speakerów', status: 'done' },
      { id: `${prefix}-t3`, title: 'Przejrzeć zgłoszenia', status: 'doing', assignee: 'Ania' },
      { id: `${prefix}-t4`, title: 'Skontaktować się ze sponsorami', status: 'todo' },
      { id: `${prefix}-t5`, title: 'Zarezerwować venue', status: 'blocked', blocker: 'Venue wymaga zaliczki, finanse jeszcze nie odpowiedziały', assignee: 'CFO' },
    ];

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const meetups: Meetup[] = [
      {
        id: 'm1',
        name: 'ngWarsaw #40',
        date: '2025-11-15',
        venue: 'ING Tech Poland, Plac Trzech Krzyży 10',
        status: 'odbyty',
        capacity: 120,
        registered: 118,
        sponsors: ['Dev Agency X', 'Cloud Co', 'BinarySoft'],
        talkIds: ['talk1', 'talk2', 'talk3'],
        tasks: makeTasks('m1', false),
      },
      {
        id: 'm2',
        name: 'ngWarsaw #41',
        date: '2026-02-20',
        venue: 'Allegro Warsaw, al. Jerozolimskie 142a',
        status: 'odbyty',
        capacity: 100,
        registered: 97,
        sponsors: ['TechHouse PL', 'StackLabs'],
        talkIds: ['talk4', 'talk5'],
        tasks: makeTasks('m2', false),
      },
      {
        id: 'm3',
        name: 'ngWarsaw #42',
        date: today,
        venue: 'Google Warsaw, ul. Emilii Plater 53',
        status: 'dzis',
        capacity: 150,
        registered: 143,
        sponsors: ['Google', 'Dev Agency X', 'NextStack'],
        talkIds: ['talk6', 'talk7', 'talk8'],
        tasks: makeTasks('m3', true),
      },
      {
        id: 'm4',
        name: 'ngWarsaw #43',
        date: nextWeek,
        venue: 'Microsoft Warsaw, Al. Jerozolimskie 195',
        status: 'za-tydzien',
        capacity: 80,
        registered: 62,
        sponsors: ['Microsoft', 'CloudPrime'],
        talkIds: ['talk9', 'talk10', 'talk11'],
        tasks: makeTasks('m4', true),
      },
      {
        id: 'm5',
        name: 'ngWarsaw #44',
        date: '2026-06-19',
        venue: 'TBD',
        status: 'cfp-open',
        capacity: 100,
        registered: 0,
        sponsors: ['TechHouse PL'],
        talkIds: ['talk12', 'talk13', 'talk14', 'talk15'],
        tasks: makeCfpTasks('m5'),
      },
    ];

    const talks: Talk[] = [
      // Meetup 1 (odbyty)
      { id: 'talk1', title: 'Angular Signals: The Future Is Now', abstract: 'Deep dive into reactivity primitives w Angular 17. Jak signals zmieniły mój mózg i mój kod.', speakerId: 's1', duration: 30, level: 'intermediate', status: 'delivered', meetupId: 'm1', rating: 5 },
      { id: 'talk2', title: 'NgRx ComponentStore: Lokalny stan bez płaczu', abstract: 'Kiedy global store to za dużo, a plain component to za mało. ComponentStore to twój nowy BFF.', speakerId: 's9', duration: 25, level: 'intermediate', status: 'delivered', meetupId: 'm1', rating: 4 },
      { id: 'talk3', title: 'CSS Animations + Angular: Match Made in Hell', abstract: 'Sarah pokazuje jak animować bez płakania. Spoiler: płakałam podczas przygotowań.', speakerId: 's5', duration: 20, level: 'beginner', status: 'delivered', meetupId: 'm1', rating: 5 },
      // Meetup 2 (odbyty)
      { id: 'talk4', title: 'Enterprise Angular w 2026: Micro-frontends or Die', abstract: 'Manfred o tym jak podzielić monolith zanim podzieli ciebie.', speakerId: 's4', duration: 40, level: 'advanced', status: 'delivered', meetupId: 'm2', rating: 4 },
      { id: 'talk5', title: 'Testing Angular: Bez Bólu, Bez Mocków', abstract: 'Kent zdradza sekrety testowania które nie sprawiają że chcesz zmieniać kariery.', speakerId: 's3', duration: 30, level: 'intermediate', status: 'delivered', meetupId: 'm2', rating: 3 },
      // Meetup 3 (dziś)
      { id: 'talk6', title: 'Signals Deep Dive: computed() i effect() w praktyce', abstract: 'Prawdziwe use-case\'y gdzie signals świecą. Żadnych todo-list, tylko prawdziwy kod.', speakerId: 's2', duration: 35, level: 'intermediate', status: 'scheduled', meetupId: 'm3' },
      { id: 'talk7', title: 'Angular + Web Workers: UI bez lagów', abstract: 'Alicia o tym jak przenieść heavy logic off the main thread i sprawić że app lata.', speakerId: 's7', duration: 25, level: 'advanced', status: 'scheduled', meetupId: 'm3' },
      { id: 'talk8', title: 'Mój Pierwszy Talk: Historia Strachu i Sukcesu', abstract: 'Dawid o tym jak napisał CFP w żarcie i skończył na scenie. Motivational AF.', speakerId: 's8', duration: 15, level: 'beginner', status: 'approved', meetupId: 'm3' },
      // Meetup 4 (za tydzień)
      { id: 'talk9', title: 'Angular SSR w 2026: Appka Na Serwerze, Spokój W Duszy', abstract: 'Server-side rendering z Angular Universal – kiedy warto, kiedy nie warto, kiedy musisz.', speakerId: 's1', duration: 30, level: 'intermediate', status: 'approved', meetupId: 'm4' },
      { id: 'talk10', title: 'Lazy Loading Bez Wymówek', abstract: 'Piotr rozkłada na czynniki pierwsze route-level lazy loading i defer block.', speakerId: 's10', duration: 20, level: 'beginner', status: 'reviewing', meetupId: 'm4' },
      { id: 'talk11', title: 'Nx Monorepo: Tak Możesz Żyć', abstract: 'Tomasz o tym jak jeden repo może pomieścić 47 projektów i nie zwariować.', speakerId: 's6', duration: 40, level: 'advanced', status: 'reviewing', meetupId: 'm4' },
      // Meetup 5 (CFP open)
      { id: 'talk12', title: 'Angular 21: Co Nowego?', abstract: 'Przegląd nowości w Angular 21 – nowe API, deprecations i co nas czeka.', speakerId: 's1', duration: 30, level: 'beginner', status: 'submitted', meetupId: 'm5' },
      { id: 'talk13', title: 'TypeScript 6 dla Angular Devów', abstract: 'Jak nowe typy w TS 6 zmieniają sposób pisania Angular appek.', speakerId: 's4', duration: 25, level: 'intermediate', status: 'submitted', meetupId: 'm5' },
      { id: 'talk14', title: 'Zoneless Angular: Produkcja w 2026', abstract: 'Elena dzieli się doświadczeniem z migration na zoneless w prawdziwej appce.', speakerId: 's9', duration: 35, level: 'advanced', status: 'reviewing', meetupId: 'm5' },
      { id: 'talk15', title: 'Animacje z @angular/animations vs CSS', abstract: 'Kiedy sięgnąć po Angular animations a kiedy czysty CSS robi robotę.', speakerId: 's5', duration: 20, level: 'beginner', status: 'submitted', meetupId: 'm5' },
    ];

    this.store.seedData(meetups, talks, speakers);
  }
}
