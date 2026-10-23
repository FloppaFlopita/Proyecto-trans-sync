import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen" style="background: #09090f;">
      <app-navbar></app-navbar>
      <!-- Fondo con gradiente ambiental -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden" style="z-index:0;">
        <div class="absolute rounded-full"
             style="width:600px;height:600px;top:-200px;left:-100px;
                    background:radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);"></div>
        <div class="absolute rounded-full"
             style="width:500px;height:500px;bottom:-100px;right:-100px;
                    background:radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%);"></div>
      </div>
      <main class="relative pt-14 min-h-screen" style="z-index:1;">
        <div class="max-w-screen-xl mx-auto px-6 py-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class MainLayoutComponent {}
