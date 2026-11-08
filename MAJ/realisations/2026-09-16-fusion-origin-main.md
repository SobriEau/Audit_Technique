# Fusion des deux migrations V3 — choix faits

Journal de la fusion du 2026-09-16 entre le travail local non commité et
`origin/main`. Chaque écart entre les deux versions y est consigné avec la
décision prise et sa raison, pour qu'on puisse la contester ou la défaire.

Les choix marqués **⚠ à valider** défont explicitement quelque chose que l'une
des deux versions avait écrit à dessein.

---

## 1. Ce qui s'est passé

Deux migrations vers la V3 du classeur ont été menées **en parallèle, sur deux
postes, sans que l'une sache rien de l'autre** :

| | Local | `origin/main` |
|---|---|---|
| Date | 2026-08-24, puis arbitrages (`arbitrages-v3.md`) | 2026-09-14 |
| État | non commité, sur `main` resté à `847c7d7` | commits `366a323` et `65e1f5c` |
| Apport principal | lecture partagée du classeur (`tools/lib/classeur.js`), sections, exigence rattachée en deux passes, écrans Documents / Glossaire / zone piscine, refonte des cases de l'accueil | niveau de remplissage, volet des champs masqués, validation bloquante des champs obligatoires, surpresseur conservé |

Base commune : `847c7d7`. Aucun commit local n'était en avance ; tout le travail
local tenait dans l'arbre de travail.

## 2. Méthode

1. **Sauvegarde** de l'arbre de travail complet, fichiers non suivis compris,
   dans la branche locale `sauvegarde/v3-local-avant-fusion` (`b03a9c0`), sans
   toucher à `main` ni aux fichiers.
2. **Fusion à trois voies** de cette sauvegarde avec `origin/main`, base
   `847c7d7`, sur une branche de travail supprimée depuis. Douze conflits,
   dont deux binaires.
3. Résolution **par conception, pas par fichier** : pour chaque sujet, une
   version de référence et ce qu'on y porte de l'autre (§3).
4. Correction des incohérences que la fusion a révélées ou créées (§4).
5. Régénération complète et contrôles (§6).
6. **Résultat laissé non commité sur `main`, avancé à `origin/main`** : même
   situation qu'avant la fusion — un `main` local sans divergence, et des
   modifications à relire puis commiter.

Rien n'a été poussé.

---

## 3. Choix de conception

### F1 — Le classeur `audit_technique.xlsx`

| `origin/main` | Local |
|---|---|
| enregistré par Victor Ledoux, 2026-08-24 07:22 UTC | enregistré par Sacha Mailler, 2026-08-24 07:54 UTC |

**Choix : la version d'`origin/main`.** Comparaison exhaustive des deux
extractions : 0 cellule, 0 note, 0 fusion, 0 style différent. Seul le
réenregistrement les distingue. Garder la version déjà versionnée évite de
remplacer un binaire de 2 Mo pour rien. Idem pour la copie archivée
`260821- volet technique - audit_V3_allégée_logiciel.xlsx`.

### F2 — Le nom de l'exigence : `requirement`

| `origin/main` | Local |
|---|---|
| `FieldDef.requirement`, type `FieldRequirement` | `FieldDef.priority`, type `Priority` |

Mêmes trois valeurs, tirées des mêmes cellules. **Choix : `requirement`**, déjà
publié sur `origin/main`, et plus exact depuis que la donnée pilote une
validation. Le vocabulaire local a été renommé partout : modèle, générateur,
`lib/classeur.js` (`requirementOf`), contrôles, `documents-collectes.ts`. Les
classes CSS `.priority--*` gardent leur nom : elles désignent la pastille, pas
la donnée.

### F3 — L'affichage de l'exigence : une seule pastille orange ⚠ à valider

| `origin/main` | Local |
|---|---|
| badge **neutre** « Obligatoire » **plus** l'ancienne pastille orange curée à la main (`FIELD_PRIORITY`, une entrée : « Priorité : haute » sur `Emplacement`) | pastille **orange** « Obligatoire / Recommandé / Facultatif » tirée du classeur ; table curée vidée |

Après fusion automatique, `audit-field` affichait **les deux** sur chaque champ :
« Priorité : haute » puis « Obligatoire » sur l'emplacement.

**Choix : une seule pastille, orange, lisant `requirement`.** `FIELD_PRIORITY`
est supprimée.

Raison : `origin/main` voulait séparer « jugement éditorial curé à la main » et
« donnée du classeur qui pilote une validation ». Mais la table curée n'était
qu'un bouche-trou en attendant que le classeur fournisse l'information — ce
qu'il fait depuis la V3, pour chaque question — et la même valeur affichée deux
fois ne distingue rien. La crainte de confondre exigence et erreur est levée
par la palette : orange pour l'exigence, rouge réservé à l'encadré des champs
obligatoires manquants. L'orange en dégradé est une demande explicite de la
revue KAPT (`to_do.md`), confirmée lors des arbitrages.

*Pour défaire :* rendre `requirementLabel` en `.badge-neutre` dans
`audit-field.component.html`.

### F4 — Le rattachement de l'exigence : deux passes

| `origin/main` | Local |
|---|---|
| même ligne que le libellé seulement ; les lignes de marqueurs dédiées (Bassin1, Extérieur1) sont abandonnées à dessein | même ligne, puis ligne voisine dédiée ; éprouvé sans aucun rattachement faux |

**Choix : deux passes.** 448 champs portent une exigence, contre 374. La crainte
exprimée côté `origin/main` — « une majorité correcte et une exception
silencieuse » — est couverte par `check-coverage.js`, qui signale toute priorité
non rattachée : il n'en reste aucune.

### F5 — Le générateur : lecture partagée du classeur

| `origin/main` | Local |
|---|---|
| générateur V2 adapté ; titres exclus par une liste de mots (`SECTION_HEADER_RE`) | `tools/lib/classeur.js` : sections lues aux styles, cellules techniques, en-tête borné par « Numéro », champs ajoutés, coquilles |

**Choix : la version locale.** Le schéma d'`origin/main` contenait encore une
quinzaine de **faux champs**, rendus comme des zones de saisie : les titres
d'onglet « Réseau de distribution d'Eau Chaude Sanitaire » et « Production /
Stockage d'Eau Chaude Sanitaire », les titres de section « Réglage »,
« Utilisation(s) », « Surfaces nettoyées » (en champ numérique), les lignes de
légende « Mauvais état » et « équipement ancien, fuite permanente… », le titre
« Ventilation » de l'onglet Ventilation1, et une question que les auteurs se
posaient en marge (« pour les piscines individuelles, faut-il ajouter… »). Il
laissait aussi 41 listes « oui / non » en texte, que la version locale convertit
en booléens.

Repris d'`origin/main` : le repli des champs figés du surpresseur (F6).

### F6 — Le surpresseur : conservé ⚠ à valider

| `origin/main` | Local |
|---|---|
| conservé, champs figés de la V2 (`LEGACY_FIELD_LINES`), masqué par défaut, réactivable d'une case | supprimé du schéma |

**Choix : conservé.** C'est la décision la plus récente, et la plus prudente :
conserver ne perd rien, supprimer efface `Qte.surpresseurs` des audits qui en
porteraient. La table est renommée `CHAMPS_FIGES` et vit dans
`lib/classeur.js` ; l'entité est marquée `horsClasseur`.

La suppression locale n'avait jamais été arbitrée explicitement — elle
découlait du choix « tout le classeur V3 ». Si le surpresseur doit
disparaître, il suffit de retirer son entrée d'`ENTITIES` et de `CHAMPS_FIGES`.

### F7 — Le réducteur de pression : retiré

Les deux versions concordent : fiche à part retirée, contenu repris en bloc
conditionnel dans le compteur général (décision Sacha, 2026-09). Rien à
arbitrer.

### F8 — Le niveau de remplissage : conservé, porté sur les sections

Apport d'`origin/main` seul (Complet / Allégée / Minimale, sur l'accueil).
**Conservé.** Il filtrait les deux tronçons de fiche avant et après la
localisation ; il filtre désormais les champs **à l'intérieur de chaque
section**, et une section entièrement masquée disparaît — sauf si elle porte la
localisation sur plan.

### F9 — Le volet des champs masqués : conservé

Apport d'`origin/main` seul. **Conservé tel quel.** La liste des champs masqués
est calculée par `champsMasques()` (`src/app/qte/exigences.ts`).

### F10 — La validation bloquante : conservée, restreinte aux blocs actifs

Apport d'`origin/main` seul. **Conservée, mais corrigée** — voir I1, c'était un
défaut bloquant.

### F11 — Les cases de l'accueil du projet

| `origin/main` | Local |
|---|---|
| cases d'**équipements** dérivées du schéma, tout coché par défaut, `MASQUE_PAR_DEFAUT` pour le surpresseur | dix cases d'**utilisations de l'eau** du classeur, rien coché par défaut |

**Choix : la version locale**, arbitrée (« Refondre selon le classeur »). Les
entités hors classeur (le surpresseur) ont une case à part, décochée par défaut,
stockée dans `EquipementsPresents` comme sur `origin/main`. Le sélecteur de
niveau de remplissage d'`origin/main` reste sous les cases.

### F12 — Les groupes du tableau de bord

| `origin/main` | Local |
|---|---|
| anciens groupes éditoriaux, `reducteurs_de_pression` retiré | les cinq groupes du classeur V3 |

**Choix : les groupes du classeur**, avec le surpresseur dans « Arrivée d'eau »,
où `origin/main` le rangeait.

### F13 — Le contrôle de couverture

**Choix : la version locale** (lecture partagée), avec l'idée d'`origin/main` de
ne pas signaler le surpresseur comme un onglet manquant : il apparaît en
« repli connu ».

### F14 — Chrome sans bac à sable

Apport d'`origin/main` à `check-extract.js` (`--no-sandbox`, délai de 30 s),
nécessaire sur le poste où Chrome était remplacé par le Chromium de Puppeteer.
**Conservé**, et reporté sur `smoke-test.js`.

---

## 4. Incohérences découvertes et corrigées

### I1 — Une fiche pouvait être impossible à enregistrer (défaut d'`origin/main`)

La validation exigeait **tous** les champs obligatoires d'une fiche. Or une
même fiche décrit plusieurs objets exclusifs. Mesuré sur le schéma :

- un **lave-linge** entièrement rempli restait bloqué par **5 champs** du
  lave-vaisselle, de l'autolaveuse et du lavage manuel ;
- une **douche** exigeait les champs de la baignoire, et inversement ;
- le **compteur général** exigeait les champs du réducteur de pression, même en
  son absence.

Seule issue pour l'auditeur : inventer des réponses.

**Correction :** des **blocs conditionnels** déclarés dans `ENTITIES`, chacun
rattaché au champ qui le commande et à la règle du classeur :

| Fiche | Bloc | Actif quand | Source |
|---|---|---|---|
| Compteur général | Réducteur de pression | « Présence d'un réducteur… » = Oui | note `H44` |
| Douche / Baignoire | Douche, Baignoire | Type d'équipement | notes `I9`, `D24`, `D65` |
| Appareils de lavage | Lave linge, Lave vaisselle, Autolaveuse, Lavage manuel du sol | Type | structure de l'onglet ⚠ |

Un champ obligatoire n'est exigé que si son bloc est actif. Le bloc « Robinet »
de la douche reste toujours exigé (note `D104` : « affichée systématiquement »).

⚠ Pour les appareils de lavage, **aucune note ne l'écrit** : la règle se déduit
de ce que le champ « Type » propose quatre appareils et que l'onglet porte
quatre blocs nommés d'après eux. Déduction solide, mais déduction.

Garde-fous : le générateur **refuse** un bloc dont le champ, l'intitulé ou une
valeur ne se résout pas ; `tools/check-exigences.js` rejoue pour chaque entité
et chaque valeur une saisie complète, qui doit être validable, et vérifie qu'un
bloc inactif n'exige rien.

Les blocs ne sont **pas masqués à l'écran** : c'est l'affichage conditionnel,
reporté à une passe ultérieure (`arbitrages-v3.md`, Q17). La table en est le
point de départ.

### I2 — Deux badges sur chaque champ

Créé par la fusion automatique d'`audit-field`. Voir F3.

### I3 — Un audit neuf affichait tout, puis masquait tout (défaut local)

Le nouveau régime des cases ne s'appliquait qu'aux audits portant
`UtilisationsEau`. Un audit neuf n'en avait pas tant qu'aucune case n'était
cochée : il affichait **toutes** les sections, puis les masquait à la première
case cochée. **Correction :** `UtilisationsEau: {}` dès la création
(`audit-registry.service.ts`). Un audit sans cette clé reste un audit antérieur,
avec l'ancien régime. L'épreuve de fumée le vérifie désormais.

### I4 — Champs empilés hors des fiches

`.field-row`, qui aligne les champs d'une même ligne du classeur, n'était défini
que dans le style de la fiche. La zone piscine et le contexte du tableau de bord
empilaient leurs champs. **Correction :** classe globale dans `styles.scss`.

### I5 — La zone piscine au tableau de bord

Arbitrage Q10 interrompu avant la fusion : l'entité `zone_piscine` serait
tombée dans un groupe « Autres ». **Correction :** exclue du tableau de bord
(`embedded`), rendue en tête de la page Piscines.

### I6 — Un contrôle qui validait ce que l'écran ne montrait pas

`smoke-test.js` cherchait ses repères dans le DOM brut, qui contient le
JavaScript et les styles inlinés : tous les libellés du schéma et toutes les
classes CSS y figurent. Des attentes étaient donc satisfaites par le code, pas
par l'écran. **Correction :** recherche dans le rendu seul, et ajout d'attentes
négatives (« ne doit pas figurer »).

### I7 — Clés de stockage : ce qui change par rapport à `origin/main`

16 clés d'`origin/main` n'existent plus dans le schéma fusionné, 24 sont
nouvelles.

- **15 des 16 sont les faux champs** de F5 — personne n'a pu y saisir une
  donnée utile.
- **1 est une coquille corrigée** : `DispoisitifRelieAuGtbGtc` devient
  `DispositifRelieAuGtbGtc` sur les sous-compteurs (arbitrage Q12).
- Les 24 nouvelles : les 17 champs de la zone piscine, et des champs que
  `origin/main` ne voyait pas.

Sans conséquence tant qu'aucun audit réel ne circule (arbitrage Q26). **Si des
audits d'essai ont été saisis entre le 14 et le 16 septembre avec la version
d'`origin/main`**, une valeur saisie sous `DispoisitifRelieAuGtbGtc` ne
s'afficherait plus.

---

## 5. Arbitrages de `arbitrages-v3.md` achevés pendant la fusion

Le travail local avait été interrompu en cours d'application des réponses. Ont
été terminés ici :

- **Q10** — la zone piscine en tête de la page Piscines (gabarit, enregistrement
  à la volée) ;
- **Q19** — les logos du classeur : bloc « Financé par » (République Française,
  France 2030, ADEME) et École des Ponts / Institut Polytechnique de Paris, en
  pied de l'accueil général (+120 Ko inlinés, accepté) ;
- **Q22** — lignes libres illimitées sur la page Documents, avec un bouton
  « Ajouter une ligne » ; une ligne vidée ne laisse pas d'entrée dans l'export.

`arbitrages-v3.md` lui-même n'a pas été modifié.

---

## 6. Vérifications

| Contrôle | Résultat |
|---|---|
| `npm run gen` | 18 entités, 517 champs, 448 avec exigence, 7 blocs conditionnels résolus |
| `npm run check:coverage` | 0 faux champ, 0 priorité orpheline, 0 colonne introuvable ; 45 étiquettes non retenues, toutes des légendes |
| `npx tsc` | sans erreur |
| `npm run build` | fichier autonome de 2 340 Ko |
| `npm run check:extract` | copie produite par la page identique au livrable |
| `npm run check:smoke` | 8 écrans sur 8, dont l'absence des sections non demandées sur un audit neuf |
| `npm run check:exigences` | toutes les fiches validables, blocs inactifs sans exigence |

Non vérifié en conditions réelles : le **parcours cliqué** de la validation
(cocher un type, remplir, valider) — ni Puppeteer ni pilotage du navigateur
dans cet environnement. `check-exigences.js` en éprouve la logique contre le
schéma réel, pas le câblage de l'écran.

---

## 7. Revenir en arrière

- **Tout annuler** : `git checkout -- . && git clean -fd` ramène `main` à
  `origin/main` ; le travail local d'avant la fusion reste intact dans
  `sauvegarde/v3-local-avant-fusion`. *Attention, `git clean` efface aussi ce
  fichier et `arbitrages-v3.md`, non suivis.*
- **Retrouver un fichier tel qu'il était en local** :
  `git show sauvegarde/v3-local-avant-fusion:<chemin>`.
- **Tel qu'il était sur `origin/main`** : `git show origin/main:<chemin>`.

La branche `sauvegarde/v3-local-avant-fusion` est locale, jamais poussée ; à
supprimer une fois la fusion commitée et relue.
