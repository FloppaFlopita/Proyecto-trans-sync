import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <app-navbar></app-navbar>
      <main class="flex-1 pt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <router-outlet></router-outlet>
        </div>
      </main>
      <footer class="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 TransSync Transportes del Perú S.A.C. Todos los derechos reservados.</p>
          <p class="font-medium text-slate-600">Sistema Empresarial de Transporte Interprovincial · UPeU</p>
        </div>
      </footer>
    </div>
  `
})
export class MainLayoutComponent {}
