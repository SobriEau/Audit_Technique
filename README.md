# SobriEau

Application d'audit de consommation d'eau dans les bâtiments publics (Cerema).
L'auditeur remplit l'audit sur le terrain, souvent hors connexion, dans un
**fichier `index.html` unique** ouvert par double-clic, puis exporte un JSON.

- Angular 18, sans serveur. Le livrable terrain est `index.html`, à la racine.
- La partie technique est **générée depuis le classeur Excel** de
  spécification (`audit_technique.xlsx`).
- Les contraintes du projet (mode `file://`, stockage, génération du schéma,
  pièges déjà rencontrés) sont décrites dans [CLAUDE.md](CLAUDE.md).
  **À lire avant toute modification.**

```bash
npm install
npm start                # développement, http://localhost:4200
npm run gen              # régénère la partie technique depuis le classeur
npm run build            # fichier autonome index.html (à commiter)
npm run check:extract    # le fichier sait-il encore se reproduire ?
npm run check:smoke      # chaque écran se rend-il en file:// ?
npm run check:exigences  # chaque fiche est-elle validable ?
npm run check:coverage   # que contient le classeur que le schéma ignore ?
```

Sur un poste sans Node : `install.bat`, puis `build.bat`. L'outillage du
classeur est décrit dans [tools/README.md](tools/README.md).

---

# Journal des modifications

Du plus ancien au plus récent. Chaque entrée renvoie au commit qui la porte.

## 0. Avant le classeur — avril à mai 2026

**Première version (7 avril).** Seize pages HTML (`site/`) fusionnées en une
page unique par un script Python (`fusionner_v2.py` → `index_fusionne.html`),
persistance par une classe `Data.js` (localStorage, repli cookie).
Questionnaires général (QGE), usages (QUS) et technique (QTE), ce dernier
édité en grande partie en JSON brut. `bbe41af` à `cc9edcd`.

- 21 avril : liste « à faire » (dictée, nom de l'auditeur et du bâtiment
  dans la sauvegarde) — `8a4f401`.
- 27 avril : intégration d'images, uniformisation des styles — `d7eb2fe`,
  `856a2ca`.

**Migration vers Angular (13 mai).** Suppression de `site/` et des scripts
Python ; projet Angular, `inline-build.js` qui produit le fichier autonome,
`install.bat` / `build.bat` — `5cc1bf5`, `c867868`.

**Dictée hors ligne, abandonnée (15 mai).** Essai de reconnaissance vocale
embarquée (Vosk, modèle français de ~40 Mo) : trop lourd pour les téléphones,
annulé le jour même. Conservé sur la branche `origin/vosk` — `7f67195`,
`1052933`.

## 1. Premier classeur — août 2026

### Première utilisation : `audit_technique.xlsx` (17 août)

Le classeur Excel devient la **spécification de référence** de la partie
technique — `cfb2177` :

- quinze entités décrites en données (`audit-schema.ts`, généré depuis le
  classeur) et rendues par deux composants génériques, liste et fiche. Plus
  d'éditeur JSON pour ces sections ;
- `audit-field`, composant de saisie unique ; disposition reprise des lignes
  du tableau Excel ;
- identité stable des éléments (`Id`), distincte du numéro affiché ;
- charte graphique en variables CSS, en-tête commun et collant, logos
  inlinés ;
- images en IndexedDB, export JSON portant les images en base64 ;
- plans chargés depuis l'accueil (images ou PDF), punaise de localisation ;
- dictée rétablie avec la Web Speech API du navigateur (en ligne) ;
- `CLAUDE.md`, `docs/audit/`, outils de transcription dans `tools/`.

### Modifications connexes (17 au 20 août)

- **Saisie** : boutons radio sous quatre options, liste filtrable au-delà
  (casse et accents ignorés) — `95dfbad`.
- **Plusieurs audits**, un par bâtiment, rapprochés par adresse normalisée
  sans que l'adresse serve de clé ; reprise de l'audit unique d'avant —
  `5d53a46`.
- **Google Drive** : sonde puis synchronisation depuis le fichier `file://`
  (device flow, portée `drive.file`) — `cb90a78`, `a7e4002`.
- **Export** : les photos des entités autres que les robinets étaient omises
  sans message — `2959122`.
- **Démarrage** : page blanche quand le poste refuse le stockage local ; repli
  en mémoire, bandeau d'avertissement, message de secours statique —
  `8191f2a`.
- **Outillage** : mode opératoire de régénération, contrôle de couverture du
  classeur — `c4ecd7d`.
- **Photos** : appareil photo par `getUserMedia` (le bouton ouvrait le
  sélecteur de fichiers sur ordinateur), mode expérimental « fichiers
  voisins », double conservation — `26c32e0`, `3297292`.
- **Diffusion** : page « Télécharger l'application », qui reproduit le
  livrable à l'identique depuis la page elle-même — `11a7195`.

### Deuxième version du même classeur : V2 (20 août)

`260520- volet technique - audit_V2_impression.xlsx` remplace le contenu
d'`audit_technique.xlsx` : **18 entités** régénérées, dont structure,
ventilation, incendie, toitures, surpresseurs, appareils de lavage,
opportunités, autres ; réseaux ECS et production / stockage ECS fusionnés ou
renommés — `25b2fab`.

### Revue d'ergonomie KAPT (réunion du 18 août, commits du 20 août)

- Comptes rendus et prompt d'exécution — `f378d1c`.
- Accueil scindé en deux : choix du projet, puis accueil du projet (identité,
  plans, photos en consultation) ; fil d'Ariane, logos des financeurs —
  `0daa495`, `c97c77e`.
- Bouton Annuler des fiches : retiré, puis rétabli avec sa limite affichée
  (photos et localisation s'enregistrent immédiatement) — `ed29ff7`,
  `b5ce248`.
- Cases à cocher des équipements présents du bâtiment, qui masquent les
  sections inutiles — `847c7d7`.

## 2. Deuxième classeur : V3 « allégée logiciel » — septembre 2026

### Migration (14 septembre)

`260821- volet technique - audit_V3_allégée_logiciel.xlsx` remplace le
classeur — `366a323`, archivé par `65e1f5c` :

- **exigence de chaque question** (obligatoire / recommandé / facultatif) lue
  dans le classeur ;
- **niveau de remplissage** (complet / allégé / minimal) choisi sur l'accueil
  du projet, volet des champs masqués ;
- **validation** qui refuse une fiche dont un champ obligatoire est vide ;
- réducteur de pression replié en bloc conditionnel du compteur général ;
  surpresseur conservé hors classeur, masqué par défaut.

### Fusion de deux migrations parallèles (17 septembre)

Une seconde migration V3 avait été menée sur un autre poste. Fusion et
arbitrages, consignés dans `MAJ/done/fusion-origin-main.md` et
`MAJ/done/arbitrages-v3.md` — `eb09088` :

- `tools/lib/classeur.js`, lecture unique du classeur : sections lues aux
  styles, exigence rattachée en deux passes, faux champs écartés ;
- une seule pastille orange d'exigence ;
- **blocs conditionnels** : la validation n'exige que les champs de ce qui
  concerne l'élément (un lave-linge n'a pas de champs d'autolaveuse) ;
- dix utilisations de l'eau sur l'accueil du projet, qui commandent les
  sections affichées ; documents collectés, glossaire, zone piscine ;
- nouveaux contrôles : `check-exigences.js`, épreuve de fumée sur le rendu.

### Dictée dans les champs texte (17 septembre)

Composant `dictation-field` : un micro sur les champs texte de l'accueil, des
documents, des questionnaires, des plans et des fiches techniques — `962cb9a`.

## 3. Retour de test de Victor Ledoux — 29 septembre 2026 (non commité)

Support : `MAJ/to_do/retours_test_html_victor.txt`. Vérification remarque par
remarque, et liste des modifications hors remarques :
[MAJ/verification-retours-victor.md](MAJ/verification-retours-victor.md).

### Sur toutes les fiches

- **Indications entre parenthèses** du classeur affichées sous chaque champ.
  Le générateur les retirait du libellé et les perdait.
- **Légendes** « Bon / Moyen / Mauvais état », « fort / moyen / faible /
  à approfondir », exigence de propreté, affichées sous les champs.
- **Choix multiples** en cases à cocher (26 champs) ; une ancienne réponse
  unique est relue comme une case cochée.
- **Champ libre** quand une option « Autre » est choisie.
- **Rubriques masquées** tant qu'elles ne concernent pas l'élément :
  douche / baignoire, types d'appareils de lavage, réducteur de pression,
  bouclage ECS, arrosage / nettoyage, types de structure, opportunités,
  rubriques « Autre ». Les remarques générales forment leur propre bloc.
- **Localiser sur le plan** placé juste sous l'emplacement.
- **Illustrations** du classeur (types d'émetteur et de jet, de toilettes, de
  gouttières et de chéneaux), recadrées et inlinées (+267 Ko).
- **Mesures de débit** : trois essais temps / volume, débit calculé, mesure au
  bol, moyenne.
- Chaque page s'ouvre **en haut**.

### Par onglet

- **Compteur général** : devient une liste (plusieurs compteurs possibles) ;
  l'audit existant est converti.
- **Sous-compteurs** : rubrique « Caractéristiques » séparée de la
  localisation.
- **Réseaux ECS** : champ « Présence d'un traçage ».
- **Exigences corrigées** : réseau ECS associé / d'appartenance → recommandé ;
  combustible, limiteur de débit (douche et baignoire), diamètre nominal →
  facultatif.
- **Unités** : pente de toiture en %, durées d'arrosage et de nettoyage en
  minutes.
- **Listes** : matériaux du bassin, période d'arrosage (+ nuit, variable),
  types de structure et choix « Autre » sans option parasite.
- **Structure** : emplacement en double retiré ; « réseau supplémentaire »
  en oui / non.
- **Autre** : un champ dans chaque rubrique.
- **Totaux en tête de liste** : robinets, WC, douches et baignoires,
  générateurs et stockages, appareils de lavage par type, surfaces des
  espaces extérieurs, surface et pans de toiture.
- **Surpresseur retiré.**
- **Documents collectés** : « Suivi des interventions de plomberie des
  3 dernières années ».
- **Audit technique** : lien vers les documents collectés sous le glossaire.
- **Coquilles** : « réservie », « Entérée », « Type d'emetteur » ; options
  perdues ou mal coupées dans les listes des WC.

### Diffusion et dictée

- La page « Télécharger l'application » ignore les ressources injectées par
  les extensions du navigateur, qui lui faisaient refuser la copie sur un
  Chrome de bureau.
- Messages de dictée explicites quand l'appareil n'a pas de service de
  reconnaissance vocale (Android sans services Google, /e/OS).

### Outillage

- `tools/gen-illustrations.js`, ajouté à `npm run gen`.
- Tables de corrections sourcées dans le générateur (exigences, unités,
  listes, choix multiples, champs retirés ou détachés) ; la génération
  s'arrête si l'une ne retrouve plus sa cellule. À reporter dans le classeur.
- `check-coverage.js` reconnaît légendes, illustrations et tableaux de
  mesure : 3 signalements au lieu de 45.

### Restent ouverts

- Photos en mode « fichiers voisins » sur Firefox et Chrome mobile : non
  diagnostiqué.
- À confirmer avec Victor :
  - le calcul des totaux « fiches + équipements identiques » ;
  - la définition des générateurs et stockages ;
  - la colonne « Surfaces nettoyées » ;
  - l'exigence du traçage.
