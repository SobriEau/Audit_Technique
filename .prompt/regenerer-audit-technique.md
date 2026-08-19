# Régénérer la partie technique depuis le classeur

> **Prompt destiné à un assistant IA.** À coller tel quel quand une nouvelle
> version du classeur d'audit arrive. Il condense un travail déjà mené une fois :
> suivre l'ordre indiqué évite de refaire les mêmes erreurs, qui ont toutes
> coûté un aller-retour.

---

## 0. Commence par demander

**Ne présume pas du fichier.** Pose ces questions et attends les réponses :

1. **Quel classeur** faut-il prendre pour base ? Donne-moi le chemin exact.
   L'actuel est `audit_technique.xlsx`, à la racine du dépôt.
2. Remplace-t-il l'ancien, ou faut-il **comparer les deux** et ne présenter que
   les écarts ? La seconde réponse change tout : elle impose un diff, et surtout
   l'obligation de ne pas casser les audits déjà saisis.
3. Des **arbitrages ont-ils été rendus** depuis la dernière fois, notamment sur
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

**Titres d'onglet pris pour des champs.** Les lignes 1 à 5 portent le bandeau,
le titre de la fiche et « Numéro ». Elles doivent être écartées.

**Fausse détection d'unité.** Un motif trop permissif a transformé « Présence de
protection (chocs, gel) » en champ numérique d'unité « chocs, gel », parce que
« chocs » contient un `h`. Exiger que la parenthèse **ne contienne que** l'unité.

**Onglets sans notes.** Les quatre onglets ECS n'en portent aucune : leurs champs
ne peuvent être déduits que de la disposition — une cellule texte suivie d'une
case vide. Ce repli est fragile, signale-le et fais relire.

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
node tools/check-coverage.js            # tous les onglets
node tools/check-coverage.js Robinet1   # un seul
```

Il compare le classeur au schéma produit et remonte, **avec la cellule
d'origine** : les étiquettes sans champ correspondant, les notes décrivant un
champ qui n'a pas été retenu, et les onglets renseignés qu'aucune entité ne
couvre.

Cette passe ne peut rien inventer. Fais-la d'abord : elle réduit le travail de
lecture à ce qui le mérite.

**Son angle mort :** un onglet sans notes ne peut pas être contrôlé ainsi, faute
de repère. Les quatre onglets ECS sont dans ce cas — « Stockage ECS » ressortait
« complet » avec **un seul champ**, ce qui est manifestement faux. Ces onglets-là
relèvent entièrement de la passe 2.

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

Ce que la première passe avait relevé sur la version précédente, à titre
d'étalon : 14 notes non rattachées, dont 5 sur « équipements ECS », une
énumération sans champ sur `WC1 D51`, et l'onglet « Tableau bord » couvert par
aucune entité.

---

## 7. Vérification — la compilation ne prouve rien

Sur ce projet, **chaque** vérification en conditions réelles a révélé un bug que
la compilation ne voyait pas. Ne conclus pas sans avoir exécuté.

```bash
npx ng build --configuration production   # doit passer sans avertissement
npm start                                 # puis piloter le navigateur
```

Contrôles minimaux, tous déjà pris en défaut au moins une fois :

1. **Le nombre de sections** dans `#/qte` correspond au nombre d'entités.
2. **La disposition d'une fiche** reproduit le classeur. Pour les robinets, le
   motif attendu était `1,1,2,3,2,2,2,2,1` — à comparer au tableau Excel.
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
