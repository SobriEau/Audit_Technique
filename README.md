# sobriEau

Application web de questionnaires pour l'audit de consommation d'eau.

## Structure du projet

```
├── fusionner_v2.py          # Script de bundling HTML (fusionne 16 pages → 1 fichier)
├── index_fusionne.html      # Application single-page générée
├── site/                    # Sources HTML (16 pages)
│   ├── home.html           # Page d'accueil
│   ├── qge/index.html      # Questionnaire Général
│   ├── qte/                # Questionnaire Technique (12 pages)
│   │   ├── index.html      # Index des questionnaires techniques
│   │   ├── robinets.html   # Liste des robinets
│   │   ├── robinet.html    # Détail d'un robinet
│   │   └── ...
│   ├── qus/index.html      # Questionnaire Usage
│   └── shared/Data.js      # Classe de persistence (localStorage)
```

## Utilisation

### Générer le fichier fusionné

```bash
python fusionner_v2.py
```

Génère `index_fusionne.html` (65 Ko environ) en fusionnant toutes les pages du dossier `site/`.

### Ouvrir l'application

Ouvrir `index_fusionne.html` dans un navigateur. L'application démarre sur la page d'accueil.

## Bonnes pratiques pour modifier les fichiers HTML dans `site/`

⚠️ **Important** : Le fichier `index_fusionne.html` est généré automatiquement. Ne le modifiez jamais directement !  
Modifiez toujours les fichiers sources dans `site/`, puis régénérez avec `python fusionner_v2.py`.

### ✅ Navigation entre pages

**Utilisez toujours des chemins relatifs** dans les HTML sources :

```javascript
// ✅ BON - sera automatiquement transformé en showPage()
location.href = './index.html';
location.href = '../home.html';
location.href = './robinet.html?idx=' + i;

// ❌ MAUVAIS - ne fonctionnera pas après fusion
showPage('page-site-home-html');  // Ne pas utiliser showPage() dans les sources
window.location = '/site/home.html';  // Chemins absolus ne fonctionnent pas
```

Le script `fusionner_v2.py` transforme automatiquement :
- `location.href = './page.html'` → `showPage('page-site-dossier-page-html')`
- `location.href = '../home.html'` → `showPage('page-site-home-html')`

### ✅ Sélecteurs DOM

**Utilisez normalement `document.getElementById()`** dans les sources :

```javascript
// ✅ BON - sera automatiquement sécurisé
document.getElementById('back').addEventListener('click', () => ...);
document.getElementById('editor').value = data;
const el = document.getElementById('table');

// ❌ INUTILE - ne pas faire de scope manuel
section?.querySelector('#back');  // Le script le fait automatiquement
```

Le script ajoute automatiquement l'isolation par section :
- `document.getElementById('id')` → `((section?.querySelector('#id')) || document.getElementById('id'))`

### ✅ Styles CSS

**Écrivez vos styles normalement dans le `<head>`** :

```html
<head>
  <style>
    body { font-family: Arial; padding: 20px; background: #f6f9fb; }
    .toolbar { display: flex; gap: 8px; }
    button.primary { background: #0b566b; color: #fff; }
  </style>
</head>
```

Le script `fusionner_v2.py` **scope automatiquement** les styles à chaque section :
- Extrait les `<style>` du `<head>`
- Les place dans la section correspondante
- Préfixe tous les sélecteurs avec `#page-site-dossier-page-html`

**Exemple de transformation** :
```css
/* Source : robinet.html */
body { padding: 20px; }
.row { max-width: 800px; }

/* Devient dans index_fusionne.html */
#page-site-qte-robinet-html { padding: 20px; }
#page-site-qte-robinet-html .row { max-width: 800px; }
```

✅ **Avantages** :
- Pas de conflits CSS entre pages
- Chaque page garde ses propres styles
- Le sélecteur `body` est automatiquement converti en style de section

❌ **Éviter** :
- Les styles globaux qui doivent s'appliquer partout (les mettre dans le `<head>` global du document fusionné)
- Les `@keyframes` ou `@media` complexes (peuvent nécessiter un traitement spécial)

### ✅ Scripts externes (Data.js)

**Importez Data.js normalement** dans chaque page qui l'utilise :

```html
<!-- ✅ BON - dans le <head> -->
<script src="../shared/Data.js"></script>
```

Le script `fusionner_v2.py` :
1. Détecte et supprime tous les imports de Data.js
2. Inclut Data.js **une seule fois** globalement dans le fichier fusionné
3. La classe Data est accessible partout sans duplication

### ✅ Boutons retour

Les boutons retour fonctionnent comme la navigation normale :

```javascript
// ✅ BON
document.getElementById('back').addEventListener('click', () => location.href = '../home.html');
document.getElementById('back').addEventListener('click', () => location.href = './index.html');
```

### ✅ Paramètres URL (cas spécial robinet.html)

Pour passer un paramètre `idx` avec persistence et reload :

```javascript
// ✅ BON - dans robinets.html (envoyer avec localStorage)
localStorage.setItem('currentRobinetIdx', idx);
location.href = './robinet.html?idx=' + idx;

// ✅ BON - dans robinet.html (fonction pour recalculer l'index)
function getCurrentIdx() {
  if (window.__robinetIdx !== undefined) {
    return window.__robinetIdx;  // 1. Variable globale SPA
  } else if (localStorage.getItem('currentRobinetIdx')) {
    return parseInt(localStorage.getItem('currentRobinetIdx'), 10);  // 2. LocalStorage
  } else {
    return parseInt(params.get('idx'), 10);  // 3. URL params
  }
}

// ✅ BON - Appeler getCurrentIdx() dans load() pour recalculer
function load() {
  const idx = getCurrentIdx();  // Recalculé à chaque affichage
  // ... utiliser idx
}

// ✅ BON - Appeler getCurrentIdx() dans save() aussi
function save() {
  const idx = getCurrentIdx();  // Toujours à jour
  // ... utiliser idx
}
```

**Pourquoi getCurrentIdx() comme fonction ?**
- ✅ Recalculé à chaque appel, pas une seule fois
- ✅ `load()` est rappelé quand la page redevient visible (MutationObserver)
- ✅ L'index est toujours à jour même si on clique sur plusieurs robinets différents
- ✅ Survit aux actualisations grâce à localStorage

**⚠️ Erreur classique à éviter :**
```javascript
// ❌ MAUVAIS - idx calculé une seule fois au chargement
const idx = getCurrentIdx();  // Défini au début du script

function load() {
  // idx garde toujours la valeur initiale même après load() répété
  const item = arr[idx];  // Toujours le même robinet !
}
```

Le script transforme automatiquement en :
```javascript
(window.__robinetIdx = i, showPage('page-site-qte-robinet-html'))
```

La fonction `showPage()` met la section à `display: 'none'` puis `display: 'block'`, ce qui déclenche le `MutationObserver` et rappelle `load()` avec l'index mis à jour.

## Architecture technique

### Comment fonctionne fusionner_v2.py

1. **collecter_pages()** : Liste tous les *.html dans site/
2. **extraire_head_body()** : Parse <head> et <body> avec regex
3. **nettoyer_head()** : Retire les imports de Data.js
4. **transformer_navigation()** : Convertit `location.href` → `showPage()`
5. **encapsuler_scripts()** : Wrappe chaque <script> dans une IIFE avec `section` parameter
6. **creer_script_navigation()** : Génère showPage() + inclut Data.js une fois
7. **assembler()** : Produit le HTML final

### Single-Page Application

Le fichier fusionné contient :
- Une fonction globale `showPage(pageId)` pour la navigation
- 16 éléments `<section id="page-site-*-html">` (un par page)
- Chaque section contient ses propres styles et scripts isolés
- Navigation par affichage/masquage des sections (`display: block/none`)

### Isolation des scripts

Chaque page est encapsulée dans une IIFE :

```javascript
(function(section) {
  // Code de la page avec accès à 'section' (son conteneur)
  const el = ((section?.querySelector('#btn')) || document.getElementById('btn'));
})(document.currentScript?.closest('section'));
```

Cela évite les conflits entre pages (même ID dans plusieurs pages).

## Développement

### Workflow recommandé

1. Modifier les fichiers dans `site/`
2. Exécuter `python fusionner_v2.py`
3. Ouvrir `index_fusionne.html` dans le navigateur
4. Tester la navigation et les fonctionnalités

### Débogage

- **Console navigateur** : Les erreurs JavaScript apparaissent avec le numéro de ligne dans index_fusionne.html
- **Identifier la source** : Chercher le `<section id="page-site-*">` contenant la ligne d'erreur
- **Corriger dans site/** : Toujours corriger dans le fichier source, jamais dans index_fusionne.html

## Conventions de code

### CSS

Utilisez des styles inline `<style>` dans chaque page HTML. Ils sont automatiquement isolés dans la section correspondante.

### IDs HTML

Évitez de réutiliser les mêmes IDs sur plusieurs pages (même si l'isolation fonctionne, c'est plus clair d'avoir des IDs uniques ou préfixés).

### localStorage / Cookies

Utilisez la classe `Data` pour toute persistence :

```javascript
Data.set('key', value);
const value = Data.get('key', defaultValue);
```

## Compatibilité

- **Navigateurs** : Tous les navigateurs modernes (Chrome, Firefox, Edge, Safari)
- **JavaScript** : ES6+ (arrow functions, optional chaining ?., template strings)
- **Storage** : localStorage (avec fallback cookies dans Data.js)

## Licence

Projet interne Cerema

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
