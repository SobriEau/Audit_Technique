import { AppData } from '../models/data.models';
import { EntityDef } from '../models/field.models';
import { sectionsDemandees } from '../models/utilisations-eau';

/**
 * Une section de l'audit technique est-elle proposée à l'auditeur ?
 *
 * Fonction partagée par le tableau de bord (`qte-index`) et par la page d'une
 * pièce (`piece-detail`), qui offrent tous deux l'accès aux mêmes entités. Les
 * deux écrans dupliquaient la règle au départ ; une divergence y aurait rendu
 * une section atteignable d'un côté et pas de l'autre, sans rien signaler.
 *
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
 *
 * @param nbElements nombre d'éléments déjà saisis dans cette section. Une
 * section qui en contient reste visible même décochée : décocher ne doit
 * jamais rendre une saisie inatteignable.
 */
export function sectionVisible(def: EntityDef, data: AppData, nbElements: number): boolean {
  if (nbElements > 0) return true;
  if (def.single) return true;

  // Hors classeur (aucune depuis le retrait du surpresseur) : aucun usage de
  // l'eau ne la commande. Masquée tant que l'auditeur ne l'a pas affichée
  // depuis l'accueil du projet.
  if (def.horsClasseur) return data.EquipementsPresents?.[def.key] === true;

  if (data.UtilisationsEau) return sectionsDemandees(data.UtilisationsEau).has(def.key);
  return data.EquipementsPresents?.[def.key] !== false;
}
