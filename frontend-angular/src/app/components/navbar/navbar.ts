import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
         style="background: rgba(10,10,20,0.85); backdrop-filter: blur(20px);">
      <div class="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">

        <!-- Logo -->
        <div class="flex items-center gap-8">
          <a routerLink="/dashboard" class="flex items-center gap-2.5 group">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="text-white font-semibold text-sm tracking-tight">TransSync</span>
          </a>

          <!-- Nav links -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/dashboard" routerLinkActive="text-white bg-white/10"
               class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 text-sm font-medium transition-all">
              Overview
            </a>
            <a routerLink="/rutas" routerLinkActive="text-white bg-white/10"
               class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 text-sm font-medium transition-all">
              Rutas
            </a>
            <a routerLink="/flota" routerLinkActive="text-white bg-white/10"
               class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 text-sm font-medium transition-all">
              Flota
            </a>
            <a routerLink="/reservas" routerLinkActive="text-white bg-white/10"
               class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 text-sm font-medium transition-all">
              Reservas
            </a>
            <a routerLink="/pagos" routerLinkActive="text-white bg-white/10"
               class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 text-sm font-medium transition-all">
              Pagos
            </a>
          </div>
        </div>

        <!-- Right -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
               style="color:#4ade80; border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.08);">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Online
          </div>
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">C</div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {}
