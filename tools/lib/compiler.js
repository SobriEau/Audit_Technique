/**
 * Compile des modules de l'application pour les exécuter hors navigateur.
 *
 * Les règles qui ne dépendent pas d'Angular — exigences, totaux, export CSV —
 * sont écrites en fonctions pures précisément pour cela : un contrôle les
 * charge telles que l'application les embarque, au lieu d'en tenir une copie
 * qui divergerait.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

/**
 * @param {string[]} entrees fichiers TypeScript, relatifs à la racine du dépôt
 * @returns {{ charger: (module: string) => any, nettoyer: () => void }}
 *   `charger('app/models/audit-schema.js')` ; `nettoyer()` efface le dossier temporaire.
 */
function compiler(entrees) {
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-ts-'));
  const nettoyer = () => fs.rmSync(sortie, { recursive: true, force: true });
  try {
    execFileSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '--outDir', sortie,
        '--module', 'commonjs',
        '--target', 'es2020',
        '--skipLibCheck',
        '--rootDir', path.join(ROOT, 'src'),
        ...entrees.map((e) => path.join(ROOT, e)),
      ],
      { stdio: 'inherit' }
    );
  } catch (e) {
    nettoyer();
    console.error('Compilation impossible — voir ci-dessus.');
    process.exit(2);
  }
  return { charger: (module) => require(path.join(sortie, module)), nettoyer };
}

module.exports = { compiler, ROOT };
