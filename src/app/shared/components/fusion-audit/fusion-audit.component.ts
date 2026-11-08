import { Component, ChangeDetectorRef } from '@angular/core';
import { DataService, PreparationFusion } from '../../../core/services/data.service';
import { rapportVide, totalElements } from '../../../core/utils/fusion';

/**
 * Intégration d'un audit reçu dans l'audit ouvert.
 *
 * « Pour les grands bâtiments, deux auditeurs doivent pouvoir se répartir les
 * pièces à auditer » (première visite terrain, 2026-10). Chacun remplit sa
 * part hors connexion, puis l'un intègre le fichier de l'autre.
 *
 * **En deux temps, et c'est le point important.** Le fichier est d'abord lu et
 * la réunion calculée à blanc (`prepareMerge`) ; l'écran montre ce qui sera
 * ajouté, ce qui est déjà là, ce qui diverge ; rien n'est écrit avant que
 * l'auditeur ne confirme. Une fusion porte sur des relevés de terrain qu'on ne
 * referait pas : elle ne se fait pas à l'aveugle, et le bouton « Charger un
 * projet » de l'accueil général reste là pour l'autre geste — ouvrir un audit
 * reçu à part, sans y toucher.
 */
@Component({
  selector: 'app-fusion-audit',
  standalone: true,
  templateUrl: './fusion-audit.component.html',
  styleUrl: './fusion-audit.component.scss',
})
export class FusionAuditComponent {
  /** Réunion calculée, en attente de confirmation. */
  prep: PreparationFusion | null = null;

  occupe = '';
  erreur: string | null = null;
  fait: string | null = null;

  constructor(private data: DataService, private cdr: ChangeDetectorRef) {}

  choisir(input: HTMLInputElement): void {
    this.erreur = null;
    this.fait = null;
    input.click();
  }

  async fichierChoisi(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permet de rechoisir le même fichier
    if (!file) return;

    this.occupe = 'Lecture du fichier…';
    this.erreur = null;
    this.prep = null;
    this.cdr.markForCheck();
    try {
      this.prep = await this.data.prepareMerge(file);
    } catch (e) {
      this.erreur =
        'Ce fichier n’a pas pu être lu comme un audit SobriEau : ' +
        (e instanceof Error ? e.message : String(e));
    } finally {
      this.occupe = '';
      this.cdr.markForCheck();
    }
  }

  get rien(): boolean {
    return !!this.prep && rapportVide(this.prep.rapport);
  }

  get nbElements(): number {
    return this.prep ? totalElements(this.prep.rapport) : 0;
  }

  get nbDoublons(): number {
    return this.prep ? this.prep.rapport.entites.reduce((n, e) => n + e.dupliques, 0) : 0;
  }

  /** Fiches déjà là que le fichier reçu a complétées, sans rien contredire. */
  get nbCompletes(): number {
    return this.prep ? this.prep.rapport.entites.reduce((n, e) => n + e.completes, 0) : 0;
  }

  annuler(): void {
    this.prep = null;
    this.erreur = null;
  }

  /**
   * Applique la réunion, puis **recharge la page** : les écrans affichés
   * tiennent une copie locale des données (même raison que l'import, voir
   * `drive-actions`).
   */
  async integrer(): Promise<void> {
    if (!this.prep) return;
    this.occupe = 'Intégration…';
    this.cdr.markForCheck();
    try {
      await this.data.applyMerge(this.prep);
      this.fait = 'Audit intégré.';
      window.location.hash = '/home';
      window.location.reload();
    } catch (e) {
      this.erreur = e instanceof Error ? e.message : String(e);
    } finally {
      this.occupe = '';
      this.cdr.markForCheck();
    }
  }
}
