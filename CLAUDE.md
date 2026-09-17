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

### Le fichier sait se reproduire — et doit le rester

La page `#/telecharger` produit une copie propre du fichier autonome, pour la
transmettre à un collègue sans passer par le gestionnaire de fichiers. Une page
ouverte en `file://` ne pouvant pas relire son propre contenu (`fetch` y est
refusé), elle **re-sérialise son DOM** : elle y réinjecte le `<app-root>`
d'origine et écarte ce que l'exécution a ajouté — Angular injecte des feuilles
de style au fil des pages visitées.

Trois points portent tout le montage :

- **La photographie du document est prise par un `<script type="module">`** dans
  [index.html](src/index.html). Les modules sont différés : il s'exécute donc
  quand le document est entièrement analysé, mais avant le module d'Angular,
  placé plus bas. Un script classique s'exécuterait trop tôt — il ne verrait pas
  les balises de script qui le suivent et les prendrait pour des ajouts
  d'exécution. *Vérifié en le cassant : la copie tombait à 14 Ko, sans le
  moindre script.*
- **`inline-build.js` écrit le fichier sous forme canonique**, c'est-à-dire
  telle que le navigateur la reproduit en re-sérialisant : attributs sans valeur
  explicitée, espace supprimé entre `<html>` et `<head>`, espace suivant
  `</body>` déplacé à l'intérieur. Sans cela l'aller-retour perd trois
  caractères, et la copie n'est plus le livrable.
- **La page refuse de produire une copie** si le document charge des fichiers
  séparés. Cela protège la version hébergée, et sert de témoin si une ressource
  échappait un jour à l'inlinage.

`node tools/check-extract.js` compare l'empreinte que la page annonce à celle du
fichier sur le disque. **À lancer après tout `npm run build`** : les trois points
ci-dessus se cassent en silence.

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
- **Origine `null`, et on ne peut pas lui en donner une.** L'origine opaque
  d'un `file://` est une invariante du navigateur, pas un réglage : ni `<base>`,
  ni un indicateur de lancement n'y changent rien. Obtenir une vraie origine
  suppose de changer de mode de diffusion — hébergement, application installée
  (PWA), ou extension.
- **Toutes les pages `file://` d'un même profil partagent le stockage** (mesuré :
  deux fichiers dans des dossiers différents lisent le même `localStorage`).
  Heureuse conséquence : remplacer `index.html` par une version plus récente
  conserve les audits de l'auditeur. Revers : une autre page locale ouverte dans
  le même navigateur peut les lire.

### Le stockage peut être refusé — et faisait tomber l'application

Sur certains postes (politique d'entreprise, blocage des données de site), la
simple lecture de `localStorage` **lève une exception**. Les services la
lisaient dans leur constructeur, donc pendant l'amorçage : Angular ne démarrait
pas, l'auditeur voyait une **page blanche** et l'URL restait bloquée sur `#/`
au lieu de `#/home`. Aucun message, ni à l'écran ni ailleurs.

Deux garde-fous, à ne pas retirer :

- Tout passe par [safe-storage.ts](src/app/core/utils/safe-storage.ts), qui
  absorbe l'échec et bascule sur une mémoire vive. L'application reste
  utilisable pour la journée, et un bandeau rouge prévient que rien ne sera
  conservé — perdre un audit sans avertissement serait pire que tout.
- [index.html](src/index.html) contient un **repli statique** dans `<app-root>`,
  remplacé par Angular au démarrage. S'il reste affiché, c'est que l'amorçage a
  échoué : il explique quoi faire (débloquer le fichier) et affiche le détail
  technique pour le support. Une page blanche ne dit rien à personne.

Une modification qui fonctionne sous `npm start` peut être cassée en `file://`.
**Tester le fichier autonome avant de conclure.**

---

## 3. Modèle de données

Un audit est décrit par `AppData` dans
[data.models.ts](src/app/models/data.models.ts). Plusieurs audits coexistent —
voir §4 pour leur rangement en `localStorage`.

```
AppData
├── Id                   identité de l'audit
├── Adresse              texte simple (sert au rapprochement, voir §4)
├── AdresseKey           forme normalisée, recalculée à l'enregistrement
├── Info                 HTML libre (éditeur riche)
├── Date, Auditeur       texte
├── Accompagnant         texte — nom et fonction de la personne sur place
├── Effectif             texte — salariés, élèves, visiteurs…
├── UtilisationsEau {}   usages de l'eau cochés → sections affichées (§8)
├── NiveauRemplissage    complet | allege | minimal — champs masqués sur les fiches (§8)
├── EquipementsPresents {} ancien régime d'affichage, et entités hors classeur
├── Documents {}         documents récupérés, par identifiant stable
├── Plans[]              AssetRef — plans du bâtiment, communs à l'audit
├── Photos[]             AssetRef — galerie générale
├── Qge {}               JSON libre (éditeur brut)
├── Qus {}               JSON libre (éditeur brut)
└── Qte
    ├── Info                     HTML libre
    ├── TableauDeBord {}         contexte du bâtiment (construction, pressions…)
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
Or les relations décrites par le classeur — « Numéro réseau ECS d'appartenance »
sur les robinets et les douches/baignoires — pointent sur ce numéro. S'y fier
ferait glisser silencieusement un élément vers la mauvaise cible dès la
première suppression. **Ne jamais utiliser `Numero` ni un index de tableau
comme clé.**

Le classeur ne formule pas toujours cette relation de façon reconnaissable. La
V3 emploie **huit** tournures pour huit renvois, et deux seulement passaient par
le motif d'origine (« avec les choix de la liste des réseaux ECS »). Trois
autres ne sont annoncées que par le libellé — « Numéro de réseau ECS associé »,
« Numéro du robinet utilisé pour le remplissage » — la note se bornant à
« Champ libre » ; s'en tenir à la note les laissait en texte libre, où
l'auditeur saisit à la main un numéro que la renumérotation d'une suppression
fera pointer ailleurs. `gen-schema.js` lit donc aussi le libellé
(`LABEL_REF_RE`), et le contrôle est simple : le schéma doit porter **cinq**
`entity-ref`.

Les trois derniers renvois sont **multiples** — « Numéros des robinets
correspondants », au pluriel, à cocher — et aucun mécanisme ne les couvre :
`entity-ref` ne stocke qu'un seul Id. Ils restent donc en texte, mais **avec un
`warn`** qui le dit à l'écran plutôt qu'un `entity-ref` qui enregistrerait une
seule cible sur trois sans prévenir. C'est la première chose à reprendre si le
type `entity-ref-multi` est un jour ajouté.

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
| `localStorage` (voir ci-dessous) | Le JSON des audits, **sauf les images** | ~5 Mo |
| IndexedDB `sobrieau-assets` | Les images (plans, photos), en `Blob` | large |

### Plusieurs audits, pas un seul

Un auditeur enchaîne les bâtiments. Chaque audit est stocké à part :

```
sobrieau.index          → AuditSummary[]  (fiches légères, relues au démarrage)
sobrieau.current        → identifiant de l'audit ouvert
sobrieau.audit.<Id>     → données complètes d'un audit
sobrieau.legacy-backup  → l'audit mono-utilisateur d'avant, conservé par sécurité
```

`AuditRegistryService` porte cette disposition et reprend automatiquement
l'ancienne clé `sobrieau` au premier démarrage.

**L'adresse n'est pas une clé.** Chaque audit garde un `Id` technique ; l'adresse
normalisée (`AdresseKey`) sert seulement à *rapprocher*. Sans cette séparation,
affiner un jour les règles de normalisation rendrait orphelins tous les audits.

Le rapprochement se fait **à la sortie du champ**, jamais à la frappe — sinon
saisir une adresse créerait autant d'audits que de caractères. Et une question
n'est posée que s'il y a des données à perdre : clé inchangée ou audit vide,
c'est un simple renommage.

**Le repli cookie a été retiré** : il ne pouvait porter qu'un audit, et son
plafond de ~4 Ko le rendait de toute façon inopérant dès qu'un audit se
remplissait.

**Ne jamais mettre d'image dans `localStorage`.** Une photo de téléphone (2–4 Mo,
+33 % en base64) sature à elle seule le quota. Les images passent par
[AssetStoreService](src/app/core/services/asset-store.service.ts) ; le JSON ne
transporte que des `AssetRef { id, name }`.

### Cohérence des images

Toute image ajoutée est écrite immédiatement en IndexedDB. Les écrans qui
manipulent des `AssetRef` doivent donc **persister sans attendre un bouton
« Enregistrer »**, sinon quitter la page laisse des images stockées mais
orphelines (voir `onPhotosChange()` dans `entity-form.component.ts`).
Symétriquement, `DataService.deleteEntity()` supprime les photos de l'élément
retiré.

Supprimer un plan doit purger les localisations qui le référencent :
`DataService.purgePlanReferences()`.

Chaque image porte l'`auditId` de son audit : les images de plusieurs audits
cohabitent dans le même magasin, et `purgeAudit()` permet de n'effacer que
celles de l'audit supprimé. L'import réattribue de nouveaux identifiants
d'images, sinon deux audits importés de la même source les partageraient — et
supprimer l'un effacerait les images de l'autre.

### Prise de vue — pourquoi `capture` ne suffit pas

`capture="environment"` sur un `<input type="file">` n'ouvre l'appareil photo
**que sur mobile**. Sur ordinateur l'attribut est silencieusement ignoré et le
sélecteur de fichiers s'affiche : le bouton « Prendre une photo » ne prenait
donc aucune photo, sans le moindre signe d'échec. La webcam suppose
`getUserMedia`, et rien d'autre.

Mesuré depuis le fichier autonome ouvert en `file://` :

- `window.isSecureContext` vaut **`true`** — Chrome tient le schéma `file` pour
  digne de confiance, contrairement à ce que l'origine `null` laisse craindre.
- L'invite d'autorisation s'affiche et le flux arrive ; la chaîne
  flux → `<video>` → canvas → JPEG a été vérifiée de bout en bout à cette
  origine, punaise comprise dans la galerie après rechargement.
- **L'autorisation n'est pas mémorisée** d'un lancement à l'autre : une origine
  opaque n'a pas de fiche de permissions. L'auditeur devra l'accorder à chaque
  ouverture du fichier. C'est écrit à l'écran, pas laissé deviner.

[camera-capture](src/app/shared/components/camera-capture/camera-capture.component.ts)
porte le dialogue. Trois choses à ne pas défaire :

- **La photo est réduite à 1600 px de côté** (JPEG 0,85) au moment du
  déclenchement. Une image de capteur pèse plusieurs mégaoctets ; un audit peut
  compter plus de cent photos, et l'export les recopie en base64.
- **Les pistes sont arrêtées** à la validation, à la fermeture et à la
  destruction du composant. Une piste oubliée laisse le témoin de la caméra
  allumé — vérifié : `readyState === 'ended'` après fermeture en cours de flux.
- **Le repli reste branché** : si `getUserMedia` manque, le bouton retombe sur
  le champ natif. Refus d'autorisation, caméra absente ou déjà occupée donnent
  un message qui dit quoi faire, et un bouton « Choisir un fichier ».

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

Les entités de la partie technique (V3 du classeur, 2026-08) **ne sont pas
autant de composants** : seize fiches du classeur, plus la zone piscine rendue
en tête de la page Piscines, plus le surpresseur conservé hors classeur. Le
classeur décrit partout le même motif « liste puis fiche » : chaque entité est
donc décrite en données et rendue par deux composants génériques.

| Fichier | Rôle |
|---|---|
| [audit-schema.ts](src/app/models/audit-schema.ts) | **Généré** depuis le classeur : champs, types, colonnes, disposition, sections, priorités |
| [value-lists.ts](src/app/models/value-lists.ts) | Les listes de valeurs partagées, curées à la main |
| [field.models.ts](src/app/models/field.models.ts) | Vocabulaire de description des champs |
| [field-priority.ts](src/app/models/field-priority.ts) | Libellé de la pastille d'exigence |
| [exigences.ts](src/app/qte/exigences.ts) | Niveau de remplissage et validation — fonctions pures, testées par `check-exigences.js` |
| [form-layout.ts](src/app/qte/form-layout.ts) | Lignes et sections d'un formulaire, partagées par la fiche et le préambule |
| [utilisations-eau.ts](src/app/models/utilisations-eau.ts) | Usages de l'eau → sections à afficher, curé à la main |
| `glossaire.ts`, `documents-collectes.ts` | **Générés** : contenus repris mot pour mot du classeur |
| `audit-field` | **Composant de saisie unique** — texte, nombre, liste, oui/non, référence, photos |
| `entity-list` / `entity-form` | Rendu générique de la liste et de la fiche |

**Deux entités de la V2 n'ont plus d'onglet en V3**, et elles ne sont pas
traitées pareil. Le *réducteur de pression* est replié en bloc conditionnel
dans la fiche Compteur général (six champs sur dix-sept survivent) : sa fiche à
part est retirée du schéma, et `Qte.reducteurs_de_pression` n'est plus lu. Le
*surpresseur* n'a aucun équivalent : il est **conservé** avec ses champs figés
depuis la V2 (`CHAMPS_FIGES`, entité `horsClasseur`), masqué par défaut et
réactivable d'une case sur l'accueil du projet.

### Deux migrations V3 ont été menées en parallèle

Le 2026-08-24 sur un poste, le 2026-09-14 sur un autre, sans que l'une sache
rien de l'autre. Elles ont été fusionnées le 2026-09-16 ; chaque arbitrage est
consigné dans [fusion-origin-main.md](fusion-origin-main.md). À lire avant de
toucher à l'exigence des champs, au surpresseur ou à la validation : plusieurs
choix y défont explicitement ce qu'une des deux versions avait écrit.

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

### Sections et priorités — deux informations que le classeur cache

La V3 ajoute deux choses qu'aucune cellule ne déclare en toutes lettres :

- **Le découpage en sections.** Deux dispositifs coexistent — un titre écrit à
  la verticale dans une cellule fusionnée à gauche des champs (neuf onglets),
  et un intertitre pleine largeur reconnaissable à son seul fond de cellule
  (onze onglets, dont cinq n'ont que celui-là). Il faut donc lire les **styles**
  du classeur, ce que `xlsx-extract.js` transporte désormais. `entity-form`
  rend un `.panel` par section : une fiche peut compter 77 champs.
- **L'exigence de chaque question** (`FieldDef.requirement`) — `Obligatoire`,
  `Recommandé`, `Facultatif` — écrite dans une cellule à droite du libellé.
  481 cellules, aucune variante. **Une seule donnée, trois usages** : la
  pastille orange après l'intitulé, le niveau de remplissage qui masque les
  champs les moins exigés, et la validation qui refuse d'enregistrer une fiche
  dont un champ obligatoire est vide.

Un champ **sans** exigence n'affiche aucune pastille, compte comme facultatif
pour le niveau de remplissage, et n'est jamais exigé. L'absence n'est pas un
quatrième niveau : elle distingue « le classeur dit facultatif » de « le
classeur ne dit rien », et garde la trace des questions non arbitrées.

⚠️ **La validation ne vaut que pour les blocs qui concernent l'élément.** Une
même fiche décrit plusieurs objets : quatre appareils de lavage, la douche et
la baignoire, le réducteur de pression du compteur. Sans restriction, un
lave-linge ne pouvait pas être enregistré sans remplir les champs obligatoires
de l'autolaveuse — c'était le cas sur origin/main avant la fusion. Les blocs
conditionnels se déclarent dans `ENTITIES` (`lib/classeur.js`) ; le générateur
refuse une déclaration qui ne se résout pas, et `check-exigences.js` vérifie
que chaque fiche reste validable. Masquer les blocs inactifs à l'écran
(l'affichage conditionnel) reste à faire.

⚠️ **Ces cellules occupent la place d'un libellé.** Non filtrées, elles
produisaient 406 faux champs — plus que de vrais — et, en s'intercalant entre
un libellé et sa note, faisaient perdre sa liste déroulante à 48 champs réels
sans rien signaler. Le tri des cellules vit dans
[tools/lib/classeur.js](tools/lib/classeur.js), partagé par le générateur et
les contrôles ; `check-coverage.js` le vérifie, sa rubrique « FAUX CHAMPS »
devant rester vide.

Routes : `#/qte/<route>` pour la liste — ou directement la fiche si l'entité est
déclarée `single` — et `#/qte/<route>/<Id>` pour un élément.

### Les quatre écrans du classeur, et où ils vivent

Le fil d'Ariane du classeur V3 (« Accueil - Généralités - Tableau de bord -
Robinets - Robinet 1 », repris sur les seize fiches) décrit l'application telle
qu'elle est structurée. Chaque onglet a son écran :

| Onglet du classeur | Écran | Route |
|---|---|---|
| ` Accueil` | Choix du projet | `#/accueil` |
| `Généralités` | Accueil du projet ouvert | `#/home` |
| `Tableau de bord` | Contexte du bâtiment + navigation + glossaire | `#/qte` |
| `Documents collectés` | Documents à réunir | `#/documents` |

**L'affichage des sections est piloté par les usages déclarés**, non par les
équipements. Le classeur fait cocher dix *utilisations de l'eau* (Généralités
B33) ; trois d'entre elles commandent la même section (« Appareils de lavage »),
une en commande deux (l'eau chaude sanitaire), et sept sections s'affichent
toujours. La correspondance est un arbitrage, écrite à la main dans
[utilisations-eau.ts](src/app/models/utilisations-eau.ts).

Deux garde-fous à ne pas retirer : **une section qui contient déjà des éléments
reste affichée même non cochée** — décocher ne doit jamais rendre une saisie
inatteignable — et **les audits antérieurs, dépourvus d'`UtilisationsEau`,
retombent sur l'ancien `EquipementsPresents`**, où une clé absente valait
« présent ». Les faire basculer sur la règle du classeur ferait disparaître,
d'une mise à jour à l'autre, des sections que l'auditeur voyait la veille.

### Deux formes pour un champ à choix

`audit-field` choisit seul, selon le nombre d'options : **moins de quatre**
donne des boutons radio, **quatre ou plus** un champ de recherche filtrant la
liste. Le seuil est `RADIO_THRESHOLD`. Le Oui/Non suit la même règle — c'est un
choix à deux options comme un autre.

Le filtrage ignore casse et accents : sur le terrain, personne ne tape
« Mélangeur » avec son accent.

### Deux pièges déjà rencontrés

- **Lire les paramètres de route par abonnement, jamais par `snapshot`.** Angular
  réutilise l'instance du composant quand seul un paramètre change : passer des
  robinets aux douches conservait l'entité précédente, au point de créer un
  robinet depuis la page des douches.
- **Une valeur enregistrée absente de la liste est conservée** et signalée
  « hors liste ». Les énumérations du classeur ne sont pas arbitrées ; les faire
  évoluer ne doit jamais effacer en silence une saisie faite sur le terrain.

## 9. Synchronisation Google Drive

Facultative : tant que `drive-config.ts` n'est pas renseigné, l'application
signale « non configurée » et tout le reste fonctionne.

| Fichier | Rôle |
|---|---|
| `drive-config.ts` | Identifiants et portées. **Vides par défaut**, volontairement. |
| `google-auth.service.ts` | Device flow, jeton, rafraîchissement, révocation |
| `drive-sync.service.ts` | Dépôt, liste, récupération, suppression |
| `drive-actions` | Enregistrer / Charger / pastille de compte, dans l'en-tête |

### Ce qui a été mesuré, et qu'il ne faut pas re-supposer

- **Google accepte l'origine `null`** — device flow, jeton, révocation, API
  Drive et dépôt de fichier. Microsoft et GitHub, non. Une synchronisation
  depuis le fichier autonome est donc possible, contrairement à l'intuition.
- **Le client doit être de type « Téléviseurs et périphériques d'entrée
  limités »** ; un client Web est refusé d'emblée.
- **`drive.file` est la seule portée Drive acceptée** sur ce flux (`drive` et
  `drive.appdata` sont refusés). `openid email profile` passe en supplément,
  d'où les initiales dans la pastille.

### Conséquences à connaître

`drive.file` ne donne accès **qu'aux fichiers créés par l'application** : un
fichier déposé à la main sur le Drive lui restera invisible. L'accès est par
**compte Google**, donc un auditeur retrouve ses audits d'un poste à l'autre,
mais pas ceux de ses collègues.

La récupération crée **un nouvel audit local** au lieu d'écraser celui ouvert :
perdre une saisie de terrain non encore envoyée serait bien pire qu'un doublon.

La déconnexion **révoque** le jeton chez Google, elle ne l'oublie pas seulement.
Sur un poste partagé, l'effacer localement ne suffirait pas.

### Le secret et le dépôt

`drive-config.ts` est commité **avec des valeurs vides**, pour qu'aucun
identifiant ne parte dans git sans décision. Les renseigner avant
`npm run build` les fait entrer dans `index.html`, lui-même commité. Google
considère que le secret d'un client installé n'est pas confidentiel, mais c'est
un choix à assumer. `.gitignore` couvre par ailleurs `client_secret_*.json`.

## 10. Charte graphique

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

## 11. Vérifier son travail

La compilation ne prouve presque rien ici : l'essentiel du comportement est
interactif et dépend du stockage.

```bash
npm start                     # développement
npm run gen                   # régénère schéma, pages, docs depuis le classeur
npm run check:coverage        # que contient le classeur que le schéma ignore ?
npm run build                 # fichier autonome, puis ouvrir index.html
npm run check:extract         # le fichier sait-il encore se reproduire ?
npm run check:smoke           # chaque écran se rend-il en file:// ?
npm run check:exigences       # chaque fiche est-elle validable ?
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
6. `node tools/check-extract.js` après chaque build : la copie que produit
   `#/telecharger` doit avoir l'empreinte du livrable.
7. `npm run check:smoke` après chaque build : les écrans se rendent-ils en
   `file://` ? Une page blanche ne remonte aucune erreur, nulle part.
8. `npm run check:coverage` après chaque régénération : la rubrique
   « FAUX CHAMPS » doit rester vide, et chaque « priorité sans champ » désigne
   une question que le classeur a jugée utile et que le schéma n'a pas vue.
9. `npm run check:exigences` après toute modification des blocs conditionnels,
   des exigences ou de la validation : une fiche invalidable ne produit aucune
   erreur, elle empêche seulement l'auditeur d'avancer.

---

## 12. À savoir

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
