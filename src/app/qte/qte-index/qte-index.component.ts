import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { EntityDef } from '../../models/field.models';

/**
 * Regroupement éditorial des 18 sections en grandes familles, pour la
 * lisibilité du tableau de bord — le classeur ne formalise pas ces
 * catégories, c'est un choix indépendant du schéma généré.
 *
 * Une clé d'entité absente de ce regroupement atterrit dans « Autres » :
 * une section ne doit jamais disparaître de l'écran faute d'y figurer.
 */
const GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Arrivée d’eau', keys: ['releve_compteur_general', 'sous_compteurs', 'reducteurs_de_pression', 'surpresseurs'] },
  { label: 'Réseaux ECS', keys: ['reseaux_eau_chaude_sanitaire', 'production_stockage_ecs'] },
  { label: 'Points d’eau', keys: ['robinets', 'douches_baignoires', 'wc', 'appareils_lavage', 'piscines'] },
  { label: 'Bâtiment', keys: ['structure', 'ventilation_batiment', 'incendie', 'toitures'] },
  { label: 'Extérieur', keys: ['espace_vert_exterieur'] },
];

interface SectionGroup {
  label: string;
  sections: EntityDef[];
}

@Component({
  selector: 'app-qte-index',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './qte-index.component.html',
  styleUrl: './qte-index.component.scss',
})
export class QteIndexComponent {
  private readonly groups: SectionGroup[] = buildGroups();

  constructor(private router: Router, private dataService: DataService) {}

  /**
   * Groupes filtrés des équipements déclarés absents depuis l'accueil du
   * projet — sauf s'ils contiennent déjà des éléments : la case à cocher ne
   * masque qu'une section vide, jamais une saisie déjà faite.
   */
  get visibleGroups(): SectionGroup[] {
    return this.groups
      .map((g) => ({ label: g.label, sections: g.sections.filter((s) => this.isVisible(s)) }))
      .filter((g) => g.sections.length > 0);
  }

  private isVisible(section: EntityDef): boolean {
    if (section.single) return true;
    if (this.dataService.data.EquipementsPresents?.[section.key] !== false) return true;
    return (this.count(section) ?? 0) > 0;
  }

  /** Nombre d'éléments saisis, affiché en regard de chaque section. */
  count(section: EntityDef): number | null {
    if (section.single) return null;
    return this.dataService.getEntities(section.key).length;
  }

  navigate(section: EntityDef): void {
    this.router.navigate(['/qte', section.route]);
  }
}

function buildGroups(): SectionGroup[] {
  const byKey = new Map(AUDIT_SCHEMA.map((s) => [s.key, s]));
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

  const reste = AUDIT_SCHEMA.filter((s) => !used.has(s.key));
  if (reste.length) groups.push({ label: 'Autres', sections: reste });

  return groups.filter((g) => g.sections.length > 0);
}
