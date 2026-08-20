import { Routes } from '@angular/router';
import { AccueilComponent } from './accueil/accueil.component';
import { HomeComponent } from './home/home.component';
import { QgeComponent } from './qge/qge.component';
import { QusComponent } from './qus/qus.component';
import { QteIndexComponent } from './qte/qte-index/qte-index.component';
import { EntityListComponent } from './qte/entity-list/entity-list.component';
import { EntityFormComponent } from './qte/entity-form/entity-form.component';
import { TelechargerComponent } from './telecharger/telecharger.component';

export const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  // Accueil général : choix du projet (reprendre, créer, charger).
  { path: 'accueil', component: AccueilComponent },
  // Accueil du projet ouvert : adresse, informations, plans, photos.
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

  // Copie propre du fichier autonome, produite par la page elle-même.
  { path: 'telecharger', component: TelechargerComponent },

  { path: '**', redirectTo: 'home' },
];
