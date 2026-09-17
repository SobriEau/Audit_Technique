# Régénérer la partie technique depuis le classeur

> **Prompt destiné à un assistant IA.** À coller tel quel quand une nouvelle
> version du classeur d'audit arrive. Il condense un travail déjà mené une fois :
> suivre l'ordre indiqué évite de refaire les mêmes erreurs, qui ont toutes
> coûté un aller-retour.

---

## 0. Commence par demander

**Ne présume pas du fichier.** Pose ces questions et attends les réponses :

1. **Quel classeur** faut-il prendre pour base ? Donne-moi le chemin exact.
   `audit_technique.xlsx`, à la racine, est la copie canonique de la dernière
   version retenue — mais plusieurs classeurs datés cohabitent à la racine, et
   le plus récent n'est pas forcément celui qu'on veut. Demande, ne devine pas.
   Pour comparer deux versions, `xlsx-extract.js` accepte un dossier source et
   un fichier de sortie en arguments.
2. Remplace-t-il l'ancien, ou faut-il **comparer les deux** et ne présenter que
   les écarts ? La seconde réponse change tout : elle impose un diff, et surtout
   l'obligation de ne pas casser les audits déjà saisis.
3. **Des audits réels circulent-ils déjà ?** C'est la question qui commande tout
   le reste, et la seule à laquelle tu ne peux pas répondre seul. Si oui, il faut
   remplir `KEY_OVERRIDES` **avant** de lancer le générateur : le passage de la
   V2 à la V3 a fait dériver 47 clés de stockage et en a mis 3 en collision. Une
   clé qui disparaît laisse un champ vide, ce qui se voit ; une clé qui change de
   sens affiche une valeur sous le mauvais intitulé, ce qui ne se voit pas.
4. Des **arbitrages ont-ils été rendus** depuis la dernière fois, notamment sur
   les listes de valeurs divergentes signalées dans
   `docs/audit/referentiel-listes.md` ?

La suite dépend de ces réponses.

---

## 1. Ce qu'est réellement ce classeur

À revérifier, mais c'était vrai de la version précédente, et l'ignorer fait
perdre beaucoup de temps :

- **Ce n'est pas une feuille de calcul, c'est une maquette de spécification.**
  Chaque onglet décrit un écran de l'application.
- **Il ne contient aucune validation de données Excel.** Zéro `dataValidation`,
  zéro liste déroulante native. Ne cherche pas à en résoudre : les valeurs
  autorisées sont écrites **en langage naturel**, soit dans les notes de
  cellules, soit dans les cellules elles-mêmes.
- **Aucune formule inter-onglets.** Les relations entre pages sont décrites en
  prose dans les notes.
- **La spécification vit dans les notes de cellules** — environ 320 la dernière
  fois, signées de leurs auteurs. Une note est attachée à la **cellule de
  saisie**, qui se trouve *sous* son étiquette.
- **La disposition des cellules est la mise en page attendue.** Les étiquettes
  d'une même ligne Excel restent sur une même ligne du formulaire. Ne remplace
  jamais ce groupement par une grille automatique : c'est une erreur qui a déjà
  été commise et qu'il a fallu défaire.

---

## 2. Extraction

Décompresser le `.xlsx` — c'est une archive ZIP — puis lancer la chaîne
existante :

```bash
node tools/xlsx-extract.js      # → tools/.cache/workbook.json
node tools/gen-schema.js        # → src/app/models/audit-schema.ts
node tools/gen-docs.js          # → docs/audit/<onglet>.md
node tools/gen-referentiel.js   # → docs/audit/referentiel-listes.md
```

`tools/README.md` donne la commande de décompression PowerShell.

**Utilise un vrai parseur XML**, jamais des expressions régulières : les chaînes
partagées OOXML contiennent du texte enrichi et des entités échappées. Le paquet
`sax` est déjà présent dans `node_modules`.

Les notes vivent dans `xl/comments*.xml`, reliées à leur feuille par
`xl/worksheets/_rels/sheetN.xml.rels`.

---

## 3. Pièges déjà rencontrés — à lire avant de coder

Chacun a produit un bug réel.

**Titres d'onglet pris pour des champs.** L'en-tête porte le fil d'Ariane, le
titre de la fiche et « Numéro ». Sa hauteur **varie d'un onglet à l'autre** :
une borne fixe à la ligne 5 laissait passer « Réseau de distribution d'Eau
Chaude Sanitaire » pour un champ, le titre ayant glissé en ligne 6 sur trois
onglets. La borne se prend sur la cellule « Numéro » elle-même.

**Les cellules de priorité occupent la place d'un libellé.** Depuis la V3,
chaque question porte `Obligatoire`, `Recommandé` ou `Facultatif` dans une
cellule à sa droite. Non filtrées, ces 481 cellules produisaient **406 faux
champs**, aux clés `ObligatoireBis`, `ObligatoireBisBis`… Et surtout, en
s'intercalant entre un libellé et sa note, elles **referment la fenêtre de
recherche** : 48 champs réels perdaient leur liste déroulante et retombaient en
texte libre, sans que rien ne le signale. Même chose pour les boutons
(« Valider », qui a remplacé « Enregistrer », et « Ouvrir le plan », inédit) et
les exemples de saisie (« AAAA », « jj/mm/aaaa »).

**Les titres de section décalent le sens des clés.** Ils entrent dans la chaîne
des suffixes `Bis` : sur « Appareils de lavage », `UtilisationsBis` désignait le
lave-vaisselle en V2 et un titre de section en V3, la valeur du lave-vaisselle
glissant sous `UtilisationsBisBis`, qui portait l'autolaveuse. Ce n'est pas un
orphelinage — c'est une **corruption silencieuse**, sans champ vide pour
alerter.

**Une note peut être sur la ligne du libellé.** Le classeur la pose d'ordinaire
sur la cellule de saisie, en dessous ; la V3 en place aussi à droite, sur la
même ligne. Ne chercher qu'en dessous rend ces champs invisibles dans les deux
sens : ni retenus, ni signalés oubliés.

**Une liste peut n'avoir aucun marqueur.** Seize énumérations de la V3 n'ont ni
« liste déroulante » ni « à cocher » — dont « Type de toilette ou urinoir » et
ses quinze options, pourtant obligatoire. Une note faite de plusieurs lignes
courtes, sans ponctuation de phrase ni consigne d'interface, en est une.

**Une note mélange la liste et la consigne.** « liste déroulante douche ou
baignoire ⏎⏎ Affiche ensuite la partie "Douche" ou "Baignoire" » : sans coupe à
la ligne vide, la consigne devient deux options de plus.

**Fausse détection d'unité.** Un motif trop permissif a transformé « Présence de
protection (chocs, gel) » en champ numérique d'unité « chocs, gel », parce que
« chocs » contient un `h`. Exiger que la parenthèse **ne contienne que** l'unité.

**Onglets sans notes.** C'était le cas des quatre onglets ECS de la V1 : leurs
champs ne pouvaient être déduits que de la disposition. Ce repli existe encore
dans le code, mais **plus aucun onglet ne le déclenche** depuis la V2. S'il se
remet à servir, c'est que quelque chose d'autre a cassé.

**Énumérations sans séparateur.** « liste déroulante douche ou baignoire » n'a ni
virgule ni retour à la ligne. Traiter le « ou ».

**Copier-collés fautifs dans le classeur.** La version précédente faisait dire à
`Liste SS-compteurs` et `Liste Réseaux EF-EC` : « Données reprises sur les pages
"Robinet" ». Une lecture littérale câblerait une navigation fausse. Les repérer
et les signaler plutôt que les reproduire.

**Options aberrantes.** « Volume estimé des fuites/an » recevait la liste des
commandes de chasse d'eau. Traiter en nombre, et documenter l'anomalie.

**Point-virgule automatique en JavaScript.** Un `return` suivi d'un saut de ligne
renvoie `undefined`. Cette erreur est survenue **deux fois**. Mettre l'expression
sur la même ligne, ou l'entourer de parenthèses.

**Caractères invisibles écrits littéralement.** `U+2028` et `U+2029` terminent
une ligne de code source : une classe de caractères les contenant en clair casse
le fichier. Toujours des séquences `\uXXXX`.

---

## 4. Règles à ne pas enfreindre

**Les clés de stockage sont figées.** Renommer une clé rend illisibles les audits
déjà saisis. `KEY_OVERRIDES`, dans `tools/gen-schema.js`, fige celles des
robinets : **étends cette table** à toute entité déjà utilisée sur le terrain,
au lieu de laisser le générateur en dériver de nouvelles.

**`audit-schema.ts` est généré.** Ne jamais l'éditer à la main. Pour changer un
champ, corriger le classeur ; pour changer une liste de valeurs,
`src/app/models/value-lists.ts`, qui est curé à la main.

**Identité contre numéro.** Chaque élément porte un `Id` stable, jamais
renuméroté, distinct du `Numero` affiché. La spécification demande de
renuméroter après suppression : s'y fier ferait glisser silencieusement les
relations entre éléments vers de mauvaises cibles.

**Une valeur enregistrée absente d'une liste est conservée** et signalée « hors
liste ». Faire évoluer une énumération ne doit jamais effacer une saisie de
terrain.

**Ne touche pas au moteur de rendu.** `entity-list`, `entity-form` et
`audit-field` sont génériques : tout passe par le schéma. Si un cas semble
exiger un composant dédié, dis-le au lieu de contourner.

---

## 5. Ce qu'il faut produire

| Cible | Contenu |
|---|---|
| `src/app/models/audit-schema.ts` | Entités : clé de stockage, route, champs, types, unités, `row`, colonnes de liste |
| `src/app/models/value-lists.ts` | Listes de valeurs curées, divergences signalées |
| `docs/audit/<onglet>.md` | Une fiche par onglet : champs, listes, règles, contenu brut |
| `docs/audit/agencement.md` | Hiérarchie des pages, motif liste/fiche, relations entre entités |
| `docs/audit/referentiel-listes.md` | Les deux sources de listes et leurs écarts |

Le champ `row` porte le numéro de ligne Excel : c'est lui qui reproduit la mise
en page. Les champs partageant une valeur sont rendus côte à côte.

---

## 6. Audit de couverture — deux passes, dans cet ordre

Le générateur travaille par heuristiques : il laisse forcément des choses de
côté, et **l'oubli est silencieux**. C'est ainsi que la fiche WC est restée à 12
champs sur 27 sans que rien ne le signale. Ne saute pas cette étape.

### Passe 1 — mécanique, sans IA

```bash
npm run check:coverage                # tous les onglets
node tools/check-coverage.js Robinets # un seul
```

Il compare le classeur au schéma produit et remonte, **avec la cellule
d'origine** : les étiquettes sans champ correspondant, les notes décrivant un
champ qui n'a pas été retenu, les onglets qu'aucune entité ne couvre, et trois
contrôles ajoutés pour la V3 —

- **FAUX CHAMPS** : un champ dont le libellé est un mot de priorité ou un
  bouton. **Attendu à zéro.** S'il remonte, c'est le générateur qu'il faut
  corriger, pas le classeur.
- **Priorités sans champ** : le classeur a jugé une question digne d'un niveau
  d'exigence, et le lecteur ne l'a pas vue. C'est le signalement le plus utile
  de tous : les six de la première passe pointaient six vrais champs manqués.
- **Colonnes de liste introuvables** : `listColumns` est écrit à la main, les
  clés de champ dérivent des libellés. Une reformulation en amont suffit à
  rendre une colonne orpheline, et le tableau se contente alors de ne pas
  l'afficher.

Cette passe ne peut rien inventer. Fais-la d'abord : elle réduit le travail de
lecture à ce qui le mérite.

⚠️ **N'utilise aucun total comme étalon d'une passe à l'autre.** Les chiffres
dépendent autant de l'outillage que du classeur : le même contrôle affichait
540 étiquettes non couvertes avant correction et 46 après, sur le **même**
classeur. Un total qui explose accuse l'outil, pas la transcription.

**Son angle mort :** le contrôle ne voit une étiquette que si une note s'y
rattache. Les légendes du classeur — les tables qui définissent « Bon état /
Etat moyen / Mauvais état », les noms de formes de gouttières — sont écartées
par une heuristique de voisinage, qui n'est pas infaillible.

### Passe 2 — un relecteur par onglet

Pour chaque onglet signalé `À RELIRE`, sans notes, ou dont le nombre de champs
paraît faible, confie la relecture à un sous-agent — **un par onglet**, ils sont
indépendants. Donne-lui une consigne stricte :

> Voici le contenu brut de l'onglet *X* (cellules et notes) et les champs que le
> schéma en a tirés. Dis-moi ce que le schéma a perdu.
>
> **Règles :** cite la **référence de cellule** de chaque élément signalé ; ne
> propose jamais un champ qui ne s'appuie pas sur une cellule ou une note
> existante ; distingue trois catégories — *champ de saisie manquant*, *aide ou
> précision perdue*, *règle de comportement* (navigation, enregistrement, question
> ouverte des auteurs) ; et signale les contradictions internes plutôt que de les
> arbitrer.

Exige la référence de cellule : c'est ce qui rend chaque signalement vérifiable
en dix secondes, et ce qui empêche un rapport plausible mais inventé.

**Ne traite pas leurs conclusions comme acquises.** Les corrections vont dans le
classeur ou dans `value-lists.ts`, jamais directement dans `audit-schema.ts` qui
est généré. Un élément signalé n'est pas forcément un oubli : beaucoup de notes
décrivent une navigation ou posent une question aux auteurs.

Ce que la passe 1 relevait après la régénération V3, pour situer l'ordre de
grandeur — et **non** comme un seuil à retrouver : 46 étiquettes sans champ (des
légendes, pour l'essentiel), 4 notes non rattachées, 1 priorité orpheline, 0
faux champ. Si un total s'en écarte d'un facteur deux, soupçonne l'outillage
avant la transcription.

---

## 7. Vérification — la compilation ne prouve rien

Sur ce projet, **chaque** vérification en conditions réelles a révélé un bug que
la compilation ne voyait pas. Ne conclus pas sans avoir exécuté.

```bash
npx ng build --configuration production   # doit passer sans avertissement
npm run build && npm run check:smoke      # chaque écran se rend-il en file:// ?
npm start                                 # puis piloter le navigateur
```

`smoke-test.js` ouvre chaque écran dans Chrome à l'origine de l'auditeur et
vérifie qu'un repère attendu s'y trouve. Il n'attrape que la panne franche —
il ne remplace pas un essai à la main, mais il attrape la page blanche, qui ne
remonte aucune erreur nulle part.

Contrôles minimaux, tous déjà pris en défaut au moins une fois :

1. **Le nombre de sections** dans `#/qte` correspond aux entités demandées par
   les utilisations d'eau cochées, plus les sept toujours visibles.
2. **La disposition d'une fiche** reproduit le classeur : les champs d'une même
   ligne Excel restent côte à côte, et chaque section du classeur donne un bloc.
   Compare une fiche à l'onglet, ligne à ligne.
3. **Les options d'une liste** correspondent à la note d'origine.
4. **Moins de quatre options donne des boutons radio**, au-delà un champ
   filtrant — voir `RADIO_THRESHOLD` dans `audit-field.component.ts`.
5. **Une référence entre entités** propose les éléments cibles et stocke leur
   `Id`, pas leur numéro.
6. **Changer d'entité par l'URL** ne conserve pas la précédente. Angular réutilise
   l'instance du composant : lire les paramètres de route **par abonnement**,
   jamais par `snapshot`. Ce bug avait créé un robinet depuis la page des douches.
7. **L'export emporte tout** : plans, galerie, photos d'un élément **et** d'une
   fiche unique, localisations sur plan. Un parcours limité aux robinets avait
   fait disparaître les autres photos en silence.
8. **Le fichier autonome démarre en `file://`** après `npm run build`.

Écris tes vérifications comme un script piloté par le Chrome DevTools Protocol
plutôt qu'à la main : `ws` est disponible dans `node_modules`, et c'est ainsi
que les points ci-dessus ont été validés.

**Quand un test échoue, cherche d'abord si c'est le test qui a tort.** C'est
arrivé plusieurs fois : attente trop courte avant le rendu d'Angular,
comparaison sensible à la casse, base IndexedDB supprimée pendant qu'une
connexion restait ouverte, `focus()` programmatique sans effet en mode headless.
Ne signale un bug applicatif qu'après avoir écarté ces causes.

---

## 8. Pour finir

- Régénère le livrable avec `npm run build`, puis vérifie que `index.html` est
  bien plus récent que `src/`.
- Mets à jour `CLAUDE.md` si une contrainte structurante a changé, et **corrige
  les passages devenus faux** : un guide périmé est pire que pas de guide.
- Signale explicitement les onglets vides, les champs déduits sans note, les
  listes divergentes non arbitrées, et tout ce que tu n'as pas pu vérifier.

Ne présente pas comme terminé ce qui n'a pas été exécuté.
