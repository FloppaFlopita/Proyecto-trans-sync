import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div class="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
        </div>
        <div>
          <h1 class="text-base font-bold tracking-wide">TransSync</h1>
          <p class="text-xs text-slate-400">Sistema de Transportes</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-4 py-6 space-y-1">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-2">Principal</p>

        <a routerLink="/dashboard" routerLinkActive="bg-teal-600 text-white"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
          Dashboard
        </a>

        <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-5 mb-3 px-2">Gestión</p>

        <a routerLink="/rutas" routerLinkActive="bg-teal-600 text-white"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          Rutas
        </a>

        <a routerLink="/flota" routerLinkActive="bg-teal-600 text-white"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
          </svg>
          Flota
        </a>

        <a routerLink="/reservas" routerLinkActive="bg-teal-600 text-white"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          Reservas
        </a>

        <a routerLink="/pagos" routerLinkActive="bg-teal-600 text-white"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          Pagos
        </a>
      </nav>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-xs font-bold">C</div>
          <div>
            <p class="text-sm font-medium text-white">Christian</p>
            <p class="text-xs text-slate-400">Integrante 2</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {}
