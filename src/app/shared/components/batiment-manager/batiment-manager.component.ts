import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Batiment } from '../../../models/data.models';
import { DictationFieldComponent } from '../dictation-field/dictation-field.component';

/**
 * Bâtiments de l'établissement : création, nom, année de construction et de
 * dernière rénovation.
 *
 * Un établissement peut en compter plusieurs — un groupe scolaire, un campus —
 * et il fallait sinon ressaisir le même contexte pour chacun (Martin Perrin,
 * 2026-11). L'arborescence est **bâtiment → pièces → points d'eau**.
 *
 * **Facultatif, et il faut que cela le reste** : un audit sans bâtiment est un
 * audit d'un seul bâtiment, ce qu'il a toujours été. Rien n'oblige à en
 * déclarer, et les audits déjà en circulation n'en ont pas.
 */
@Component({
  selector: 'app-batiment-manager',
  standalone: true,
  imports: [FormsModule, DictationFieldComponent],
  templateUrl: './batiment-manager.component.html',
  styleUrl: './batiment-manager.component.scss',
})
export class BatimentManagerComponent implements OnInit {
  batiments: Batiment[] = [];

  /** Nombre de pièces rattachées, par bâtiment. */
  pieces: Record<string, number> = {};

  /** Bâtiment dont le volet de détail est ouvert. */
  deplie: string | null = null;

  constructor(
    private data: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recharger();
  }

  private recharger(): void {
    this.batiments = [...this.data.getBatiments()];
    this.pieces = {};
    for (const b of this.batiments) {
      this.pieces[b.Id] = this.data.getPiecesOfBatiment(b.Id).length;
    }
    this.cdr.markForCheck();
  }

  /** Pièces qu'aucun bâtiment ne revendique — à signaler, pas à masquer. */
  get piecesSansBatiment(): number {
    if (!this.batiments.length) return 0;
    return this.data.getPieces().filter((p) => !this.data.findBatiment(p.Batiment)).length;
  }

  ajouter(): void {
    const batiment = this.data.createBatiment();
    this.deplie = batiment.Id;
    this.recharger();
  }

  basculer(id: string): void {
    this.deplie = this.deplie === id ? null : id;
  }

  /** Enregistré à la volée : cette page n'a pas de bouton « Valider ». */
  enregistrer(): void {
    this.data.setBatiments(this.batiments);
  }

  pieces0(b: Batiment): number {
    return this.pieces[b.Id] ?? 0;
  }

  voirPieces(): void {
    this.router.navigate(['/pieces']);
  }

  /**
   * Supprime un bâtiment. Ses pièces et ses points d'eau sont **détachés**, pas
   * supprimés — c'est dit avant, parce que rien ne le laisserait devenir.
   */
  supprimer(batiment: Batiment): void {
    const n = this.pieces0(batiment);
    const nom = (batiment.Nom || '').trim() || 'ce bâtiment sans nom';
    const avertissement = n
      ? `\n\n${n} pièce(s) y sont rattachées : elles ne seront pas supprimées, ` +
        'mais se retrouveront sans bâtiment.'
      : '';
    if (!confirm(`Supprimer « ${nom} » ?${avertissement}`)) return;

    this.data.deleteBatiment(batiment.Id);
    if (this.deplie === batiment.Id) this.deplie = null;
    this.recharger();
  }
}
