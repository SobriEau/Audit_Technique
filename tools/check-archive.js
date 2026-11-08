/**
 * Contrôle de l'archive, de bout en bout, dans un vrai navigateur.
 *
 * Trois choses doivent tomber juste **ensemble**, et chacune peut être exacte
 * séparément : le chemin que l'audit enregistre, l'arborescence que l'archive
 * produit, et la résolution de ce chemin par le navigateur une fois l'archive
 * dépliée. `check-zip.js` éprouve l'écrivain ; celui-ci éprouve la chaîne.
 *
 * Il pose un audit et une image dans le stockage de la page elle-même — même
 * origine, donc le même IndexedDB —, clique le bouton d'export, récupère le
 * fichier téléchargé, le déplie, et exige que la photo s'y trouve **au chemin
 * que le JSON annonce**. L'audit porte exprès un chemin périmé, pour vérifier
 * que l'archive le réécrit.
 *
 * Le pilotage passe par le protocole DevTools : c'est le seul moyen
 * d'autoriser un téléchargement en mode sans fenêtre (`--dump-dom` n'en fait
 * aucun, silencieusement).
 *
 *   node --experimental-websocket tools/check-archive.js [chemin.html]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const CIBLE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const RACINE = path.dirname(CIBLE);

const CANDIDATS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
];

function trouverChrome() {
  const explicite = process.env.CHROME_PATH;
  if (explicite && fs.existsSync(explicite)) return explicite;
  const t = CANDIDATS.find((p) => fs.existsSync(p));
  if (!t) {
    console.error('Chrome est introuvable. Indiquez son chemin dans CHROME_PATH.');
    process.exit(2);
  }
  return t;
}

if (typeof globalThis.WebSocket !== 'function') {
  console.error(
    'Ce contrôle a besoin d’un client WebSocket :\n' +
      '  node --experimental-websocket tools/check-archive.js\n' +
      '(ou `npm run check:archive`, qui pose le drapeau).'
  );
  process.exit(2);
}

let echecs = 0;
const ok = (cond, message, detail) => {
  if (cond) return;
  echecs++;
  console.log('  ✗ ' + message + (detail === undefined ? '' : '\n      ' + String(detail).slice(0, 600)));
};

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// ── L'audit posé dans le stockage ──────────────────────────────────────────

const AUDIT_ID = 'arch-1';
/** Dossier que `dossierAudit('École de l’archive', 'arch-1')` doit composer. */
const DOSSIER = 'ecole-de-l-archive-arch-1';
const PHOTO = 'photo-de-test.jpg';
/** Chemin **périmé** : l'archive doit le réécrire sur le dossier qu'elle crée. */
const CHEMIN_PERIME = './dossier-d-avant-le-renommage/' + PHOTO;

/** PNG de 1×1 pixel, pour que l'image soit un vrai binaire décodable. */
const IMAGE_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

const GRAINE = `(async () => {
  const audit = {
    Id: ${JSON.stringify(AUDIT_ID)},
    NomSite: "École de l’archive",
    Adresse: '1 rue du Test',
    UtilisationsEau: { robinet: true },
    Plans: [{ id: 'plan-1', name: 'RDC' }],
    Pieces: [{ Id: 'p-1', Nom: 'Sanitaires', Niveau: 'R+0', Localisation: null }],
    Qte: {
      robinets: [{
        Id: 'rob-1', Numero: '1', Piece: 'p-1', Emplacement: 'Près de la porte',
        Photos: [{ id: 'img-1', name: 'photo.jpg', path: ${JSON.stringify(CHEMIN_PERIME)} }],
      }],
    },
  };
  const fiche = {
    Id: audit.Id, Adresse: audit.Adresse, AdresseKey: '1 rue du test',
    NomProjet: null, UpdatedAt: new Date().toISOString(),
  };
  localStorage.setItem('sobrieau.index', JSON.stringify([fiche]));
  localStorage.setItem('sobrieau.current', audit.Id);
  localStorage.setItem('sobrieau.audit.' + audit.Id, JSON.stringify(audit));
  localStorage.setItem('sobrieau.photo-mode', 'fichiers');

  // L'image, dans le magasin que l'application utilise.
  const octets = Uint8Array.from(atob(${JSON.stringify(IMAGE_B64)}), (c) => c.charCodeAt(0));
  const blob = new Blob([octets], { type: 'image/png' });
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open('sobrieau-assets', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('assets')) req.result.createObjectStore('assets', { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  // Une seule transaction, et l'attente porte sur sa **validation**
  // (oncomplete) et non sur le succès de la requête : onsuccess se
  // déclenche avant que la transaction soit écrite, et le rechargement qui
  // suit l'interrompait — le plan n'arrivait jamais en base, et l'archive
  // paraissait fautive alors que c'était la graine. Un plan est posé aussi,
  // pour éprouver le sous-dossier plans/.
  await new Promise((res, rej) => {
    const t = db.transaction('assets', 'readwrite');
    const s = t.objectStore('assets');
    s.put({ id: 'img-1', name: 'photo.jpg', type: 'image/png', blob, auditId: audit.Id });
    s.put({ id: 'plan-1', name: 'RDC.png', type: 'image/png', blob, auditId: audit.Id });
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('transaction abandonnee'));
  });
  return 'graine posee, ' + octets.length + ' octets';
})()`;

const CLIQUER = `(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Exporter tout en ZIP/.test(x.textContent || ''));
  if (!b) return 'BOUTON-ABSENT';
  b.click();
  return 'clique';
})()`;

// ── Pilotage ───────────────────────────────────────────────────────────────

(async () => {
  const chrome = trouverChrome();
  // Résidus d'une exécution interrompue : le profil de Chrome est volumineux,
  // et un dossier oublié dans le dépôt se voit dans `git status`.
  for (const n of fs.readdirSync(RACINE)) {
    if (n.startsWith('.sobrieau-archive-')) fs.rmSync(path.join(RACINE, n), { recursive: true, force: true });
  }
  const profil = fs.mkdtempSync(path.join(RACINE, '.sobrieau-archive-profil-'));
  const dl = fs.mkdtempSync(path.join(RACINE, '.sobrieau-archive-dl-'));
  const travail = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-archive-'));

  console.log("\nCONTRÔLE DE L'ARCHIVE — la chaîne entière, dans le navigateur\n");

  // `detached` place Chrome dans son propre groupe de processus : il en lance
  // plusieurs (zygote, GPU, rendu), et tuer le seul processus père en laisse
  // qui gardent le profil ouvert — le dossier résistait alors à la suppression.
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${profil}`,
    '--remote-debugging-port=0', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'], detached: true });

  /**
   * Chrome écrit encore dans son profil au moment où il est tué : retirer le
   * dossier aussitôt échoue en `ENOTEMPTY`. On lui laisse le temps, et on
   * réessaie — un dossier oublié dans le dépôt serait pire qu'une seconde
   * d'attente.
   */
  const nettoyer = async () => {
    // Tout le groupe, puis on attend sa sortie : retirer le dossier pendant que
    // Chrome y écrit encore échoue en `ENOTEMPTY`.
    try { process.kill(-proc.pid, 'SIGKILL'); } catch { /* déjà mort */ }
    try { proc.kill('SIGKILL'); } catch { /* idem */ }
    await Promise.race([new Promise((r) => proc.once('exit', r)), attendre(3000)]);
    for (const d of [profil, dl, travail]) {
      for (let i = 0; i < 30; i++) {
        try {
          fs.rmSync(d, { recursive: true, force: true });
          break;
        } catch {
          await attendre(300);
        }
      }
    }
  };

  try {
    // Point d'entrée DevTools
    let entree = null;
    for (let i = 0; i < 80 && !entree; i++) {
      const f = path.join(profil, 'DevToolsActivePort');
      if (fs.existsSync(f)) {
        const l = fs.readFileSync(f, 'utf8').split('\n');
        if (l[0] && l[1]) entree = { port: Number(l[0]), chemin: l[1].trim() };
      }
      if (!entree) await attendre(250);
    }
    if (!entree) throw new Error('DevTools ne répond pas');

    const ws = new WebSocket(`ws://127.0.0.1:${entree.port}${entree.chemin}`);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WebSocket refusée')); });

    let id = 0;
    const attentes = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && attentes.has(m.id)) { attentes.get(m.id)(m); attentes.delete(m.id); }
    };
    const envoyer = (method, params = {}, sessionId) =>
      new Promise((res) => {
        const n = ++id;
        attentes.set(n, res);
        ws.send(JSON.stringify(sessionId ? { id: n, method, params, sessionId } : { id: n, method, params }));
      });

    await envoyer('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl, eventsEnabled: true });

    const url = 'file://' + CIBLE.replace(/\\/g, '/') + '#/accueil';
    const cible = await envoyer('Target.createTarget', { url });
    const attache = await envoyer('Target.attachToTarget', { targetId: cible.result.targetId, flatten: true });
    const session = attache.result.sessionId;

    const evaluer = async (expression, attendrePromesse = false) => {
      const r = await envoyer(
        'Runtime.evaluate',
        { expression, awaitPromise: attendrePromesse, returnByValue: true },
        session
      );
      if (r.error) throw new Error('Runtime.evaluate : ' + r.error.message);
      const res = r.result?.result;
      if (r.result?.exceptionDetails) {
        throw new Error('page : ' + (res?.description || r.result.exceptionDetails.text));
      }
      return res?.value;
    };

    // L'application démarre
    let pret = false;
    for (let i = 0; i < 60 && !pret; i++) {
      await attendre(500);
      pret = await evaluer("!!document.querySelector('app-root') && document.body.textContent.includes('Vos audits')").catch(() => false);
    }
    ok(pret, "l'application ne s'est pas rendue");
    if (!pret) throw new Error('application non rendue');

    // La graine, dans le stockage de la page elle-même
    const graine = await evaluer(GRAINE, true);
    ok(/graine posee/.test(String(graine)), "la graine n'a pas été posée", graine);

    // Rechargement **effectif** : `Page.navigate` vers la même URL ne ferait
    // que changer de fragment, et l'écran garderait la liste d'audits rendue
    // avant la graine — l'archive, elle, relit le registre à chaque fois.
    await envoyer('Page.reload', { ignoreCache: false }, session);
    await attendre(1500);
    // L'accueil liste un audit par son nom de projet, ou son adresse à défaut —
    // et non par son nom de site (voir `AccueilComponent.libelle`).
    let charge = false;
    for (let i = 0; i < 60 && !charge; i++) {
      await attendre(500);
      charge = await evaluer("document.body.textContent.includes('1 rue du Test')").catch(() => false);
    }
    ok(charge, "l'audit posé n'apparaît pas sur l'accueil");

    // Témoin : ce que le magasin contient réellement après le rechargement.
    const enBase = await evaluer(`(async () => {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('sobrieau-assets', 1);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      const cles = await new Promise((res, rej) => {
        const r = db.transaction('assets', 'readonly').objectStore('assets').getAll();
        r.onsuccess = () => res(r.result.map((a) => a.id + ':' + (a.blob ? a.blob.size : 'SANS-BLOB')));
        r.onerror = () => rej(r.error);
      });
      return cles.join(' ');
    })()`, true);
    console.log(`  ${'images en base après rechargement'.padEnd(44)} ${enBase || '(aucune)'}`);

    const clic = await evaluer(CLIQUER);
    ok(clic === 'clique', "le bouton « Exporter tout en ZIP » est introuvable", clic);

    // Le fichier arrive
    let archive = null;
    for (let i = 0; i < 80 && !archive; i++) {
      await attendre(500);
      const f = fs.readdirSync(dl).filter((n) => n.endsWith('.zip'));
      if (f.length) {
        const p = path.join(dl, f[0]);
        // Un téléchargement en cours porte un suffixe .crdownload ; une taille
        // stable deux fois de suite suffit à savoir qu'il est fini.
        const a = fs.statSync(p).size;
        await attendre(400);
        if (a > 0 && fs.statSync(p).size === a) archive = p;
      }
    }
    ok(!!archive, "aucune archive n'a été téléchargée", fs.readdirSync(dl).join(', '));
    if (!archive) throw new Error('pas d’archive');

    console.log(`  ${'archive téléchargée'.padEnd(44)} ${String(Math.round(fs.statSync(archive).size / 1024)).padStart(5)} Ko`);

    // Le compte rendu affiché par la page : c'est lui qui dit combien d'images
    // ont été trouvées, et combien manquaient. Une image absente de l'archive
    // sans ce compte rendu laisserait chercher longtemps.
    const compte = await evaluer(
      "(document.querySelector('.rapport-archive') || {}).textContent || 'SANS-RAPPORT'"
    );
    console.log(`  ${'compte rendu de la page'.padEnd(44)} ${String(compte).replace(/\s+/g, ' ').trim().slice(0, 150)}`);
    ok(!/manquante/.test(String(compte)), 'la page ne doit signaler aucune image manquante', compte);

    // ── Relecture par unzip ───────────────────────────────────────────────
    try {
      execFileSync('unzip', ['-t', archive], { stdio: 'ignore' });
    } catch {
      ok(false, 'unzip refuse l’archive produite par la page');
    }
    execFileSync('unzip', ['-q', '-o', archive, '-d', travail], { stdio: 'ignore' });

    const liste = [];
    const parcourir = (d, prefixe) => {
      for (const n of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, n.name);
        if (n.isDirectory()) parcourir(p, prefixe + n.name + '/');
        else liste.push(prefixe + n.name);
      }
    };
    parcourir(travail, '');
    liste.sort();

    ok(liste.includes('index.html'), "l'application doit être à la racine de l'archive", liste.join(', '));
    ok(liste.includes('LISEZ-MOI.txt'), 'la notice doit être à la racine');
    const html = fs.existsSync(path.join(travail, 'index.html'))
      ? fs.readFileSync(path.join(travail, 'index.html'), 'utf8')
      : '';
    ok(html.length > 1_000_000, "l'index.html de l'archive doit être le fichier autonome complet", `${html.length} caractères`);
    ok(/<app-root/.test(html), "l'index.html de l'archive doit porter <app-root>");

    ok(liste.includes(`${DOSSIER}/audit.json`), `le dossier « ${DOSSIER} » doit porter audit.json`, liste.join(', '));
    ok(liste.includes(`${DOSSIER}/${PHOTO}`), `la photo doit être à « ${DOSSIER}/${PHOTO} »`, liste.join(', '));
    ok(
      liste.some((n) => n.startsWith(`${DOSSIER}/plans/`)),
      'les plans doivent avoir leur sous-dossier',
      liste.join(', ')
    );

    // ── Le lien relatif tombe-t-il juste ? ────────────────────────────────
    const json = JSON.parse(fs.readFileSync(path.join(travail, DOSSIER, 'audit.json'), 'utf8'));
    const ref = json?.Qte?.robinets?.[0]?.Photos?.[0];
    ok(!!ref, "la photo doit figurer dans l'audit.json de l'archive");
    ok(
      ref && ref.path === `./${DOSSIER}/${PHOTO}`,
      "le chemin du JSON doit être réécrit sur le dossier réellement créé",
      ref && ref.path
    );
    // Et ce chemin, résolu depuis la racine de l'archive, désigne un fichier.
    const vise = ref ? path.join(travail, ref.path.replace(/^\.\//, '')) : '';
    ok(!!vise && fs.existsSync(vise), 'le chemin annoncé par le JSON doit désigner un fichier existant', ref && ref.path);
    ok(
      !!vise && fs.existsSync(vise) && fs.readFileSync(vise).length === Buffer.from(IMAGE_B64, 'base64').length,
      "l'image doit revenir octet pour octet"
    );
    ok(!!json.__assets && !!json.__assets['img-1'], "l'audit.json doit embarquer l'image en base64 (case cochée par défaut)");

    console.log(
      `  ${'lien relatif vérifié'.padEnd(44)} ${(ref && ref.path) || '—'}\n` +
        `  ${'arborescence'.padEnd(44)} ${liste.length} fichiers` + (echecs ? '   ✗' : '')
    );
  } catch (e) {
    ok(false, 'contrôle interrompu', e.message);
  } finally {
    await nettoyer();
  }

  console.log(
    echecs
      ? `\n${echecs} échec(s).`
      : "\nL'archive s'ouvre, et la photo s'y trouve au chemin que le JSON annonce."
  );
  process.exit(echecs ? 1 : 0);
})();
