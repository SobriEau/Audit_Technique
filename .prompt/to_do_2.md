# Prompt d'exécution — retours ergonomie du 18 août 2026

Ce prompt croise trois comptes rendus de la même réunion de revue ergonomique
(`.prompt/retours/`) :

- `Compte rendu kapt ocrisé/markdown.md` — compte rendu officiel rédigé par KAPT ;
- `Compte rendu victor.md` — notes de Victor Ledoux ;
- `Compte rendu sacha.md` — notes de Sacha Mailler.

Chaque point a été confronté à l'état réel du code (2026-08-20), pas seulement
aux comptes rendus : certains points sont déjà résolus, obsolètes, ou hors
d'atteinte d'une modification de code. Ils sont signalés comme tels pour ne pas
être réattaqués inutilement.

**Ne pas régénérer ni éditer `audit-schema.ts` à la main** (voir CLAUDE.md §8) :
tout ce qui touche au contenu d'une fiche générée (champs, aides, options)
passe par `audit_technique.xlsx` puis `tools/gen-schema.js`, sauf indication
contraire ci-dessous.

**Pas de suite de tests automatisée dans ce projet** (aucun `*.spec.ts`, aucun
script `test` dans `package.json`). « Les tests » demandés signifient donc, pour
chaque point : une vérification manuelle décrite explicitely, à dérouler après
implémentation — dans l'esprit de CLAUDE.md §11. Les exécuter **à la fois** en
`npm start` et sur le fichier autonome reconstruit (`npm run build`), certains
irritants (stockage, `file://`) ne se manifestant que sur ce dernier.

---

## 0. Déjà réglé ou hors périmètre — ne pas retraiter

| Point évoqué | Statut |
|---|---|
| Connexion Google Drive non fonctionnelle | Géré par ailleurs (indication de l'utilisateur) — ne rien changer ici. |
| Renommer « cool start » en « cold start » (Victor) | Ce champ n'existe plus dans le schéma actuel (`audit-schema.ts`, robinets) : vestige d'une version antérieure du classeur. Rien à faire. |
| « Pouvoir indiquer le nombre d'éléments identiques » (KAPT) | Déjà présent (`NombreDEquipementsIdentiques`) sur WC et appareils de lavage. **Absent des robinets** — c'est une question de contenu du classeur (`audit_technique.xlsx`), pas de code : à signaler à qui tient le classeur, pas à corriger dans `audit-schema.ts`. |
| Aides en petit texte gris sous les champs | Le mécanisme existe déjà et fonctionne (`def.help` → `.field-help` dans `audit-field.component.html`). Le manque constaté (ex. champ Emplacement sans aide) est un manque de **contenu** dans le classeur, pas un défaut du moteur de rendu — voir point 9 pour le seul cas où une aide est ajoutée en dur, hors schéma. |

---

## 1. Scinder l'accueil en deux pages

Les trois comptes rendus s'accordent : `HomeComponent` fait aujourd'hui les
deux métiers à la fois (choix de l'audit + fiche du projet), ce que Sacha note
explicitement comme un piège (« Attention on a deux accueils »).

**Cible :**

- **Accueil général** (nouvelle route, ex. `/accueil` ou racine `''`) : ne
  contient que le choix du projet — reprendre un audit existant (sélection
  claire, pas seulement une `<select>` discrète), en créer un nouveau, en
  charger un depuis un fichier. Seul le logo SobriEau en haut ; logos des
  financeurs en bas de l'écran. Aujourd'hui ce bloc correspond à la section
  « Audit » de `home.component.html` (lignes 3-32) et aux actions Charger/
  Connexion de `drive-actions`.
- **Accueil du projet** (nouvelle route, ex. `/projet`, ouverte automatiquement
  après sélection/création d'un audit) : ce que contient le reste de
  `home.component.html` aujourd'hui — adresse, informations complémentaires,
  date, auditeur, plans, photos (lecture seule, voir point 4). Remettre un
  titre « Audit » au-dessus de ce bloc puisqu'il n'est plus sur l'accueil
  général.

**Fichiers concernés :** `src/app/home/home.component.ts/.html`, nouveau
composant pour l'accueil général, `src/app/app.routes.ts`, tout `routerLink`/
`nav('home')` pointant vers l'accueil (`page-header.component.ts` `goHome()`,
`FieldDef` non concerné).

**Point de vigilance :** `HashLocationStrategy` est imposée (CLAUDE.md §2) —
ajouter une route ne pose pas de problème particulier, mais vérifier que
l'audit ouvert (`DataService.currentAuditId`) est bien lu à l'arrivée sur
l'accueil du projet, pas seulement au moment du clic sur l'accueil général.

**Test :** depuis un poste vidé, ouvrir le fichier autonome → l'accueil général
n'affiche que le choix de projet et les logos ; créer un audit → bascule vers
l'accueil du projet ; recharger la page en plein milieu de l'accueil du
projet → le bon audit reste ouvert (pas de retour silencieux à l'accueil
général).

---

## 2. Accueil général

- Rendre la sélection d'un audit existant sans ambiguïté (aujourd'hui un
  simple `<select>` avec un bouton « + Nouvel audit » et « Supprimer » à côté —
  fonctionnellement correct mais jugé pas assez lisible en réunion). Une liste
  de cartes/lignes cliquables, une par audit, est une piste raisonnable.
- Ajouter un bouton « Charger un fichier » (déjà géré par `drive-actions` →
  `charger()`), visible uniquement ici (KAPT : « le bouton Charger ne sera
  présent que sur la page d'accueil »).
- Le bouton « Connexion » (Google) peut rester discret ici, dans les mêmes
  termes que `drive-actions` actuel.

**Test :** aucun audit enregistré → l'écran ne propose que « nouveau projet »
et « charger » ; plusieurs audits enregistrés → chacun est identifiable
(adresse ou repère) et cliquable pour l'ouvrir directement, sans passer par un
menu déroulant.

---

## 3. Accueil du projet

Champs actuels : `Adresse`, `Info`, `Date`, `Auditeur` (`home.component.ts`
lignes 31-34).

- Ajouter un champ libre **« Nom du projet »**, facultatif (`AppData` n'a pas
  ce champ aujourd'hui — l'ajouter dans `data.models.ts` `AppData`, dans
  `AuditSummary` si utile à l'affichage de la liste, et le brancher comme
  `Adresse`/`Info` dans `home.component.ts`). Rétrocompatibilité : un audit
  existant sans ce champ doit rester lisible (`?? ''` comme les autres champs).
- Champ Adresse : ajouter un texte d'aide précisant ce qui est attendu (voie,
  numéro, code postal, ville). Actuellement aucune aide sous ce champ
  (`home.component.html` ligne 35-43) — ce n'est pas un champ généré par le
  schéma, l'aide peut donc être écrite en dur dans le template.
- Ajouter un champ séparé **« Nom du site audité »** (texte libre, à côté ou
  sous l'adresse).
- Renommer le libellé « Info » en **« Informations complémentaires »**, avec un
  placeholder clair (ex. « Toute information utile à la compréhension de
  l'audit »).
- Champ Auditeur : le libellé doit être « Nom, prénom de l'auditeur » et le
  placeholder un **exemple** (ex. « Jean Dupont »), pas une reformulation de
  l'intitulé — actuellement `placeholder="Nom de l'auditeur"`
  (`home.component.html` ligne 98), à corriger.
- Champ Date : préciser « Date de début de la visite terrain » (l'audit peut
  durer plusieurs jours).
- Ajouter un encadré, plutôt en bas des formulaires de cette page, rappelant
  qu'il vaut mieux enregistrer/exporter régulièrement sous peine de perdre les
  données (à ne pas confondre avec la bannière `stockageIndisponible` déjà
  présente dans `page-header`, qui couvre un cas différent : le stockage
  refusé par le poste).

**Test :** recharger un audit existant créé avant l'ajout du champ « Nom du
projet » → l'audit s'ouvre sans erreur, le champ est vide et modifiable ; les
nouveaux libellés/placeholders s'affichent correctement en desktop et à
l'étroit (mobile terrain).

---

## 4. Photos de l'audit (accueil du projet) — lecture seule

KAPT et Sacha demandent explicitement de ne plus pouvoir ajouter de photo
depuis cet écran, seulement consulter la galerie déjà constituée dans les
fiches techniques.

- Ajouter un `@Input() readonly = false` à `PhotoEditorComponent`
  (`photo-editor.component.ts`) : quand `true`, masquer les boutons « Prendre
  une photo », « Choisir des fichiers » et le bouton de suppression (✕) de
  chaque vignette, tout en gardant le clic sur une vignette pour l'ouvrir en
  grand (`openPhoto()`, déjà en place).
- Utiliser `[readonly]="true"` sur l'instance de `home.component.html` ligne
  132-136 (`contexte="galerie"`).
- Les autres usages de `<app-photo-editor>` (fiches techniques) restent en
  mode édition complet.

**Test :** depuis l'accueil du projet, la galerie affiche les photos déjà
prises mais aucun bouton d'ajout/suppression n'apparaît ; cliquer sur une photo
l'ouvre toujours en grand dans un nouvel onglet ; depuis une fiche technique
(ex. un robinet), la galerie reste éditable comme avant.

---

## 5. Plans du bâtiment

`plan-manager.component.html` gère déjà un nom éditable par plan
(`plan.name`), mais pas de date, et l'icône de suppression est une croix texte
(`✕`, ligne 47).

- Ajouter, au-dessus du champ nom, un libellé **« Titre du plan »** avec une
  aide invitant à un nom représentatif (étage, bâtiment…) — actuellement le
  champ n'a ni libellé ni aide, juste un `placeholder="Nom du plan"`.
- Ajouter un champ **date** à côté du titre. `AssetRef` (`data.models.ts`) n'a
  pas de champ date aujourd'hui : l'ajouter en optionnel (`date?: string`) pour
  ne pas casser les plans déjà enregistrés (import d'anciens audits, voir
  CLAUDE.md §5).
- Remplacer l'icône ✕ (ligne 40-48) par une icône poubelle (SVG inline ou glyphe
  🗑, cohérent avec la charte — pas de couleur en dur, réutiliser
  `--c-danger*`).

**Test :** charger un plan (image et PDF) → titre et date éditables,
persistent après rechargement complet (`localStorage`) ; supprimer un plan via
la nouvelle icône déclenche bien la confirmation existante et purge les
localisations (`purgePlanReferences`, déjà en place — ne pas y toucher).

---

## 6. Navigation générale (bandeau, retour, fil d'ariane)

- Retirer le texte de bas de page « Les données sont sauvegardées
  automatiquement dans le localStorage. » (`home.component.html` ligne 154) —
  jugé contre-productif (incite à ne pas exporter).
- Bouton « Retour » : le repositionner en haut à gauche du bandeau de
  navigation (`page-header.component.html`), pas à sa place actuelle — à
  vérifier visuellement, le CSS du bandeau (§10 CLAUDE.md, position sticky
  deux niveaux) ne doit pas être cassé par ce déplacement.
- Ajouter un **fil d'Ariane**, qui remplace à terme le bouton retour sur les
  pages profondes. Profondeur maximale attendue par KAPT : 5 niveaux
  (`Accueil > Nom du projet > Audit technique > Section > Élément`). Le
  composant `page-header` connaît déjà `pageTitle` et `backTo` : le fil
  d'Ariane peut se déduire de la route active (`ActivatedRoute` / `Router.url`)
  plutôt que d'ajouter un `@Input` à chaque page. Prévoir un composant dédié
  (`breadcrumb.component.ts`) plutôt que d'alourdir `page-header`.
- Renommer le bouton d'enregistrement du bandeau : « Enregistrer » →
  « Sauvegarder l'audit » (`drive-actions.component.html`, bouton actuel
  `enregistrer()`), pour lever l'ambiguïté avec le bouton « Enregistrer » d'un
  formulaire de fiche.
- « On peut gagner de la place (connexion et charger) » : resserrer visuellement
  les actions Connexion/Charger du bandeau — à évaluer une fois les deux
  écrans d'accueil séparés (point 1), une partie de l'encombrement vient du
  fait que `drive-actions` cohabite avec le sélecteur d'audit sur la même
  barre aujourd'hui.

**Test :** naviguer `Accueil → projet → Audit technique → Robinets →
Robinet n°2` : le fil d'Ariane affiche bien les 5 niveaux, chaque maillon
intermédiaire est cliquable et ramène au bon niveau ; le bandeau reste
`sticky` au défilement (CLAUDE.md §10) après les changements de mise en page.

---

## 7. Tableau de bord de l'audit technique (`qte-index`)

- Supprimer le champ « Info » en haut de page (`qte-index.component.html`
  lignes 3-6, et `saveInfo()`/`Qte.Info` dans `qte-index.component.ts`) — jugé
  non nécessaire par KAPT. Attention : `Qte.Info` reste un champ valide du
  modèle (`QteData.Info`, `data.models.ts`) pour la rétrocompatibilité des
  audits déjà enregistrés qui l'ont rempli ; ne supprimer que l'affichage/la
  saisie, pas la donnée existante.
- Renommer le bouton d'entrée « Audit technique » en **« Démarrer l'audit
  technique »** — déjà fait ailleurs (page d'accueil) d'après le dernier commit
  (`feat(diffusion)…`) : **vérifier l'état réel du libellé avant de le
  renommer à nouveau**, ce point peut déjà être résolu.
- Regrouper les 18 sections de `AUDIT_SCHEMA` par grande famille plutôt que la
  grille plate actuelle (`qte-index.component.html` lignes 8-19). Proposition
  de regroupement à valider avec Sacha avant implémentation (le classeur ne
  formalise pas ces catégories, c'est un choix éditorial) :
  - **Arrivée d'eau** — Compteur général, Sous-compteurs, Réducteurs de
    pression, Surpresseurs
  - **Réseaux ECS** — Réseaux ECS, Production / Stockage ECS
  - **Points d'eau** — Robinets, Douches et baignoires, WC, Appareils de
    lavage, Piscines
  - **Bâtiment** — Structures, Ventilation, Incendie, Toitures
  - **Extérieur** — Espaces extérieurs
  - **Autres** — Opportunités, Autres

  Implémentation : un regroupement **à côté** du schéma (pas dedans, puisque
  généré) — une constante `SECTION_GROUPS` hors `audit-schema.ts` (ex. dans
  `qte-index.component.ts` ou un petit fichier dédié), qui référence les `key`
  d'entités existantes. Une section absente de ce mapping doit rester visible
  (dans un groupe « Autres » par défaut) pour ne jamais faire disparaître une
  entité si le classeur en ajoute une sans mise à jour du regroupement.

**Test :** l'écran affiche les 18 sections réparties dans les groupes,
aucune section manquante ni dupliquée ; les compteurs par section
(`count(section)`) restent corrects ; ouvrir un audit déjà rempli sur `Qte.Info`
avant la modif — la donnée est toujours dans le JSON exporté même si elle ne
s'affiche plus.

---

## 8. Bandeaux de priorité sur les champs

Les trois comptes rendus demandent un signal visuel de priorité à côté des
libellés de champ, avec des formulations légèrement différentes (Victor : 4
niveaux, dont un sans pastille ; KAPT : 3 niveaux nommés basse/moyenne/haute ;
Sacha : dégradé jaune→orange→rouge mais déconseille le rouge, qui évoque une
erreur). Synthèse retenue : **3 niveaux nommés, dégradé d'orange clair à
foncé, jamais de rouge/vert** (évite toute confusion avec un état
d'erreur/validation) :

- pas de pastille = champ non prioritaire (défaut, pas de marquage) ;
- `Priorité : basse` — orange très clair ;
- `Priorité : moyenne` — orange moyen ;
- `Priorité : haute` — orange foncé.

**Implémentation :** ce n'est pas une donnée du classeur — `FieldDef`
(`field.models.ts`) n'a pas de notion de priorité et ne doit pas en gagner une
en dur dans `audit-schema.ts` (généré). Suivre le même principe que
`value-lists.ts` : un fichier **curé à la main**, ex.
`src/app/models/field-priority.ts`, exportant une table `{ [entityKey]:
{ [fieldKey]: 'basse' | 'moyenne' | 'haute' } }` consultée par
`audit-field.component.ts` pour afficher le badge. Curation initiale hors
périmètre de ce prompt : commencer avec une table vide ou partiellement
remplie (quelques champs évidents comme `Emplacement`), le remplissage complet
étant un travail métier à faire avec Sacha/Victor, pas une déduction du code.
Couleurs : ajouter les 3 nuances d'orange comme variables CSS dans
`styles.scss` (CLAUDE.md §10 — aucune couleur en dur dans un composant), pas
seulement dans `audit-field.component.scss`.

**Test :** un champ marqué « haute » dans la table affiche le badge orange
foncé à droite de son libellé ; un champ absent de la table n'affiche rien ;
aucune régression sur les champs `boolean`/`select` en radio (le badge doit
s'accrocher au `<legend>`, pas seulement au `<label>`).

---

## 9. Fiche d'un élément technique (`entity-form`)

Concentration de demandes des trois comptes rendus.

### 9.1 Localisation en haut de fiche

Aujourd'hui `<app-plan-locator>` est rendu **après** le bloc de champs et les
photos (`entity-form.component.html` ligne 35, en dehors du `.panel`). Les
trois retours demandent de le remonter, juste après le champ Emplacement.

- Détecter, dans `EntityFormComponent`, la ligne (`formRows`) qui contient le
  champ `Emplacement` et scinder l'affichage : les lignes jusqu'à et y compris
  celle d'Emplacement, puis `<app-plan-locator>`, puis le reste des lignes.
  Une entité sans champ `Emplacement` (rare) garde `<app-plan-locator>` en tout
  début de fiche.
- Ajouter, à côté du résumé de localisation actuel (`plan-locator.component`),
  un bouton **« Ouvrir le plan »** qui ouvre l'image du plan associé dans un
  nouvel onglet, en taille réelle — même mécanique que `openPhoto()` dans
  `photo-editor.component.ts` (`window.open(url, '_blank')`), à partir de
  `PlanLocatorComponent.currentPlan` / `urls[location.planId]`.
- Conserver le champ texte « Emplacement » tel quel (les 3 retours insistent
  pour le garder), avec une aide « Reprendre le nom de la pièce indiqué sur le
  plan » — ce texte d'aide n'existe dans aucune entité aujourd'hui (vérifié :
  `grep Emplacement` sur `audit-schema.ts` ne montre pas de `help`). Comme il
  s'agit d'un champ générique partagé par toutes les entités, l'ajouter en dur
  dans `audit-field.component.ts`/`.html` (fallback `help` quand
  `def.key === 'Emplacement'` et que `def.help` est vide), plutôt que d'éditer
  le classeur pour un texte identique répété sur 15 onglets.

### 9.2 Dupliquer un élément

Ajouter un bouton **« Dupliquer »** dans les actions de la fiche
(`entity-form.component.html` ligne 27-32, à côté d'Enregistrer/Supprimer) :

- Crée un nouvel élément (`DataService.createEntity`, en réutilisant
  l'attribution d'`Id` déjà en place — **ne jamais copier l'`Id` source**,
  CLAUDE.md §3) en recopiant tous les champs de l'élément courant sauf `Id` et
  éventuellement `Numero` (à renuméroter comme un ajout classique).
- Navigue vers la fiche du nouvel élément après duplication.
- Non disponible pour les entités `single` (pas de sens à dupliquer un
  compteur général).

### 9.3 Sectionner le formulaire en blocs

- Séparer le bloc unique actuel (`entity-form.component.html` ligne 4-33) en
  plusieurs `.panel` : un pour les champs (dans l'ordre du classeur, via
  `formRows`, inchangé), un second **blanc distinct** pour les photos
  (actuellement dans le même panel, ligne 19-25).
- Ne pas remplacer le regroupement par ligne du classeur (`groupByRow`) par une
  grille automatique — règle déjà actée en CLAUDE.md §8, à ne pas défaire à
  l'occasion de ce sectionnement.

### 9.4 Barre d'actions fixe en bas d'écran

- Remplacer les boutons Enregistrer/Supprimer en fin de formulaire par une
  barre `position: sticky` (ou `fixed`) en bas de la fenêtre, présente en
  permanence pendant le remplissage — cohérent avec l'en-tête déjà `sticky`
  (CLAUDE.md §10) : même logique, l'autre extrémité de l'écran. Renommer
  « Enregistrer » en **« Valider »**, garder « Annuler » (retour sans
  sauvegarder — actuellement il n'y a pas de bouton Annuler explicite, seul le
  bouton retour du bandeau ; à ajouter à côté de Valider dans cette barre).

### 9.5 Unité affichée comme aide, pas dans le libellé

Actuellement l'unité s'affiche entre parenthèses à côté du libellé
(`audit-field.component.html` ligne 6 et 32 : `{{ def.label }} ({{ def.unit
}})`). La demande est de la faire apparaître comme un texte d'aide, sous le
champ (ex. « m³ » en petit gris), à la manière de `def.help`.

- Retirer le `<span class="unit">` inline.
- Ajouter, sous le champ (dans le bloc `@if (def.help)` existant ou juste à
  côté), une ligne `@if (def.unit) { <p class="muted field-unit">Unité :
  {{ def.unit }}</p> }` — ou fusionner avec l'aide existante si les deux sont
  présents sur le même champ.

**Test (9.1 à 9.5) :** ouvrir la fiche d'un robinet existant → le bloc
localisation apparaît juste après Emplacement, le bouton « Ouvrir le plan »
ouvre bien l'image dans un nouvel onglet quand une localisation existe (rien
si aucune) ; dupliquer un robinet → un nouveau robinet apparaît dans la liste
avec les mêmes champs mais un `Id` et un `Numero` distincts, et supprimer
l'original ne supprime pas la copie (vérifie qu'`Id` n'est jamais partagé) ;
la barre Valider/Annuler reste visible en bas de l'écran même sur une fiche à
38 champs, y compris pendant le défilement ; l'unité (ex. « L/min ») apparaît
sous le champ Débit, plus dans son libellé.

---

## 10. Récapitulatif — check-list de non-régression à dérouler après tout ceci

Reprendre la check-list de CLAUDE.md §11, complétée des points propres à ces
changements :

1. `npm run build` puis ouvrir `index.html` en `file://` (double-clic) —
   démarrage propre, pas de page blanche.
2. `node tools/check-extract.js` — le fichier sait toujours se reproduire via
   `#/telecharger` malgré les changements de template/CSS.
3. Accueil général → accueil du projet → audit technique → fiche d'un
   élément : fil d'Ariane cohérent à chaque niveau, bouton retour toujours
   fonctionnel.
4. Créer un nouvel audit, remplir adresse/nom du projet/nom du site/auditeur/
   date, l'exporter puis le réimporter sur un profil vidé (cookies compris,
   CLAUDE.md §11 point 4) : tous les nouveaux champs survivent à l'aller-retour
   JSON.
5. Charger un plan, vérifier titre + date éditables et persistants ; localiser
   un robinet dessus ; ouvrir le plan en grand depuis la fiche du robinet ;
   supprimer le plan (icône poubelle) → la localisation du robinet disparaît
   bien (`purgePlanReferences`).
6. Dupliquer un élément dans une liste avec plusieurs entrées (ex. robinets),
   vérifier qu'aucune relation `entity-ref` existante ne pointe par erreur sur
   la copie plutôt que l'original (CLAUDE.md §3 — jamais se fier à `Numero`).
7. Recharger un audit **antérieur à ces changements** (fixture ou export
   existant) : `Nom du projet` vide mais éditable, `Qte.Info` toujours présent
   dans le JSON même s'il n'est plus affiché, plans sans date affichée
   correctement (champ optionnel).
8. Vérifier qu'aucune couleur n'a été codée en dur dans un `.scss` de
   composant (badges de priorité, icône poubelle) — seules des `var(--…)`
   définies dans `styles.scss` (CLAUDE.md §10).
