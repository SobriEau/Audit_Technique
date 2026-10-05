/**
 * Contrôle de l'export CSV : tout ce que contient le JSON s'y retrouve-t-il ?
 *
 * L'export sert à compiler des audits ; une réponse qui n'y figurerait pas
 * manquerait à l'analyse sans que rien ne le signale. Et le formulaire est
 * voué à évoluer : ce qui doit tenir, c'est la règle, pas la liste des champs
 * d'aujourd'hui.
 *
 * Ce script compile l'export tel que l'application l'embarque, puis :
 *  - fabrique un audit qui remplit **chaque champ de chaque fiche du schéma
 *    réel**, plus tout ce que le schéma ignore — clés inconnues, structures
 *    imbriquées, formes d'avant une migration, onglet retiré ;
 *  - énumère les feuilles de ce JSON **par son propre parcours**, indépendant
 *    de celui de l'export, et vérifie que chacune a sa ligne, avec sa valeur,
 *    une fois relu le fichier encodé ;
 *  - rejoue l'export avec un schéma amputé ou vide : aucune feuille ne doit
 *    disparaître quand le formulaire change ;
 *  - éprouve le fichier lui-même : séparateur, guillemets, encodage cp-1252.
 *
 *   node tools/check-csv.js
 */
const { compiler } = require('./lib/compiler');

const ts = compiler(['src/app/core/utils/csv-export.ts', 'src/app/core/utils/cp1252.ts']);
const { AUDIT_SCHEMA } = ts.charger('app/models/audit-schema.js');
const { csvAudit, COLONNES_CSV } = ts.charger('app/core/utils/csv-export.js');
const { encoderCp1252 } = ts.charger('app/core/utils/cp1252.js');
ts.nettoyer();

let echecs = 0;
const ok = (cond, message, detail) => {
  if (cond) return;
  echecs++;
  console.log('  ✗ ' + message + (detail === undefined ? '' : '\n      ' + String(detail).slice(0, 600)));
};

// ── Un audit qui remplit tout ──────────────────────────────────────────────

/**
 * Textes à risque pour un CSV : séparateur, guillemets, retours à la ligne,
 * caractères de la plage haute de cp-1252, débuts que le tableur prend pour
 * une formule ou une date.
 */
const PIEGES = [
  'Local « technique » ; sous-sol',
  'ligne 1\nligne 2',
  'cœur d’îlot — 12 € … œuvre',
  '- fuite au compteur',
  '=SOMME(A1:A3)',
  '  espace en tête',
  'guillemet " droit',
  'fin de ligne\r\nWindows',
  '+33 6 12 34 56 78',
  '@bureau',
  'été, hiver',
  '2/4',
  '03/2024',
  '0123',
  '1998',
  '2026-10-05',
];
let rang = 0;
const texte = () => {
  const piege = PIEGES[rang++ % PIEGES.length];
  return piege.length > 12 ? `${piege} (${rang})` : piege;
};

const idDe = (entite, lettre) => `${entite}-${lettre}`;

function valeurDe(f) {
  switch (f.kind) {
    case 'boolean':
      return rang++ % 2 === 0;
    case 'number':
      return 12.5 + (rang++ % 7);
    case 'select': {
      const options = f.options || [];
      if (!options.length) return texte();
      return f.multiple ? options.slice(-2) : options[options.length - 1];
    }
    case 'entity-ref':
      return idDe(f.refTo, 'A');
    case 'mesures-debit':
      return [{ temps: 12, volume: 2.5, direct: 11.8 }, { temps: 10, volume: 2 }, {}];
    case 'rich':
      return '<p>Texte <b>riche</b></p><ul><li>un</li><li>deux &amp; trois</li></ul>';
    default:
      return texte();
  }
}

/** Élément où tout est rempli, y compris ce que le schéma ne connaît pas. */
function elementComplet(def, lettre, numero) {
  const item = { Id: idDe(def.key, lettre) };
  if (numero) item.Numero = numero;
  for (const f of def.fields) {
    item[f.key] = valeurDe(f);
    if (f.kind === 'select') item[f.key + 'Autre'] = texte();
    if (f.parOption) item[f.parOption.cle] = Object.fromEntries((f.options || []).slice(-2).map((o) => [o, texte()]));
  }
  item.Photos = [
    { id: `${item.Id}-p1`, name: 'photo 1.jpg', path: 'photos/p1.jpg', driveId: 'drive-1', date: '2026-10-05' },
    { id: `${item.Id}-p2`, name: 'photo 2.jpg' },
  ];
  item.Localisation = { planId: 'plan-1', x: 0.25, y: 0.75 };
  item.ChampHorsSchema = texte();
  item.StructureHorsSchema = { a: 1, b: ['x', 'y'], c: [{ d: true }, { d: false, e: null }], 'clé à espace': 'oui' };
  return item;
}

/** Élément saisi sous d'anciennes formes : la forme réelle prime sur le type annoncé. */
function elementAncien(def, lettre, numero) {
  const item = { Id: idDe(def.key, lettre), Numero: numero };
  for (const f of def.fields) {
    if (f.kind === 'select' && f.multiple && f.options?.length) item[f.key] = f.options[0]; // chaîne d'avant le choix multiple
    else if (f.kind === 'mesures-debit') item[f.key] = 7.5; // ancien « Débit en sortie »
    else if (f.kind === 'number') item[f.key] = '12'; // nombre resté en texte
    else if (f.kind === 'entity-ref') item[f.key] = 'cible-supprimee';
  }
  return item;
}

function auditComplet() {
  const qte = {
    Info: '<p>Visite du <b>5 octobre</b></p><p>Accès par la cour &amp; le parking</p>',
    TableauDeBord: {
      AnneeConstruction: '1998',
      TravauxDerniereRenovation: 'Toiture ; menuiseries',
      PressionProcheCompteur: 3.2,
      PressionEloigneeCompteur: -0.5,
      ChampAjouteDepuis: 'valeur',
    },
  };
  for (const def of AUDIT_SCHEMA) {
    qte[def.key] = def.single
      ? elementComplet(def, 'A', null)
      : [elementComplet(def, 'A', '1'), { Id: idDe(def.key, 'B'), Numero: '2', Photos: [] }, elementAncien(def, 'C', '3')];
  }
  // Ce que le schéma ne décrit plus, ou pas encore.
  qte.surpresseurs = [{ Id: 'surpresseur-A', Numero: '1', Marque: 'Marque X', Photos: [{ id: 'sp1', name: 's.jpg' }] }];
  qte.Localisations = { robinets: { planId: 'plan-1', x: 0.1, y: 0.2 } };
  qte.PhotosSections = { robinets: [{ id: 'ps1', name: 'ancienne.jpg' }] };
  qte.CleQteInconnue = 12;
  qte.ListeSimpleInconnue = ['a', 'b'];

  return {
    Id: 'audit-1',
    Adresse: '12 rue des Lilas, Créteil',
    AdresseKey: '12 rue des lilas creteil',
    NomProjet: 'Projet « test »',
    NomSite: 'École Jean Moulin ; bâtiment B',
    Info: '<p>Ouvert de 8 h à 18 h</p><ul><li>fermé l&#39;été</li><li>cantine</li></ul>',
    Date: '2026-10-05',
    Auditeur: 'Jean Dupont',
    Accompagnant: 'Marie Durand - responsable technique',
    Effectif: '320 élèves, 28 personnels',
    NiveauRemplissage: 'allege',
    CleRacineInconnue: 'valeur',
    StructureRacineInconnue: { a: { b: [1, 2] }, liste: [{ x: 1 }, { x: 2.5 }] },
    ImageEnLigne: 'data:image/png;base64,' + 'A'.repeat(4000),
    Plans: [{ id: 'plan-1', name: 'RDC', date: '2025-01-01' }, { id: 'plan-2', name: 'Étage' }],
    Photos: [{ id: 'g1', name: 'façade.jpg' }],
    UtilisationsEau: { wc: true, piscine: false, usage_inconnu: true },
    EquipementsPresents: { robinets: true, surpresseurs: false },
    Documents: {
      'doc-08': { coche: true },
      'autre-1': { coche: true, precision: 'Carnet sanitaire' },
      'doc-inconnu': { coche: false, champ_nouveau: 'x' },
    },
    Qge: {
      gestion: { contrat: 'régie', releves: [{ mois: 'janvier', m3: 120.5 }, { mois: 'février', m3: 98 }] },
      'clé avec espace': 'oui',
    },
    Qus: { satisfaction: 4, remarques: ['bruit', 'pression'], vide: null, rien: '' },
    Qte: qte,
    __assets: { 'audit-p1': { name: 'photo 1.jpg', data: 'data:image/png;base64,AAAA' } },
  };
}

// ── Parcours indépendant du JSON ───────────────────────────────────────────

const acces = (k) => (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) ? '.' + k : '[' + k + ']');
const simple = (v) => v === null || typeof v !== 'object';
const vide = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/** Feuilles du JSON : chemin → valeur. Un tableau de réponses simples compte pour une. */
function feuilles(v, chemin, out) {
  if (vide(v)) return out;
  if (simple(v)) return out.set(chemin, v);
  if (Array.isArray(v)) {
    if (v.every(simple)) {
      const reponses = v.filter((x) => !vide(x));
      if (reponses.length) out.set(chemin, reponses);
      return out;
    }
    v.forEach((x, i) => feuilles(x, `${chemin}[${i}]`, out));
    return out;
  }
  for (const [k, x] of Object.entries(v)) feuilles(x, chemin ? chemin + acces(k) : k, out);
  return out;
}

// ── Relecture du fichier ───────────────────────────────────────────────────

/** Lecteur CSV strict (RFC 4180), séparateur « ; ». */
function lireCsv(texteCsv) {
  const rangs = [];
  let champs = [];
  let champ = '';
  let cite = false;
  for (let i = 0; i < texteCsv.length; i++) {
    const c = texteCsv[i];
    if (cite) {
      if (c === '"' && texteCsv[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') cite = false;
      else champ += c;
    } else if (c === '"') cite = true;
    else if (c === ';') { champs.push(champ); champ = ''; }
    else if (c === '\r' && texteCsv[i + 1] === '\n') { champs.push(champ); rangs.push(champs); champs = []; champ = ''; i++; }
    else champ += c;
  }
  if (champ || champs.length) rangs.push([...champs, champ]);
  return rangs;
}

const fr = (x) => (typeof x === 'number' ? String(x).replace('.', ',') : typeof x === 'boolean' ? (x ? 'Oui' : 'Non') : x);

/** Ce qu'une cellule doit contenir pour cette valeur du JSON, une fois le fichier relu. */
function attendu(v) {
  let t = Array.isArray(v) ? v.map(fr).join(' | ') : fr(v);
  t = t.replace(/\r\n?/g, '\n');
  const estTexte = typeof v === 'string' || Array.isArray(v);
  return estTexte && PROTEGES.some((re) => re.test(t)) && !FIDELES.some((re) => re.test(t)) ? "'" + t : t;
}

/**
 * Textes qu'Excel réinterprète à l'ouverture, donc précédés d'une apostrophe —
 * et ceux qu'il relit à l'identique, laissés tels quels. Écrit ici une seconde
 * fois, d'après les mesures faites sur Excel, plutôt que repris de l'export.
 */
const PROTEGES = [/^[=+\-@\t\r]/, /^(?=[^\d]*\d)[\d\s/.:,%+\-]+$/, /^\d+(?:[.,]\d+)?[eE][+-]?\d+$/];
const FIDELES = [/^[+-]?(?:0|[1-9]\d{0,14})(?:[.,]\d+)?$/, /^(?:\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/];

/** Valeurs en texte enrichi : le balisage doit avoir disparu, pas le texte. */
const TEXTE_ENRICHI = new Set(['Info', 'Qte.Info', 'Adresse']);
const BALISAGE_RE = /<\/?[a-z]|&(amp|#39|nbsp);/i;

/**
 * Exporte, encode, relit, et confronte au JSON.
 * @returns les lignes relues, pour les contrôles propres à un scénario.
 */
function controler(nom, audit, schema) {
  const avant = echecs;
  const { texte: csv, lignes } = csvAudit(audit, schema);
  const { octets, remplaces } = encoderCp1252(csv);
  ok(remplaces.length === 0, `${nom} : caractères remplacés à l'encodage`, remplaces.join(' '));

  const relu = new TextDecoder('windows-1252').decode(octets);
  ok(relu === csv.normalize('NFC'), `${nom} : le fichier relu en cp-1252 diffère du texte écrit`);
  ok(relu.endsWith('\r\n') && !/[^\r]\n$/.test(relu), `${nom} : fins de ligne`);

  const rangs = lireCsv(relu);
  const entetes = rangs.shift();
  ok(entetes.join(';') === COLONNES_CSV.join(';'), `${nom} : en-têtes`, entetes.join(';'));
  ok(rangs.length === lignes.length, `${nom} : ${rangs.length} rangs relus pour ${lignes.length} lignes écrites`);
  const hors = rangs.filter((r) => r.length !== COLONNES_CSV.length);
  ok(hors.length === 0, `${nom} : ${hors.length} rang(s) n'ont pas ${COLONNES_CSV.length} colonnes`, hors[0] && hors[0].join(' ¦ '));

  const col = (n) => COLONNES_CSV.indexOf(n);
  const relues = rangs.map((r, i) => ({ ...lignes[i], relu: r }));

  // Chaque feuille du JSON a sa ligne. Une identité (`Id`) peut tenir dans une
  // colonne plutôt que sur une ligne : celle de l'audit, celle d'un élément.
  const attendues = feuilles({ ...audit, __assets: undefined }, '', new Map());
  const saisies = new Map();
  for (const l of relues) {
    if (l.origine !== 'saisie') continue;
    ok(!saisies.has(l.chemin), `${nom} : deux lignes pour ${l.chemin}`);
    saisies.set(l.chemin, l);
  }
  const identites = new Set(rangs.flatMap((r) => [r[col('AuditId')], r[col('ElementId')]]));
  // Un audit sans aucune réponse ne produit que les en-têtes.
  if (!rangs.length) identites.add(String(audit.Id));
  const manquantes = [...attendues].filter(([ch, v]) => !saisies.has(ch) && !(/(^|\.)Id$/.test(ch) && identites.has(String(v))));
  ok(manquantes.length === 0, `${nom} : ${manquantes.length} valeur(s) du JSON absentes du CSV`, manquantes.map(([ch]) => ch).join(', '));
  const inventees = [...saisies.keys()].filter((ch) => !attendues.has(ch));
  ok(inventees.length === 0, `${nom} : ${inventees.length} ligne(s) « saisie » sans valeur dans le JSON`, inventees.join(', '));

  // …et sa valeur, après l'aller-retour par le fichier encodé.
  let fausses = 0;
  for (const [ch, l] of saisies) {
    const v = attendues.get(ch);
    if (v === undefined) continue;
    const cellule = l.relu[col('Valeur')];
    let juste;
    if (TEXTE_ENRICHI.has(ch) && BALISAGE_RE.test(v)) juste = cellule.length > 0 && !BALISAGE_RE.test(cellule);
    else if (typeof v === 'string' && v.startsWith('data:')) juste = cellule.startsWith('[') && cellule.length < 200;
    else juste = cellule === attendu(v);
    if (!juste && fausses++ < 3) ok(false, `${nom} : valeur altérée pour ${ch}`, `${JSON.stringify(v)} → ${JSON.stringify(cellule)}`);
  }
  ok(fausses <= 3, `${nom} : ${fausses} valeur(s) altérée(s) au total`);

  // Une ligne se retrouve sans ambiguïté : c'est ce qui permet de repasser en
  // tableau large sans rien écraser.
  const cles = new Map();
  for (const l of relues) {
    const k = l.relu[col('ElementId')] + ' ¦ ' + l.relu[col('Cle')];
    cles.set(k, (cles.get(k) || 0) + 1);
  }
  const doublons = [...cles].filter(([, n]) => n > 1);
  ok(doublons.length === 0, `${nom} : ${doublons.length} couple(s) élément / clé en double`, doublons.slice(0, 5).map(([k]) => k).join(', '));
  ok(relues.every((l) => l.relu[col('AuditId')] === String(audit.Id)), `${nom} : AuditId absent d'une ligne`);

  console.log(
    `  ${nom.padEnd(44)} ${String(attendues.size).padStart(5)} valeurs du JSON, ${String(lignes.length).padStart(5)} lignes ` +
      `(${lignes.filter((l) => l.origine === 'calcul').length} calculées)` +
      (echecs > avant ? '   ✗' : '')
  );
  return { relues, col };
}

console.log("\nCONTRÔLE DE L'EXPORT CSV — tout le JSON s'y retrouve-t-il ?\n");

const audit = auditComplet();
const { relues, col } = controler('audit complet, schéma actuel', audit, AUDIT_SCHEMA);

// ── Le schéma habille bien ce qu'il décrit ─────────────────────────────────
let habilles = 0;
for (const def of AUDIT_SCHEMA) {
  const cleBase = def.single ? `Qte.${def.key}.` : `Qte.${def.key}[].`;
  const duBloc = relues.filter((l) => l.relu[col('Section')] === def.plural);
  for (const f of def.fields) {
    const l = duBloc.find((x) => x.relu[col('Cle')] === cleBase + f.key || x.relu[col('Cle')].startsWith(cleBase + f.key + '['));
    ok(!!l, `${def.key}.${f.key} : aucun champ exporté`);
    if (!l) continue;
    ok(l.relu[col('Question')].startsWith(f.label), `${def.key}.${f.key} : libellé`, l.relu[col('Question')]);
    ok(l.relu[col('Rubrique')] === (f.section || ''), `${def.key}.${f.key} : rubrique`, l.relu[col('Rubrique')]);
    habilles++;
  }
  // Une fiche créée sans rien y saisir doit encore se compter.
  if (!def.single) {
    const vide = relues.filter((l) => l.relu[col('ElementId')] === idDe(def.key, 'B'));
    ok(vide.length === 1 && vide[0].relu[col('Question')] === 'Numéro', `${def.key} : la fiche vide n'a pas sa ligne`);
  }
}
console.log(`  ${'habillage par le schéma'.padEnd(44)} ${String(habilles).padStart(5)} champs retrouvés sous leur libellé et leur rubrique`);

// ── Lignes calculées ───────────────────────────────────────────────────────
const calculee = (suffixe, valeur) =>
  relues.some((l) => l.origine === 'calcul' && l.relu[col('Cle')].endsWith(suffixe) && (valeur === undefined || l.relu[col('Valeur')] === valeur));
ok(calculee('[0].debitCalcule', '12,5'), 'débit calculé : 2,5 L en 12 s doivent donner 12,5 L/min');
ok(calculee('.planNom', 'RDC'), 'localisation : le nom du plan manque');
ok(calculee('.Numero', '1'), "renvoi vers une autre fiche : le numéro de la cible manque");
ok(relues.some((l) => l.relu[col('Valeur')] === '-0,5'), 'un nombre négatif doit rester un nombre');
ok(relues.some((l) => l.relu[col('Valeur')].startsWith("'- fuite")), 'un texte commençant par « - » doit être neutralisé');

// ── Ce qu'Excel réinterprète, et ce qu'il relit à l'identique ───────────────
//
// Relevé sur Excel 16 en français, à l'ouverture directe d'un fichier sans
// protection. La première liste y était détruite sans avertissement ; la
// seconde relue telle quelle, ou laissée en texte.
const DETRUITS = ['2/4', '3/6', '6/9', '3-6', '10-15', '03/2024', '1/2/3', '12:30', '0123', '007', '00', '1 000',
  '123456789012345678', '50%', '50 %', '1e5', '12E3', '1 1/2', ',5', '- fuite', '=1+1', '+33 6 12 34 56 78', '@bureau'];
const INTACTS = ['1998', '12,5', '-5', '0', '0,5', '6', '2026-10-05', '05/10/2026', 'R40', 'DN 15', '<3', '>9',
  '8h30', '12 m3', '2-3 fois', '12-14 rue X', 'Oui', '2/4 | 6/9'];
const sondes = Object.fromEntries([...DETRUITS, ...INTACTS].map((t, i) => ['sonde' + i, t]));
const lues = lireCsv(csvAudit({ Id: 'sondes', Qus: sondes }).texte).slice(1).map((r) => r[COLONNES_CSV.indexOf('Valeur')]);
const mal = [...DETRUITS, ...INTACTS].filter((t, i) => lues[i] !== (DETRUITS.includes(t) ? "'" + t : t));
ok(mal.length === 0, `protection contre la réinterprétation d'Excel : ${mal.length} cas mal traités`, mal.join(' ¦ '));
// Un nombre du JSON n'est jamais protégé : c'est un nombre.
ok(lireCsv(csvAudit({ Id: 'n', Qus: { n: -12.5, z: 0 } }).texte).slice(1).map((r) => r[8]).join(' ') === '-12,5 0', 'un nombre du JSON reste un nombre');
console.log(`  ${'protection contre Excel'.padEnd(44)} ${String(DETRUITS.length).padStart(5)} textes protégés, ${INTACTS.length} laissés tels quels`);

// ── Le formulaire évolue : rien ne doit disparaître ────────────────────────
controler('schéma vide (tout est inconnu)', audit, []);
controler('schéma sans les WC ni les robinets', audit, AUDIT_SCHEMA.filter((d) => d.key !== 'wc' && d.key !== 'robinets'));
controler(
  'un champ sur deux retiré de chaque fiche',
  audit,
  AUDIT_SCHEMA.map((d) => ({ ...d, fields: d.fields.filter((_, i) => i % 2 === 0) }))
);
controler('audit vide', { Id: 'audit-vide' }, AUDIT_SCHEMA);
// Fichier d'avant les identifiants et le passage du compteur général en liste.
controler(
  'ancien fichier, compteur général en objet',
  { Id: 'audit-ancien', Adresse: '<p>3 place du <b>Marché</b></p>', Qte: { releve_compteur_general: { Emplacement: 'Local compteur', Type: 'Inconnu' } } },
  AUDIT_SCHEMA
);

// ── Encodage ───────────────────────────────────────────────────────────────
const octets = (t) => [...encoderCp1252(t).octets];
const memes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
ok(memes(octets('é€œ…’—«»'), [0xe9, 0x80, 0x9c, 0x85, 0x92, 0x97, 0xab, 0xbb]), 'cp-1252 : plage haute', octets('é€œ…’—«»'));
ok(memes(octets('é'), [0xe9]), 'cp-1252 : un « é » décomposé doit être recomposé', octets('é'));
ok(memes(octets('a b‑c'), [0x61, 0xa0, 0x62, 0x2d, 0x63]), 'cp-1252 : espace fine et trait d’union insécables', octets('a b‑c'));
const inconnu = encoderCp1252('ok \u{1F600} 中');
ok(memes([...inconnu.octets], [0x6f, 0x6b, 0x20, 0x3f, 0x20, 0x3f]) && inconnu.remplaces.length === 2, 'cp-1252 : un caractère inconnu devient « ? » et est signalé', inconnu.remplaces);

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout le JSON se retrouve dans le CSV, quel que soit l'état du schéma.");
process.exit(echecs ? 1 : 0);
