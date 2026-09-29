import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

bootstrapApplication(AppComponent, {
  providers: [
    // Chaque page s'ouvre en haut : sans cela, passer d'une fiche à l'autre
    // gardait la position de défilement de la précédente, et l'auditeur
    // arrivait au milieu de la page (Victor Ledoux, 2026-09). Le retour
    // arrière, lui, retrouve la position quittée.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    // HashLocationStrategy est obligatoire pour l'utilisation offline (file://)
    // Les URLs auront la forme index.html#/home, #/qte/robinets, etc.
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
}).catch(console.error);
