/**
 * Génère `audit-schema.ts` depuis le classeur.
 *
 * Deux informations sont reprises telles quelles :
 *  - les champs et leur type, décrits dans les notes de cellules ;
 *  - **la disposition** : les étiquettes situées sur une même ligne du tableau
 *    Excel restent sur une même ligne du formulaire.
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');

const colOf = (r) => r.match(/^[A-Z]+/)[0];
const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const colNum = (c) => [...c].reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);
/**
 * Certaines notes ne portent pas de signature d'auteur et commencent
 * directement par le marqueur de type (« Liste déroulante : », « O/N »).
 * Sans garde, la regexp qui retire la signature avale ce marqueur, et le
 * champ retombe en texte libre sans ses options — bug constaté sur 11 notes
 * de « Réseaux ECS » et « Production Stockage ECS » dans la V2 du classeur.
 */
const NOTE_MARKER_RE = /^(liste\s*d[ée]roulante|champ[s]?\s*libre|oui\s*\/\s*non|o\s*\/\s*n\b)/i;
const strip = (n) => {
  const t = n.replace(/\r/g, '').trim();
  if (NOTE_MARKER_RE.test(t)) return t;
  return t.replace(/^[^:\n]{0,40}:\s*/, '').trim();
};

// ── Correspondance option-set → constante du référentiel ───────────────────
const L = {
  TYPE_COMPTEUR: ['Compteur à jet unique','Compteur à jet multiple','Compteur à palettes','Compteur volumétrique','Compteur électromagnétique','Compteur ultrasonique','Compteur à pression différentielle','Compteur à insertion','Inconnu'],
  CLASSE_METROLOGIQUE: ['Classe A','Classe B','Classe C','Classe D','Inconnue'],
  TYPE_REDUCTEUR_PRESSION: ['Réducteur de pression à membrane','Réducteur de pression à piston','Réducteur de pression à cartouche','Inconnu'],
  TYPE_ROBINET: ['Simple EF','Simple EF de puisage extérieur','Mélangeur','Mitigeur classique','Mitigeur à butée','Mitigeur thermostatique'],
  COMMANDE_ROBINET: ['manuelle','au genou','à pédale','à détection'],
  TEMPORISATION: ['Aucune','Mécanique','Electronique'],
  MATERIAU_TUYAU: ['Cuivre','Multicouche','PER','PEHD','PE'],
  TYPE_EQUIPEMENT_DOUCHE: ['Douche','Baignoire'],
  TYPE_POMMEAU: ['Pommeau de douche classique','Pommeau de douche hydroéconome','Pommeau de douche anti-légionnelle'],
  TYPE_WC: ['WC à eau suspendu','WC à eau sur pied','Urinoir masculin à eau','Urinoir masculin sans eau','Urinoir féminin sans eau'],
  COMMANDE_CHASSE: ['manuelle double chasse','manuelle simple chasse','manuelle poussoir temporisé','à pédale','à détection','à pas de temps','écoulement en continu','non concerné'],
  TEMPORISATION_ECOULEMENT: ['Non concerné','Volume','Mécanique','Electronique'],
  EMPLACEMENT_BASSIN: ['Intérieure','Extérieure',"Extérieure avec possibilité d'être couverte"],
  MODE_NETTOYAGE: ['auto laveuse','nettoyeur haute pression','tuyaux simple','autre'],
  MODE_ARROSAGE: ['Arrosage goutte à goutte','Arrosage tuyaux poreux','Arrosage non sélectif','Autre'],
  FONCTIONS_EAU_EXTERIEUR: ['arrosage','arrosage et nettoyage','arrosage et autre','nettoyage','nettoyage et autre','autre','arrosage, nettoyage et autre'],
};
const norm = (a) => a.map((s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()).sort().join('|');
const normLabel = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const LOOKUP = new Map(Object.entries(L).map(([k, v]) => [norm(v), k]));

/**
 * Clés de champs à figer par [onglet][libellé exact] → clé de stockage.
 *
 * Vide pour cette régénération (V2 du classeur, 2026-08) : aucun audit réel
 * n'est encore en circulation (confirmé avant de régénérer), donc rien ne
 * dépend encore des clés dérivées. La table reste prête à l'emploi : dès que
 * de vrais audits circuleront, toute régénération future devra y figer les
 * clés des entités concernées avant de faire tourner ce script, exactement
 * comme le faisait l'ancienne entrée `Robinet1` ici même — sans quoi un
 * libellé retouché dans le classeur ferait dériver une nouvelle clé et
 * orphelinerait silencieusement les données déjà saisies sous l'ancienne.
 */
const KEY_OVERRIDES = {};

/** Clé de stockage dérivée du libellé, stable et lisible. */
function keyFor(sheet, label) {
  const o = KEY_OVERRIDES[sheet]?.[label];
  if (o) return o;
  const base = label
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 5)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return base || 'Champ';
}

/**
 * Unité entre parenthèses. Le motif exige que la parenthèse **ne contienne que**
 * l'unité : « (chocs, gel) » n'en est pas une, alors qu'un simple `h` accepté
 * n'importe où dans la parenthèse le faisait passer pour tel.
 */
const UNIT_RE = /\(\s*(l\/min|L\/min|l\/s|m3\/h|m3|m³|m²|m2|mm|cm|m|°C|bar|kWh|%|kg|s|L|h)\s*\)/;

/**
 * Marqueur d'énumération dans une note. La V2 du classeur emploie plusieurs
 * formulations pour la même intention (liste déroulante, menu déroulant,
 * cases à cocher) — s'en tenir à « liste déroulante » seul avait fait perdre
 * 13 champs sur le seul onglet WC1.
 */
const ENUM_MARKER_RE = /liste\s*d[ée]roulante|menu\s*d[ée]roulant|(?:cases?\s*)?[aà]\s*cocher/i;

/**
 * Découpe une liste d'options en respectant les parenthèses : une virgule à
 * l'intérieur d'une parenthèse fait partie de la valeur (« maçonnée (brique,
 * parpaing, carreau de plâtre) » est une seule option, pas trois).
 */
function splitOptions(text) {
  const parts = [];
  let cur = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\n,;]/.test(ch)) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts;
}

/**
 * Note décrivant une référence croisée déguisée en liste déroulante — ex.
 * « Liste déroulante : avec les choix de la liste des réseaux ECS ». Sans
 * cette détection, le champ devient un select à une seule option absurde
 * (« avec les choix de la liste des réseaux ECS » comme valeur), au lieu
 * d'une vraie référence stockant l'Id de l'élément visé. `entityByPlural` fait
 * correspondre le nom cité au pluriel d'une entité du schéma (ex. « réseaux
 * ECS » → `reseaux_eau_chaude_sanitaire`).
 */
const ENTITY_REF_RE = /avec\s+les\s+choix\s+de\s+la\s+liste\s+des?\s+([^.\n,;()]+)/i;

function classify(note, cellBelow, label, entityByPlural) {
  const n = note || '';
  const ref = n.match(ENTITY_REF_RE);
  if (ref && entityByPlural) {
    const target = entityByPlural.get(normLabel(ref[1]));
    if (target) return { kind: 'entity-ref', refTo: target };
  }
  if (/\bo\s*\/\s*n\b/i.test(n) || /^\s*oui\s*\/\s*non\s*$/i.test(cellBelow || '')) {
    return { kind: 'boolean' };
  }
  if (ENUM_MARKER_RE.test(n)) {
    const after = n.replace(new RegExp('^[\\s\\S]*?(?:' + ENUM_MARKER_RE.source + ')\\s*:?\\s*', 'i'), '');
    let opts = splitOptions(after).map((o) => o.trim().replace(/[.,;]+$/, '')).filter((o) => o && o.length < 80);
    // Un seul item retenu : les options sont peut-être jointes par « / » plutôt
    // que par une virgule (« Bon / Moyen / Mauvais », « oui/non/ne sait pas »).
    // Ne s'applique qu'à un item unique : un « / » à l'intérieur d'un item d'une
    // liste déjà scindée (ex. « PVC/EPDM ») fait partie de sa valeur.
    if (opts.length === 1 && /\bou\b/.test(opts[0])) {
      opts = opts[0].split(/\bou\b/).map((o) => o.trim()).filter(Boolean).map((o) => o[0].toUpperCase() + o.slice(1));
    } else if (opts.length === 1 && opts[0].includes('/')) {
      opts = opts[0].split('/').map((o) => o.trim()).filter(Boolean);
    }
    return { kind: 'select', options: opts };
  }
  const unit = label.match(UNIT_RE);
  if (unit) return { kind: 'number', unit: unit[1].trim() };
  if (/^nombre|^nb\b|^dur[ée]e|^ann[ée]e|^volume|^temps|^fr[ée]quentation|^surface/i.test(label)) {
    return { kind: 'number' };
  }
  if (/remarques|dysfonctionnements|raisons|pr[ée]cisions?$/i.test(label)) return { kind: 'textarea' };
  return { kind: 'text' };
}

// ── Entités, dans l'ordre du classeur ──────────────────────────────────────
//
// Reconstruite pour la V2 du classeur (2026-08) : la plupart des onglets ont
// été renommés (ex. Robinet1 → Robinets, Piscine → Bassin1) ou le cluster ECS
// a été réorganisé. `key`/`route` reprennent ceux de la version précédente
// quand le même onglet-fiche existe encore, pour rester lisibles ; seul
// `sheet` a changé. Cinq entités de la version précédente n'ont plus
// d'onglet correspondant dans cette V2 et ont donc disparu du schéma :
// Réseau distribution EFS, Production ECS, Stockage ECS (fusionnées avec
// Production Stockage ECS ci-dessous), équipements ECS (v0), et Collecte eau
// de pluie. Voir le rapport de régénération pour le détail.
const ENTITIES = [
  { sheet: 'Compteur général', key: 'releve_compteur_general', route: 'compteur-general', singular: 'Compteur général', plural: 'Compteur général', single: true, cols: [] },
  { sheet: 'Sous-compteur1', key: 'sous_compteurs', route: 'sous-compteurs', singular: 'Sous-compteur', plural: 'Sous-compteurs', cols: ['Numero', 'Emplacement', 'AnneeDePose', 'Teletransmission'] },
  { sheet: 'Réducteur de pression1', key: 'reducteurs_de_pression', route: 'reducteurs-pression', singular: 'Réducteur de pression', plural: 'Réducteurs de pression', cols: ['Numero', 'Emplacement', 'AnneeDePose'] },
  { sheet: 'Surpresseur1', key: 'surpresseurs', route: 'surpresseurs', singular: 'Surpresseur', plural: 'Surpresseurs', cols: ['Numero', 'Emplacement', 'AnneeDePose'] },
  { sheet: 'Réseaux ECS', key: 'reseaux_eau_chaude_sanitaire', route: 'reseaux-ecs', singular: 'Réseau ECS', plural: 'Réseaux ECS', cols: ['Numero', 'MateriauPrincipalDesCanalisations', 'DiametreDesGaines', 'Bouclage'] },
  { sheet: 'Production Stockage ECS', key: 'production_stockage_ecs', route: 'production-stockage-ecs', singular: 'Production / Stockage ECS', plural: 'Production / Stockage ECS', cols: ['Numero', 'TypeDeSystemeDeProduction', 'SystemesDeProduction'] },
  { sheet: 'Robinets', key: 'robinets', route: 'robinets', singular: 'Robinet', plural: 'Robinets', cols: ['Numero', 'Emplacement', 'Type', 'Debit'] },
  { sheet: 'Douche-baignoire1', key: 'douches_baignoires', route: 'douches-baignoires', singular: 'Douche / Baignoire', plural: 'Douches et baignoires', cols: ['Numero', 'TypeDEquipement', 'Emplacement'] },
  { sheet: 'WC1', key: 'wc', route: 'wc', singular: 'WC', plural: 'WC', cols: ['Numero', 'TypeDeToiletteOuUrinoir', 'Emplacement', 'NombreDEquipementsIdentiques'] },
  { sheet: 'Appareils de lavage', key: 'appareils_lavage', route: 'appareils-lavage', singular: 'Appareil de lavage', plural: 'Appareils de lavage', cols: ['Numero', 'Emplacement', 'Type'] },
  { sheet: 'Structure1', key: 'structure', route: 'structure', singular: 'Structure', plural: 'Structures', cols: ['Numero', 'Emplacement', 'TypeDeLaStructure'] },
  { sheet: 'Ventilation1', key: 'ventilation_batiment', route: 'ventilation', singular: 'Ventilation', plural: 'Ventilation', cols: ['Numero', 'SystemeDeVentilation', 'EmplacementDuSysteme'] },
  { sheet: 'Incendie', key: 'incendie', route: 'incendie', singular: 'Incendie', plural: 'Incendie', cols: ['Numero', 'Emplacement', 'PrecisionEmplacement'] },
  { sheet: 'Toiture1', key: 'toitures', route: 'toitures', singular: 'Toiture', plural: 'Toitures', cols: ['Numero', 'Emplacement', 'SurfaceDeToiture', 'ToitureAccessible'] },
  { sheet: 'Bassin1', key: 'piscines', route: 'piscines', singular: 'Bassin', plural: 'Piscines', cols: ['Numero', 'Nom', 'Emplacement', 'VolumeDuBassin'] },
  { sheet: 'Extérieur1', key: 'espace_vert_exterieur', route: 'espaces-exterieurs', singular: 'Espace extérieur', plural: 'Espaces extérieurs', cols: ['Numero', 'Emplacement'] },
  { sheet: 'Opportunités1', key: 'opportunites', route: 'opportunites', singular: 'Opportunité', plural: 'Opportunités', cols: ['Numero', 'Emplacement'] },
  { sheet: 'Autre1', key: 'autre', route: 'autre', singular: 'Autre', plural: 'Autres', cols: ['Numero', 'Choix', 'Nom', 'Emplacement'] },
];

const IGNORE = /^(audit sobrieau|enregistrer|num[ée]ro$)/i;

/** Pour résoudre « la liste des réseaux ECS » → `reseaux_eau_chaude_sanitaire`. */
const entityByPlural = new Map(ENTITIES.map((e) => [normLabel(e.plural), e.key]));

const out = [];
out.push(`import { EntityDef } from './field.models';`);
out.push(`import * as L from './value-lists';`);
out.push('');
out.push(`/**`);
out.push(` * Schéma de la partie technique — GÉNÉRÉ depuis \`audit_technique.xlsx\`.`);
out.push(` *`);
out.push(` * \`row\` reproduit le numéro de ligne du tableau Excel : les champs partageant`);
out.push(` * la même valeur sont affichés côte à côte, comme le prescrit le classeur.`);
out.push(` * Les clés de stockage des robinets sont conservées à l'identique.`);
out.push(` *`);
out.push(` * Régénérer avec \`node tools/gen-schema.js\` après modification du classeur.`);
out.push(` */`);
out.push(`export const AUDIT_SCHEMA: EntityDef[] = [`);

const report = [];

for (const ent of ENTITIES) {
  const s = wb.sheets.find((x) => x.name === ent.sheet);
  if (!s) { report.push(`  ⚠ onglet absent : ${ent.sheet}`); continue; }

  const noteRows = new Set(Object.keys(s.notes).map(rowOf));
  const cellAt = (r, c) => {
    for (const [ref, cell] of Object.entries(s.cells)) {
      if (rowOf(ref) === r && colNum(colOf(ref)) === c) return String(cell.v ?? '').trim();
    }
    return '';
  };

  // Étiquettes : cellules texte dont la ligne suivante porte des notes.
  // Le plafond de longueur écarte les bandeaux/titres (un vrai libellé,
  // même verbeux avec ses exemples entre parenthèses, ne dépasse pas 250
  // caractères dans ce classeur — mesuré, le plus long en fait 219).
  const MAX_LABEL_LEN = 250;
  const rows = {};
  for (const [ref, cell] of Object.entries(s.cells)) {
    const v = String(cell.v ?? '').trim();
    if (!v || v.length > MAX_LABEL_LEN || IGNORE.test(v)) continue;
    const r = rowOf(ref);
    if (r < 6) continue; // lignes 1 à 5 : bandeau, titre de la fiche, Numéro
    if (!noteRows.has(r + 1)) continue;
    (rows[r] ??= []).push({ col: colNum(colOf(ref)), label: v.replace(/\s+/g, ' ') });
  }

  // Onglets dépourvus de notes : on déduit les étiquettes de la disposition.
  if (Object.keys(rows).length === 0) {
    const occupied = new Set(Object.keys(s.cells).map((ref) => rowOf(ref) + ':' + colNum(colOf(ref))));
    for (const [ref, cell] of Object.entries(s.cells)) {
      const v = String(cell.v ?? '').trim();
      const r = rowOf(ref), c = colNum(colOf(ref));
      if (!v || v.length > MAX_LABEL_LEN || r < 6 || IGNORE.test(v)) continue;
      if (occupied.has((r + 1) + ':' + c)) continue; // suivi de contenu → pas une étiquette
      (rows[r] ??= []).push({ col: c, label: v.replace(/\s+/g, ' ') });
    }
  }

  const fields = [];
  const seen = new Set();
  for (const r of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
    const cells = rows[r].sort((a, b) => a.col - b.col);
    for (const c of cells) {
      // Note portée par la cellule de saisie, sous l'étiquette
      let note = '';
      for (const [ref, raw] of Object.entries(s.notes)) {
        if (rowOf(ref) !== r + 1) continue;
        const nc = colNum(colOf(ref));
        const next = cells.find((x) => x.col > c.col);
        if (nc >= c.col && (!next || nc < next.col)) { note = strip(raw); break; }
      }
      const below = cellAt(r + 1, c.col);
      const { kind, options, unit, refTo } = classify(note, below, c.label, entityByPlural);

      let key = keyFor(ent.sheet, c.label);
      while (seen.has(key)) key += 'Bis';
      seen.add(key);

      const f = { key, label: c.label.replace(/\s*\([^)]*\)\s*$/, '').trim() || c.label, kind, row: r };
      if (unit) f.unit = unit;
      if (refTo) f.refTo = refTo;
      if (options?.length) {
        const constant = LOOKUP.get(norm(options));
        f.options = constant ? `L.${constant}` : JSON.stringify(options);
      }
      if (kind === 'textarea') f.wide = true;
      fields.push(f);
    }
  }

  report.push(`  ${ent.sheet.padEnd(26)} ${String(fields.length).padStart(3)} champs, ${new Set(fields.map(f=>f.row)).size} lignes`);

  out.push(`  {`);
  out.push(`    key: ${JSON.stringify(ent.key)},`);
  out.push(`    route: ${JSON.stringify(ent.route)},`);
  out.push(`    singular: ${JSON.stringify(ent.singular)},`);
  out.push(`    plural: ${JSON.stringify(ent.plural)},`);
  if (ent.single) out.push(`    single: true,`);
  out.push(`    listColumns: ${JSON.stringify(ent.cols)},`);
  out.push(`    fields: [`);
  for (const f of fields) {
    const parts = [`key: ${JSON.stringify(f.key)}`, `label: ${JSON.stringify(f.label)}`, `kind: ${JSON.stringify(f.kind)}`, `row: ${f.row}`];
    if (f.unit) parts.push(`unit: ${JSON.stringify(f.unit)}`);
    if (f.refTo) parts.push(`refTo: ${JSON.stringify(f.refTo)}`);
    if (f.options) parts.push(`options: ${f.options}`);
    if (f.wide) parts.push(`wide: true`);
    out.push(`      { ${parts.join(', ')} },`);
  }
  out.push(`    ],`);
  out.push(`  },`);
}

out.push(`];`);
out.push('');
out.push(`/** Retrouve une entité par sa clé de stockage. */`);
out.push(`export function entityByKey(key: string): EntityDef | undefined {`);
out.push(`  return AUDIT_SCHEMA.find((e) => e.key === key);`);
out.push(`}`);
out.push('');
out.push(`/** Retrouve une entité par son segment d'URL. */`);
out.push(`export function entityByRoute(route: string): EntityDef | undefined {`);
out.push(`  return AUDIT_SCHEMA.find((e) => e.route === route);`);
out.push(`}`);
out.push('');

fs.writeFileSync(path.join(__dirname,'..','src','app','models','audit-schema.ts'), out.join('\n'), 'utf8');
console.log(report.join('\n'));
