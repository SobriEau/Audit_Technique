import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QgeComponent } from './qge/qge.component';
import { QusComponent } from './qus/qus.component';
import { QteIndexComponent } from './qte/qte-index/qte-index.component';
import { RobinetsComponent } from './qte/robinets/robinets.component';
import { RobinetComponent } from './qte/robinet/robinet.component';
import { QteEditorComponent } from './qte/qte-editor/qte-editor.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'qge', component: QgeComponent },
  { path: 'qus', component: QusComponent },
  { path: 'qte', component: QteIndexComponent },
  // Routes spécifiques AVANT la route générique :section
  { path: 'qte/robinets', component: RobinetsComponent },
  { path: 'qte/robinet/:idx', component: RobinetComponent },
  // Route générique pour tous les éditeurs JSON QTE (wc, douches, etc.)
  { path: 'qte/:section', component: QteEditorComponent },
  { path: '**', redirectTo: 'home' },
];
