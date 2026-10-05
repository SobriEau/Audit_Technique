/**
 * Convertit en CSV un audit déjà exporté en JSON.
 *
 * Même code que le bouton « Exporter en CSV » de l'application, compilé tel
 * quel : un fichier reçu d'un auditeur donne exactement ce que son poste
 * aurait produit. Plusieurs fichiers peuvent être passés à la suite ; chacun
 * donne son CSV, à côté de lui.
 *
 *   node tools/json-to-csv.js audit.json [autre.json …]
 *
 * Séparateur « ; », encodage cp-1252. Les images embarquées (`__assets`) ne
 * sont pas reprises.
 */
const fs = require('fs');
const path = require('path');
const { compiler } = require('./lib/compiler');

const fichiers = process.argv.slice(2);
if (!fichiers.length) {
  console.error('Usage : node tools/json-to-csv.js audit.json [autre.json …]');
  process.exit(2);
}

const ts = compiler(['src/app/core/utils/csv-export.ts', 'src/app/core/utils/cp1252.ts']);
const { csvAudit } = ts.charger('app/core/utils/csv-export.js');
const { encoderCp1252 } = ts.charger('app/core/utils/cp1252.js');
ts.nettoyer();

let erreurs = 0;
for (const fichier of fichiers) {
  let audit;
  try {
    // Un JSON enregistré par un éditeur Windows peut porter une marque d'ordre des octets.
    audit = JSON.parse(fs.readFileSync(fichier, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    console.error(`✗ ${fichier} : ${e.message}`);
    erreurs++;
    continue;
  }

  const { texte, lignes } = csvAudit(audit);
  const { octets, remplaces } = encoderCp1252(texte);
  const sortie = path.join(path.dirname(fichier), path.basename(fichier, path.extname(fichier)) + '.csv');
  fs.writeFileSync(sortie, octets);

  console.log(`✓ ${sortie} — ${lignes.length} ligne(s)`);
  if (remplaces.length) {
    console.log(`  caractères absents de cp-1252, remplacés par « ? » : ${remplaces.join(' ')}`);
  }
}
process.exit(erreurs ? 1 : 0);
