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
const strip = (n) => n.replace(/^[^:\n]{0,40}:\s*/, '').replace(/\r/g, '').trim();

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
const LOOKUP = new Map(Object.entries(L).map(([k, v]) => [norm(v), k]));

/** Clés historiques des robinets — ne pas les changer, des audits existent. */
const KEY_OVERRIDES = {
  Robinet1: {
    'Emplacement': 'Emplacement',
    'Précision emplacement': 'PrecisionEmplacement',
    'Usages': 'Usages',
    'Type': 'Type',
    'Débit en sortie du robinet (L/min)': 'Debit',
    "Présence d'un réducteur de débit": 'PresenceReducteur',
    'Temps obtention ECS (s)': 'TempsECS',
    "Numéro réseau ECS d'appartenance": 'NumeroReseauECS',
    "Nombre d'utlisation/semaine": 'NbUtilisationSemaine',
    "Nombre d'équipements identiques": 'NbEquipementIdentique',
    'Remarques': 'Remarques',
  },
};

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
const UNIT_RE = /\(\s*(l\/min|L\/min|m3\/h|m3|m³|m2|mm|°C|bar|kWh|%|s|L|h)\s*\)/;

function classify(note, cellBelow, label) {
  const n = note || '';
  if (/\bo\s*\/\s*n\b/i.test(n) || /^\s*oui\s*\/\s*non\s*$/i.test(cellBelow || '')) {
    return { kind: 'boolean' };
  }
  if (/liste\s*d[ée]roulante/i.test(n)) {
    const after = n.replace(/^[\s\S]*?liste\s*d[ée]roulante\s*:?\s*/i, '');
    let opts = after.split(/[\n,;]+/).map((o) => o.trim().replace(/[.,;]+$/, '')).filter((o) => o && o.length < 80);
    if (opts.length === 1 && /\bou\b/.test(opts[0])) {
      opts = opts[0].split(/\bou\b/).map((o) => o.trim()).filter(Boolean).map((o) => o[0].toUpperCase() + o.slice(1));
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
const ENTITIES = [
  { sheet: 'Compteur général', key: 'releve_compteur_general', route: 'compteur-general', singular: 'Compteur général', plural: 'Compteur général', single: true, cols: [] },
  { sheet: 'Sous-compteurs1', key: 'sous_compteurs', route: 'sous-compteurs', singular: 'Sous-compteur', plural: 'Sous-compteurs', cols: ['Numero', 'Emplacement', 'AnneeDePose', 'Teletransmission'] },
  { sheet: 'Réducteur de Pression1', key: 'reducteurs_de_pression', route: 'reducteurs-pression', singular: 'Réducteur de pression', plural: 'Réducteurs de pression', cols: ['Numero', 'ConditionDAcces', 'Type'] },
  { sheet: 'Réseau distribution EFS', key: 'reseaux_efs', route: 'reseaux-efs', singular: 'Réseau EFS', plural: 'Réseaux de distribution EFS', cols: ['Numero'] },
  { sheet: 'Réseau distribution ECS', key: 'reseaux_eau_chaude_sanitaire', route: 'reseaux-ecs', singular: 'Réseau ECS', plural: 'Réseaux de distribution ECS', cols: ['Numero'] },
  { sheet: 'Production ECS', key: 'production_ecs', route: 'production-ecs', singular: 'Production ECS', plural: 'Production ECS', cols: ['Numero'] },
  { sheet: 'Stockage ECS', key: 'stockage_ecs', route: 'stockage-ecs', singular: 'Stockage ECS', plural: 'Stockage ECS', cols: ['Numero'] },
  { sheet: 'équipements ECS (v0)', key: 'equipements_ecs', route: 'equipements-ecs', singular: 'Équipement ECS', plural: 'Équipements ECS', cols: ['Numero', 'Emplacement'] },
  { sheet: 'Robinet1', key: 'robinets', route: 'robinets', singular: 'Robinet', plural: 'Robinets', cols: ['Numero', 'Emplacement', 'Type', 'Debit'] },
  { sheet: 'Douche-baignoire1', key: 'douches_baignoires', route: 'douches-baignoires', singular: 'Douche / Baignoire', plural: 'Douches et baignoires', cols: ['Numero', "ChoixDeLEquipement", 'Emplacement', 'NumeroRobinetCorrespondant'] },
  { sheet: 'WC1', key: 'wc', route: 'wc', singular: 'WC', plural: 'WC', cols: ['Numero', 'Type', 'Emplacement'] },
  { sheet: 'Ventilation', key: 'ventilation_batiment', route: 'ventilation', singular: 'Ventilation', plural: 'Ventilation', cols: ['Numero'] },
  { sheet: 'Piscine', key: 'piscines', route: 'piscines', singular: 'Piscine', plural: 'Piscines', cols: ['Numero', 'Nom', 'Emplacement'] },
  { sheet: 'Collecte eau de pluie', key: 'collecte_eau_pluie', route: 'collecte-eau-pluie', singular: "Collecte d'eau de pluie", plural: "Collecte d'eau de pluie", single: true, cols: [] },
  { sheet: 'Extérieur1', key: 'espace_vert_exterieur', route: 'espaces-exterieurs', singular: 'Espace extérieur', plural: 'Espaces extérieurs', cols: ['Numero', 'Emplacement'] },
];

const IGNORE = /^(audit sobrieau|enregistrer|num[ée]ro$)/i;

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

  // Étiquettes : cellules texte dont la ligne suivante porte des notes
  const rows = {};
  for (const [ref, cell] of Object.entries(s.cells)) {
    const v = String(cell.v ?? '').trim();
    if (!v || v.length > 70 || IGNORE.test(v)) continue;
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
      if (!v || v.length > 70 || r < 6 || IGNORE.test(v)) continue;
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
      const { kind, options, unit } = classify(note, below, c.label);

      let key = keyFor(ent.sheet, c.label);
      while (seen.has(key)) key += 'Bis';
      seen.add(key);

      const f = { key, label: c.label.replace(/\s*\([^)]*\)\s*$/, '').trim() || c.label, kind, row: r };
      if (unit) f.unit = unit;
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
