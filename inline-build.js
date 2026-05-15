/**
 * inline-build.js
 *
 * Lit le build Angular depuis dist/sobrieau/ et inline tous les scripts,
 * feuilles de styles, chunks workers et fichiers WASM dans un unique fichier
 * index.html autonome (offline).
 *
 * Usage : node inline-build.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Téléchargement HTTP(S) avec suivi des redirections ─────────────────────
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    function doGet(currentUrl) {
      const lib = currentUrl.startsWith('https') ? https : http;
      lib.get(currentUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          return doGet(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} pour ${currentUrl}`));
        }
        const chunks = [];
        let received = 0;
        res.on('data', (chunk) => {
          chunks.push(chunk);
          received += chunk.length;
          process.stdout.write(`\r  ${Math.round(received / 1024 / 1024)} Mo reçus...`);
        });
        res.on('end', () => {
          process.stdout.write('\n');
          resolve(Buffer.concat(chunks));
        });
        res.on('error', reject);
      }).on('error', reject);
    }
    doGet(url);
  });
}

const distDir = path.join(__dirname, 'dist', 'sobrieau');
const outputFile = path.join(__dirname, 'index.html');

if (!fs.existsSync(distDir)) {
  console.error('ERREUR : dist/sobrieau/ introuvable.');
  console.error('Lancez "ng build" ou "npm run build" avant ce script.');
  process.exit(1);
}

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERREUR : dist/sobrieau/index.html introuvable.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// ── Étape 1 : Inline les feuilles de styles (<link rel="stylesheet" href="...">) ──

html = html.replace(
  /<link rel="stylesheet" href="([^"]+)"[^>]*\/?>/gi,
  (match, href) => {
    const filePath = path.join(distDir, href);
    if (!fs.existsSync(filePath)) {
      console.warn(`Avertissement : fichier CSS introuvable : ${href}`);
      return match;
    }
    const css = fs.readFileSync(filePath, 'utf8');
    return `<style>${css}</style>`;
  }
);

// ── Étape 2 : Inline les scripts d'entrée (<script src="..." ...></script>) ──

// Mémorise les fichiers déjà inlinés via <script src> pour ne pas les retraiter
const alreadyInlined = new Set();

html = html.replace(
  /<script ([^>]*?)src="([^"]+)"([^>]*)><\/script>/gi,
  (match, before, src, after) => {
    const filePath = path.join(distDir, src);
    if (!fs.existsSync(filePath)) {
      console.warn(`Avertissement : fichier JS introuvable : ${src}`);
      return match;
    }
    const js = fs.readFileSync(filePath, 'utf8');
    alreadyInlined.add(path.basename(src));
    const attrs = (before + after).trim();
    return `<script ${attrs}>${js}</script>`;
  }
);

// ── Étape 3 : Supprimer les balises <link rel="modulepreload"> ─────────────
//
// Ces balises sont des hints de préchargement destinés au navigateur.
// Elles référencent les mêmes chunks JS déjà inlinés en <script> à l'étape 2.
// Conservées telles quelles, elles gêneraient le remplacement des Blob URLs
// (l'attribut href deviendrait une expression JS invalide).

html = html.replace(/<link rel="modulepreload"[^>]*\/?>/gi, '');

// ── Étape 4 : Inline les fichiers WASM en base64 data-URL ──────────────────
//
// esbuild émet les binaires WASM comme assets séparés et les référence
// avec leur nom haché (ex: "vosk-abc123.wasm"). On les encode en base64
// et on remplace les références dans le HTML inline.

const distEntries = fs.readdirSync(distDir).filter(
  (f) => fs.statSync(path.join(distDir, f)).isFile()
);

// ── Utilitaire : résolution des dépendances inter-chunks (avant étapes 5 et 6) ──
//
// Un blob URL n'a pas de base hiérarchique, donc `import from"./chunk.js"`
// échoue quand le chunk est chargé depuis un blob. On remplace ces imports
// par des IIFEs qui copient le code de la dépendance directement dans le blob.

const allChunksInDist = new Set(
  distEntries.filter((f) => f.endsWith('.js'))
);

function inlineChunkDeps(code) {
  return code.replace(
    /import\s*(\{[^}]*\})\s*from\s*(["'])(?:\.\/)?((?:[\w.-]+\.js))\2;?/g,
    (match, importBindings, _quote, chunkName) => {
      if (!allChunksInDist.has(chunkName)) return match;
      const chunkPath = path.join(distDir, chunkName);
      if (!fs.existsSync(chunkPath)) return match;

      const depCode = fs.readFileSync(chunkPath, 'utf8');

      // Extraire la carte d'export : nom_exporté → variable locale dans dep
      const exportMatch = depCode.match(/export\s*\{([^}]*)\}/);
      if (!exportMatch) return match;

      const exportMap = {};
      exportMatch[1].split(',').forEach((entry) => {
        const parts = entry.trim().split(/\s+as\s+/);
        if (parts.length === 2) {
          exportMap[parts[1].trim()] = parts[0].trim();
        } else {
          exportMap[parts[0].trim()] = parts[0].trim();
        }
      });

      const depCodeClean = depCode.replace(/export\s*\{[^}]*\};?/, '').trim();

      const bindingsStr = importBindings.trim().replace(/^\{|\}$/g, '');
      const bindings = bindingsStr.split(',').map((b) => {
        const parts = b.trim().split(/\s+as\s+/);
        return {
          exported: parts[0].trim(),
          local: parts.length === 2 ? parts[1].trim() : parts[0].trim(),
        };
      });

      const returnObj = bindings
        .filter((b) => exportMap[b.exported])
        .map((b) => `${b.exported}:${exportMap[b.exported]}`)
        .join(',');

      const destructure = bindings.map((b) => `${b.exported}:${b.local}`).join(',');

      console.log(`  dep inlinée : ${chunkName} (IIFE)`);
      return `const{${destructure}}=(()=>{${depCodeClean};return{${returnObj}}})();`;
    }
  );
}

const wasmFiles = distEntries.filter((f) => f.endsWith('.wasm'));
for (const wasmFile of wasmFiles) {
  const wasmPath = path.join(distDir, wasmFile);
  const wasmData = fs.readFileSync(wasmPath);
  const base64 = wasmData.toString('base64');
  const dataUrl = `data:application/wasm;base64,${base64}`;

  // Le nom peut apparaître entre guillemets simples ou doubles dans le JS inliné
  const dq = `"${wasmFile}"`;
  const sq = `'${wasmFile}'`;
  if (html.includes(dq) || html.includes(sq)) {
    html = html.split(dq).join(JSON.stringify(dataUrl));
    html = html.split(sq).join(`'${dataUrl}'`);
    console.log(
      `WASM inliné  : ${wasmFile} (${Math.round(wasmData.length / 1024)} Ko brut → ${Math.round(base64.length / 1024)} Ko base64)`
    );
  }
}

// ── Étape 5 : Inline les imports statiques de chunks ES modules ────────────
//
// Les scripts inlinés à l'étape 2 peuvent contenir des instructions
// import{...}from"./chunk-X.js" (code-splitting d'esbuild).
// Les imports statiques requièrent un littéral de chaîne — on ne peut pas
// y mettre une expression Blob URL directement.
// On les transforme en top-level await dynamic imports :
//   import{a as y,b as $}from"./chunk-X.js"
//   → const {a:y,b:$}=await import(URL.createObjectURL(new Blob([...],{...})))

function transformImportBindings(bindings) {
  // "{a as y, b as $, d as Tt}" → "{a:y, b:$, d:Tt}"
  return bindings.replace(/(\w+)\s+as\s+([\w$]+)/g, '$1:$2');
}

html = html.replace(
  /(<script[^>]*type="module"[^>]*>)([\s\S]*?)(<\/script>)/gi,
  (fullMatch, openTag, content, closeTag) => {
    const newContent = content.replace(
      /import\s*(\{[^}]*\})\s*from\s*["'](?:\.\/)?([^"']+\.js)["']/g,
      (importStmt, bindings, chunkName) => {
        const chunkPath = path.join(distDir, chunkName);
        if (!fs.existsSync(chunkPath)) {
          console.warn(`Avertissement : chunk import introuvable : ${chunkName}`);
          return importStmt;
        }
        let code = fs.readFileSync(chunkPath, 'utf8');
        // Résoudre les dépendances internes du chunk avant de créer le blob
        code = inlineChunkDeps(code);
        alreadyInlined.add(chunkName);
        const destructured = transformImportBindings(bindings.trim());
        const blobExpr = `URL.createObjectURL(new Blob([${JSON.stringify(code)}],{type:'text/javascript'}))`;    
        console.log(`Chunk inliné : ${chunkName} (import → await import)`);
        return `const ${destructured}=await import(${blobExpr})`;
      }
    );
    return openTag + newContent + closeTag;
  }
);

// ── Étape 6 : Inline les chunks workers/dynamiques en Blob URL ────────────
// (allChunksInDist et inlineChunkDeps définis plus haut)

const jsFiles = distEntries.filter(
  (f) => f.endsWith('.js') && !alreadyInlined.has(f)
);

  for (const jsFile of jsFiles) {
  // Cherche les deux formes : "chunk-X.js" et "./chunk-X.js"
  const dq    = `"${jsFile}"`;
  const sq    = `'${jsFile}'`;
  const dqRel = `"./${jsFile}"`;
  const sqRel = `'./${jsFile}'`;
  if (html.includes(dq) || html.includes(sq) || html.includes(dqRel) || html.includes(sqRel)) {
    let code = fs.readFileSync(path.join(distDir, jsFile), 'utf8');
    // Résoudre les dépendances inter-chunks avant de créer le blob
    code = inlineChunkDeps(code);

    // Si le chunk est un wrapper CommonJS lazy (export default JU()),
    // ajouter aussi les exports nommés pour que le bundle puisse les destructurer.
    if (/export default JU\(\);?\s*$/.test(code)) {
      const lastPart = code.slice(-600);
      const namedExports = new Set();
      const reExport = /\ba\.([A-Za-z][A-Za-z0-9$_]*)\s*=/g;
      let em;
      while ((em = reExport.exec(lastPart)) !== null) {
        if (em[1] !== '__esModule') namedExports.add(em[1]);
      }
      if (namedExports.size > 0) {
        const names = [...namedExports];
        const varDecls = names.map((n) => `var ${n}=__m__.${n}`).join(';');
        const exportList = names.join(',');
        code = code.replace(
          /export default JU\(\);?\s*$/,
          `var __m__=JU();export default __m__;${varDecls};export{${exportList}};`
        );
        console.log(`  exports nommés : ${exportList}`);
      }
    }

    // Patch le worker interne de vosk-browser : décoder le base64 du worker,
    // appliquer tous les correctifs nécessaires, puis ré-encoder.
    const innerWorkerMatch = code.match(/var FU=UU\("([^"]+)"/);
    if (innerWorkerMatch) {
      const b64 = innerWorkerMatch[1];
      let workerCode = Buffer.from(b64, 'base64').toString('utf8');
      let patched = false;

      // Correctif 1 : new URL(modelUrl, location.href.replace(/^blob:/, ""))
      // produit "null/UUID" invalide en contexte blob:null (file://).
      const badBase = 'location.href.replace(/^blob:/, "")';
      if (workerCode.includes(badBase)) {
        workerCode = workerCode.replace(
          badBase,
          '(location.href.startsWith("blob:") ? "https://localhost/" : location.href.replace(/^blob:/, ""))'
        );
        patched = true;
        console.log('  inner worker patché : blob:null base URL corrigé');
      }

      // Correctif 2 : modelPath = storagePath + "/" + modelUrl.replace(/[\W]/g, "_")
      // Avec une data: URI de 54 Mo, le chemin IDBFS résultant serait
      // lui-même de 72 Mo — impossible. On utilise un nom court fixe.
      const badPath = 'const modelPath = storagePath + "/" + modelUrl.replace(/[\\W]/g, "_");';
      if (workerCode.includes(badPath)) {
        workerCode = workerCode.replace(
          badPath,
          'const modelPath = storagePath + "/" + (modelUrl.startsWith("data:") ? "vosk_model_bundled" : modelUrl.replace(/[\\W]/g, "_"));'
        );
        patched = true;
        console.log('  inner worker patché : modelPath court pour data: URI');
      }

      if (patched) {
        const newB64 = Buffer.from(workerCode).toString('base64');
        code = code.replace(b64, newB64);
      }
    }

    const blobExpr = `URL.createObjectURL(new Blob([${JSON.stringify(code)}],{type:'text/javascript'}))`;
    html = html.split(dq).join(blobExpr);
    html = html.split(sq).join(blobExpr);
    html = html.split(dqRel).join(blobExpr);
    html = html.split(sqRel).join(blobExpr);
    console.log(`Chunk inliné : ${jsFile}`);
  }
}

// ── Étape 5 : Supprimer <base href="/"> pour compatibilité file:// ──────────

html = html.replace(/<base href="\/">/i, '<base href="">');

// ── Étape 8 : Bundler le modèle Vosk en base64 (offline file://) ──────────
//
// Depuis file://, l'origine est null et CORS bloque le téléchargement du
// modèle depuis alphacephei.com. On télécharge le zip au moment du build,
// on l'encode en base64 et on l'injecte dans le HTML. Un script synchrone
// crée un Blob URL (blob:null/...) avant que Angular ne démarre.
// La référence littérale de l'URL est remplacée dans le bundle inliné par
// window.__VOSK_MODEL_URL__ qui pointe vers ce Blob.

const MODEL_REMOTE_URL =
  'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip';
const MODEL_CACHE_PATH = path.join(__dirname, 'vosk-model-small-fr-0.22.zip');

async function bundleVoskModel() {
  let modelBuf;
  if (fs.existsSync(MODEL_CACHE_PATH)) {
    const sizeMo = Math.round(fs.statSync(MODEL_CACHE_PATH).size / 1024 / 1024);
    console.log(`\nModèle vosk en cache (${sizeMo} Mo) : ${MODEL_CACHE_PATH}`);
    modelBuf = fs.readFileSync(MODEL_CACHE_PATH);
  } else {
    console.log(`\nTéléchargement modèle vosk (~32 Mo)...\n  ${MODEL_REMOTE_URL}`);
    modelBuf = await downloadBuffer(MODEL_REMOTE_URL);
    fs.writeFileSync(MODEL_CACHE_PATH, modelBuf);
    console.log(`  Modèle mis en cache : ${MODEL_CACHE_PATH}`);
  }

  const base64 = modelBuf.toString('base64');
  const sizeMo = Math.round(modelBuf.length / 1024 / 1024);
  console.log(`  ${sizeMo} Mo → ${Math.round(base64.length / 1024 / 1024)} Mo base64`);

  // Script synchrone injecté au début de <body> :
  // On utilise une data: URI plutôt qu'un blob: URL car les workers blob:null
  // (origin null depuis file://) ne peuvent pas fetch() des blob: URLs créés
  // dans un autre contexte. Les data: URIs sont accessibles depuis n'importe
  // quel worker, quelle que soit l'origine.
  const modelScript =
    `<script>window.__VOSK_MODEL_URL__="data:application/zip;base64,${base64}";</script>`;

  // Remplacer la string URL littérale dans le bundle inliné
  const dqUrl = `"${MODEL_REMOTE_URL}"`;
  const sqUrl = `'${MODEL_REMOTE_URL}'`;
  if (html.includes(dqUrl)) {
    html = html.split(dqUrl).join('window.__VOSK_MODEL_URL__');
    console.log('  MODEL_URL (double-quotes) remplacé par window.__VOSK_MODEL_URL__');
  } else if (html.includes(sqUrl)) {
    html = html.split(sqUrl).join('window.__VOSK_MODEL_URL__');
    console.log('  MODEL_URL (single-quotes) remplacé par window.__VOSK_MODEL_URL__');
  } else {
    console.warn('  ATTENTION : MODEL_URL introuvable dans le bundle inliné.');
  }

  // Injecter au tout début de <body> (avant Angular)
  html = html.replace('<body>', '<body>\n' + modelScript);
}

bundleVoskModel()
  .then(() => {
    fs.writeFileSync(outputFile, html, 'utf8');
    const sizeKo = Math.round(fs.statSync(outputFile).size / 1024);
    console.log(`\nindex.html autonome créé (${sizeKo} Ko) : ${outputFile}`);
  })
  .catch((err) => {
    console.error('Erreur lors du bundling du modèle Vosk :', err.message);
    process.exit(1);
  });
