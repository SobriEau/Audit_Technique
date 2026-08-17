import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QgeComponent } from './qge/qge.component';
import { QusComponent } from './qus/qus.component';
import { QteIndexComponent } from './qte/qte-index/qte-index.component';
import { EntityListComponent } from './qte/entity-list/entity-list.component';
import { EntityFormComponent } from './qte/entity-form/entity-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'qge', component: QgeComponent },
  { path: 'qus', component: QusComponent },

  // Partie technique : toutes les entités sont rendues par le même couple de
  // composants génériques, piloté par le schéma (models/audit-schema.ts).
  { path: 'qte', component: QteIndexComponent },
  // Liste des éléments — ou fiche directe pour une entité unique.
  { path: 'qte/:entity', component: EntityListComponent },
  // Fiche d'un élément, adressée par identité stable et jamais par index.
  { path: 'qte/:entity/:id', component: EntityFormComponent },

  { path: '**', redirectTo: 'home' },
];
