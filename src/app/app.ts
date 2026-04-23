import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-[#0a0a0f] text-gray-200">
      <!-- Nav -->
      <nav class="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-6">
        <div class="font-bold text-green-400 font-mono text-sm tracking-wider">
          🎛️ BACKSTAGE
        </div>
        <div class="flex gap-4">
          <a
            routerLink="/dashboard"
            routerLinkActive="text-green-400 border-b border-green-400"
            class="text-sm text-gray-500 hover:text-gray-300 transition-colors pb-0.5 font-mono"
          >
            Dashboard
          </a>
          <a
            routerLink="/pipeline"
            routerLinkActive="text-green-400 border-b border-green-400"
            class="text-sm text-gray-500 hover:text-gray-300 transition-colors pb-0.5 font-mono"
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
