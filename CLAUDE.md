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
├── Batiments[]          bâtiments de l'établissement (§3bis)
├── Pieces[]             pièces, rattachées à un bâtiment (§3bis)
├── Photos[]             AssetRef — galerie générale
├── Qge {}               JSON libre (éditeur brut)
├── Qus {}               JSON libre (éditeur brut)
└── Qte
    ├── Info                     HTML libre
    ├── TableauDeBord {}         contexte du bâtiment (construction, pressions…)
    ├── robinets[]               une entrée par élément
    │   ├── Id                   identité stable
    │   ├── Numero               libellé affiché
    │   ├── Piece                Id de la pièce, ou null (§3bis)
    │   ├── Localisation         PlanLocation | null
    │   ├── Photos[]             AssetRef
    │   └── … champs du schéma
    ├── wc[], piscines[], …      idem, une clé par entité listée
    ├── releve_compteur_general[] liste depuis 2026-09 (objet unique avant,
    │                            converti au chargement par ensureEntityIds)
    ├── zone_piscine{}           seule entité unique : un objet, pas un tableau
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

### Bâtiments et pièces — trois niveaux, posés par renvois

L'arborescence est **bâtiment → pièces → points d'eau** (arbitrage du
2026-11-09), et les trois niveaux tiennent par des **renvois**, jamais par
imbrication :

| Niveau | Où | Désigne son parent par |
|---|---|---|
| `AppData.Batiments[]` | hors du schéma, comme les pièces | — |
| `AppData.Pieces[]` | idem | `Piece.Batiment` |
| un point d'eau | dans sa liste sous `Qte` | `Piece` (clé `CLE_PIECE`) |
| un élément **hors pièce** — réseau ECS, toiture, structure, ventilation, opportunités | idem | `Batiment` (clé `CLE_BATIMENT`) |

Quatre règles à ne pas défaire :

- **Le bâtiment d'un point d'eau se déduit de sa pièce**, il n'est pas recopié
  (`DataService.batimentDeElement`). Une seule vérité par niveau : déplacer une
  pièce d'un bâtiment à l'autre emmène ses points d'eau, sans rien à
  resynchroniser. Un élément porte `Batiment` **seulement** s'il n'est dans
  aucune pièce.
- **Un audit sans bâtiment est un audit d'un seul bâtiment.** C'est le cas
  d'origine, et celui de tous les audits en circulation : la forme du JSON ne
  change pas, et une version qui ignore `Batiments` continue de le relire.
- **Les utilisations de l'eau restent déclarées pour l'établissement entier**
  (même arbitrage). Elles ne décident que des sections *proposées* ; une section
  proposée mais vide ne coûte rien, là où dix cases par bâtiment coûteraient à
  chaque saisie.
- **Supprimer un bâtiment détache ses pièces et les éléments qui le
  désignaient** (`purgeBatimentReferences`), sans rien supprimer, et le nombre
  est annoncé avant. Même règle que pour une pièce.

**Deux seuils d'affichage**, pour que rien n'apparaisse sans raison : avec
**un** bâtiment, le contexte reste sur le tableau de bord et une pièce créée lui
est rattachée d'office ; à partir de **deux**, apparaissent le sélecteur de
bâtiment d'une pièce, le filtre par bâtiment de la liste des pièces, la colonne
« Bâtiment » des listes par type, et l'année de construction / rénovation qui
passe au niveau du bâtiment.

⚠️ Les trois champs ainsi déplacés (`AnneeConstruction`,
`AnneeDerniereRenovation`, `TravauxDerniereRenovation` du tableau de bord) ne
sont **jamais effacés** : déjà remplis, ils restent consultables et modifiables
dans un volet dépliable du tableau de bord. Une saisie ne doit pas devenir
inatteignable — même règle que le niveau de remplissage (§8).

### Les pièces — une seconde entrée, pas une seconde structure

Le classeur range l'audit par **type d'équipement** : un onglet « Robinets »,
un onglet « WC ». Sur le terrain, l'auditeur avance par **pièce** : il entre
dans un local et relève tout ce qu'il y voit (première visite terrain,
2026-10). Les deux lectures coexistent, et c'est ce qu'il ne faut pas défaire.

- **La pièce ne contient pas les points d'eau.** `AppData.Pieces[]` d'un côté,
  une clé `Piece` portant son `Id` sur chaque élément de l'autre (`CLE_PIECE`
  dans [data.models.ts](src/app/models/data.models.ts)). Ranger les éléments
  *dans* la pièce aurait changé la forme du JSON : or des audits circulent, et
  une version qui ignore les pièces doit continuer de les relire — elle ignore
  simplement une clé de plus.
- **`Piece` n'est pas un champ du schéma, et ne peut pas l'être.**
  `audit-schema.ts` est généré depuis le classeur, qui ne décrit pas les
  pièces. La clé est donc traitée comme `Photos` et `Localisation` : déclarée
  dans le modèle, rendue à part par `entity-form`, habillée à part par l'export
  CSV.
- **Les listes par type restent le chemin d'origine.** Sept entités ne sont
  dans aucune pièce (réseaux ECS, toitures, structure, ventilation, espaces
  extérieurs, opportunités, zone piscine), un audit commencé avant n'a pas de
  pièces, et la colonne « Pièce » d'une liste est le seul endroit où l'on voit
  qu'un point d'eau n'en a pas. Les retirer rendrait des saisies
  inatteignables.
- **Supprimer une pièce détache ses points d'eau, sans les supprimer**
  (`purgePieceReferences`). On supprime une pièce pour réorganiser ; effacer au
  passage une fiche remplie sur le terrain n'aurait aucun rapport avec ce que
  l'auditeur a demandé. Le nombre d'éléments concernés est annoncé avant.
- La règle d'affichage des sections est **partagée** entre le tableau de bord
  et la page d'une pièce
  ([sections-visibles.ts](src/app/qte/sections-visibles.ts)), et le rendu d'une
  cellule entre les deux tableaux ([affichage.ts](src/app/qte/affichage.ts)) :
  dupliquées, elles rendraient une section atteignable d'un côté et pas de
  l'autre, sans rien signaler.

Écrans : `#/pieces` (liste, et préparation) et `#/pieces/<Id>` (points d'eau de
la pièce). Le composant `piece-manager` sert à la fois la préparation sur
l'accueil du projet et la page `#/pieces`. Le **compteur général** n'y est pas
rendu en tableau mais par un lien direct vers sa fiche : un bâtiment n'en a
qu'un, et un tableau d'une ligne serait une étape de plus sans rien montrer.

Une pièce porte une `PlanLocation`, comme un élément — donc la même punaise et
le même dialogue, et `purgePlanReferences` les traite ensemble. Ce n'est pas un
contour de pièce : voir l'arbitrage dans
[MAJ/realisations/2026-11-08-pieces-archive-images.md](MAJ/realisations/2026-11-08-pieces-archive-images.md).

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

### Où chercher une photo — quatre sources, et l'ordre est la règle

`sourcePhoto` ([photo-mode.ts](src/app/core/utils/photo-mode.ts)) décide, et
c'est une fonction pure parce que **cet ordre a déjà été faux deux fois** :

| # | Source | Pourquoi là |
|---|---|---|
| 1 | `base` | Le binaire local. Écrit avant même que la vignette soit rendue, dans les deux modes de rangement : la seule source sûre et immédiate. |
| 2 | `voisin` | Le fichier **à plat**, à côté de la page. C'est le cas **normal** : le navigateur télécharge dans un dossier unique et aplatit les séparateurs, la photo est donc là et nulle part ailleurs sur le poste de l'auditeur. |
| 3 | `archive` | Le même fichier **dans le sous-dossier de l'audit** — le chemin enregistré tel quel. C'est le **repli**, et il ne sert qu'après : chacun exporte son archive, on les réunit, et les photos de plusieurs auditeurs se retrouvent chacune dans le dossier de son audit. |
| 4 | `drive` | Le filet, qui suppose le réseau. |

Les deux erreurs, pour qu'on ne les refasse pas :

- **Le chemin relatif avant le binaire.** Le téléchargement n'est ni instantané
  ni notifiable : la vignette tombait sur un fichier inexistant, le navigateur
  retenait l'échec, et il fallait **recharger la page** pour voir les photos
  (première visite terrain, 2026-10).
- **Le sous-dossier avant le fichier à plat.** C'était échouer à chaque
  affichage sur le poste de l'auditeur pour réussir sur un cas qui n'arrive
  qu'après l'archivage.

Une source mise en échec est **écartée**, pas réessayée : chaque échec retire
exactement une piste, donc le parcours est fini. C'est la même fonction qui
désigne la source et qui l'écarte — elles ne peuvent pas diverger.

### Le chemin d'une photo : à plat sur le poste, en sous-dossier dans l'archive

Le chemin enregistré est `./<dossier-de-l-audit>/<fichier>` (`cheminPhoto`,
`dossierAudit`). Le dossier porte le nom de l'audit **et huit caractères de son
identité**, et c'est là tout l'intérêt : deux audits peuvent s'appeler « École
Jean Moulin », et une fois les archives de plusieurs auditeurs réunies leurs
photos se mélangeraient dans un dossier commun.

⚠️ **Un navigateur ne peut pas créer ce sous-dossier.** Mesuré sur Chromium 141
en pilotant le protocole DevTools — seul moyen d'autoriser un téléchargement
sans fenêtre : l'attribut `download` **aplatit** les séparateurs.
`mon-audit/photo.jpg` est écrit `mon-audit_photo.jpg`, et
`./mon-audit/photo.jpg` devient `_mon-audit_photo.jpg`. C'est une règle
d'assainissement du navigateur, pas un réglage.

D'où deux emplacements pour un même fichier, et il faut tenir les deux :

- **sur le poste de l'auditeur**, à plat dans le dossier de téléchargement, à
  côté de la page. C'est l'état courant, pendant tout l'audit ;
- **dans l'archive**, au chemin enregistré. C'est l'état d'après — celui qui
  permet de réunir le travail de plusieurs auditeurs sans collision.

L'affichage essaie donc le fichier à plat **avant** le sous-dossier (§4,
tableau des sources). L'API File System Access, qui saurait écrire dans un
dossier choisi et rendrait les deux états identiques, est bien présente en
`file://` (mesuré) mais **absente de Chrome sur Android**, c'est-à-dire de
l'appareil de terrain : elle n'a pas été retenue.

Un renommage de l'audit ne réécrit pas les chemins déjà enregistrés — ce serait
toucher à des dizaines d'enregistrements pour un libellé. C'est **l'archive qui
réécrit** chaque chemin sur le dossier qu'elle a réellement créé : elle est
donc toujours cohérente avec elle-même.

`npm run check:photos` porte ces règles — composition des noms, unicité du
dossier, et l'ordre des sources. *Vérifié en le cassant : remettre le
sous-dossier avant le fichier à plat remonte 4 échecs ; retirer l'identité du
nom de dossier en remonte 2.*

### Le binaire est la sauvegarde, le chemin n'en est pas une

Une photo n'est enregistrée **que** si son binaire est en base : c'est de là que
l'export JSON tire les images (`buildExportPayload`), une page `file://` ne
pouvant pas lire ses fichiers voisins. Un chemin relatif ne vaut que sur le
poste où le fichier se trouve.

Deux garde-fous, pour que l'écart se voie au lieu de se découvrir à la
réception : la vignette d'une photo sans binaire porte un bandeau rouge
« hors sauvegarde », et l'export annonce le nombre d'images qu'il n'a pas pu
embarquer.

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

### Réunir deux audits — deux auditeurs sur un même bâtiment

Pour un grand bâtiment, l'un prépare l'audit (plans, pièces), l'envoie à
l'autre, chacun relève sa part hors connexion, et l'un **intègre** le fichier
de l'autre dans l'audit qu'il a ouvert. C'est une opération distincte de
l'import, qui crée un audit à part : panneau « Travailler à deux sur le même
bâtiment » de l'accueil du projet, et
[fusion.ts](src/app/core/utils/fusion.ts).

Trois règles portent tout, et ce sont elles le contrat :

- **Rien n'est jamais écrasé.** Une fiche renseignée **différemment** des deux
  côtés n'est pas arbitrée : elle est ajoutée **en double**, et le rapport
  nomme les champs en cause. Un doublon se supprime en deux clics ; une saisie
  de terrain écrasée ne se retrouve jamais. Une fiche que l'autre a seulement
  **complétée** — champs vides ici, photos ajoutées — est complétée sur place,
  parce que c'est le cas courant et que le dupliquer serait absurde.
- **L'identité fait foi, le numéro est refait.** Le rapprochement se fait sur
  `Id` (pièces, plans, fiches) : c'est ce qui permet de reconnaître la base
  préparée en commun au lieu de la recopier. Les deux listes numérotant chacune
  à partir de 1, les éléments repris sont renumérotés à la suite — sans risque,
  les relations désignant l'`Id` (§3).
- **`fusionner()` est pure.** Elle ne touche ni à l'un ni à l'autre de ses
  arguments et rend un audit neuf plus un rapport. C'est ce qui permet de
  **montrer le résultat avant de l'appliquer** — on n'intègre pas un relevé de
  terrain à l'aveugle — et de l'éprouver hors navigateur.

Deux conséquences à connaître : l'identifiant d'une image reprise est
**conservé** sauf s'il désigne déjà une autre image du poste (sinon la reprise
écraserait une image étrangère au fichier) ; et intégrer **deux fois** le même
fichier n'ajoute rien, un doublon déjà posé étant reconnu à son contenu. Un
fichier antérieur aux identifiants n'offre rien à reconnaître : l'intégrer deux
fois double ses fiches.

`npm run check:fusion` porte la garantie : il joue le scénario de terrain —
base commune, deux apports, une fiche remplie des deux côtés — puis vérifie,
par son propre parcours du JSON, que chaque réponse des deux fichiers se
retrouve, que la base commune n'est pas recopiée, que les identités et les
numéros restent uniques, et que la seconde intégration est blanche. *Vérifié en
le cassant : remplacer la fiche d'accueil par celle reçue remonte 8 échecs.*

### Archive complète — tout emporter d'un coup

Bouton « Exporter tout en ZIP » de l'accueil général. L'archive porte
l'application **et tous les audits du poste**, et elle est autosuffisante : on
la déplie, on ouvre `index.html`, et les chemins relatifs des photos tombent
juste, parce que l'arborescence est celle qu'ils décrivent (§4).

```
sobrieau-2026-11-08.zip
├── index.html                     ← l'application, par `reconstituer()`
├── LISEZ-MOI.txt
└── ecole-jean-moulin-a1b2c3d4/    ← un dossier par audit
    ├── audit.json
    ├── 20261108T0930_robinet-3_1f2e3d4c.jpg
    └── plans/rdc.png
```

Quatre points à ne pas défaire :

- **C'est un ZIP, pas un RAR**, et ce n'est pas un choix de confort : le format
  RAR est propriétaire, son algorithme de compression n'est pas publié, et
  aucune bibliothèque JavaScript ne sait en *écrire* — celles qui existent ne
  font que lire. Un ZIP s'ouvre d'un double-clic sous Windows comme sous macOS.
- **L'écrivain ZIP est écrit à la main** ([zip.ts](src/app/core/utils/zip.ts)),
  deux cents lignes, sans dépendance : le livrable est un fichier autonome, et
  toute bibliothèque y serait inlinée. La compression vient du navigateur
  (`CompressionStream('deflate-raw')`, présent en `file://` — mesuré) ; faute
  d'elle, les fichiers sont stockés tels quels et l'archive s'ouvre pareil. Un
  JPEG est stocké sans tentative de compression : elle ne gagne rien et coûte
  le parcours de chaque octet.
- **Les images viennent de la base, pas des fichiers voisins.** « Depuis les
  liens relatifs » est impossible à la lettre : `fetch` d'un voisin est refusé
  en `file://`. C'est la même image, et elle est en base dans les deux modes de
  rangement.
- **`audit.json` embarque les images par défaut**, sur une case à cocher : coché,
  chaque dossier est réutilisable seul ; décoché, l'archive est deux fois plus
  légère mais un JSON sorti de son dossier a perdu ses images.

Pas de ZIP64 : au-delà de 65 535 fichiers ou de 4 Go, l'archive est **refusée**
avec un message, plutôt que produite dans un état qu'aucun outil n'ouvrirait.

Deux contrôles, parce qu'il y a deux choses distinctes à garantir :

- `npm run check:zip` éprouve **l'écrivain** : une archive aux contenus pénibles
  — accents, sous-dossiers, fichier vide, binaire incompressible, noms en
  double — confiée à **`unzip`**, un lecteur indépendant, et chaque octet relu
  comparé à l'octet écrit. *Vérifié en le cassant : une somme de contrôle
  faussée, un décalage d'index faussé ou le bit UTF-8 retiré font refuser
  l'archive.*
- `npm run check:archive` éprouve **la chaîne**, dans un vrai navigateur piloté
  par le protocole DevTools — seul moyen d'autoriser un téléchargement sans
  fenêtre, `--dump-dom` n'en faisant aucun, silencieusement. Un audit et une
  image sont posés dans le stockage de la page, le bouton est cliqué, l'archive
  dépliée, et la photo doit s'y trouver au chemin que le JSON annonce. C'est le
  seul à éprouver les trois bouts ensemble.

### Export CSV — pour compiler et analyser

Bouton « Exporter en CSV » de l'accueil du projet, et `npm run csv -- audit.json`
pour un JSON déjà reçu : c'est le même code
([csv-export.ts](src/app/core/utils/csv-export.ts)), et les deux donnent le même
fichier à l'octet près. Séparateur « ; », encodage **cp-1252**, virgule
décimale : ce qu'Excel attend en France.

**Format long, une ligne par réponse**, onze colonnes fixes. Un format large
aurait changé de colonnes à chaque évolution du formulaire.

| Colonne | Contenu |
|---|---|
| `AuditId`, `Audit` | identité et nom du bâtiment, répétés sur chaque ligne pour rassembler les fichiers |
| `Section` | « Généralités », « Robinets », « Documents collectés »… |
| `Element`, `ElementId` | numéro affiché et `Id` de la fiche ; un renvoi entre fiches vaut un `ElementId` |
| `Rubrique`, `Question` | intitulés affichés — ils peuvent changer d'une version à l'autre |
| `Cle` | chemin dans le JSON, sans le rang de l'élément : `Qte.wc[].Utilisateurs`. **C'est la colonne stable**, celle sur laquelle filtrer |
| `Valeur`, `Unite` | un choix multiple tient sur une ligne, réponses séparées par « \| » |
| `Origine` | `saisie` — une valeur du JSON — ou `calcul` (débit, numéro d'un renvoi, nom du plan) |

Trois choses à ne pas défaire :

- **Le parcours suit les données, jamais le schéma.** Le schéma n'habille
  qu'une valeur (libellé, rubrique, unité) ; il ne décide pas de ce qui sort.
  Un champ retiré du classeur sort encore, sous sa clé, pour les audits qui
  l'avaient rempli ; une structure inconnue est dépliée telle quelle. Filtrer
  l'export par le schéma ferait disparaître des saisies à chaque évolution.
- **Les images ne sont pas reprises** — ni `__assets`, ni une image restée en
  ligne dans un audit ancien : le CSV porte leurs références. C'est la seule
  partie du JSON qui n'y figure pas.
- **L'apostrophe en tête d'une valeur est voulue.** Mesuré sur Excel 16 en
  français, à l'ouverture directe : « 2/4 » — une option du volume de chasse
  des WC — devient le 2 avril, « 0123 » perd son zéro, un numéro de seize
  chiffres ses derniers chiffres, « 5E3 » vaut 5000, « - fuite » s'affiche
  « #NOM? », sans que rien le signale. `reinterpreteParExcel()` protège ces
  textes et eux seuls : un nombre simple et une date complète sont relus à
  l'identique. Restent converties, sans perte, les dates écrites en lettres
  (« mars 2024 »).

Un caractère absent de cp-1252 (un émoji) devient « ? » et l'écran le dit ; les
espaces et tirets typographiques ont un équivalent
([cp1252.ts](src/app/core/utils/cp1252.ts)).

`npm run check:csv` porte la garantie : il remplit chaque champ de chaque fiche
du schéma réel, y ajoute ce que le schéma ignore, énumère les feuilles du JSON
par son propre parcours et exige une ligne pour chacune — puis recommence avec
un schéma amputé, puis vide. *Vérifié en le cassant : sans le dépliage des clés
inconnues, il signale 104 valeurs manquantes.*

---

## 6. Plans et localisation

- Les plans sont chargés **depuis l'accueil** et communs à tout l'audit.
- **Formats acceptés : images et PDF.** Un PDF est *rasterisé au chargement*
  (une page = un plan), car un PDF ne s'affiche pas dans une `<img>` et un
  `<embed>` isole les clics — impossible d'y poser une punaise.
- Les coordonnées de punaise sont des **fractions (0 à 1)**, jamais des pixels :
  la punaise doit rester juste en vignette, en plein écran et à l'impression.
- **Les pièces y sont posées comme les éléments** (§3bis) : supprimer un plan
  purge aussi leurs punaises, et un import réécrit aussi les leurs.

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
en tête de la page Piscines. Le
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
| [sections-visibles.ts](src/app/qte/sections-visibles.ts), [affichage.ts](src/app/qte/affichage.ts) | Règles partagées par le tableau de bord et la page d'une pièce (§3bis) |

**Deux entités de la V2 n'ont plus d'onglet en V3.** Le *réducteur de
pression* est replié en bloc conditionnel dans la fiche Compteur général (six
champs sur dix-sept survivent) : `Qte.reducteurs_de_pression` n'est plus lu.
Le *surpresseur*, conservé un temps avec ses champs figés de la V2, a été
**retiré** à la demande de Victor Ledoux (2026-09) ; `Qte.surpresseurs` n'est
plus lu. Le mécanisme `CHAMPS_FIGES` / `horsClasseur` reste, vide.

### Retour de test de Victor Ledoux (2026-09)

Le support est dans `MAJ/retours/2026-09-16-victor-ledoux-test-html.txt`. Chaque
correction est sourcée dans le code, et **le générateur s'arrête si l'une ne
retrouve plus sa cellule** :

| Demande | Où |
|---|---|
| Indications entre parenthèses perdues | `decouperLibelle()` (gen-schema) → `FieldDef.help` |
| Légendes « Bon / Moyen / Mauvais état », « fort / moyen / faible » | `lireFiche().legendes`, rattachées dans gen-schema → `FieldDef.legend` |
| Choix multiples (« à cocher ») | `MULTI_RE`, `MULTIPLES_IMPOSES` → `FieldDef.multiple`, valeur `string[]` |
| Exigences corrigées (réseau ECS, limiteur, combustible, DN) | `REQUIREMENT_OVERRIDES` |
| Unités (%, minutes), listes (matériaux du bassin, période d'arrosage) | `UNIT_OVERRIDES`, `OPTION_OVERRIDES` |
| Trois mesures de débit calculées | `MESURES_DEBIT` → `kind: 'mesures-debit'`, `debitCalcule()` |
| Photos des types (jets, émetteurs, WC, gouttières, chéneaux) | `ILLUSTRATIONS` (lib/classeur) → `gen-illustrations.js` → `illustrations.ts` |
| Champ libre sur « Autre » | `audit-field`, stocké sous `<clé>Autre` (`cleAutre()`) |
| Rubriques masquées selon le type, le bouclage, les usages | blocs de `ENTITIES`, `blocActif()` |
| Totaux en tête des listes | `src/app/qte/totaux.ts` |
| Compteur général répétable | `ENTITIES` sans `single`, conversion dans `DataService` |
| Traçage (réseau ECS), blocs « Autre » | `CHAMPS_AJOUTES` |
| « Emplacement » en double (structure) | `CHAMPS_RETIRES` |
| Localiser sur plan à côté de l'emplacement | `entity-form` (`locatorApres`) |
| Arriver en haut de page | `withInMemoryScrolling` dans `main.ts` |
| Bouton de téléchargement absent sur Chrome de bureau | `self-extract.ts` ignore les ressources d'extensions |

Les totaux « fiches + équipements identiques » suivent la règle telle que
Victor l'a formulée ; le détail du calcul est affiché, pour qu'on voie tout
de suite si « équipements identiques » compte déjà l'élément lui-même.

### Second retour de test (2026-10)

Mêmes tables, même garde-fou — `CHAMPS_RETIRES` compris, qui n'en avait pas.

| Demande | Où |
|---|---|
| « Continuité de l'isolation » retirée (réseau ECS) | `CHAMPS_RETIRES` |
| « Autre » dans les utilisateurs des WC, les matériaux du bassin | `OPTION_OVERRIDES` |
| Fréquence d'utilisation par utilisateur coché (WC) | `CHAMPS_PAR_OPTION` → `FieldDef.parOption` |
| Colonne « Type de gestion des eaux pluviales » retirée de la liste | `cols` de `ENTITIES` |
| « Autre information » et « Autre utilisation » cochables ensemble | `MULTIPLES_IMPOSES` |
| Coquilles des indications (descentes, ventilation) | `LABEL_FIXES` |

Deux demandes n'appelaient aucune modification, vérifié dans Chrome :
arrosage et nettoyage se cochaient déjà ensemble, et la seule parenthèse des
« Remarques » du réseau ECS que porte le classeur — « (circulateur double, …) »
— s'affiche, mais dans la sous-partie bouclage, donc seulement à « Oui ».

### Première visite terrain (2026-10)

Le support est dans `MAJ/retours/2026-10-16-premiere-visite-terrain.md`, les arbitrages dans
[MAJ/realisations/2026-11-08-pieces-archive-images.md](MAJ/realisations/2026-11-08-pieces-archive-images.md).

| Demande | Où |
|---|---|
| Intégrer un JSON dans l'audit en cours (deux auditeurs, un bâtiment) | [fusion.ts](src/app/core/utils/fusion.ts), `DataService.prepareMerge` / `applyMerge`, `fusion-audit` (§5) |
| Avancer par pièce plutôt que par type d'équipement | `AppData.Pieces`, clé `Piece`, `piece-manager`, `#/pieces` (§3bis) |
| Bâtiment → pièces → points d'eau (établissements à plusieurs bâtiments) | `AppData.Batiments`, clés `Batiment` et `Piece`, `batiment-manager` (§3bis) |
| Déplacer une ligne dans une liste | `DataService.moveEntity` — **les numéros ne suivent pas** : `Numero` est un libellé noté sur place, et les renvois désignent l'`Id` (§3) |
| Voir d'un coup d'œil ce qui reste à remplir | colonne « État » d'`entity-list` : champs obligatoires restants, via `champsManquants()`, et présence d'une photo |
| Télécharger les photos déjà prises en passant en « fichiers voisins » | `DataService.telechargerPhotosVoisines`, par un bouton — un téléchargement multiple demande l'accord du navigateur |
| Dictée muette sur un Android sans services Google (/e/OS) | `SpeechService.MOTEUR_ABSENT` : trois codes d'erreur rendent la dictée **durablement** indisponible, sur tous les champs, avec le message qui dit quoi faire (§7) |
| Photos mal affichées jusqu'au rechargement de la page | `PhotoEditorComponent.source` (§4) |

### Demandes complémentaires (2026-11-08)

| Demande | Où |
|---|---|
| Chemin d'une photo = dossier de la page + dossier de l'audit + fichier | `cheminPhoto()`, `dossierAudit()` (§4) |
| Archive : l'application à la racine, un dossier par audit | `ArchiveService`, [zip.ts](src/app/core/utils/zip.ts) (§5) |
| Garantir qu'une photo reste enregistrée autrement que par son chemin | binaire en base, bandeau « hors sauvegarde », compte à l'export (§4) |
| Restructurer le suivi des mises à jour | `MAJ/` — voir [MAJ/AVANCEMENT.md](MAJ/AVANCEMENT.md) |

### Deux migrations V3 ont été menées en parallèle

Le 2026-08-24 sur un poste, le 2026-09-14 sur un autre, sans que l'une sache
rien de l'autre. Elles ont été fusionnées le 2026-09-16 ; chaque arbitrage est
consigné dans [MAJ/realisations/2026-09-16-fusion-origin-main.md](MAJ/realisations/2026-09-16-fusion-origin-main.md). À lire avant de
toucher à l'exigence des champs, au surpresseur ou à la validation : plusieurs
choix y défont explicitement ce qu'une des deux versions avait écrit.

⚠️ **`audit-schema.ts` est généré : ne pas l'éditer à la main.** Il se régénère
depuis `audit_technique.xlsx` — voir [tools/README.md](tools/README.md). Une
modification manuelle serait perdue à la prochaine régénération. Pour changer un
champ, corriger le classeur ; pour changer une liste de valeurs, `value-lists.ts`.

**Régénérer ne perd pas les corrections déjà apportées**, et c'est important de
le savoir avant de toucher au classeur. Le générateur ne lit pas que le
classeur : il applique par-dessus des tables de corrections tenues à la main —
`REQUIREMENT_OVERRIDES`, `OPTION_OVERRIDES`, `UNIT_OVERRIDES`,
`MULTIPLES_IMPOSES`, `CHAMPS_PAR_OPTION`, `CHAMPS_RETIRES`, `CHAMPS_DETACHES`,
`HELP_OVERRIDES` (`gen-schema.js`), `ENTITIES`, `CHAMPS_AJOUTES`, `LABEL_FIXES`,
`MESURES_DEBIT`, `ILLUSTRATIONS`, `LEGENDES_AJOUTEES` (`lib/classeur.js`). Elles
vivent dans le dépôt, et portent les corrections des retours de test.

Et si une cellule bouge, **le générateur s'arrête** en nommant la cellule, au
lieu de produire un schéma amputé en silence. C'est le garde-fou à ne pas
retirer : il change une perte invisible en un échec bruyant. Voir
[MAJ/AVANCEMENT.md](MAJ/AVANCEMENT.md).

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
que chaque fiche reste validable. Un bloc inactif est **masqué à l'écran**
et dispensé de validation. Un bloc désigne un intitulé de premier niveau ou
une section ; le champ qui le commande n'y est jamais soumis. Les remarques
générales que le classeur range sous la dernière rubrique en sont détachées
(`CHAMPS_DETACHES`), sinon elles disparaîtraient avec elle.

⚠️ **Ces cellules occupent la place d'un libellé.** Non filtrées, elles
produisaient 406 faux champs — plus que de vrais — et, en s'intercalant entre
un libellé et sa note, faisaient perdre sa liste déroulante à 48 champs réels
sans rien signaler. Le tri des cellules vit dans
[tools/lib/classeur.js](tools/lib/classeur.js), partagé par le générateur et
les contrôles ; `check-coverage.js` le vérifie, sa rubrique « FAUX CHAMPS »
devant rester vide.

Routes : `#/qte/<route>` pour la liste — ou directement la fiche si l'entité est
déclarée `single` — et `#/qte/<route>/<Id>` pour un élément.

### Choix multiples et option « Autre »

Un champ `multiple` stocke un tableau et s'affiche en cases à cocher, quel que
soit le nombre d'options. Une chaîne seule, saisie quand le champ n'acceptait
qu'une réponse, est relue comme une case cochée. Une option « Autre » retenue
ouvre un champ libre, stocké sous `<clé>Autre` pour que la valeur du champ
reste une option de la liste.

« Autre » s'entend seul ou suivi de sa consigne (« Autre (préciser dans
remarques) »). **« Autres adultes » et « Autre information » sont des réponses
à part entière** : le motif d'origine, `^autres?\b`, leur ouvrait à tort le
champ de précision.

Un champ `parOption` ouvre en plus **un champ libre par option cochée** —
« Fréquence d'utilisation — Public extérieur » sur les utilisateurs des WC. Les
saisies sont stockées à part, sous la clé que le schéma déclare
(`FrequenceDUtilisation`), en `{ option: texte }`. Décocher une option retire
sa saisie : une fréquence sans son utilisateur n'a plus de sens à l'export.

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

Pour un choix simple, `audit-field` choisit seul, selon le nombre d'options : **moins de quatre**
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
npm run gen                   # régénère schéma, pages, illustrations, docs depuis le classeur
npm run check:coverage        # que contient le classeur que le schéma ignore ?
npm run build                 # fichier autonome, puis ouvrir index.html
npm run check:extract         # le fichier sait-il encore se reproduire ?
npm run check:smoke           # chaque écran se rend-il en file:// ?
npm run check:exigences       # chaque fiche est-elle validable ?
npm run check:csv             # tout le JSON se retrouve-t-il dans l'export CSV ?
npm run check:fusion          # réunir deux audits perd-il, ou double-t-il, quelque chose ?
npm run check:photos          # chemins des photos, et ordre des sources d'affichage
npm run check:zip             # l'archive produite s'ouvre-t-elle vraiment ?
npm run check:archive         # dépliée, la photo est-elle au chemin que le JSON annonce ?
```

`check:smoke` et `check:extract` cherchent Chrome dans quelques chemins usuels,
`/snap/bin/chromium` compris, et obéissent à `CHROME_PATH`.

`check:smoke` sait en outre **amorcer le stockage** avant de charger un écran,
et **relever l'état enregistré** après. C'est ce qui lui permet d'éprouver deux
choses autrement invisibles :

- les écrans qui n'existent que sur un audit rempli — la page d'une pièce
  n'existe pas sur un audit neuf, et sa route redirige ;
- **la lisibilité des audits anciens** : un audit rangé sous la clé mono-audit
  `sobrieau`, sans `Id` sur ses éléments, compteur général en objet,
  `EquipementsPresents` sans `UtilisationsEau`, ni pièces. Cinq écrans le
  chargent, et un sixième relit le `localStorage` après coup.

Ce dernier point mérite l'écran de relevé : une identité attribuée à un
élément ancien **ne change rien au tableau** — Angular rend la liste sans elle
— mais sans identité la fiche est inatteignable par son URL. *Vérifié en le
cassant : retirer l'attribution des identités ne fait tomber aucun écran, et
seul le relevé le signale.*

La page d'amorçage est écrite **à côté de la cible** et non dans `/tmp`, qu'un
navigateur en paquet confiné (snap, flatpak) ne voit pas.

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
10. `npm run check:csv` après toute évolution du modèle de données ou de
    l'export : une réponse absente du CSV manque à l'analyse sans que rien ne
    le signale.
11. `npm run check:fusion` après toute modification de la réunion de deux
    audits, du modèle de données ou de la numérotation : une fusion fautive
    écrase un relevé de terrain sans laisser de trace, et personne ne refera
    la visite pour s'en apercevoir.
12. Rattacher un point d'eau à une pièce, puis **supprimer la pièce** : la
    fiche doit rester dans la liste de son type, et le nombre d'éléments
    détachés doit avoir été annoncé.
13. En mode « fichiers voisins », ajouter une photo **sur un téléphone** : la
    vignette doit s'afficher immédiatement, sans recharger la page.
14. Ouvrir un audit **antérieur** à la version en cours — `check:smoke` en
    charge un, mais la variété des audits réellement en circulation dépasse ce
    qu'une graine peut représenter. Les sections visibles la veille doivent
    l'être encore (§8), et les fiches rester atteignables par leur URL.
15. `npm run check:zip` après toute modification de l'écrivain ZIP ou de
    l'archive : une archive mal formée ne se voit pas au moment de la produire,
    seulement à la réception.
15 bis. `npm run check:photos` après toute modification des chemins de photos
    ou de l'ordre des sources : une vignette finit toujours par s'afficher, par
    la source suivante — seuls le réseau et le cache gardent la trace de
    l'essai perdu.
16. `npm run check:archive` après toute modification de l'archive ou du chemin
    des photos : il pose un audit et une image dans le stockage d'un vrai
    navigateur, clique le bouton, déplie l'archive téléchargée, et exige que la
    photo s'y trouve **au chemin que le JSON annonce** — l'audit porte exprès
    un chemin périmé, pour vérifier que l'archive le réécrit. C'est le seul
    contrôle qui éprouve les trois bouts **ensemble** : chemin enregistré,
    arborescence produite, résolution du lien. Chacun peut être juste seul et
    faux à trois.

---

## 12. Suivi des mises à jour

`MAJ/` porte l'historique des demandes, et sa convention tient en trois
dossiers — décrite dans [MAJ/AVANCEMENT.md](MAJ/AVANCEMENT.md), qui est le
point d'entrée :

| Dossier | Contenu | Règle |
|---|---|---|
| `retours/` | Les éléments de retour **bruts**, tels que reçus | Jamais modifiés. C'est la seule pièce qu'on ne peut pas reconstituer. `retours-cumules.html` est le document vivant où les remarques s'ajoutent. |
| `to_do/` | Une fiche par retour : chaque demande, son état, et l'endroit du code où elle a abouti | Le document de travail — c'est là que vivent les réserves et les lectures tranchées. |
| `realisations/` | Les notes d'arbitrage : ce qui a été fait, et pourquoi plutôt qu'autrement | À lire avant de défaire quelque chose. |
| `classeurs/` | Les versions du classeur Excel dont le schéma est généré | `audit_technique.xlsx` est la version courante. |

Les trois raisons de cette séparation ont chacune été payées une fois :

- **Un retour reformulé perd sa demande.** « Pas pour le compteur général » ne
  se laisse lire que dans la phrase entière ; résumé en « ne pas afficher »,
  l'arbitrage aurait porté sur autre chose.
- **Un retour sans fichier se perd.** Le second retour de test (2026-10) est
  arrivé hors fichier : sa fiche ne contient que ce que le code atteste, et nul
  ne sait ce qu'elle oublie.
- **Une réalisation sans note se défait.** Plusieurs choix du projet annulent
  explicitement un choix antérieur pris à dessein ; sans la note, le suivant les
  rétablit de bonne foi.

Nommage `AAAA-MM-JJ-sujet` : les dossiers se trient d'eux-mêmes, et la date d'un
retour ne se confond pas avec celle de sa réalisation.

---

## 13. À savoir

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
