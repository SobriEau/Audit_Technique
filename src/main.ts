import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // HashLocationStrategy est obligatoire pour l'utilisation offline (file://)
    // Les URLs auront la forme index.html#/home, #/qte/robinets, etc.
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
}).catch(console.error);
