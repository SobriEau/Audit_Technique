# 2026-11-08 — pièces, travail à deux, photos, archive

Journal des choix faits pour réaliser deux séries de demandes :
[le retour de la première visite terrain](../retours/2026-10-16-premiere-visite-terrain.md)
(§1 à §6) et [les demandes complémentaires](../retours/2026-11-08-demandes-complementaires.md)
(§7 à §9). Chaque arbitrage est consigné avec sa raison, pour qu'on puisse le
contester ou le défaire.

Les choix marqués **⚠ à trancher** reposent sur une lecture de la demande qui
n'allait pas de soi : si la lecture est fausse, c'est là qu'il faut reprendre.

---

## 1. Ce qui était demandé

Trois points, relevés après la première visite terrain :

1. **Intégrer un JSON dans un audit en cours** — « pour les grands bâtiments
   deux auditeurs puissent se répartir les pièces à auditer ».
2. **Refactoriser les points d'eau par pièce** — définir les pièces sur les
   plans à la préparation, y déclarer les points d'eau présents, puis sur
   place entrer dans la pièce plutôt que d'enchaîner les fiches par type.
   « Les données restent dans le même format mais on ajoute juste à chaque
   élément une clé étrangère qui est la pièce correspondante. »
3. **Solidifier la gestion des images** — « sur mon téléphone s'affichent mal,
   je suis obligé de recharger la page pour que les liens relatifs se chargent
   correctement ».

---

## 2. Les pièces

### La pièce ne contient pas les points d'eau

La demande le dit, et c'était le bon choix : **une clé étrangère sur
l'élément**, et non les éléments rangés dans la pièce. `AppData.Pieces[]` d'un
côté, `Piece` sur chaque élément de l'autre (`CLE_PIECE`).

Ranger les éléments dans la pièce aurait changé la forme du JSON — or des
audits circulent déjà, et un export doit rester lisible par une version qui
ignore les pièces. Avec un simple renvoi, un audit sans pièces fonctionne
exactement comme avant, et un audit avec pièces reste lisible par l'ancienne
version : elle ignore une clé de plus.

### `Piece` n'est pas un champ du schéma

`audit-schema.ts` est **généré** depuis le classeur, qui ne décrit pas les
pièces : un champ ajouté à la main y serait perdu à la première régénération.
La clé est donc traitée comme `Photos` et `Localisation` le sont déjà —
déclarée dans `data.models.ts`, rendue à part par `entity-form`, habillée à
part par l'export CSV.

### Les deux entrées coexistent

**⚠ à trancher.** La demande dit « au lieu de rentrer élément par élément »,
ce qui se lit comme un remplacement. Les listes par type sont pourtant
conservées, pour trois raisons :

- sept entités ne sont pas dans une pièce — réseaux ECS, toitures, structure,
  ventilation, espaces extérieurs, opportunités, zone piscine ;
- un audit commencé avant n'a pas de pièces, et ses fiches deviendraient
  inatteignables ;
- une liste par type est le seul endroit où l'on voit qu'un point d'eau n'a
  **pas** de pièce — d'où la colonne « Pièce », qui n'apparaît que si l'audit
  en définit.

L'entrée par pièce est donc une carte de plus sur le tableau de bord
(« Avancer pièce par pièce »), pas un remplacement.

### Une pièce est un point sur le plan, pas un contour

**⚠ à trancher.** « Définir les pièces sur les plans » peut se lire comme
tracer leur contour. La pièce porte une `PlanLocation` — le même type qu'un
élément, donc la même punaise, le même dialogue, le même code déjà éprouvé sur
téléphone, et `purgePlanReferences` qui les traite ensemble.

Un contour (rectangle à deux touchers, ou polygone) se dessine mal sur un
téléphone et demanderait un éditeur à part. Si le contour est vraiment
attendu, c'est `Piece.Localisation` qu'il faut étendre — les écrans, eux, ne
changent pas.

### Le compteur général n'a pas de tableau dans la pièce

« En tableau quand c'est ce qui est fait actuellement, comme quand on rentrait
directement les robinets, **mais pas pour le compteur général** » : un bâtiment
n'en a qu'un, et un tableau d'une ligne pour y accéder serait une étape de plus
sans rien montrer. Sa fiche s'ouvre directement
(`PieceDetailComponent.SANS_TABLEAU`).

### Supprimer une pièce ne supprime pas ses points d'eau

On supprime une pièce pour réorganiser, pas pour effacer un relevé. Les
éléments sont **détachés** (`purgePieceReferences`) et restent dans la liste de
leur type. Le nombre d'éléments concernés est annoncé dans la confirmation,
parce que rien d'autre ne le laisserait devenir.

### Les types proposés dans une pièce suivent les usages déclarés

Même règle que le tableau de bord, extraite dans `sections-visibles.ts` pour
que les deux écrans ne puissent pas diverger : une divergence rendrait une
section atteignable d'un côté et pas de l'autre, sans rien signaler.

---

## 3. Le travail à deux

### En deux temps : calculer, montrer, puis appliquer

Une fusion porte sur des relevés de terrain qu'on ne refera pas.
`fusionner()` est une **fonction pure** : elle rend un audit neuf et un
rapport, sans toucher à ses arguments. L'écran montre ce qui sera fait — ajouts,
compléments, doublons, divergences, renumérotations — et rien n'est écrit avant
confirmation (`DataService.prepareMerge` / `applyMerge`).

### Trois sorts pour une fiche reçue

| Ce qu'on trouve sous la même identité | Ce qui se passe |
|---|---|
| rien | ajoutée, avec son identité et un numéro à la suite |
| la même fiche, moins remplie | **complétée** : les champs vides ici sont remplis, les photos réunies |
| la même fiche, remplie autrement | **ajoutée en double**, l'accueil n'est pas touché |

Le second cas est le plus courant — les deux auditeurs partent de la même base
préparée — et le dupliquer aurait été absurde. Le troisième n'est pas arbitré :
un doublon se supprime en deux clics, une saisie de terrain écrasée ne se
retrouve jamais. Le rapport nomme les champs en cause.

Les photos sont le seul champ **réuni** plutôt qu'arbitré : deux photos d'un
même robinet ne sont pas deux réponses concurrentes.

### L'identité fait foi, le numéro est refait

Le rapprochement se fait sur `Id` — pièces, plans, fiches — ce qui permet de
reconnaître la base préparée en commun au lieu de la recopier. Les deux listes
numérotant chacune à partir de 1, les éléments repris sont renumérotés à la
suite de ceux de l'accueil, et le rapport dit lequel est devenu lequel. Sans
risque : les relations entre fiches désignent l'`Id` (voir CLAUDE.md §3).

Au passage, `createEntity` ne numérote plus par le rang dans la liste mais par
le plus grand numéro plus un : après une suppression, le rang redonnait un
numéro déjà porté.

### Images : l'identifiant est conservé, sauf collision

Un identifiant libre est gardé tel quel — c'est ce qui permet de reconnaître
une image d'une intégration à l'autre, et de ne pas la recopier. Il n'est
changé que s'il désigne déjà **une autre** image du poste, sinon la reprise
écraserait une image étrangère au fichier reçu.

Le cas arrive vraiment : une fiche ajoutée en double porte les photos prises à
la préparation, que l'accueil possède déjà. Le doublon en reçoit **sa propre
copie**, pour que supprimer l'une des deux fiches n'efface pas les images de
l'autre (voir `DataService.deleteEntity`).

### Intégrer deux fois n'ajoute rien

L'auditeur peut se tromper de fichier, ou reprendre après une coupure. Un
doublon déjà posé est reconnu à son contenu (`memeContenu`, qui écarte
identité, numéro et photos) et n'est pas reposé. `check-fusion.js` l'éprouve.

**Limite connue** : un fichier antérieur aux identifiants (`ensureEntityIds`)
n'offre rien à reconnaître ; l'intégrer deux fois double ses fiches. Préférer
l'ancien chemin — « Charger depuis un fichier », qui crée un audit à part.

### Ce qui n'a pas été fait

- **Pas de fusion depuis le Drive.** `drive.pull` crée un audit à part, comme
  avant. Le geste existe, il suffirait de brancher `prepareMerge` sur le
  fichier récupéré.
- **Pas de fusion à trois voies.** Faute de connaître la base d'où les deux
  copies divergent, on ne peut pas distinguer « l'autre a modifié » de « j'ai
  modifié ». C'est ce qui justifie le doublon plutôt qu'un arbitrage.

---

## 4. Les images

### La cause

Le mode « fichiers voisins » affichait la vignette **depuis le fichier
téléchargé** (`photo.path`, premier dans l'ordre des sources). Or le
téléchargement n'est ni instantané ni notifiable : la vignette tombait sur un
fichier qui n'existait pas encore, le navigateur retenait l'échec, et il
fallait recharger la page. Sur téléphone, le fichier n'aboutit pas toujours
dans le dossier de la page.

Pire : `resolveAll()` **sautait** les photos qui portaient un chemin, si bien
qu'aucune URL d'objet n'était même résolue pour elles.

### Le correctif

L'ordre des sources est inversé : **le binaire local d'abord**, le fichier
voisin ensuite, le Drive en dernier. Le binaire est déjà en base avant que la
vignette soit rendue — il est écrit dans les deux modes, et l'était déjà avant
ce correctif. L'affichage ne dépend donc plus d'un téléchargement.

La cascade d'échecs a été reprise au passage : une source mise en échec est
**écartée** (`echoues`) au lieu d'être réessayée, de sorte que chaque échec
retire exactement une piste et que le parcours est fini.

Le chemin relatif n'est pas abandonné : il reste dans l'audit, il sert à
retrouver les photos dans l'explorateur de fichiers et de secours si le
navigateur vide ses données. Le texte d'aide de l'accueil le dit maintenant
ainsi — il annonçait un allègement de l'export qui n'a jamais eu lieu, le
binaire étant conservé en base de toute façon.

---

## 5. Contrôles

| Commande | Ce qu'elle garantit | État |
|---|---|---|
| `npm run check:fusion` | **nouveau** — la réunion ne perd rien et ne double rien | passe |
| `npm run check:csv` | tout le JSON se retrouve dans le CSV, pièces et renvois compris | passe |
| `npm run check:smoke` | chaque écran se rend en `file://`, **page d'une pièce comprise** | passe |
| `npm run check:extract` | le fichier autonome sait toujours se reproduire | passe |
| `npm run check:exigences` | chaque fiche reste validable | passe |
| `npm run check:coverage` | inchangé — le schéma n'a pas bougé | passe |

Deux contrôles ont été corrigés pour pouvoir tourner ailleurs que sur le poste
d'origine :

- **`check-csv.js` relisait le fichier avec `TextDecoder('windows-1252')`.** Un
  Node compilé sans ICU complète (`small-icu`, le cas de bien des paquets
  système) laisse tomber silencieusement toute la plage 0x80–0x9F : « cœur
  d'îlot — 12 € » revenait « cur dîlot  12  », et le contrôle signalait
  **181 échecs sur un encodeur parfaitement juste**. Le script porte désormais
  sa propre table de décodage, écrite d'après la table publiée — une seconde
  implémentation, comme les règles d'Excel plus bas dans le même fichier.
  *Vérifié en cassant l'encodeur : 25 échecs remontent.*
- **`smoke-test.js` écrivait sa page d'amorçage dans `/tmp`.** Un navigateur
  installé en paquet confiné (snap, flatpak) ne voit pas le `/tmp` de l'hôte :
  la graine passait inaperçue et les écrans amorcés retombaient sur un audit
  vide. Elle est maintenant écrite à côté de la cible. `/snap/bin/chromium` a
  été ajouté aux chemins cherchés, ici et dans `check-extract.js`.

`check:smoke` sait désormais **amorcer le stockage** avant de charger un écran,
et **relever l'état enregistré** après. L'amorçage repose sur le partage du
`localStorage` entre pages `file://` d'un même profil — mesuré de nouveau à
cette occasion, et donc éprouvé à chaque passage.

## 6. Les audits anciens restent-ils lisibles ?

C'est la question qu'il fallait poser, et elle n'était d'abord traitée que par
raisonnement. Six écrans l'éprouvent maintenant sur un audit qui cumule tout ce
que les versions successives ont laissé derrière elles : rangé sous la clé
mono-audit `sobrieau`, adresse en texte enrichi, aucun `Id` sur les éléments,
compteur général en objet, `EquipementsPresents` sans `UtilisationsEau`,
`Qte.Localisations`, et bien sûr ni `Pieces` ni clé `Piece`.

| Ce qui est éprouvé | Comment |
|---|---|
| L'ancienne clé est reprise dans le registre | `#/accueil` affiche l'adresse de l'audit ancien |
| L'ancien régime d'affichage tient | `#/qte` montre deux sections **vides** que la règle V3 masquerait |
| La fiche unique devient une liste | `#/qte/compteur-general` affiche la saisie, et non « Aucun élément » |
| Les identités sont attribuées **et enregistrées** | écran de relevé, qui relit le `localStorage` |
| Rien de ce qui touche aux pièces ne s'affiche à vide | colonne « Pièce » absente, `#/pieces` invite à en définir |

Deux de ces écrans ne prouvaient d'abord rien, et c'est instructif :

- `#/qte` attendait « Points d'eau intérieurs », une section que l'audit
  ancien **remplit** — or une section non vide reste affichée sous les deux
  régimes. L'attente porte maintenant sur deux sections vides.
- la liste des robinets ne pouvait pas révéler une identité manquante :
  Angular rend une liste même avec deux clés de suivi identiques. D'où l'écran
  de relevé, qui regarde ce qui a été **écrit**.

Reste vérifié par lecture seule, faute de pouvoir amorcer IndexedDB depuis une
page voisine : l'affichage des photos d'un audit ancien dont le binaire a
disparu. La cascade retombe sur le chemin relatif, comme avant le correctif.
Le point 4 de CLAUDE.md §11 — export puis import sur un profil vidé — reste un
essai à la main.

---

## 7. Le chemin d'une photo

Demandé : le lien relatif doit être le dossier de la page, puis un sous-dossier
au nom de l'audit, puis la photo. C'est fait — `./<dossier-de-l-audit>/<fichier>`
(`cheminPhoto`) — avec une impossibilité à connaître.

### Un navigateur ne crée pas ce sous-dossier

**Mesuré**, sur Chromium 141, en pilotant le protocole DevTools — seul moyen
d'autoriser un téléchargement en mode sans fenêtre, les autres approches ne
téléchargeant rien du tout. Trois noms demandés, trois noms obtenus :

| Demandé dans `download` | Écrit sur le disque |
|---|---|
| `sobrieau-plat.txt` | `sobrieau-plat.txt` |
| `sobrieau-sous-dossier/dans-le-dossier.txt` | `sobrieau-sous-dossier_dans-le-dossier.txt` |
| `./sobrieau-point/relatif.txt` | `_sobrieau-point_relatif.txt` |

L'attribut **aplatit** les séparateurs. C'est une règle d'assainissement du
navigateur, pas un réglage : aucun contournement ne la lève.

### Deux emplacements, et lequel vient d'abord

Un même fichier existe donc à deux endroits selon le moment, et il faut tenir
les deux :

| Quand | Où | Rôle |
|---|---|---|
| Pendant l'audit | à plat, dans le dossier de téléchargement, à côté de la page | le **cas normal** — le navigateur n'a pas d'autre choix |
| Après l'archivage | au chemin enregistré, dans le dossier de l'audit | le **repli**, qui permet de réunir le travail de plusieurs auditeurs sans collision |

L'affichage essaie donc le fichier **à plat avant** le sous-dossier. Un premier
jet faisait l'inverse : c'était échouer à chaque affichage sur le poste de
l'auditeur pour réussir sur un cas qui n'arrive qu'après. Corrigé après
précision de la demande, et l'ordre est désormais une **fonction pure**
(`sourcePhoto`) tenue par `npm run check:photos` — la même fonction désigne la
source et l'écarte quand elle échoue, si bien qu'elles ne peuvent pas diverger.

C'est aussi ce qui donne tout son sens aux huit caractères d'identité dans le
nom de dossier (§7, plus bas) : sans eux, réunir deux archives mélangerait les
photos de deux bâtiments homonymes.

### L'API File System Access existe, et n'a pas été retenue

`showDirectoryPicker` est bien **présent en `file://`**, et
`window.isSecureContext` y vaut `true` (mesuré de nouveau). Elle saurait écrire
dans un dossier choisi. Deux raisons de ne pas la prendre :

- elle est **absente de Chrome sur Android**, c'est-à-dire de l'appareil de
  terrain — celui qui a motivé la demande ;
- elle impose un sélecteur de dossier, et une origine opaque n'a pas de fiche de
  permissions : l'autorisation serait à redonner à chaque ouverture, comme pour
  la caméra (CLAUDE.md §4).

Si un jour l'audit se fait sur ordinateur, c'est la voie à reprendre.

### Le dossier porte aussi huit caractères de l'identité

`dossierAudit()` compose `nom-de-l-audit-a1b2c3d4`. Deux audits peuvent très
bien s'appeler « École Jean Moulin », et leurs photos se mélangeraient dans un
même dossier.

Un renommage de l'audit ne réécrit pas les chemins déjà enregistrés — ce serait
toucher à des dizaines d'enregistrements pour un libellé. C'est **l'archive qui
réécrit** chaque chemin sur le dossier qu'elle a réellement créé.

---

## 8. L'archive

Demandé : un bouton d'export en RAR plaçant `index.html` à la racine et, pour
chaque audit en mémoire, un dossier à son nom contenant ses photos et son JSON.
Fait — en ZIP.

### Pourquoi pas RAR

Le format RAR est **propriétaire** : son algorithme de compression n'est pas
publié, et aucune bibliothèque JavaScript ne sait en *écrire* — celles qui
existent ne font que lire. Ce n'est pas une difficulté qu'on contourne, c'est
une impossibilité. ZIP rend le même service : un fichier unique, une
arborescence dedans, et un double-clic suffit sous Windows comme sous macOS.

### Pourquoi un écrivain écrit à la main

Le livrable est un **fichier autonome** : toute dépendance y est inlinée et
pèse sur les deux mégaoctets que les auditeurs téléchargent.
[zip.ts](../../src/app/core/utils/zip.ts) tient en deux cents lignes, et la
compression vient du navigateur — `CompressionStream('deflate-raw')` est
présent en `file://` (mesuré). Faute d'elle, les fichiers sont stockés tels
quels : l'archive est plus grosse, elle s'ouvre pareil. Un JPEG est stocké sans
tentative de compression — elle ne gagne rien et coûte le parcours de chaque
octet, ce qui se sent sur cent photos.

Pas de ZIP64 : au-delà de 65 535 fichiers ou de 4 Go, l'archive est **refusée**
avec un message. Produire une archive qu'aucun outil n'ouvrirait serait pire.

### Les photos viennent de la base, pas des fichiers voisins

« Toutes les photos depuis les liens relatifs » n'est pas réalisable à la
lettre : une page `file://` ne peut pas lire ses voisins — `fetch` y est refusé,
mesuré de nouveau à cette occasion. Le binaire est de toute façon en base dans
les deux modes de rangement : c'est la même image. La demande est donc respectée
pour l'**arborescence produite**, pas pour la **source lue**.

### Les images dans le JSON, sur une case à cocher

Un arbitrage avec deux bonnes réponses, donc exposé : coché (par défaut), chaque
dossier d'audit est réutilisable seul — son `audit.json` s'importe ailleurs sans
ses fichiers voisins ; décoché, l'archive est deux fois plus légère mais un JSON
sorti de son dossier a perdu ses images.

Un `LISEZ-MOI.txt` est posé à la racine : une archive sans notice se devine mal,
et c'est là que se dit la différence entre les deux cas.

---

## 9. « Enregistrées plus que sous la forme du chemin »

C'était déjà vrai — `ajouterCommeFichier` écrit le binaire en base avant de
déclencher le téléchargement, et `buildExportPayload` embarque toutes les images
référencées en base64. Mais rien ne le **montrait**, et rien ne signalait l'écart
si le binaire venait à manquer.

Deux garde-fous ajoutés, pour que l'écart se voie au lieu de se découvrir à la
réception :

- la vignette d'une photo dont le binaire a disparu porte un bandeau rouge
  « hors sauvegarde », et la galerie compte ces photos en tête ;
- `exportJson` **rend** le nombre d'images qu'il n'a pas pu embarquer, et
  « Sauvegarder l'audit » l'affiche.

Le texte d'aide du mode « fichiers voisins » a été corrigé : il annonçait un
allègement de l'export qui n'a jamais eu lieu, le binaire étant conservé en base
de toute façon.

---

## 10. Contrôles ajoutés

| Commande | Ce qu'elle garantit |
|---|---|
| `npm run check:zip` | L'archive s'ouvre : produite avec des contenus pénibles — accents, sous-dossiers, fichier vide, binaire incompressible, noms en double — puis relue par **`unzip`**, un lecteur indépendant, octet par octet. *Vérifié en le cassant : somme de contrôle faussée, décalage d'index faussé ou bit UTF-8 retiré font refuser l'archive.* |
| `npm run check:archive` | La chaîne entière, dans un vrai navigateur : un audit et une image sont posés dans le stockage, le bouton est cliqué, l'archive téléchargée est dépliée, et la photo doit s'y trouver **au chemin que le JSON annonce**. |
| `npm run check:photos` | Les deux règles invisibles : l'unicité du dossier d'un audit, et l'**ordre des sources d'affichage** — à plat avant le sous-dossier. *Vérifié en le cassant : remettre le sous-dossier devant remonte 4 échecs ; retirer l'identité du nom de dossier en remonte 2.* |

Le second est le seul à éprouver ce qui a motivé toute cette partie : que le
lien relatif tombe juste. Les deux autres bouts — le chemin enregistré et
l'arborescence produite — peuvent être justes séparément et faux ensemble.
