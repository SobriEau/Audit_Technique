/**
 * Contrôle de la réunion de deux audits : rien ne se perd, rien ne se double.
 *
 * Deux auditeurs se répartissent les pièces d'un grand bâtiment, chacun
 * remplit sa part hors connexion, et l'un intègre le fichier de l'autre. Une
 * erreur ici ne se voit pas : un relevé écrasé ne laisse aucune trace, et
 * personne ne refera la visite pour s'en apercevoir. D'où ce contrôle.
 *
 * Il compile `fusion.ts` tel que l'application l'embarque, joue le scénario de
 * terrain — une base préparée en commun, deux apports distincts, une fiche
 * remplie des deux côtés — puis vérifie, par son propre parcours du JSON :
 *
 *  - que **chaque réponse des deux fichiers** se retrouve dans le résultat,
 *    sauf celles qu'un conflit déclaré met de côté ;
 *  - que la base commune n'est **pas recopiée** : plans, pièces et fiches
 *    reconnus à leur identité ;
 *  - que les identités restent **uniques**, et que celles de l'audit d'accueil
 *    ne changent jamais ;
 *  - que les numéros ne se **télescopent** pas d'une liste à l'autre ;
 *  - que les images changent d'identifiant **seulement** en cas de collision,
 *    et que les références suivent ;
 *  - que la fonction est **pure**, et l'opération **idempotente** : intégrer
 *    deux fois le même fichier n'ajoute rien la seconde fois.
 *
 *   node tools/check-fusion.js
 */
const { compiler } = require('./lib/compiler');

const ts = compiler(['src/app/core/utils/fusion.ts']);
const { AUDIT_SCHEMA } = ts.charger('app/models/audit-schema.js');
const { fusionner, egal, rapportVide, totalElements } = ts.charger('app/core/utils/fusion.js');
ts.nettoyer();

let echecs = 0;
const ok = (cond, message, detail) => {
  if (cond) return;
  echecs++;
  console.log('  ✗ ' + message + (detail === undefined ? '' : '\n      ' + String(detail).slice(0, 600)));
};

const clone = (v) => JSON.parse(JSON.stringify(v));

// ── Parcours indépendant du JSON ───────────────────────────────────────────

const acces = (k) => (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) ? '.' + k : '[' + k + ']');
const simple = (v) => v === null || typeof v !== 'object';
const vide = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/** Feuilles du JSON : chemin → valeur, indépendamment de l'ordre des tableaux. */
function feuilles(v, chemin, out) {
  if (vide(v)) return out;
  if (simple(v)) return out.set(chemin, v), out;
  if (Array.isArray(v)) {
    v.forEach((x, i) => feuilles(x, `${chemin}[${i}]`, out));
    return out;
  }
  for (const [k, x] of Object.entries(v)) feuilles(x, chemin ? chemin + acces(k) : k, out);
  return out;
}

/** Toutes les valeurs d'un audit, par valeur et non par chemin : un élément peut changer de rang. */
function valeurs(audit) {
  const out = [];
  for (const [chemin, v] of feuilles(audit, '', new Map())) out.push({ chemin, v });
  return out;
}

// ── Le scénario de terrain ─────────────────────────────────────────────────

/** L'audit préparé en commun, avant que les deux auditeurs se séparent. */
function base() {
  return {
    Id: 'audit-1',
    NomSite: 'Groupe scolaire Jean Moulin',
    Adresse: '12 rue des Lilas, Créteil',
    UtilisationsEau: { wc: true, robinet: true },
    Documents: { 'doc-08': { coche: true } },
    Plans: [
      { id: 'plan-1', name: 'RDC' },
      { id: 'plan-2', name: 'R+1' },
    ],
    Batiments: [
      { Id: 'b-1', Nom: 'Bâtiment A — primaire', AnneeConstruction: '1998' },
      { Id: 'b-2', Nom: 'Bâtiment B — gymnase', AnneeConstruction: '2004' },
    ],
    Pieces: [
      { Id: 'p-1', Nom: 'Sanitaires RDC', Niveau: 'R+0', Batiment: 'b-1', Localisation: { planId: 'plan-1', x: 0.2, y: 0.3 } },
      { Id: 'p-2', Nom: 'Cuisine', Niveau: 'R+0', Batiment: 'b-1', Localisation: null },
      { Id: 'p-3', Nom: 'Sanitaires R+1', Niveau: 'R+1', Batiment: 'b-2', Localisation: { planId: 'plan-2', x: 0.5, y: 0.5 } },
    ],
    Qte: {
      TableauDeBord: { AnneeConstruction: '1998' },
      // Deux fiches créées à la préparation, vides, à remplir sur place.
      robinets: [
        // Photo prise à la préparation : les deux auditeurs l'ont donc tous deux.
        { Id: 'r-base', Numero: '1', Piece: 'p-1', Photos: [{ id: 'img-base', name: 'base.jpg' }] },
        { Id: 'r-vide', Numero: '2', Piece: 'p-2', Photos: [] },
      ],
      wc: [],
      releve_compteur_general: [{ Id: 'c-1', Numero: '1', Emplacement: 'Local technique', Photos: [] }],
    },
  };
}

/** Ce que l'auditeur A a relevé : les pièces du rez-de-chaussée. */
function local() {
  const d = base();
  d.Effectif = '320 élèves';
  d.Qte.robinets[0].TemperatureMaxEcs = 60;
  d.Qte.robinets[0].Photos.push({ id: 'img-a1', name: 'robinet1.jpg' });
  d.Qte.robinets.push({
    Id: 'r-a1',
    Numero: '3',
    Piece: 'p-1',
    TemperatureMaxEcs: 58,
    Photos: [{ id: 'img-a2', name: 'r3.jpg' }],
  });
  d.Qte.wc.push({ Id: 'w-a1', Numero: '1', Piece: 'p-1', Photos: [] });
  return d;
}

/** Ce que l'auditeur B a relevé : l'étage, et un passage au rez-de-chaussée. */
function recu() {
  const d = base();
  d.Accompagnant = 'Marie Durand - responsable technique';
  d.Effectif = '300 élèves environ';
  d.UtilisationsEau.douche = true;
  d.Documents['doc-12'] = { coche: true };

  // Fiche que B a remplie et que A a laissée vide : complément, pas conflit.
  d.Qte.robinets[1].NombreDEquipementsIdentiques = 3;
  d.Qte.robinets[1].Photos = [{ id: 'img-b0', name: 'r2.jpg' }];
  // Même fiche, même champ, deux relevés différents : conflit.
  d.Qte.robinets[0].TemperatureMaxEcs = 55;
  d.Qte.robinets[0].Photos.push({ id: 'img-b-extra', name: 'rbase-bis.jpg' });
  // Les numéros de B repartent de 1 : ils doivent se ranger à la suite de A.
  d.Qte.robinets.push({
    Id: 'r-b1',
    Numero: '3',
    Piece: 'p-3',
    TemperatureMaxEcs: 52,
    Photos: [{ id: 'img-b1', name: 'rb1.jpg' }],
  });
  d.Qte.robinets.push({ Id: 'r-b2', Numero: '4', Piece: 'p-4', TemperatureMaxEcs: 51, Photos: [] });
  d.Qte.wc.push({ Id: 'w-b1', Numero: '1', Piece: 'p-3', Photos: [] });

  // Un bâtiment, une pièce et un plan découverts sur place.
  d.Batiments.push({ Id: 'b-3', Nom: 'Bâtiment C — préfabriqué', AnneeConstruction: '2019' });
  d.Pieces.push({ Id: 'p-4', Nom: 'Local ménage', Niveau: 'R+1', Batiment: 'b-3', Localisation: { planId: 'plan-2', x: 0.1, y: 0.9 } });
  d.Plans.push({ id: 'plan-3', name: 'Sous-sol' });

  d.__assets = {
    'img-base': { name: 'base.jpg', data: 'data:image/jpeg;base64,ZZZZ' },
    'img-b0': { name: 'r2.jpg', data: 'data:image/jpeg;base64,BBBB' },
    'img-b1': { name: 'rb1.jpg', data: 'data:image/jpeg;base64,CCCC' },
    'img-b-extra': { name: 'rbase-bis.jpg', data: 'data:image/jpeg;base64,DDDD' },
    'plan-1': { name: 'RDC', data: 'data:image/png;base64,PPPP' },
    'plan-2': { name: 'R+1', data: 'data:image/png;base64,QQQQ' },
    'plan-3': { name: 'Sous-sol', data: 'data:image/png;base64,RRRR' },
  };
  return d;
}

console.log('\nCONTRÔLE DE LA RÉUNION DE DEUX AUDITS\n');

const A = local();
const B = recu();
const avantA = JSON.stringify(A);
const avantB = JSON.stringify(B);

// Les images déjà en base sur ce poste : les plans préparés, la photo de la
// préparation, et celles que A a prises.
const pris = new Set(['img-base', 'img-a1', 'img-a2', 'plan-1', 'plan-2']);
const { data: fusion, rapport } = fusionner(A, B, { schema: AUDIT_SCHEMA, assetsPris: pris });

// ── Pureté ─────────────────────────────────────────────────────────────────
ok(JSON.stringify(A) === avantA, "l'audit d'accueil a été modifié par le calcul");
ok(JSON.stringify(B) === avantB, 'le fichier reçu a été modifié par le calcul');

// ── Rien ne se perd ────────────────────────────────────────────────────────
//
// Chaque valeur des deux fichiers doit se retrouver dans le résultat. On
// compare par valeur et non par chemin : un élément change de rang, et un
// numéro est refait exprès.
const presentes = new Set(valeurs(fusion).map(({ v }) => JSON.stringify(v)));
const cheminsFusion = new Set(valeurs(fusion).map(({ chemin }) => chemin));

/**
 * Trois sortes de valeurs n'ont pas à se retrouver telles quelles, et chacune
 * doit être **annoncée** par le rapport — c'est la contrepartie :
 *  - un numéro, refait pour ranger les reçus à la suite (`renumerotes`) ;
 *  - l'identité d'un doublon, neuve par construction (`dupliques`) ;
 *  - un identifiant d'image renuméroté pour cause de collision (`assets`).
 * Une valeur de champ gardée côté accueil doit, elle, figurer en `divergences`.
 */
const renumerotees = new Set(rapport.assets.filter((a) => a.source !== a.cible).map((a) => a.source));
const divergentes = new Set(rapport.divergences.map((d) => d.recu));
const perdues = [];
for (const source of [
  { nom: "audit d'accueil", audit: A },
  { nom: 'fichier reçu', audit: B },
]) {
  for (const { chemin, v } of valeurs(source.audit)) {
    if (/^__assets/.test(chemin)) continue;
    if (/\.Numero$/.test(chemin)) continue;
    if (/^(Id|AdresseKey)$/.test(chemin)) continue;
    if (/\.Id$/.test(chemin) && source.nom === 'fichier reçu') continue;
    if (renumerotees.has(v)) continue;
    if (divergentes.has(String(v))) continue;
    if (!presentes.has(JSON.stringify(v))) perdues.push(`${source.nom} : ${chemin} = ${JSON.stringify(v)}`);
  }
}
ok(perdues.length === 0, `${perdues.length} valeur(s) perdues à la réunion`, perdues.join('\n      '));

// ── La base commune n'est pas recopiée ─────────────────────────────────────
ok(fusion.Plans.length === 3, `plans : 3 attendus, ${fusion.Plans.length} obtenus`, fusion.Plans.map((p) => p.name).join(', '));
ok(rapport.plansDeja === 2, `plans déjà présents : 2 attendus, ${rapport.plansDeja}`);
ok(fusion.Pieces.length === 4, `pièces : 4 attendues, ${fusion.Pieces.length}`, fusion.Pieces.map((p) => p.Nom).join(', '));
ok(rapport.piecesDeja === 3, `pièces déjà présentes : 3 attendues, ${rapport.piecesDeja}`);
// Les bâtiments suivent la même règle : reconnus à leur identité, repris sinon.
ok(fusion.Batiments.length === 3, `bâtiments : 3 attendus, ${fusion.Batiments.length}`, fusion.Batiments.map((b) => b.Nom).join(', '));
ok(rapport.batimentsDeja === 2, `bâtiments déjà présents : 2 attendus, ${rapport.batimentsDeja}`);
ok(
  rapport.batimentsAjoutes.length === 1 && /préfabriqué/.test(rapport.batimentsAjoutes[0]),
  'bâtiment ajouté',
  rapport.batimentsAjoutes.join(', ')
);
// Et la pièce reprise garde son rattachement au bâtiment repris avec elle.
const menage = fusion.Pieces.find((p) => p.Nom === 'Local ménage');
ok(menage && menage.Batiment === 'b-3', 'la pièce reprise doit rester rattachée à son bâtiment', menage && menage.Batiment);
ok(rapport.piecesAjoutees.length === 1 && rapport.piecesAjoutees[0] === 'Local ménage', 'pièce ajoutée');

// robinets : 2 de la base + 1 de A + 2 de B + 1 doublon = 6
ok(fusion.Qte.robinets.length === 6, `robinets : 6 attendus, ${fusion.Qte.robinets.length}`);
ok(fusion.Qte.wc.length === 2, `WC : 2 attendus, ${fusion.Qte.wc.length}`);
ok(
  fusion.Qte.releve_compteur_general.length === 1,
  `compteur général : 1 attendu, ${fusion.Qte.releve_compteur_general.length} — la fiche partagée a été recopiée`
);

const apportRobinets = rapport.entites.find((e) => e.entite === 'robinets');
ok(!!apportRobinets, 'robinets : aucun apport rapporté');
ok(apportRobinets.ajoutes === 2, `robinets ajoutés : 2 attendus, ${apportRobinets.ajoutes}`);
ok(apportRobinets.completes === 1, `robinets complétés : 1 attendu, ${apportRobinets.completes}`);
ok(apportRobinets.dupliques === 1, `robinets dupliqués : 1 attendu, ${apportRobinets.dupliques}`);

// ── Complément : la fiche que A avait laissée vide est remplie, pas doublée ─
const complete = fusion.Qte.robinets.find((r) => r.Id === 'r-vide');
ok(
  complete && complete.NombreDEquipementsIdentiques === 3,
  'la fiche laissée vide doit recevoir la réponse du collègue'
);
ok(complete && (complete.Photos || []).length === 1, 'la photo du collègue doit rejoindre la fiche complétée');

// ── Conflit : les deux versions coexistent, l'accueil n'est pas touché ─────
const accueil = fusion.Qte.robinets.find((r) => r.Id === 'r-base');
ok(accueil && accueil.TemperatureMaxEcs === 60, "la fiche d'accueil ne doit pas être écrasée par la version reçue");
ok(accueil && accueil.Photos.length === 2, "les photos de la fiche d'accueil doivent rester telles quelles");
const doublon = fusion.Qte.robinets.find((r) => r.TemperatureMaxEcs === 55);
ok(!!doublon, 'la version reçue de la fiche en conflit doit être ajoutée');
ok(doublon && doublon.Id !== 'r-base', 'le doublon doit avoir une identité neuve');
ok(
  rapport.conflitsFiches.length === 1 && rapport.conflitsFiches[0].champs.length === 1,
  'le conflit doit être rapporté avec le champ en cause',
  JSON.stringify(rapport.conflitsFiches)
);
ok(
  rapport.conflitsFiches[0] && /Temp.rature/i.test(rapport.conflitsFiches[0].champs[0]),
  "le champ en conflit doit être nommé comme à l'écran, et non par sa clé",
  rapport.conflitsFiches[0] && rapport.conflitsFiches[0].champs.join(', ')
);

// ── Identités et numéros ───────────────────────────────────────────────────
for (const [cle, liste] of Object.entries(fusion.Qte)) {
  if (!Array.isArray(liste)) continue;
  const ids = liste.map((e) => e.Id);
  ok(new Set(ids).size === ids.length, `${cle} : identités en double`, ids.join(', '));
  const numeros = liste.map((e) => String(e.Numero));
  ok(new Set(numeros).size === numeros.length, `${cle} : numéros en double`, numeros.join(', '));
}
// Les identités de l'audit d'accueil ne bougent jamais.
for (const id of ['r-base', 'r-vide', 'r-a1', 'w-a1', 'c-1']) {
  const trouve = Object.values(fusion.Qte).some((l) => Array.isArray(l) && l.some((e) => e.Id === id));
  ok(trouve, `l'identité ${id} de l'audit d'accueil a disparu`);
}
// Les numéros de A ne bougent pas non plus : ce sont les reçus qui se rangent.
ok(accueil.Numero === '1' && fusion.Qte.robinets.find((r) => r.Id === 'r-a1').Numero === '3', 'les numéros de l\'audit d\'accueil doivent être conservés');
ok(rapport.renumerotes.length >= 2, `renumérotations rapportées : ${rapport.renumerotes.length}`);

// ── Pièces : les renvois restent valides ───────────────────────────────────
// Aucun renvoi orphelin : ni pièce vers bâtiment, ni élément vers pièce.
const idsBatiments = new Set(fusion.Batiments.map((b) => b.Id));
const piecesOrphelines = fusion.Pieces.filter((p) => p.Batiment && !idsBatiments.has(p.Batiment));
ok(piecesOrphelines.length === 0, `${piecesOrphelines.length} pièce(s) désignent un bâtiment absent`, piecesOrphelines.map((p) => p.Nom).join(', '));

const idsPieces = new Set(fusion.Pieces.map((p) => p.Id));
const orphelins = [];
for (const liste of Object.values(fusion.Qte)) {
  if (!Array.isArray(liste)) continue;
  for (const e of liste) if (e.Piece && !idsPieces.has(e.Piece)) orphelins.push(e.Id);
}
ok(orphelins.length === 0, `${orphelins.length} élément(s) désignent une pièce absente`, orphelins.join(', '));
ok(rapport.piecesIntrouvables === 0, `pièces introuvables rapportées : ${rapport.piecesIntrouvables}`);

// ── Images : renumérotées seulement en cas de collision ────────────────────
const remap = new Map(rapport.assets.map((a) => [a.source, a.cible]));
// Un identifiant libre est conservé : c'est ce qui permet de reconnaître une
// image d'une intégration à l'autre.
ok(remap.get('img-b0') === 'img-b0', "une image dont l'identifiant est libre doit le garder");
ok(remap.get('img-b1') === 'img-b1', "une image dont l'identifiant est libre doit le garder");
ok(remap.get('plan-3') === 'plan-3', "un plan dont l'identifiant est libre doit le garder");
const plan3 = fusion.Plans.find((p) => p.name === 'Sous-sol');
ok(plan3 && plan3.id === 'plan-3', 'le plan repris doit garder sa référence');
// Les plans reconnus ne sont pas réimportés.
ok(!remap.has('plan-1') && !remap.has('plan-2'), 'un plan déjà présent ne doit pas être réimporté', [...remap.keys()].join(', '));
// Les images de l'audit d'accueil ne sont jamais réécrites.
ok(
  accueil.Photos.map((p) => p.id).join(',') === 'img-base,img-a1',
  "les images de l'audit d'accueil ont été réécrites",
  accueil.Photos.map((p) => p.id).join(',')
);
ok(rapport.imagesManquantes === 0, `images manquantes rapportées : ${rapport.imagesManquantes}`);
// Le doublon reçoit sa **propre copie** de la photo prise à la préparation :
// supprimer l'une des deux fiches ne doit pas effacer l'image de l'autre
// (voir `DataService.deleteEntity`). C'est la collision d'identifiant que la
// réunion rencontre vraiment — les autres relèvent du hasard.
ok(remap.get('img-base') && remap.get('img-base') !== 'img-base', "la photo partagée du doublon doit être recopiée sous un identifiant neuf");
ok(
  doublon.Photos.map((p) => p.id).join(',') === `${remap.get('img-base')},img-b-extra`,
  'les photos du doublon doivent pointer sur leurs copies',
  doublon.Photos.map((p) => p.id).join(',')
);

// Une punaise qui désigne un plan renuméroté doit suivre. Scénario à part :
// une collision d'identifiant de plan suppose deux tirages de `uid()`
// identiques, ce qui n'arrive pas sur le terrain — mais la réécriture, elle,
// doit être juste.
const hote = { Id: 'hote', Plans: [], Pieces: [], Qte: {} };
const venu = {
  Id: 'autre',
  Plans: [{ id: 'plan-x', name: 'Niveau -1' }],
  Pieces: [{ Id: 'px', Nom: 'Chaufferie', Localisation: { planId: 'plan-x', x: 0.5, y: 0.5 } }],
  Qte: { robinets: [{ Id: 'rx', Numero: '1', Localisation: { planId: 'plan-x', x: 0.1, y: 0.2 } }] },
  __assets: { 'plan-x': { name: 'Niveau -1', data: 'data:image/png;base64,XXXX' } },
};
const { data: avecPlan, rapport: rp } = fusionner(hote, venu, {
  schema: AUDIT_SCHEMA,
  assetsPris: new Set(['plan-x']),
});
const neuf = new Map(rp.assets.map((a) => [a.source, a.cible])).get('plan-x');
ok(neuf && neuf !== 'plan-x', "un plan en collision doit changer d'identifiant");
ok(avecPlan.Plans[0].id === neuf, 'le plan repris doit suivre son nouvel identifiant');
ok(avecPlan.Pieces[0].Localisation.planId === neuf, 'la punaise de la pièce doit suivre le plan renuméroté');
ok(avecPlan.Qte.robinets[0].Localisation.planId === neuf, "la punaise de l'élément doit suivre le plan renuméroté");

// ── Généralités, cases à cocher, documents ─────────────────────────────────
ok(fusion.Accompagnant === B.Accompagnant, "un champ vide ici doit être rempli par le fichier reçu");
ok(fusion.Effectif === '320 élèves', "un champ renseigné des deux côtés doit garder la valeur d'ici");
ok(
  rapport.divergences.some((d) => d.libelle === 'Effectif'),
  'la divergence sur un champ renseigné des deux côtés doit être rapportée'
);
ok(fusion.UtilisationsEau.douche === true, "une utilisation cochée par l'un doit valoir pour les deux");
ok(fusion.Documents['doc-12'] && fusion.Documents['doc-12'].coche === true, 'un document collecté par le collègue doit être repris');
ok(fusion.Id === 'audit-1', "l'identité de l'audit d'accueil doit être conservée");
ok(rapport.memeAudit === true, 'deux copies du même audit doivent être reconnues comme telles');

console.log(
  `  ${'scénario de terrain'.padEnd(44)} ${String(totalElements(rapport)).padStart(5)} points d'eau repris, ` +
    `${rapport.piecesAjoutees.length} pièce(s), ${rapport.plansAjoutes.length} plan(s)` +
    (echecs ? '   ✗' : '')
);

// ── Idempotence : intégrer deux fois n'ajoute rien ─────────────────────────
//
// L'auditeur peut se tromper de fichier, ou recommencer après une coupure. La
// seconde passe doit être blanche, sinon chaque hésitation double l'audit.
const avecImages = clone(fusion);
const { data: deuxFois, rapport: r2 } = fusionner(avecImages, B, {
  schema: AUDIT_SCHEMA,
  // Les images reprises à la première passe sont désormais en base.
  assetsPris: new Set([...pris, ...rapport.assets.map((a) => a.cible)]),
});
ok(deuxFois.Qte.robinets.length === 6, `seconde intégration : ${deuxFois.Qte.robinets.length} robinets au lieu de 6`);
ok(deuxFois.Pieces.length === 4, `seconde intégration : ${deuxFois.Pieces.length} pièces au lieu de 4`);
ok(deuxFois.Batiments.length === 3, `seconde intégration : ${deuxFois.Batiments.length} bâtiments au lieu de 3`);
ok(deuxFois.Plans.length === 3, `seconde intégration : ${deuxFois.Plans.length} plans au lieu de 3`);
ok(r2.entites.every((e) => e.ajoutes === 0), 'seconde intégration : des éléments ont été ajoutés');
// Le conflit persiste — la version reçue est déjà là en double, mais la fiche
// d'accueil, elle, n'a toujours pas la valeur du collègue.
ok(
  r2.entites.every((e) => e.dupliques <= 1),
  'seconde intégration : le conflit ne doit pas se multiplier'
);
console.log(`  ${'seconde intégration du même fichier'.padEnd(44)} ${String(totalElements(r2)).padStart(5)} point(s) d'eau repris${echecs ? '   ✗' : ''}`);

// ── Un fichier d'avant les identifiants et les pièces ──────────────────────
const ancien = {
  Id: 'audit-ancien',
  Adresse: '<p>3 place du <b>Marché</b></p>',
  Qte: {
    // Le compteur général était une fiche unique, en objet.
    releve_compteur_general: { Emplacement: 'Regard trottoir', Type: 'Inconnu' },
    robinets: [{ Numero: '1', Debit: 7 }],
  },
};
const { data: avecAncien, rapport: r3 } = fusionner(local(), ancien, { schema: AUDIT_SCHEMA, assetsPris: pris });
ok(Array.isArray(avecAncien.Qte.releve_compteur_general), 'un compteur général en objet doit rejoindre la liste');
ok(
  avecAncien.Qte.releve_compteur_general.length === 2,
  `compteur général : 2 attendus, ${avecAncien.Qte.releve_compteur_general.length}`
);
ok(
  avecAncien.Qte.robinets.every((r) => !!r.Id),
  "un élément reçu sans identité doit en recevoir une"
);
ok(avecAncien.Qte.robinets.length === 4, `robinets : 4 attendus, ${avecAncien.Qte.robinets.length}`);
ok(!rapportVide(r3), 'un fichier qui apporte des fiches ne doit pas être annoncé comme vide');
console.log(`  ${'fichier antérieur aux identifiants'.padEnd(44)} ${String(totalElements(r3)).padStart(5)} point(s) d'eau repris${echecs ? '   ✗' : ''}`);

// ── Un fichier qui n'apporte rien ──────────────────────────────────────────
const { rapport: r4 } = fusionner(local(), clone(local()), { schema: AUDIT_SCHEMA, assetsPris: pris });
ok(rapportVide(r4), 'intégrer son propre audit ne doit rien apporter', JSON.stringify(r4.entites));
console.log(`  ${'intégration de son propre audit'.padEnd(44)} ${'rien'.padStart(5)} à reprendre${echecs ? '   ✗' : ''}`);

// ── `egal` ignore l'ordre des clés, pas les valeurs ────────────────────────
ok(egal({ a: 1, b: 2 }, { b: 2, a: 1 }), "egal : l'ordre des clés ne fait pas une différence");
ok(egal({ a: 1 }, { a: 1, b: null }), 'egal : une clé absente vaut une clé vide');
ok(!egal({ a: 1 }, { a: 2 }), 'egal : deux valeurs différentes');
ok(!egal([1, 2], [2, 1]), "egal : l'ordre d'un tableau compte");
ok(!egal({ a: false }, { a: null }), 'egal : « Non » est une réponse, pas un vide');

console.log(echecs ? `\n${echecs} échec(s).` : '\nLa réunion de deux audits ne perd rien et ne double rien.');
process.exit(echecs ? 1 : 0);
