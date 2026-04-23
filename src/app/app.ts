import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-stone-50 text-stone-900">
      <nav class="bg-white/80 backdrop-blur border-b border-stone-200 px-6 py-3 flex items-center gap-8 sticky top-0 z-20">
        <a routerLink="/dashboard" class="flex items-center gap-2.5 font-semibold text-stone-900 text-[15px]">
          <span class="inline-block w-6 h-6 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500"></span>
          Backstage
        </a>
        <div class="flex gap-2 text-sm">
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-stone-900 text-white"
            class="px-3.5 py-1.5 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Panel
          </a>
          <a
            routerLink="/pipeline"
            routerLinkActive="bg-stone-900 text-white"
            class="px-3.5 py-1.5 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Pipeline
          </a>
        </div>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class App {}
