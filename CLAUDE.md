# SobriEau — guide de développement

Application d'audit de consommation d'eau dans les bâtiments publics (Cerema).
Angular 18 standalone, sans backend. Un auditeur remplit l'audit sur le terrain,
souvent hors connexion, puis exporte un JSON.

> Ce fichier décrit les **contraintes structurantes** du projet. La plupart des
> régressions viennent de leur méconnaissance : elles ne se voient ni à la
> compilation, ni sur le serveur de développement.

---

## 1. Deux cibles de build — ne pas les confondre

| Commande | Cible | Résultat |
|---|---|---|
| `npm run build` | **Fichier autonome** | `index.html` unique (~2 Mo), tout inliné, ouvert en `file://` |
| `npm run build:hosted` | **Version hébergée** | `dist/sobrieau/` classique, chunks séparés, chargement différé |
| `npm start` | Développement | `ng serve` sur `http://localhost:4200` |

`build.bat` et `install.bat` sont destinés aux postes sans chaîne Node installée ;
`build.bat` appelle la configuration `standalone`.

**Le livrable terrain est le fichier autonome.** Il est **commité à la racine**
(`index.html`) et doit être régénéré à chaque modification de `src/`, sinon ce
que les auditeurs ouvrent ne correspond plus aux sources. Ce décalage s'est déjà
produit.

---

## 2. Contraintes du mode `file://` — l'origine de la plupart des pièges

Le fichier autonome s'ouvre par double-clic, sans serveur. Il en découle :

- **Pas de routage par chemin.** `HashLocationStrategy` est imposée dans
  [main.ts](src/main.ts) : les URL sont `index.html#/qte/wc`. Ne pas la retirer.
  *Corollaire pour les tests : une URL sans `#` renvoie toujours l'accueil.*
- **Pas de Web Worker.** Un worker ne peut pas être chargé depuis `file://`.
- **Pas de chunk chargé dynamiquement.** Un `import()` produit un fichier séparé
  que `file://` ne récupérera pas. D'où la configuration `standalone` et ses
  `fileReplacements` (voir §6).
- **Pas de requête réseau** dans le chemin nominal. Aucune police, aucun script,
  aucune image externe : `inline-build.js` inline tout, et une ressource restée
  externe casse le mode hors ligne sans erreur visible en développement.
- **Origine `null`.** Beaucoup d'API à « contexte sécurisé » se comportent
  différemment. C'est le cas de la dictée vocale (§7).

Une modification qui fonctionne sous `npm start` peut être cassée en `file://`.
**Tester le fichier autonome avant de conclure.**

---

## 3. Modèle de données

Racine unique en `localStorage`, clé **`sobrieau`**, décrite par `AppData` dans
[data.models.ts](src/app/models/data.models.ts).

```
AppData
├── Adresse, Info        HTML libre (éditeur riche)
├── Date, Auditeur       texte
├── Plans[]              AssetRef — plans du bâtiment, communs à l'audit
├── Photos[]             AssetRef — galerie générale
├── Qge {}               JSON libre (éditeur brut)
├── Qus {}               JSON libre (éditeur brut)
└── Qte
    ├── Info                     HTML libre
    ├── robinets[]               une entrée par élément
    │   ├── Id                   identité stable
    │   ├── Numero               libellé affiché
    │   ├── Localisation         PlanLocation | null
    │   ├── Photos[]             AssetRef
    │   └── … champs du schéma
    ├── wc[], piscines[], …      idem, une clé par entité listée
    ├── releve_compteur_general{} entité unique : un objet, pas un tableau
    └── Localisations{}          vestige des sections en JSON brut (voir §8)
```

Les clés de stockage et les segments d'URL sont déclarés dans
[audit-schema.ts](src/app/models/audit-schema.ts). **Renommer une clé casse les
audits déjà enregistrés.**

### Identité des éléments — `Id` contre `Numero`

Tout élément listé puis détaillé sur sa propre fiche implémente `AuditEntity` :

- **`Id`** — identité technique, attribuée une fois, **jamais renumérotée**.
  C'est la clé des URL de fiche (`#/qte/robinet/<Id>`) et la cible de toutes les
  relations entre éléments (type `EntityRef`).
- **`Numero`** — libellé affiché à l'auditeur, rien de plus.

La spécification prévoit de renuméroter les éléments après une suppression
(« *incrémenter à chaque nouvelle page et l'inverse en cas de suppression* »).
Or les relations décrites par le classeur — « Numéro robinet correspondant »,
« Numéro réseau ECS d'appartenance » — pointent sur ce numéro. S'y fier ferait
glisser silencieusement une douche vers le mauvais robinet dès la première
suppression. **Ne jamais utiliser `Numero` ni un index de tableau comme clé.**

Les audits antérieurs à `Id` sont repris automatiquement : `ensureEntityIds()`
attribue les identifiants manquants au chargement et après un import.

### Localisation et photos vivent dans l'élément

Elles sont stockées **dans l'objet**, jamais dans une table annexe indexée par
position : sans quoi supprimer un élément ferait glisser la punaise et les
photos sur son voisin.

`Qte.Localisations` et `Qte.PhotosSections` sont un vestige de l'époque où les
sections étaient éditées en JSON brut. Ils ne sont plus alimentés, et ne
subsistent que pour relire les audits enregistrés à ce moment-là.

---

## 4. Stockage — trois supports, trois rôles

| Support | Contenu | Limite |
|---|---|---|
| `localStorage['sobrieau']` | Tout le JSON de l'audit **sauf les images** | ~5 Mo |
| IndexedDB `sobrieau-assets` | Les images (plans, photos), en `Blob` | large |
| Cookie `sobrieau` | Secours hérité de l'ancienne version HTML | **~4 Ko** |

**Ne jamais mettre d'image dans `localStorage`.** Une photo de téléphone (2–4 Mo,
+33 % en base64) sature à elle seule le quota. Les images passent par
[AssetStoreService](src/app/core/services/asset-store.service.ts) ; le JSON ne
transporte que des `AssetRef { id, name }`.

**Le cookie n'est écrit que si la charge fait moins de 3 500 caractères.** Un
cookie plus gros est rejeté par le navigateur *sans erreur*. La version
antérieure y recopiait tout l'audit à chaque sauvegarde et échouait en silence ;
ne pas réintroduire ce comportement.

### Cohérence des images

Toute image ajoutée est écrite immédiatement en IndexedDB. Les écrans qui
manipulent des `AssetRef` doivent donc **persister sans attendre un bouton
« Enregistrer »**, sinon quitter la page laisse des images stockées mais
orphelines (voir `onPhotosChange()` dans `entity-form.component.ts`).
Symétriquement, `DataService.deleteEntity()` supprime les photos de l'élément
retiré.

Supprimer un plan doit purger les localisations qui le référencent :
`DataService.purgePlanReferences()`.

---

## 5. Export / import — contrat de fichier

`exportJson()` produit le JSON de l'audit **plus une clé `__assets`** :

```jsonc
{
  "Adresse": "…", "Plans": [{ "id": "…", "name": "RDC" }],
  "__assets": { "<id>": { "name": "RDC", "data": "data:image/png;base64,…" } }
}
```

- Les images sont réencodées en base64 **uniquement à l'export** : le fichier est
  téléchargé, il échappe au quota du navigateur, et la portabilité prime.
- `importJson()` **remplace tout l'audit**, images comprises : il vide IndexedDB
  puis réinjecte `__assets` **en conservant les identifiants**, sans quoi les
  références deviendraient orphelines.
- Les exports antérieurs, sans `__assets`, restent lisibles.
- L'import recharge la page : les composants déjà affichés tiennent une copie
  locale des données.

Toute évolution du modèle doit rester lisible par un import d'ancien fichier :
des audits circulent déjà.

---

## 6. Plans et localisation

- Les plans sont chargés **depuis l'accueil** et communs à tout l'audit.
- **Formats acceptés : images et PDF.** Un PDF est *rasterisé au chargement*
  (une page = un plan), car un PDF ne s'affiche pas dans une `<img>` et un
  `<embed>` isole les clics — impossible d'y poser une punaise.
- Les coordonnées de punaise sont des **fractions (0 à 1)**, jamais des pixels :
  la punaise doit rester juste en vignette, en plein écran et à l'impression.

### PDF.js — montage à ne pas défaire

[PdfRasterService](src/app/core/services/pdf-raster.service.ts) rend les pages
**sur le fil principal**, sans worker, en exposant `globalThis.pdfjsWorker`.
C'est ce qui permet au PDF de fonctionner en `file://`. Une tentative
antérieure de charger un worker depuis un blob (moteur vocal Vosk) avait imposé
340 lignes de correctifs de build avant d'être abandonnée — ne pas reprendre
cette voie.

Le chargement de la bibliothèque passe par un indirect volontaire :

- `pdf-lib-loader.ts` — `import()` dynamique, **version hébergée** : PDF.js
  n'est téléchargé que si un PDF est réellement chargé.
- `pdf-lib-loader.standalone.ts` — imports statiques, **fichier autonome** :
  substitué par `fileReplacements` dans `angular.json`.

Si vous supprimez cette indirection, l'un des deux modes casse.

---

## 7. Dictée vocale

[SpeechService](src/app/core/services/speech.service.ts) s'appuie sur la
**Web Speech API**, donc **en ligne**, et sur Chrome ou Edge uniquement.

La variante hors ligne (Vosk WASM, modèle français de ~40 Mo) a été **écartée
délibérément** : trop lourde pour les téléphones. Elle reste consultable sur la
branche `origin/vosk`. Ne pas la réintroduire sans arbitrage explicite.

Conséquences assumées : l'audio transite par le service de reconnaissance du
navigateur (Google pour Chrome/Edge), et la dictée peut être refusée en
`file://` (`service-not-allowed`). Le service renvoie dans ce cas un message
explicite plutôt qu'un échec muet.

Le service est un **singleton** alors que plusieurs éditeurs coexistent sur
l'accueil : un jeton de propriété (`activeOwner`) garantit une seule dictée
active et évite que le texte parte dans le mauvais champ.

---

## 8. Partie technique — un moteur piloté par le schéma

Les douze entités de la partie technique **ne sont pas douze composants**. Le
classeur décrit partout le même motif « liste puis fiche » : chaque entité est
donc décrite en données et rendue par deux composants génériques.

| Fichier | Rôle |
|---|---|
| [audit-schema.ts](src/app/models/audit-schema.ts) | **Généré** depuis le classeur : champs, types, colonnes, disposition |
| [value-lists.ts](src/app/models/value-lists.ts) | Toutes les listes de valeurs, curées à la main |
| [field.models.ts](src/app/models/field.models.ts) | Vocabulaire de description des champs |
| `audit-field` | **Composant de saisie unique** — texte, nombre, liste, oui/non, référence, photos |
| `entity-list` / `entity-form` | Rendu générique de la liste et de la fiche |

⚠️ **`audit-schema.ts` est généré : ne pas l'éditer à la main.** Il se régénère
depuis `audit_technique.xlsx` — voir [tools/README.md](tools/README.md). Une
modification manuelle serait perdue à la prochaine régénération. Pour changer un
champ, corriger le classeur ; pour changer une liste de valeurs, `value-lists.ts`.

Modifier l'apparence d'un type de saisie se fait dans `audit-field`, et vaut
aussitôt pour tous les formulaires.

### La disposition vient du classeur

Chaque feuille est un **tableau**, et la position des cellules est la
spécification de mise en page. Le champ `row` d'un `FieldDef` porte le numéro de
ligne Excel : les champs qui la partagent sont rendus côte à côte, une ligne
pouvant en compter un, deux ou trois.

**Ne pas remplacer ce groupement par une grille automatique** (`auto-fit`,
`repeat(...)`) : elle alignerait les champs mécaniquement et perdrait
l'appariement voulu — « Commande / Temporisation / Cool-start » sur une ligne,
« Débit / Présence d'un réducteur » sur la suivante.

Routes : `#/qte/<route>` pour la liste — ou directement la fiche si l'entité est
déclarée `single` — et `#/qte/<route>/<Id>` pour un élément.

### Deux pièges déjà rencontrés

- **Lire les paramètres de route par abonnement, jamais par `snapshot`.** Angular
  réutilise l'instance du composant quand seul un paramètre change : passer des
  robinets aux douches conservait l'entité précédente, au point de créer un
  robinet depuis la page des douches.
- **Une valeur enregistrée absente de la liste est conservée** et signalée
  « hors liste ». Les énumérations du classeur ne sont pas arbitrées ; les faire
  évoluer ne doit jamais effacer en silence une saisie faite sur le terrain.

## 9. Charte graphique

Toutes les valeurs (couleurs, rayons, espacements, typographie, ombres) sont des
variables CSS définies dans [styles.scss](src/styles.scss).

**Aucune couleur en dur dans les SCSS de composants.** L'état de référence est
zéro occurrence hors `styles.scss` ; le projet en comptait 27 réparties dans
9 fichiers, avec trois bleus-canard quasi identiques utilisés indifféremment.

- L'en-tête et la navigation sont portés par un composant unique,
  [page-header](src/app/shared/components/page-header/page-header.component.ts).
  Ne pas recopier le bandeau dans les pages : il l'était dans six d'entre elles.

### En-tête collant et logos

L'en-tête est `position: sticky` : il reste affiché, seul le contenu défile.
Cela vaut pour ses **deux niveaux** — bandeau de marque et barre de navigation —
parce qu'une fiche peut compter jusqu'à 38 champs et qu'on y perdait le titre et
le bouton Retour.

Trois points à ne pas défaire :

- `body` n'a **pas de marge haute**, sinon l'en-tête saute au premier défilement.
- L'en-tête déborde la colonne centrée par des marges en `vw` pour traverser
  l'écran ; `body { overflow-x: clip }` neutralise la barre horizontale que la
  largeur de l'ascenseur provoquerait.
- Le fond est porté par les barres pleine largeur (`.bar--brand`, `.bar--nav`),
  pas par leur contenu centré — sinon les côtés laisseraient voir le contenu
  défiler dessous.

Les logos sont **inlinés en data URI** dans [logos.ts](src/app/shared/logos.ts),
fichier **généré** par `node tools/gen-logos.js` depuis `src/assets/logos/`. Un
`<img src="assets/…">` ne s'afficherait pas en `file://`. Le logotype SobriEau
porte le nom du produit : il tient lieu de titre, dans un `<h1>` pour conserver
la sémantique.
- Une page fournit `pageTitle` pour afficher la barre Accueil / titre / Retour.
  **L'accueil l'omet** : il n'a pas de page parente.
- Surfaces : classe globale `.panel`. Rangées de boutons : `.actions`
  (`.actions--top` au-dessus du contenu).
- Le `.toolbar` de l'éditeur riche s'appelle `.editor-toolbar` : un `.toolbar`
  global traverserait l'encapsulation Angular et le percuterait.

---

## 10. Vérifier son travail

La compilation ne prouve presque rien ici : l'essentiel du comportement est
interactif et dépend du stockage.

```bash
npm start                     # développement
npm run build                 # fichier autonome, puis ouvrir index.html
```

Points de contrôle qui ont déjà révélé des régressions :

1. Le fichier autonome démarre-t-il en `file://` (double-clic) ?
2. Charger un plan **PDF** depuis l'accueil : une page = un plan, vignette visible.
3. Poser une punaise : la position enregistrée doit correspondre au clic, et
   **survivre à un rechargement complet** (preuve que l'image revient d'IndexedDB).
4. Export puis import sur un profil vidé : les images doivent se réafficher.
   Penser à vider **aussi les cookies**, sinon le repli les repeuple et le test
   ment.
5. Supprimer un plan localisé : aucun élément ne doit rester sur un plan absent.

---

## 11. À savoir

- **`.github/copilot-instructions.md` est obsolète et trompeur.** Il décrit
  l'architecture Python supprimée (`fusionner_v2.py`, dossier `site/`,
  `index_fusionne.html`, classe `Data.js`) et donne des consignes qui ne
  s'appliquent plus. À supprimer ou réécrire.
- **`README.md` est également périmé** sur la même architecture, et se termine
  par le gabarit GitLab par défaut non retiré.
- L'intégration **Google Drive** n'est pas faite. Elle suppose un identifiant
  client OAuth, un hébergement en `https`, et un flux compatible avec
  `HashLocationStrategy` — le flux implicite renvoie ses jetons dans le fragment
  d'URL, là où vit le routeur.
