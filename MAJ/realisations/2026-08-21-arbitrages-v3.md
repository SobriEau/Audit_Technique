# Arbitrages à rendre — classeur V3

Ce qui reste ouvert après la régénération de la partie technique depuis
`260821- volet technique - audit_V3_allégée_logiciel.xlsx`.

**Mode d'emploi :** cochez une case par question — remplacez `[ ]` par `[x]` —
et rendez-moi le fichier. Chaque question porte une **recommandation** quand
j'en ai une ; si elle vous convient, il suffit de la cocher. La ligne
« Autre / précision » est là pour tout ce qui n'entre dans aucune case.

Les questions marquées 🔴 bloquent quelque chose ; les autres peuvent rester
en l'état sans dommage. **Vingt-six questions, dont dix bloquantes** — si le
temps manque, les 🔴 suffisent à débloquer la suite.

Un raccourci si toutes mes recommandations vous vont : écrivez-le en une ligne
en tête du fichier, je n'irai pas chercher les cases.

---

## A. Listes de valeurs — divergences internes au classeur

Un même libellé porte des valeurs différentes selon l'endroit. Ce sont des
arbitrages métier : je ne peux pas trancher à votre place lesquelles font foi.
Le détail complet est dans [docs/audit/referentiel-listes.md](docs/audit/referentiel-listes.md).

### Q1 — « Utilisation 1 / 2 / 3 » des robinets 🔴

Les trois listes déroulantes d'un même robinet ne proposent pas les mêmes
choix (`Robinets!F16`, `I16`, `L16`) :

- **Utilisation 2** ne propose pas « Lavage matériel (pinceau, ...) », que les deux autres proposent.
- **Utilisation 3** dit « Evier cuisine » là où les deux autres disent « Evier ».

Concrètement : un auditeur qui saisit « Lavage matériel » en usage principal ne
peut pas le saisir en usage secondaire.

- [x] **Unifier les trois sur la liste la plus complète** (celle d'Utilisation 1, plus « Evier cuisine » ajouté comme entrée distincte) — *recommandé*
- [ ] Unifier les trois sur la liste d'Utilisation 1 telle quelle
- [ ] Laisser les trois listes différentes, c'est voulu
- [ ] Autre / précision : ……………………………………………………………………

### Q2 — « Origine de l'eau » 🔴

Deux listes incompatibles pour la même notion :

| Cellule | Fiche | Valeurs |
|---|---|---|
| `WC1!J36` | WC | Eau potable · Eau de pluie · Eau forage brute · Eau grise |
| `Extérieur1!F60` | Espaces extérieurs | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |

Elles diffèrent par la casse **et** par le fond : « eau pluviale » et « eau
souterraine » n'existent que côté extérieur, « Eau forage brute » que côté WC.

- [ ] **Unifier sur une liste commune** : Eau potable · Eau de pluie · Eau pluviale · Eau grise · Eau souterraine (« eau forage brute » ≡ « eau souterraine ») — *recommandé*
- [ ] Unifier sur la liste des WC
- [ ] Unifier sur la liste des extérieurs
- [x] Laisser les deux : ce ne sont pas les mêmes usages
- [ ] Autre / précision : ……………………………………………………………………

### Q3 — « Utilisations » des appareils de lavage

Trois occurrences, dont deux ne diffèrent que par l'accord :

| Cellule | Appareil | Valeurs |
|---|---|---|
| `Appareils de lavage!E19` | Lave-linge | domestique · **collective** · **professionnelle** |
| `Appareils de lavage!E50` | Lave-vaisselle | domestique · **collectif** · **professionnel** |
| `Appareils de lavage!E82` | Autolaveuse | interne · prestataire externe |

- [x] **Unifier lave-linge et lave-vaisselle** au masculin (domestique · collectif · professionnel) ; l'autolaveuse est une autre notion, on la laisse — *recommandé*
- [ ] Unifier les deux au féminin
- [ ] Laisser tel quel
- [ ] Autre / précision : ……………………………………………………………………

### Q4 — « Type d'alimentation en eau » 🔴

| Cellule | Appareil | Valeurs |
|---|---|---|
| `Appareils de lavage!K31` | Lave-linge | EF seul · EF + ECS · **Eau de pluie** |
| `Appareils de lavage!K62` | Lave-vaisselle | EF seul · **ECS seul** · EF + ECS |

Le lave-linge ne peut pas être déclaré « ECS seul », le lave-vaisselle ne peut
pas être déclaré alimenté en eau de pluie.

- [ ] **Unifier** : EF seul · ECS seul · EF + ECS · Eau de pluie — *recommandé*
- [x] Laisser tel quel, les deux appareils ont des alimentations différentes
- [ ] Autre / précision : ……………………………………………………………………

### Q5 — « Type de zone lavée »

| Cellule | Contexte | Différence |
|---|---|---|
| `Appareils de lavage!K94` | Autolaveuse | 8 valeurs |
| `Appareils de lavage!E138` | Lavage manuel | les 8 mêmes **plus « logement »** |

- [ ] **Ajouter « logement » aux deux** — *recommandé*
- [x] Laisser tel quel : une autolaveuse ne va pas en logement
- [ ] Autre / précision : ……………………………………………………………………

### Q6 — Utilisations potentielles, extérieures et intérieures

Sur la fiche Opportunités, la même question posée deux fois (eau de pluie en
`F15`/`I15`, eaux ménagères en `F48`/`I48`) n'offre pas les mêmes réponses :

- **extérieures** : `F15` propose « piscine », `F48` non.
- **intérieures** : `I15` propose « lavage de linge », `I48` propose « tours de refroidissement ».

- [ ] **Unifier chaque paire sur l'union des valeurs** — *recommandé*
- [x] Laisser tel quel : toutes les eaux ne conviennent pas aux mêmes usages
- [ ] Autre / précision : ……………………………………………………………………

### Q7 — Divergences que je considère voulues

Ces libellés portent des valeurs différentes, mais décrivent des objets
différents. Sauf avis contraire, **je n'y touche pas** :

- « Type » : compteur, système ECS, robinet de douche, appareil de lavage, bassin, structure — six notions distinctes sous le même mot.
- « Commande du robinet » : `Robinets!K24` (manuelle, fémorale, à pédale, à détection) contre `Douche-baignoire1!I105` (manuelle, à détection de présence, à effleurement, à détection RFID).
- « Type d'émetteur » : `Douche-baignoire1!E28` (douche) contre `E72` (baignoire).
- « Utilisateurs » : `WC1!F15` contre `Bassin1!K11`.

- [x] **D'accord, ce sont des notions distinctes** — *recommandé*
- [ ] Non, il faut en unifier certaines — lesquelles : ……………………………………

---

## B. Champs que le schéma n'a pas retenus

Le contrôle de couverture remonte 46 étiquettes sans champ. J'en ai relu la
totalité : **44 sont des légendes** (tables qui définissent « Bon état / Etat
moyen / Mauvais état », noms de formes de gouttières, typologie illustrée des
WC, échelle du potentiel technique). Deux ressemblent à de vraies questions.

S'y ajoute une découverte que le contrôle ne pouvait pas faire, parce qu'elle
porte sur un onglet qu'il n'inspecte pas : voir Q10.

### Q8 — `Extérieur1!F18` — « Précision (présences de noues, fossés, regards, bassins de récupérations, etc.) » 🔴

Cette cellule n'a **aucune note**, mais la cellule au-dessus porte un niveau de
priorité « Facultatif » (`F17`) qui ne se rattache à rien d'autre. C'est le
signe d'un champ oublié dans le classeur, pas dans la transcription.

- [ ] **L'ajouter comme champ texte libre, priorité facultative** — *recommandé*
- [ ] Ne pas l'ajouter, ce n'est pas un champ
- [x] Autre / précision : ce n'est que sa priorité que tu detecte au dessus

### Q9 — `Bassin1!K20` — « Température de consigne de l'air (°C) » 🔴

Sur la même ligne que trois champs retenus (consigne d'apport quotidien, volume
d'apport, température de consigne du bassin), mais sans note ni priorité.

- [x] **L'ajouter comme champ numérique en °C** — *recommandé*
- [ ] Ne pas l'ajouter
- [ ] Autre / précision : ……………………………………………………………………

### Q10 — L'onglet « Liste Piscines » porte des champs que l'application n'a pas 🔴

C'est la trouvaille la plus lourde de cette relecture. Les onglets « Liste … »
définissent d'ordinaire les colonnes d'un tableau, rien de plus — et
l'application les traite ainsi. **« Liste Piscines » fait exception** : sous le
tableau des bassins, il porte deux sections de saisie complètes, avec leurs
notes et leurs priorités.

| Section | Cellules | Champs |
|---|---|---|
| **Pédiluve** | `E26`–`E37` | Type · Précisions · Origine de l'eau · Volume (L) · Fréquence de vidange/semaine · Nombre d'équipements identiques |
| **Nettoyage des plages** | `E40`–`E51` | Fréquence · Mode de nettoyage · Précisions · Eau utilisée · Origine eau NC · Volume eau NC disponible (L) · Numéros des robinets correspondants |

Ces treize champs **n'existent nulle part dans l'application**. Aucun autre
onglet « Liste » n'est dans ce cas — vérifié sur les quinze.

Ma lecture : ils sont placés là parce qu'ils valent pour **l'ensemble de la
zone piscine**, pas pour chaque bassin. Un pédiluve et des plages sont partagés
entre les bassins ; les répéter sur chaque fiche ferait saisir la même chose
plusieurs fois.

- [x] **Les ajouter en tête de la page « Piscines »**, au-dessus du tableau des bassins, comme un bloc commun à la zone — *recommandé, et fidèle au classeur*
- [ ] Les ajouter à la fiche de chaque bassin (saisie répétée)
- [ ] En faire une fiche unique séparée, comme le compteur général
- [ ] Ne pas les reprendre
- [ ] Autre / précision : ……………………………………………………………………

### Q11 — Les 44 légendes

Exemples : `Compteur général!H37` « * Etat compteur », `Toiture1!F43`
« pendante » / « nantaise » / « havraise », `WC1!F25` « Stalle d'urinoir »,
`Opportunités1!F32` « faible » + sa définition.

Ces textes expliquent à l'auditeur comment choisir, mais ne sont pas des
champs. Aujourd'hui **ils ne s'affichent nulle part dans l'application**.

- [x] Laisser ainsi : les listes déroulantes se suffisent — *recommandé*
- [ ] Les afficher en aide sous le champ concerné (travail supplémentaire notable)
- [ ] Autre / précision : ……………………………………………………………………

---

## C. Coquilles du classeur

### Q12 — `Sous-compteur1!F27` — « Dispoisitif relié au GTB/GTC ? » 🔴

Le même champ s'écrit correctement sur le compteur général (`H26`). La faute
n'est pas seulement affichée : elle produit une **clé de stockage différente**
(`DispoisitifRelieAuGtbGtc` contre `DispositifRelieAuGtbGtc`), donc deux champs
que rien ne relie.

- [x] **Corriger à la génération**, comme les autres coquilles — *recommandé*
- [ ] Corriger le classeur d'abord, et régénérer ensuite
- [ ] Laisser tel quel
- [ ] Autre / précision : ……………………………………………………………………

### Q13 — Coquilles que j'ai déjà corrigées à la génération

Le classeur reste la référence, mais ces fautes s'affichent à l'écran devant
tous les auditeurs. Je les corrige au passage, et le classeur n'est pas
modifié :

| Où | Écrit | Affiché |
|---|---|---|
| `Robinets!E47` | Etat lors de **lavisite** | Etat lors de la visite |
| `Opportunités1` (notes) | à **aproffondir** | à approfondir |
| `Bassin1!K8` | possibi**lt**é d'être couverte | possibilité d'être couverte |

À noter : « approfondir » est écrit **de deux façons fautives différentes** dans
le classeur — `aproffondir` dans les listes déroulantes, `approffondir` dans les
légendes (`Opportunités1!F33`, `F60`, `F75`).

- [x] **D'accord, garder ces corrections** et les remonter au Cerema — *recommandé*
- [ ] Ne rien corriger, afficher le classeur tel quel
- [ ] Autre / précision : ……………………………………………………………………

### Q14 — Intitulés de section incohérents d'une fiche à l'autre

Le même bloc s'appelle « Utilisation » sur le lave-linge et « Utilisations » sur
le lave-vaisselle ; « Utilisateurs » sur les WC et « Utilisation » sur le
bassin. Cosmétique, mais visible : ce sont des titres de blocs.

- [x] Les uniformiser à la génération — *recommandé*
- [ ] Les laisser tels que le classeur les écrit
- [ ] Autre / précision : ……………………………………………………………………

---

## D. Mécanismes que le classeur demande et que l'application n'a pas

Ces trois-là sont hors du périmètre que vous aviez retenu. Ils sont chiffrés
ici pour décider s'ils passent dans une prochaine passe.

### Q15 — Champs à choix **multiples** — 15 champs 🔴

Le classeur écrit « à cocher » ou « plusieurs réponses possibles », mais
l'application ne sait enregistrer qu'**une seule** valeur. L'auditeur ne peut
donc pas déclarer un espace extérieur à la fois arrosé et nettoyé.

Concernés : `Douche-baignoire1!E28` et `E72` (type d'émetteur) · `WC1!F15`
(utilisateurs), `J36` (origine de l'eau), `J48`, `F54` · `Appareils de
lavage!K34` (textiles lavés) · `Extérieur1!I28` (utilisations d'eau), `I54`
(mode de nettoyage), `L54` (motif) · `Bassin1!K11` (utilisateurs) ·
`Toiture1!F35` (gouttières), `F45` (chéneaux) · `Opportunités1!I11`, `F18`.

Les renvois multiples de la question suivante relèvent du même mécanisme et
sont comptés à part.

- [x] **Traiter dans une prochaine passe** (nouveau type de champ, cases à cocher) — *recommandé*
- [ ] Traiter maintenant
- [ ] Ne pas traiter : un seul choix suffit sur le terrain
- [ ] Autre / précision : ……………………………………………………………………

### Q16 — Renvois vers **plusieurs** éléments — 2 champs, plus un troisième

« Numéros des robinets correspondants » : `Extérieur1!L44` (arrosage) et `L60`
(nettoyage). Ces deux-là sont dans l'application, en **texte libre avec un
avertissement affiché** — plutôt qu'une référence qui enregistrerait une cible
sur trois sans le dire.

Une troisième occurrence, `Liste Piscines!K47`, appartient au bloc « Nettoyage
des plages » de la question Q10 : elle ne sera concernée que si vous retenez ce
bloc.

- [x] Garder l'avertissement, traiter avec Q15 — *recommandé*
- [ ] Traiter maintenant
- [ ] Laisser en texte libre sans avertissement
- [ ] Autre / précision : ……………………………………………………………………

### Q17 — Affichage conditionnel **à l'intérieur** des fiches

Cinq règles écrites dans le classeur, aujourd'hui non appliquées — tous les
champs de la fiche sont affichés :

| Où | Règle |
|---|---|
| `Compteur général!H44` | « Si oui, afficher les champs du dessous » (bloc réducteur de pression) |
| `Douche-baignoire1!I9`, `D24`, `D65` | Afficher la partie « Douche » **ou** « Baignoire » selon le type choisi |
| `Douche-baignoire1!D104` | Partie affichée systématiquement |
| `Appareils de lavage` | Quatre blocs (lave-linge, lave-vaisselle, autolaveuse, lavage manuel) selon le type — 77 champs affichés au lieu d'une vingtaine |

C'est la fiche « Appareils de lavage » qui souffre le plus : l'auditeur y voit
77 champs dont il n'en concerne qu'un quart.

- [x] **Traiter dans une prochaine passe** — *recommandé*
- [ ] Traiter maintenant
- [ ] Ne pas traiter
- [ ] Autre / précision : ……………………………………………………………………

### Q18 — `Ventilation1!G40` — message de confirmation

« Suppression du système de ventilation pièce — ajouter un message de
confirmation ». La suppression demande **déjà** confirmation partout dans
l'application.

- [x] **Déjà fait, rien à faire** — *recommandé*
- [ ] Vérifier / renforcer
- [ ] Autre / précision : ……………………………………………………………………

---

## E. Écrans

### Q19 — Logos des financeurs 🔴

La maquette de l'accueil (`Accueil!C25`) annonce « Ce projet est financé par : »
et affiche un bloc de logos. `src/app/shared/logos.ts` n'en contient que trois :
SobriEau, Cerema, AgroParisTech. **Il manque deux blocs** que la maquette
montre :

- République Française + **France 2030** + **ADEME** — c'est le bloc « financé par », celui que la cellule annonce ;
- **École nationale des Ponts et Chaussées** + **Institut Polytechnique de Paris**.

Je ne peux pas les fabriquer : il me faut les fichiers. En SVG de préférence —
le PNG du classeur pèse 76 Ko, soit ~101 Ko une fois inliné dans le livrable.

- [ ] Je vous fournis les fichiers (dites-moi où les déposer)
- [x] Extraire ceux du classeur, quitte à alourdir le fichier de ~100 Ko
- [ ] Laisser les trois logos actuels
- [ ] Autre / précision : ……………………………………………………………………

### Q20 — L'adresse, « Facultatif » au classeur mais clé de rapprochement

`Généralités!B20` marque l'adresse **facultative**. Or l'application s'en sert
pour rapprocher les audits d'un même bâtiment (`AdresseKey`) et pose une
question quand elle change. J'ai affiché la pastille « Facultatif » telle
quelle, mais les deux logiques se contredisent.

- [x] **Garder ainsi** : facultative à la saisie, utilisée si renseignée — *recommandé*
- [ ] Retirer la pastille « Facultatif », l'adresse est en pratique nécessaire
- [ ] Ne plus rapprocher les audits par l'adresse
- [ ] Autre / précision : ……………………………………………………………………

### Q21 — Les années de construction et de rénovation

Le classeur montre « AAAA » comme exemple de saisie. Je les ai faites en
**texte**, pas en nombre : un champ numérique affiche des flèches, accepte les
décimales et se laisse modifier à la molette.

- [x] **Garder en texte** — *recommandé*
- [ ] Champ numérique
- [ ] Sélecteur de date complet
- [ ] Autre / précision : ……………………………………………………………………

### Q22 — Documents à collecter : six lignes libres

Le classeur prévoit exactement six lignes « Autre, préciser : ». Je les ai
reprises telles quelles, donc six, ni plus ni moins.

- [ ] Garder six lignes fixes, comme le classeur — *recommandé*
- [x] Un bouton « Ajouter une ligne », sans limite
- [ ] Autre / précision : ……………………………………………………………………

### Q23 — Le glossaire

Trente entrées, reprises du bas du tableau de bord. Je l'ai mis sur une **page
dédiée** (`#/glossaire`), atteinte par un lien discret en pied du tableau de
bord, avec une recherche qui porte aussi sur les définitions.

- [x] **Page dédiée** — *recommandé*
- [ ] Bloc dépliable en pied du tableau de bord
- [ ] Bulle d'aide au survol des sigles, dans les fiches (travail notable)
- [ ] Autre / précision : ……………………………………………………………………

---

## F. Questions que les auteurs du classeur ont laissées en marge

Trois notes en marge de la fiche Bassin, écrites par les auteurs et adressées à
eux-mêmes. Elles ne sont pas transcrites.

### Q24 — `Bassin1!U7` — type de circulation des eaux

« Est-ce intéressant d'avoir le type de circulation des eaux dans le bassin ?
Skimmer, à débordement périphérique, à débordement partiel, à goulotte »

- [x] Non, ne pas ajouter — *recommandé faute d'arbitrage*
- [ ] Oui, ajouter ce champ avec ces quatre valeurs
- [ ] Autre / précision : ……………………………………………………………………

### Q25 — `Bassin1!U8` et `U9` — piscines individuelles

« Pour les piscines individuelles, faut-il ajouter la période d'utilisation
dans l'année ? » et « … le nombre de baigneurs moyen ? »

- [x] Non, ne pas ajouter — *recommandé faute d'arbitrage*
- [ ] Ajouter la période d'utilisation seulement
- [ ] Ajouter le nombre de baigneurs seulement
- [ ] Ajouter les deux
- [ ] Autre / précision : ……………………………………………………………………

---

## G. Une question que je dois vous reposer avant toute prochaine régénération

### Q26 — Des audits réels circulent-ils désormais ? 🔴

Vous m'avez répondu « non » pour cette régénération, ce qui m'a permis de
laisser les clés de stockage suivre les libellés du classeur. **Dès qu'un
auditeur aura saisi un audit réel, cette liberté disparaît** : la V2 → V3 a fait
dériver 47 clés et en a mis 3 en collision.

- [x] Toujours aucun audit réel en circulation
- [ ] Des audits réels existent maintenant — figer les clés avant toute régénération
- [ ] Autre / précision : ……………………………………………………………………

---

## Ce qui ne demande aucune décision

Pour mémoire, et pour que vous n'ayez pas à vous demander si j'ai oublié :

- Les **475 champs**, leurs **431 priorités** et leurs **427 sections** sont
  transcrits et vérifiés ; le contrôle ne signale aucun faux champ.
- Les deux entités retirées (réducteur de pression, surpresseur) suivent le
  classeur, vous l'avez tranché.
- La barre du haut reste conforme au compte rendu KAPT, vous l'avez tranché.
- Les cases « utilisations de l'eau » suivent le classeur, vous l'avez tranché.
- Build, auto-reproduction du fichier autonome et rendu des sept écrans en
  `file://` : tout passe.
