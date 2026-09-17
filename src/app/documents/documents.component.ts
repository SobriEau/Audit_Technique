import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { DictationFieldComponent } from '../shared/components/dictation-field/dictation-field.component';
import { DOCUMENTS_A_COLLECTER, DocumentACollecter } from '../models/documents-collectes';
import { REQUIREMENT_LABEL } from '../models/field-priority';
import { FieldRequirement } from '../models/field.models';

/** Identifiant d'une ligne libre : `autre-<n>`. */
const LIGNE_LIBRE = /^autre-(\d+)$/;

/**
 * Documents à réunir pour l'audit.
 *
 * Le classeur ne demande **aucun téléversement** : seulement de cocher ce qui
 * a pu être récupéré, plus des lignes libres pour ce qu'il n'a pas prévu. La
 * V2 demandait encore une photo de chaque document ; la V3 a retiré cette
 * note, et c'est heureux — l'export recopie les images en base64.
 *
 * Rien à valider : chaque case cochée est enregistrée aussitôt. L'auditeur
 * remplit cette page par bribes, entre deux échanges avec le gestionnaire du
 * bâtiment, et n'a aucune raison de la « terminer ».
 */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DictationFieldComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent {
  readonly documents = DOCUMENTS_A_COLLECTER;

  /** Lignes libres ajoutées pendant cette visite de la page, encore vides. */
  private ajoutees: string[] = [];

  constructor(private data: DataService) {}

  get cases(): DocumentACollecter[] {
    return this.documents.filter((d) => !d.libre);
  }

  /**
   * Lignes libres : celles que le classeur prévoit (six), celles que l'audit a
   * déjà remplies au-delà, et celles ajoutées à l'instant.
   *
   * Le classeur en fixe six ; l'arbitrage du projet a levé la limite
   * (`arbitrages-v3.md`, Q22). Les six du classeur restent affichées même
   * vides, pour que la page garde la forme prévue.
   */
  get lignesLibres(): string[] {
    const ids = new Set<string>([
      ...this.documents.filter((d) => d.libre).map((d) => d.id),
      ...Object.keys(this.data.data.Documents ?? {}).filter((k) => LIGNE_LIBRE.test(k)),
      ...this.ajoutees,
    ]);
    return [...ids].sort((a, b) => numero(a) - numero(b));
  }

  /** Nombre de documents obtenus, sur ceux que le classeur énumère. */
  get obtenus(): number {
    return this.cases.filter((d) => this.estCoche(d.id)).length;
  }

  estCoche(id: string): boolean {
    return this.data.data.Documents?.[id]?.coche === true;
  }

  precision(id: string): string {
    return this.data.data.Documents?.[id]?.precision ?? '';
  }

  libelleExigence(r: FieldRequirement | undefined): string | null {
    return r ? REQUIREMENT_LABEL[r] : null;
  }

  cocher(id: string, coche: boolean): void {
    this.ecrire(id, { coche });
  }

  preciser(id: string, precision: string): void {
    this.ecrire(id, { precision: precision.trim() || null });
  }

  ajouterLigne(): void {
    const max = Math.max(0, ...this.lignesLibres.map(numero));
    this.ajoutees = [...this.ajoutees, `autre-${max + 1}`];
  }

  private ecrire(id: string, champs: { coche?: boolean; precision?: string | null }): void {
    const d = this.data.data;
    if (!d.Documents) d.Documents = {};
    const entree = { ...d.Documents[id], ...champs };
    // Une ligne vidée ne laisse pas d'entrée derrière elle : sinon chaque ligne
    // ajoutée puis abandonnée resterait dans l'export, sans rien dire.
    if (!entree.coche && !entree.precision) delete d.Documents[id];
    else d.Documents[id] = entree;
    this.data.save();
  }
}

function numero(id: string): number {
  const m = id.match(LIGNE_LIBRE);
  return m ? parseInt(m[1], 10) : 0;
}
