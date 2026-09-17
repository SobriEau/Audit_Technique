import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { GLOSSAIRE, EntreeGlossaire } from '../models/glossaire';

/** Comparaison insensible à la casse et aux accents, comme dans `audit-field`. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Glossaire de l'audit, repris du classeur.
 *
 * Trente entrées, dont six ne sont pas des sigles mais des notions à définir
 * (« Plénum », « Eau de ruissellement »). Le filtre porte sur le terme **et**
 * sur la définition : sur le terrain, on cherche plus souvent « ce truc entre
 * le faux plafond et la dalle » que « plénum ».
 */
@Component({
  selector: 'app-glossaire',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './glossaire.component.html',
  styleUrl: './glossaire.component.scss',
})
export class GlossaireComponent {
  recherche = '';

  get entrees(): EntreeGlossaire[] {
    const q = normalize(this.recherche);
    if (!q) return GLOSSAIRE;
    return GLOSSAIRE.filter(
      (e) => normalize(e.terme).includes(q) || normalize(e.definition).includes(q)
    );
  }
}
