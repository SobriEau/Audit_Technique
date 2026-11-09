# Suivi des mises à jour

Point d'entrée du dossier `MAJ/`. Une ligne par série de demandes, de la plus
récente à la plus ancienne.

## ⚠️ Régénérer depuis le classeur ne perd pas les corrections

Crainte exprimée le 2026-11-09, et elle mérite une réponse écrite : **non**,
reprendre le classeur ne ramène pas le schéma à son état d'origine en effaçant
les corrections apportées depuis.

`audit-schema.ts` est généré, mais le générateur ne lit pas **que** le classeur.
Il applique par-dessus une couche de corrections tenues à la main, chacune
rattachée à la cellule qu'elle corrige :

| Table | Ce qu'elle porte | Où |
|---|---|---|
| `REQUIREMENT_OVERRIDES` | les exigences corrigées (réseau ECS, limiteur, combustible, DN) | `gen-schema.js` |
| `OPTION_OVERRIDES`, `UNIT_OVERRIDES` | listes de valeurs et unités ajoutées | `gen-schema.js` |
| `MULTIPLES_IMPOSES`, `CHAMPS_PAR_OPTION` | les choix multiples, la fréquence par utilisateur | `gen-schema.js` |
| `CHAMPS_RETIRES`, `CHAMPS_DETACHES`, `HELP_OVERRIDES`, `LABEL_FIXES` | retraits, rattachements, aides et coquilles | `gen-schema.js`, `lib/classeur.js` |
| `ENTITIES` (blocs conditionnels), `MESURES_DEBIT`, `ILLUSTRATIONS`, `LEGENDES_AJOUTEES`, `CHAMPS_AJOUTES` | rubriques conditionnelles, mesures de débit, photos de types, légendes, champs ajoutés | `lib/classeur.js` |

Ce sont ces tables qui portent les 148 corrections vertes. Elles sont dans le
dépôt, pas dans le classeur : `npm run gen` les réapplique à chaque fois.

**Et si une cellule bouge ?** Le générateur **s'arrête** avec le nom de la
cellule — « correction déclarée pour un champ introuvable », « bloc introuvable
parmi les sections ». Il ne produit pas un schéma amputé en silence. C'est le
garde-fou à ne pas retirer : il transforme une perte invisible en un échec
bruyant qu'on corrige en reprenant la table.

Trois contrôles doublent la garantie : `npm run check:coverage` (ce que le
classeur contient et que le schéma ignore), `npm run check:exigences` (chaque
fiche reste validable) et `npm run check:csv` (chaque réponse se retrouve à
l'export).

Corollaire pratique : **modifier le classeur se fait en lot, puis on régénère et
on relit ce que le générateur signale.** Jamais à la main dans
`audit-schema.ts`, qui serait écrasé.

---

## La convention, et pourquoi elle tient en trois dossiers

| Dossier | Contenu | Règle |
|---|---|---|
| `retours/` | Les **éléments de retour bruts**, tels que reçus | Jamais modifiés. Ni reformulés, ni corrigés, ni réordonnés. C'est la seule pièce qu'on ne peut pas reconstituer. `retours-cumules.html` est le document vivant où les remarques s'ajoutent au fil du temps ; les autres fichiers sont des pièces datées. |
| `to_do/` | Ce qu'on en a **tiré** : une fiche par retour, chaque demande avec son état et l'endroit du code où elle a abouti | Le document de travail. C'est ici qu'on coche, et ici qu'on écrit les réserves et les lectures tranchées. |
| `realisations/` | Les **notes d'arbitrage** : ce qui a été fait, et pourquoi ce choix plutôt qu'un autre | À lire avant de défaire quelque chose. Plusieurs de ces notes expliquent un choix qui en annule un précédent. |
| `classeurs/` | Les versions du **classeur Excel** dont le schéma est généré | `audit_technique.xlsx` est la version courante. Voir `tools/README.md`. |

Trois raisons à cette séparation, chacune payée une fois :

- **Un retour reformulé perd sa demande.** « Pas pour le compteur général » ne
  se laisse lire que dans la phrase entière ; une fiche de tâches l'aurait
  résumé en « ne pas afficher », et l'arbitrage aurait porté sur autre chose.
- **Un retour sans fichier se perd.** Le second retour de test (2026-10) est
  arrivé hors fichier : sa fiche de tâches ne contient que ce que le code
  atteste, et nul ne sait ce qu'elle oublie. C'est la raison d'être de
  `retours/`.
- **Une réalisation sans note se défait.** Plusieurs choix du projet annulent
  explicitement un choix antérieur pris à dessein ; sans la note qui le dit, le
  suivant les rétablit de bonne foi.

Un fichier est nommé `AAAA-MM-JJ-sujet` : les dossiers se trient d'eux-mêmes, et
une date de retour ne se confond pas avec sa date de réalisation.

---

## Le document cumulé, et ce qu'il reste

[retours/retours-cumules.html](retours/retours-cumules.html) rassemble les
remarques accumulées depuis le début. **Il se lit à deux régimes**, et les
confondre fausse tout le relevé :

| Partie | Régime | État |
|---|---|---|
| **Avant le titre « Victor »** — échange du 16/10, notes REX, formation d'Angers, audits de terrain | non annotée | c'est là qu'est le travail restant |
| **À partir de « Victor »** — 26 sections, une par onglet | **annotée en couleurs**, d'après la légende que le document porte lui-même | **148 items sur 149 sont verts**, donc traités |

La légende est celle de l'auteur : vert = traité, rouge = à traiter, jaune = à
vérifier partout, bleu = appel nécessaire. Elle est posée juste sous le titre
« Victor » et ne vaut que pour ce qui suit.

### Partie annotée — un seul point rouge

Les 148 verts correspondent aux deux fiches déjà tenues :
[2026-09-16-victor-ledoux.md](to_do/2026-09-16-victor-ledoux.md) et
[2026-10-second-retour-de-test.md](to_do/2026-10-second-retour-de-test.md).
Le seul item non vert est la **dictée vocale sur e/OS** — voir la fiche de
Victor.

Deux points rouges se trouvent après cette partie :

- **Export CSV**, alerte sur « ; » et guillemets dans un même champ :
  **vérifié, réglé** (fiche de Victor, « ajouts postérieurs ») ;
- **Remarques Martin Perrin**, quatre points sur les établissements à plusieurs
  bâtiments : [to_do/2026-11-multi-batiment.md](to_do/2026-11-multi-batiment.md).

### Partie non annotée — état au 2026-11-09

Dépouillée section par section, **chaque demande vérifiée contre le code** et
non contre le souvenir qu'on en avait. Relevé sur les quatre fiches qui en sont
issues (60 items) :

| | |
|---|---|
| **fait** | 33 |
| **tranché, rien à faire** (on garde, on abandonne, hors périmètre) | 5 |
| **sans objet** | 3, l'auteur les annote lui-même comme levées par le fonctionnement par pièce |
| **réglé ou probablement corrigé depuis** | 2 |
| **hors outil** | 1, et tout un volet de méthode d'audit |
| **à faire** | 9 |
| **à arbitrer** | 2 |
| **à reconfirmer** sur le terrain | 4 bugs dont le symptôme reste ambigu |

⚠️ Ces chiffres **ne couvrent que la partie non annotée**. Un premier relevé les
avait présentés comme l'état du document entier, ce qui donnait l'impression
qu'à peine huit demandes avaient été traitées — alors que 148 l'étaient, dans la
partie en couleurs.

### Ce qui a été fait le 2026-11-09

| Lot | Contenu |
|---|---|
| **Multi-bâtiment** | `bâtiment → pièces → points d'eau`, par renvois, rétrocompatible ([fiche](to_do/2026-11-multi-batiment.md)) |
| **Huit corrections du schéma** | ventilation « naturelle », « test impossible », « autre » aux appareils de lavage, zone et surface « véhicules », pilotage de l'arrosage à choix multiple, opportunités en recommandé, classes métrologiques 1–4, retrait du limiteur de débit sur les trois fiches |
| **Six champs nouveaux** | marque et pression du robinet, arrivée de l'eau chaude, pression au compteur général, temporisation des urinoirs, douchette des WC |
| **Quatre demandes d'ergonomie** | déplacer une ligne (↑ ↓), colonne « État » (champs obligatoires restants + photo), rattrapage des photos au changement de mode, dictée durablement signalée indisponible quand le moteur manque |

Les corrections de schéma passent par les **tables de correction** du générateur
(voir plus haut), jamais par le classeur : chacune reste rattachée au retour qui
l'a demandée, et `npm run gen` les réapplique. Le générateur s'est d'ailleurs
arrêté une fois pendant ce travail — une correction d'exigence pointait sur le
champ « limiteur de débit » que l'on venait de retirer. C'est exactement le
garde-fou décrit plus haut, et il a fonctionné.

### Les 9 « à faire », et pourquoi aucun n'est un oubli

**Quatre attendent le classeur**, parce qu'ils demandent un contenu à écrire
dans le document de référence, non une correction : l'onglet « chaufferie » et
ses rubriques, les points de vigilance, la ligne « carnet de chaufferie » des
documents collectés, et les illustrations des robinets de douche —
`gen-illustrations.js` découpe les images **du classeur**, il faut qu'elles y
soient d'abord.

**Deux attendent un arbitrage** : lier un ballon à un robinet et une douche à
deux cibles suppose d'avoir tranché la confusion ballon / réseau ; l'arrosage
des stades suppose de préciser la demande.

**Un demande un mécanisme nouveau** : la remarque par série de mesures de débit
oblige à étendre le type `mesures-debit` dans le modèle *et* dans le composant
de saisie, puis à l'éprouver à l'export. Le champ « Remarques » de la fiche
accueille le détail en attendant.

**Un est structurant et non arbitré** : dire, champ par champ, si l'on est
confiant de la réponse. C'est une seconde donnée par réponse, à décider avant
de coder.

**Un est impossible en l'état** : masquer « pente de toiture » seule. Un bloc
conditionnel agit sur une rubrique entière, et celle-ci porte aussi la surface
et le matériau ; la rubrique voisine mêle gouttières et chéneaux — or un chéneau
concerne précisément une toiture-terrasse. Il faut séparer les deux dans le
classeur, ou ajouter une condition par champ.

### Arbitrages rendus le 2026-11-09

| Arbitrage | Décision |
|---|---|
| Nom des photos | **on renomme** : nom unique lié à l'audit et à la seconde |
| Champs obligatoires en haut | **rien à faire** : on garde le format du classeur |
| Utilisations de l'eau en multi-bâtiment | **par établissement** |
| Photos sur une box | **abandonné** — ne fonctionne pas, test déjà fait |
| Supprimer « bec du robinet » | **on garde** le champ |
| Pré-remplir les opportunités | **abandonné** |
| Consommations globales d'eau et d'énergie | **hors périmètre** |

Deux arbitrages restent ouverts : la **confusion ballon / réseau** (quoi se
rattache à quoi, avant d'ajouter des renvois) et l'**adaptation de l'arrosage
aux stades** (à préciser avant de toucher au classeur).

### Attention en relisant le document brut

- Les **rouges de la partie non annotée** ne sont pas des tâches : ce sont les
  **questions de l'auteur aux auditeurs** (quel navigateur ? quel OS ? version
  du dépôt ou version téléchargée ?). Elles attendent une réponse de terrain,
  pas un développement.
- Les **surlignages** (rose, vert pâle, jaune pâle) sont une couche
  d'annotation distincte de la légende : l'auteur y répond en ligne — « ok mais
  je pense qu'il faut garder le fonctionnement par rubrique », « remarque qui
  n'existe pas si on arrive à un fonctionnement par pièce », « pas compris ».
  Un surlignage vert pâle **ne veut pas dire traité** : il marque trois
  demandes retenues qui restent à faire.

### Refaire le relevé

Le document est un export d'éditeur riche : les couleurs y sont des styles en
ligne. Pour le dépouiller de nouveau après un ajout, `tools/releve-retours.js`
le convertit en texte **en conservant les marqueurs** :

```bash
node tools/releve-retours.js            # le document, section par section
node tools/releve-retours.js --compte   # le décompte par section
```

Sans cela, une conversion naïve perd les couleurs — et c'est exactement ce qui a
produit le faux relevé mentionné plus haut.

### Fiches issues de ce document

- [to_do/2026-10-16-echange.md](to_do/2026-10-16-echange.md) — échange du 16/10
- [to_do/2026-10-06-formation-angers.md](to_do/2026-10-06-formation-angers.md) — formation d'Angers et retours des groupes (le plus volumineux)
- [to_do/2026-10-audits-terrain.md](to_do/2026-10-audits-terrain.md) — Stade le Parco, Camping Au port Punay, port de plaisance
- [to_do/2026-11-multi-batiment.md](to_do/2026-11-multi-batiment.md) — établissements à plusieurs bâtiments

---

## 2026-11-08 — Demandes complémentaires

Chemins de photos, archive complète, garantie sur le JSON d'export,
restructuration de ce dossier.

- Retour : [retours/2026-11-08-demandes-complementaires.md](retours/2026-11-08-demandes-complementaires.md)
- À faire : [to_do/2026-11-08-demandes-complementaires.md](to_do/2026-11-08-demandes-complementaires.md) — **4 / 4 faites, 2 avec réserve**
- Réalisation : [realisations/2026-11-08-pieces-archive-images.md](realisations/2026-11-08-pieces-archive-images.md)

Les deux réserves sont des **impossibilités mesurées**, pas des renoncements :
un navigateur aplatit les séparateurs de l'attribut `download` (donc ne crée pas
le sous-dossier), et le format RAR est propriétaire (donc l'archive est un
ZIP). Les deux sont documentées là où le code les subit.

## 2026-10-16 — Première visite terrain

Travail à deux sur un même bâtiment, relevé par pièce, affichage des photos.

- Retour : [retours/2026-10-16-premiere-visite-terrain.md](retours/2026-10-16-premiere-visite-terrain.md)
- À faire : [to_do/2026-10-16-premiere-visite-terrain.md](to_do/2026-10-16-premiere-visite-terrain.md) — **3 / 3 faites**
- Réalisation : [realisations/2026-11-08-pieces-archive-images.md](realisations/2026-11-08-pieces-archive-images.md)

## 2026-10 — Second retour de test

Six corrections du formulaire, et deux demandes sans objet.

- Retour : **support non conservé** — arrivé hors fichier
- À faire : [to_do/2026-10-second-retour-de-test.md](to_do/2026-10-second-retour-de-test.md) — **6 / 6 faites**

## 2026-09 — Retour de test de Victor Ledoux

Seize corrections sur la partie technique, le formulaire et la navigation.

- Retour : [retours/2026-09-16-victor-ledoux-test-html.txt](retours/2026-09-16-victor-ledoux-test-html.txt)
- À faire : [to_do/2026-09-16-victor-ledoux.md](to_do/2026-09-16-victor-ledoux.md) — **16 / 16 faites, 2 points laissés ouverts**
- Vérification : [realisations/2026-09-29-verification-retours-victor.md](realisations/2026-09-29-verification-retours-victor.md)

Les deux points ouverts : les **renvois multiples** (« Numéros des robinets
correspondants »), qui attendent un type `entity-ref-multi`, et l'**ajout de
photos sous Firefox**, non repris puisque la dictée impose déjà Chrome ou Edge.

## 2026-08/09 — Passage à la V3 du classeur, mené deux fois en parallèle

Deux migrations conduites sur deux postes sans que l'une sache rien de l'autre,
fusionnées le 2026-09-16.

- Arbitrages soumis : [realisations/2026-08-21-arbitrages-v3.md](realisations/2026-08-21-arbitrages-v3.md)
- Fusion : [realisations/2026-09-16-fusion-origin-main.md](realisations/2026-09-16-fusion-origin-main.md)

⚠️ **À lire avant de toucher** à l'exigence des champs, au surpresseur ou à la
validation : plusieurs choix y défont explicitement ce qu'une des deux versions
avait écrit à dessein.
