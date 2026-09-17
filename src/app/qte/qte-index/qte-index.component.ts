import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuditFieldComponent } from '../../shared/components/audit-field/audit-field.component';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { EntityDef, FieldDef } from '../../models/field.models';
import { sectionsDemandees } from '../../models/utilisations-eau';

/**
 * Regroupement des sections en grandes familles.
 *
 * Ce n'est plus un choix éditorial de l'application : la V3 du classeur les
 * formalise elle-même, onglet « Tableau de bord », lignes 25 à 66. Les cinq
 * intitulés et la répartition ci-dessous en sont la transcription exacte.
 *
 * Une clé d'entité absente de ce regroupement atterrit dans « Autres » : une
 * section ne doit jamais disparaître de l'écran faute d'y figurer.
 */
const GROUPS: { label: string; keys: string[] }[] = [
  // Le surpresseur n'a plus d'onglet dans le classeur V3 : origin/main le
  // conserve (champs figés, masqué par défaut) et le range à l'arrivée d'eau,
  // près du compteur dont il relève la pression.
  { label: 'Arrivée d’eau', keys: ['releve_compteur_general', 'sous_compteurs', 'surpresseurs'] },
  { label: 'Distribution d’eau', keys: ['reseaux_eau_chaude_sanitaire', 'production_stockage_ecs'] },
  {
    label: 'Points d’eau intérieurs',
    keys: ['robinets', 'douches_baignoires', 'wc', 'appareils_lavage', 'incendie'],
  },
  { label: 'Extérieurs', keys: ['espace_vert_exterieur', 'piscines', 'toitures'] },
  { label: 'Structure et opportunités', keys: ['structure', 'ventilation_batiment', 'opportunites', 'autre'] },
];

/**
 * Contexte du bâtiment, décrit par le classeur en tête du tableau de bord
 * (lignes 7 à 23). Ces champs ne sont pas dans `audit-schema.ts` : ils
 * n'appartiennent à aucune fiche d'équipement, et ce fichier est généré.
 *
 * Ils passent malgré tout par `app-audit-field`, qui sait déjà rendre une
 * pastille d'exigence, une aide et une unité — les redécrire en HTML ici
 * ferait diverger leur apparence de celle des fiches.
 */
const CHAMPS_CONTEXTE: FieldDef[] = [
  {
    key: 'AnneeConstruction',
    label: 'Date de construction du bâtiment',
    kind: 'text',
    row: 7,
    help: 'Année sur quatre chiffres (AAAA).',
    requirement: 'recommande',
    source: 'Tableau de bord!B7',
  },
  {
    key: 'AnneeDerniereRenovation',
    label: 'Date de la dernière rénovation',
    kind: 'text',
    row: 8,
    help: 'Année sur quatre chiffres (AAAA).',
    requirement: 'facultatif',
    source: 'Tableau de bord!B8',
  },
  {
    key: 'TravauxDerniereRenovation',
    label: 'Travaux réalisés lors de la dernière rénovation',
    kind: 'textarea',
    row: 9,
    wide: true,
    requirement: 'facultatif',
    source: 'Tableau de bord!B9',
  },
  {
    key: 'DysfonctionnementsBatiment',
    label: 'Principaux dysfonctionnements observés sur le bâtiment',
    kind: 'textarea',
    row: 14,
    wide: true,
    help: 'Interventions régulières, pannes qui reviennent.',
    requirement: 'facultatif',
    source: 'Tableau de bord!B14',
  },
  {
    key: 'PlaintesUtilisateurs',
    label: 'Plaintes récurrentes des utilisateurs du bâtiment',
    kind: 'textarea',
    row: 18,
    wide: true,
    requirement: 'facultatif',
    source: 'Tableau de bord!B18',
  },
  {
    key: 'PressionProcheCompteur',
    label: 'Mesure de pression au point le plus proche du compteur',
    kind: 'number',
    unit: 'bar',
    row: 22,
    requirement: 'recommande',
    source: 'Tableau de bord!B22',
  },
  {
    key: 'PressionEloigneeCompteur',
    label: 'Mesure de pression au point le plus éloigné du compteur',
    kind: 'number',
    unit: 'bar',
    row: 23,
    requirement: 'recommande',
    source: 'Tableau de bord!B23',
  },
];

interface SectionGroup {
  label: string;
  sections: EntityDef[];
}

@Component({
  selector: 'app-qte-index',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, AuditFieldComponent],
  templateUrl: './qte-index.component.html',
  styleUrl: './qte-index.component.scss',
})
export class QteIndexComponent {
  private readonly groups: SectionGroup[] = buildGroups();

  readonly champsContexte = CHAMPS_CONTEXTE;

  /** Copie de travail du contexte, écrite à chaque champ quitté. */
  contexte: Record<string, unknown>;

  constructor(private router: Router, private dataService: DataService) {
    this.contexte = { ...this.dataService.getSingle('TableauDeBord') };
  }

  valeurContexte(f: FieldDef): unknown {
    return this.contexte[f.key] ?? null;
  }

  /**
   * Enregistré à la volée, sans bouton : cette page est un point de passage
   * vers les fiches, et l'auditeur en repart par un lien plutôt que par
   * « Valider ». Une saisie perdue au premier clic serait inacceptable.
   */
  changerContexte(f: FieldDef, valeur: unknown): void {
    this.contexte[f.key] = valeur;
    this.dataService.setSingle('TableauDeBord', this.contexte);
  }

  /**
   * Groupes filtrés des sections que l'auditeur n'a pas demandées — sauf si
   * elles contiennent déjà des éléments : la case à cocher ne masque qu'une
   * section vide, jamais une saisie déjà faite.
   */
  get visibleGroups(): SectionGroup[] {
    return this.groups
      .map((g) => ({ label: g.label, sections: g.sections.filter((s) => this.isVisible(s)) }))
      .filter((g) => g.sections.length > 0);
  }

  /**
   * Deux régimes cohabitent, et c'est voulu :
   *
   *  - les audits ouverts depuis le passage à la V3 déclarent des
   *    **utilisations de l'eau** (`UtilisationsEau`), comme le prescrit le
   *    classeur : rien n'est affiché qui n'ait été demandé ;
   *  - les audits antérieurs n'en ont pas ; ils retombent sur
   *    `EquipementsPresents`, où une clé absente valait « présent ».
   *
   * Faire basculer les seconds sur la règle du classeur ferait disparaître,
   * d'une mise à jour à l'autre, des sections que l'auditeur voyait la veille.
   */
  private isVisible(section: EntityDef): boolean {
    const d = this.dataService.data;
    if ((this.count(section) ?? 0) > 0) return true;
    if (section.single) return true;

    // Hors classeur (le surpresseur) : aucun usage de l'eau ne le commande.
    // Masqué tant que l'auditeur ne l'a pas explicitement affiché depuis
    // l'accueil du projet — décision reprise d'origin/main.
    if (section.horsClasseur) return d.EquipementsPresents?.[section.key] === true;

    if (d.UtilisationsEau) return sectionsDemandees(d.UtilisationsEau).has(section.key);
    return d.EquipementsPresents?.[section.key] !== false;
  }

  /** Nombre d'éléments saisis, affiché en regard de chaque section. */
  count(section: EntityDef): number | null {
    if (section.single) return null;
    return this.dataService.getEntities(section.key).length;
  }

  navigate(section: EntityDef): void {
    this.router.navigate(['/qte', section.route]);
  }

  nav(route: string): void {
    this.router.navigate([route]);
  }
}

function buildGroups(): SectionGroup[] {
  // Une entité rendue en tête d'une autre page (la zone piscine) n'est pas une
  // section du tableau de bord : elle tomberait sinon dans « Autres ».
  const sections = AUDIT_SCHEMA.filter((s) => !s.embedded);
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const used = new Set<string>();

  const groups: SectionGroup[] = GROUPS.map((g) => {
    const sections = g.keys
      .map((k) => byKey.get(k))
      .filter((s): s is EntityDef => {
        if (!s) return false;
        used.add(s.key);
        return true;
      });
    return { label: g.label, sections };
  });

  const reste = sections.filter((s) => !used.has(s.key));
  if (reste.length) groups.push({ label: 'Autres', sections: reste });

  return groups.filter((g) => g.sections.length > 0);
}
