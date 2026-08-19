import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { faisabilite, reconstituer, empreinte, Faisabilite } from '../core/utils/self-extract';

/**
 * Obtenir une copie propre du fichier autonome, depuis l'application elle-même.
 *
 * Sert à transmettre l'outil à un collègue sans passer par le gestionnaire de
 * fichiers — malcommode sur téléphone — et à remplacer sa propre copie par une
 * version à jour. Les audits ne sont pas dans le fichier mais dans le stockage
 * du navigateur : la copie produite ne contient donc **aucune donnée de
 * terrain**, et remplacer `index.html` par elle laisse les audits en place.
 */
@Component({
  selector: 'app-telecharger',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './telecharger.component.html',
  styleUrl: './telecharger.component.scss',
})
export class TelechargerComponent implements OnInit {
  etat: Faisabilite = { possible: false, externes: [] };

  /** Taille de la copie, en kilo-octets. */
  taille = 0;

  /** Empreinte SHA-256, tronquée pour rester lisible. */
  somme: string | null = null;

  occupe = false;
  erreur: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.etat = faisabilite();
    if (this.etat.possible) void this.mesurer();
  }

  /** Reconstitue une fois au chargement, pour annoncer une taille réelle. */
  private async mesurer(): Promise<void> {
    try {
      const html = reconstituer();
      this.taille = Math.round(new Blob([html]).size / 1024);
      this.somme = await empreinte(html);
    } catch (e) {
      this.erreur = e instanceof Error ? e.message : String(e);
    } finally {
      this.cdr.markForCheck();
    }
  }

  async telecharger(): Promise<void> {
    this.occupe = true;
    this.erreur = null;
    try {
      const html = reconstituer();
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = 'index.html';
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      // Révoquer trop tôt annulerait le téléchargement en cours.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      this.erreur = e instanceof Error ? e.message : String(e);
    } finally {
      this.occupe = false;
      this.cdr.markForCheck();
    }
  }
}
