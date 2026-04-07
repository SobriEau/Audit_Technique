# Instructions Copilot - Projet sobriEau

## Architecture du projet

Ce projet est une **Single-Page Application** générée par fusion de 16 pages HTML sources.

- **Sources** : `site/` contenant 16 fichiers HTML individuels
- **Build** : `fusionner_v2.py` fusionne tout dans `index_fusionne.html`
- **⚠️ IMPORTANT** : **JAMAIS modifier `index_fusionne.html` directement** - toujours modifier dans `site/` puis régénérer

## Règles de code pour les fichiers dans `site/`

### Navigation (CRITIQUE)

Lors de la modification de fichiers HTML dans `site/`, **toujours utiliser des chemins relatifs** pour la navigation :

```javascript
// ✅ BON - ces patterns sont automatiquement transformés
location.href = './page.html';
location.href = '../home.html';
location.href = './robinet.html?idx=' + i;

// ❌ INTERDIT - ne fonctionnera pas après fusion
showPage('page-site-home-html');  // Ne JAMAIS utiliser showPage() dans les sources
window.location = '/site/home.html';  // Chemins absolus interdits
history.pushState();  // APIs d'historique non supportées
```

**Pourquoi ?** Le script `fusionner_v2.py` transforme automatiquement `location.href = './x.html'` en `showPage('page-site-x-html')`.

### Sélecteurs DOM

**Utiliser normalement `document.getElementById()`** - la transformation est automatique :

```javascript
// ✅ BON
document.getElementById('btn').addEventListener('click', handler);
document.getElementById('editor').value = text;
const el = document.getElementById('table');

// ❌ INUTILE - ne pas faire l'isolation manuellement
section?.querySelector('#btn');  // C'est fait automatiquement par fusionner_v2.py
```

Le script ajoute automatiquement l'isolation :
```javascript
// Transformé en :
((section?.querySelector('#btn')) || document.getElementById('btn'))
```

### Styles CSS (IMPORTANT)

**Écrire les styles normalement** dans le `<head>` de chaque page :

```html
<!-- ✅ BON - dans <head> -->
<style>
  body { font-family: Arial; padding: 20px; }
  .toolbar { display: flex; gap: 8px; }
  button.primary { background: #0b566b; color: #fff; }
</style>
```

Le script de fusion :
1. 📤 Extrait les `<style>` du `<head>` de chaque page
2. 🎯 Les place dans la section correspondante
3. 🔒 **Scope automatiquement** tous les sélecteurs avec `#section-id`

**Exemple de transformation** :
```css
/* Dans robinet.html (source) */
body { padding: 20px; background: #f6f9fb; }
.row { max-width: 800px; }
label { color: #0b566b; }

/* Devient dans index_fusionne.html */
#page-site-qte-robinet-html { padding: 20px; background: #f6f9fb; }
#page-site-qte-robinet-html .row { max-width: 800px; }
#page-site-qte-robinet-html label { color: #0b566b; }
```

**Pourquoi c'est important ?**
- ✅ Évite les conflits CSS entre pages
- ✅ Chaque page garde ses propres styles isolés
- ✅ Le sélecteur `body` s'applique à la section (pas au body global)
- ✅ Robinets et Robinet peuvent avoir des styles différents sans interférence

**À ne PAS faire** :
```html
<!-- ❌ MAUVAIS - styles inline excessifs -->
<div style="display:flex;gap:10px;...">  <!-- Préférer une classe CSS -->

<!-- ❌ MAUVAIS - styles globaux non scopables -->
<style>
  * { margin: 0; }  /* Trop générique, affectera tout le document */
</style>
```

### Import de Data.js

**Toujours importer Data.js** dans chaque page qui l'utilise (même si ça semble redondant) :

```html
<!-- ✅ BON - dans <head> -->
<script src="../shared/Data.js"></script>
```

Le script de fusion :
1. ✂️ Retire tous les imports de Data.js des pages
2. 📦 Inclut Data.js **une seule fois** globalement
3. ✅ La classe Data est accessible partout

### Paramètres URL (IMPORTANT pour éviter "Index invalide")

Pour passer des paramètres entre pages avec reload dynamique dans une SPA :

```javascript
// ✅ BON - Envoyer un paramètre avec persistence
localStorage.setItem('currentRobinetIdx', idx);
location.href = './robinet.html?idx=' + idx;

// ✅ BON - Créer une fonction pour recalculer l'index
function getCurrentIdx() {
  if (window.__robinetIdx !== undefined) {
    return window.__robinetIdx;  // 1. Variable globale SPA
  } else if (localStorage.getItem('currentRobinetIdx')) {
    return parseInt(localStorage.getItem('currentRobinetIdx'), 10);  // 2. LocalStorage
  } else {
    return parseInt(params.get('idx'), 10);  // 3. URL params
  }
}

// ✅ BON - Appeler getCurrentIdx() DANS load(), pas avant
function load() {
  const idx = getCurrentIdx();  // Recalculé à chaque appel de load()
  
  db.data.Qte = db.data.Qte || {};
  if (!Array.isArray(db.data.Qte[key])) db.data.Qte[key] = [];
  const arr = db.data.Qte[key];
  
  if (!Number.isInteger(idx) || idx < 0 || idx >= arr.length) {
    alert('Index invalide');
    localStorage.removeItem('currentRobinetIdx');
    location.href = './robinets.html';
    return;
  }
  
  const item = arr[idx] || {};
  // ... charger les données
}

// ✅ BON - Appeler getCurrentIdx() dans save() aussi
function save(notify = false) {
  const idx = getCurrentIdx();  // Toujours à jour
  const arr = db.data.Qte[key];
  arr[idx] = { /* ... */ };
}

// ✅ BON - Nettoyer localStorage avant de quitter
document.getElementById('back').addEventListener('click', ()=>{
  localStorage.removeItem('currentRobinetIdx');
  location.href = './robinets.html';
});
```

**Pourquoi getCurrentIdx() comme fonction ?**
1. **Recalcul à chaque appel** : `idx` n'est pas figé au chargement du script
2. **MutationObserver** : `load()` est rappelé quand la page redevient visible
3. **Navigation SPA** : Cliquer sur robinet A puis robinet B appelle `load()` deux fois avec des index différents
4. **Actualisation** : localStorage garantit que l'index survit à F5

**⚠️ ERREUR CLASSIQUE - Ne JAMAIS faire :**
```javascript
// ❌ MAUVAIS - idx défini une seule fois
const params = new URLSearchParams(location.search);
const idx = parseInt(params.get('idx'), 10);  // Calculé UNE FOIS

function load() {
  // idx garde toujours la même valeur !
  const item = arr[idx];  // Toujours le même robinet même après plusieurs clics
}
```

**Comment ça marche après transformation :**
1. Clic sur "Modifier" robinet 3 : `(window.__robinetIdx = 3, showPage('...'))`
2. `showPage()` met toutes les sections à `display: 'none'`, puis la cible à `'block'`
3. `MutationObserver` détecte `'none' → 'block'` et appelle `load()`
4. `load()` appelle `getCurrentIdx()` qui retourne 3 (depuis `window.__robinetIdx`)
5. Clic sur "Modifier" robinet 5 : même processus avec `window.__robinetIdx = 5`
6. `load()` est rappelé et `getCurrentIdx()` retourne maintenant 5

**La transformation automatique** dans `fusionner_v2.py` :
- `location.href = './robinet.html?idx=' + i` → `(window.__robinetIdx = i, showPage('...'))`
- Le `MutationObserver` reste actif (pas de `disconnect()`) pour rappeler `load()` à chaque affichage
- `localStorage` persiste l'index pour les actualisations

## Commandes de développement

### Régénérer l'application fusionnée

```bash
python fusionner_v2.py
```

Fusionne les 16 pages de `site/` → `index_fusionne.html` (~65 Ko).

### Workflow de modification

1. ✏️ Modifier les fichiers dans `site/` (JAMAIS index_fusionne.html)
2. 🔄 Exécuter `python fusionner_v2.py`
3. 🌐 Ouvrir `index_fusionne.html` dans le navigateur
4. 🧪 Tester navigation et fonctionnalités

## Structure des pages dans site/

```
site/
├── home.html              # Page d'accueil avec boutons QGE/QTE/QUS
├── shared/
│   └── Data.js           # Classe de persistence (localStorage + cookies)
├── qge/
│   └── index.html        # Questionnaire Général - éditeur de texte
├── qte/                  # Questionnaire Technique (12 pages)
│   ├── index.html        # Index dynamique des questionnaires techniques
│   ├── robinets.html     # Liste CRUD des robinets
│   ├── robinet.html      # Formulaire détail robinet (reçoit ?idx=N)
│   ├── wc.html
│   ├── douches_baignoires.html
│   └── ...
└── qus/
    └── index.html        # Questionnaire Usage - éditeur de texte
```

## Patterns à suivre

### Boutons retour

```javascript
// ✅ BON
document.getElementById('back').addEventListener('click', () => {
  location.href = '../home.html';  // ou './index.html'
});

// ❌ MAUVAIS
document.getElementById('back').addEventListener('click', () => {
  history.back();  // API history non supportée
});
```

### Persistence de données

Toujours utiliser la classe `Data` (pas de localStorage direct) :

```javascript
// ✅ BON
Data.set('robinets', arrayData);
const robinets = Data.get('robinets', []);

// ❌ ÉVITER (mais fonctionne)
localStorage.setItem('robinets', JSON.stringify(data));
```

### IDs HTML

Préférer des IDs uniques ou préfixés par page pour éviter les conflits :

```html
<!-- ✅ BON -->
<button id="qte-save">Enregistrer</button>
<div id="qte-container"></div>

<!-- ⚠️ Acceptable mais risqué -->
<button id="save">Enregistrer</button>  <!-- Si plusieurs pages ont #save -->
```

## Limitations et contraintes

### Ce qui NE fonctionne PAS

❌ `history.back()`, `history.pushState()` - L'historique navigateur n'est pas géré  
❌ Chemins absolus `/site/page.html` - Utiliser des chemins relatifs uniquement  
❌ `window.open()` vers pages internes - Toutes les pages sont dans le même fichier  
❌ Ancres `#section` avec scroll automatique - Les sections sont des pages distinctes  
❌ `<base href="...">` dans le head - Perturbera la résolution des chemins

### Ce qui fonctionne

✅ `location.href = './page.html'` - Transformé automatiquement  
✅ `document.getElementById()` - Sécurisé automatiquement  
✅ `Data.get()` / `Data.set()` - Persistence globale  
✅ Styles `<style>` dans chaque page - Isolés automatiquement  
✅ Scripts `<script>` dans chaque page - Encapsulés en IIFE  
✅ Paramètres URL `?key=value` - Transformés en variables globales

## Débogage

### Erreur JavaScript dans la console

1. 🔍 Noter le numéro de ligne dans `index_fusionne.html`
2. 🔎 Chercher `<section id="page-site-*">` contenant cette ligne
3. 📁 Ouvrir le fichier source correspondant dans `site/`
4. ✏️ Corriger dans le fichier source
5. 🔄 Régénérer avec `python fusionner_v2.py`

### Navigation ne fonctionne pas

- Vérifier que vous utilisez `location.href = './page.html'` (pas `showPage()`)
- Vérifier que le chemin relatif est correct (`./ ` pour même dossier, `../` pour parent)
- Ouvrir la console : les erreurs `showPage()` s'affichent si la page n'existe pas

### Bouton ne répond pas

- Vérifier que l'ID est unique dans la page
- Vérifier que `getElementById` est bien appelé (pas de typo)
- Les événements doivent être attachés après que le DOM soit chargé

## Notes pour Copilot

Lorsque tu suggères du code pour ce projet :

1. **TOUJOURS** utiliser `location.href = './page.html'` pour la navigation
2. **TOUJOURS** utiliser `document.getElementById()` normalement (pas de scope manuel)
3. **TOUJOURS** importer `Data.js` dans le `<head>` si la page utilise Data
4. **NE JAMAIS** suggérer de modifier `index_fusionne.html` directement
5. **NE JAMAIS** utiliser `showPage()` dans les fichiers sources de `site/`
6. Si l'utilisateur demande de corriger une erreur dans `index_fusionne.html`, lui rappeler de modifier le fichier source dans `site/` puis régénérer

## Exemple complet d'une nouvelle page

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle Question</title>
  <script src="../shared/Data.js"></script>
  <style>
    body { font-family: Arial; padding: 20px; }
    button { background: #0b566b; color: #fff; padding: 10px; }
  </style>
</head>
<body>
  <h1>Nouvelle Question</h1>
  <button id="back">← Retour</button>
  <button id="save">Enregistrer</button>

  <script>
    // Charger données
    const data = Data.get('nouvelle-question', { answer: '' });

    // Bouton retour
    document.getElementById('back').addEventListener('click', () => {
      location.href = './index.html';  // ✅ Chemin relatif
    });

    // Bouton save
    document.getElementById('save').addEventListener('click', () => {
      Data.set('nouvelle-question', { answer: 'valeur' });
      location.href = './index.html';
    });
  </script>
</body>
</html>
```

Puis placer ce fichier dans `site/qte/nouvelle_question.html` et exécuter `python fusionner_v2.py`.
