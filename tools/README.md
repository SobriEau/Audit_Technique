# Outils de transcription du classeur

`audit_technique.xlsx` est la **spécification de référence** de la partie
technique. Le schéma de l'application et la documentation en sont dérivés par
ces scripts : ne pas les modifier à la main, sinon la prochaine régénération
écrasera le travail.

## Régénérer après une modification du classeur

```bash
# 1. décompresser le classeur dans tools/.cache/xlsx/ (voir ci-dessous)
npm run gen              # extraction + schéma + pages + docs + référentiel
npm run check:coverage   # ce que le classeur contient et que le schéma n'a pas pris
npm run build            # fichier autonome
npm run check:extract    # le fichier sait-il encore se reproduire ?
npm run check:smoke      # chaque écran se rend-il en file:// ?
npm run check:exigences  # chaque fiche est-elle validable ?
```

Décompression du classeur (un .xlsx est une archive ZIP) :

```powershell
$dst = "tools\.cache\xlsx"
Remove-Item -Recurse -Force $dst -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item audit_technique.xlsx "$dst\book.zip"
Expand-Archive "$dst\book.zip" -DestinationPath $dst -Force
Remove-Item "$dst\book.zip"
```

`xlsx-extract.js` accepte un dossier source et un fichier de sortie en
arguments, ce qui permet de garder deux versions du classeur côte à côte pour
les comparer :

```bash
node tools/xlsx-extract.js tools/.cache/xlsx-v2 tools/.cache/workbook-v2.json
```

## Ce que chaque script fait

| Script | Rôle |
|---|---|
| `lib/classeur.js` | **Lecture de la mise en page** : ce qui est un libellé, une section, une priorité ou une cellule technique. Partagée par le générateur et les contrôles. Porte aussi la table des entités. |
| `xlsx-extract.js` | Lit le XML du classeur — cellules, **notes de cellules**, **styles**, plages nommées — et produit un JSON exploitable. Utilise `sax`, pas des expressions régulières : les chaînes partagées OOXML contiennent du texte enrichi et des entités échappées. |
| `gen-schema.js` | Produit le schéma des entités : champs, types, unités, listes de valeurs, **la disposition** (les champs d'une même ligne du tableau restent alignés), les **sections** et les **priorités**. |
| `gen-pages.js` | Produit `glossaire.ts` et `documents-collectes.ts` — les contenus que le classeur donne mot pour mot, sans arbitrage à faire. |
| `gen-docs.js` | Un Markdown par onglet. Les fiches sont documentées **depuis le schéma produit**, cellule d'origine comprise : la documentation décrit ainsi l'application telle qu'elle est, et non une seconde lecture du classeur qui pourrait diverger. Les autres onglets sont restitués tels quels. |
| `gen-referentiel.js` | Recense les listes de valeurs **depuis le schéma** et signale les libellés qui portent des valeurs différentes d'un endroit à l'autre. |
| `check-coverage.js` | **Contrôle** : ce que le classeur contient et que le schéma n'a pas retenu. Signale aussi les **faux champs** (à zéro attendu), les **priorités orphelines** — qui pointent chacune un champ non vu — et les **colonnes de liste introuvables**. À lancer après toute régénération. |
| `check-extract.js` | **Contrôle** : le fichier autonome sait-il encore se reproduire à l'identique ? À lancer après tout `npm run build`. Voir ci-dessous. |
| `smoke-test.js` | **Contrôle** : chaque écran se rend-il dans Chrome, en `file://` ? Attrape la page blanche, qui ne remonte aucune erreur nulle part. |
| `check-exigences.js` | **Contrôle** : chaque fiche est-elle validable, et seulement sur les champs qui la concernent ? Compile la logique d'exigence avec le schéma réel et rejoue une saisie par entité et par bloc conditionnel. |

### Une seule lecture de la mise en page

Le classeur ne déclare rien : ni ses champs, ni ses sections, ni ses niveaux de
priorité. Tout se lit dans la disposition des cellules et dans leur mise en
forme. Chaque script qui a redécouvert ces règles dans son coin en a produit
une variante : il en existait **trois**, qui se contredisaient.
`check-coverage.js` signalait comme oubliés des champs que `gen-schema.js`
retenait, et `gen-referentiel.js` fabriquait des divergences en regroupant des
listes sans rapport sous le mot « Obligatoire » voisin.

`lib/classeur.js` est désormais l'unique source de ces règles. **Un script qui
en a besoin le charge ; aucun ne les réécrit.** La table des entités y vit
aussi, pour la même raison : `gen-schema.js` et `check-coverage.js` en
portaient chacun une copie, à garder synchronisées à la main.

## `check-extract.js` — le fichier doit rester reproductible

La page `#/telecharger` produit une copie propre du fichier autonome. Comme une
page ouverte en `file://` ne peut pas relire son propre contenu, elle
**re-sérialise son DOM** en y réinjectant le `<app-root>` d'origine, mis de côté
au démarrage, et en écartant ce que l'exécution a ajouté.

Cela ne peut donner le fichier exact que si celui-ci est déjà écrit sous la forme
que le navigateur produit en le re-sérialisant — d'où la normalisation à la fin
de `inline-build.js`. Trois écarts en dépendent : les attributs sans valeur, qui
reçoivent une valeur vide ; l'espace entre `<html>` et `<head>`, supprimé ; et
celui qui suit `</body>`, déplacé à l'intérieur.

```bash
node tools/check-extract.js            # sur index.html à la racine
node tools/check-extract.js chemin.html
```

Le contrôle ouvre `#/telecharger` dans Chrome et compare **l'empreinte que la
page annonce** à celle du fichier sur le disque. Passer par l'affichage éprouve
le vrai chemin de code plutôt qu'une reconstitution parallèle qui pourrait
diverger sans qu'on le voie. En cas d'écart, il refait la reconstitution
lui-même pour situer la divergence au caractère près.

Aucune dépendance : `--dump-dom` évite de piloter le navigateur. Chrome est
cherché aux emplacements usuels, sinon renseigner `CHROME_PATH`.

## Points de vigilance

- **Le classeur ne contient aucune validation de données.** Les valeurs
  autorisées sont écrites en langage naturel, dans les notes ou dans les
  cellules. Leur extraction reste heuristique : relire le résultat.
- **`value-lists.ts` est curé à la main.** Le générateur y fait référence quand
  un ensemble d'options correspond exactement à une constante existante ; sinon
  il produit une liste en dur, à reprendre dans le référentiel.
- **`KEY_OVERRIDES` dans `gen-schema.js` fige des clés de champ** par
  [onglet][libellé exact] → clé : dès que de vrais audits circuleront, toute
  régénération devra y figer les clés des entités déjà utilisées sur le terrain
  **avant** de relancer ce script. Vide au 2026-08 : aucun audit réel n'était en
  circulation, confirmé avec l'auteur du projet avant de régénérer.

  Ce qu'il faut savoir pour la prochaine fois : le passage de la V2 à la V3 a
  fait **dériver 47 clés** et en a mis **3 en collision** — `Precisions`,
  `Materiau` et `CetEspaceEstIlEquipe` survivent, mais désignent un autre champ
  qu'avant. Une clé qui disparaît laisse un champ vide, ce qui se voit ; une
  clé qui change de sens affiche une valeur sous le mauvais intitulé, ce qui ne
  se voit pas. `KEY_OVERRIDES` règle le premier cas, pas le second : une
  collision suppose de renommer la clé entrante.

- **Les cellules techniques et les priorités s'écartent avant tout le reste.**
  Les cellules `Obligatoire`/`Recommandé`/`Facultatif` occupent la place d'un
  libellé : non filtrées, elles produisaient 406 faux champs, aux clés
  `ObligatoireBis`, `ObligatoireBisBis`… Pire, elles **referment la fenêtre de
  recherche de la note** du champ réel qui les précède, et 48 champs perdaient
  ainsi leur liste déroulante en retombant en texte libre. Les titres de
  section, eux, entrent dans la chaîne des suffixes `Bis` et **décalent le sens
  de clés existantes**. Tout cela est traité dans `lib/classeur.js`, et
  `check-coverage.js` le vérifie : sa rubrique « FAUX CHAMPS » doit rester vide.
- Certains onglets n'ont pas de note pour chacun de leurs champs (c'était le
  cas des quatre onglets ECS dans la V1 du classeur) ; leurs champs sont alors
  déduits de la seule disposition des cellules et méritent une relecture
  attentive — `check-coverage.js` les signale.
- **`requirement` (obligatoire/recommandé/facultatif) vient du classeur depuis
  la V3 (2026-08-21).** Il est rattaché en deux passes (`lireFiche`, dans
  `lib/classeur.js`) : d'abord la cellule placée à droite du libellé sur sa
  ligne, puis, pour les trois onglets qui alignent leurs marqueurs sur une
  ligne dédiée (Bassin1, Extérieur1, et partiellement WC1/Douche-baignoire1),
  la ligne voisine. La migration d'origin/main s'en tenait à la première passe
  et laissait ces champs sans exigence ; la fusion a retenu les deux (448
  champs rattachés contre 374). Un champ sans `requirement` n'affiche aucune
  pastille, est traité comme `facultatif` par le niveau de remplissage, et
  n'est jamais exigé à la validation.
- **Les blocs conditionnels se déclarent dans `ENTITIES` (`blocs`), par
  cellule du champ qui les commande.** `gen-schema.js` les résout en clé et
  **arrête la génération** si le champ, le bloc ou une valeur ne correspond
  pas : un bloc mal résolu bloquerait l'enregistrement d'une fiche pour des
  champs qui ne la concernent pas, ou cesserait d'exiger ceux qui la
  concernent. `node tools/check-exigences.js` rejoue ensuite, pour chaque
  entité et chaque valeur, une saisie complète qui doit être validable.
- **`CHAMPS_FIGES` dans `lib/classeur.js` fige les champs des entités dont
  l'onglet a disparu du classeur sans équivalent ailleurs** (V3 : Surpresseur1
  seul, marqué `horsClasseur`). Tant qu'aucun onglet ne le redécrit, une
  régénération conserve ses champs à l'identique (copie de la V2) plutôt que de
  faire disparaître l'entité — elle reste masquée par défaut sur l'accueil du
  projet, réactivable d'une case. Si un onglet réapparaît un jour sous ce nom,
  il reprend la main automatiquement et ce repli devient inutile. Repris
  d'origin/main, où la table s'appelait `LEGACY_FIELD_LINES`.
  « Réducteur de pression1 » a disparu différemment : son contenu a été
  intégré à un bloc conditionnel dans Compteur général (« Présence d'un
  réducteur de pression à proximité ? » → Réglage, Pression de consigne,
  Etat général…), donc pas de repli pour lui — la fiche à part a été retirée
  du schéma (décision Sacha, 2026-09) pour ne pas dupliquer la saisie.

---

## Intégration Google Drive — ce qui a été mesuré

Deux inconnues bloquaient la synchronisation depuis le fichier autonome. Les
deux sont levées ; les résultats sont consignés ici pour ne pas refaire le
travail.

### CORS depuis une page `file://` (origine `null`)

| Cible | Résultat |
|---|---|
| Google `device/code`, `token`, `revoke` | passent |
| Google Drive : lecture, création, **dépôt de fichier** | passent |
| Microsoft `devicecode`, GitHub `login/device/code` | **bloqués** |

Contrairement à une intuition répandue, Google renvoie les en-têtes CORS pour
l'origine nulle. Le réseau n'est donc pas un obstacle depuis un fichier local.

### Portées acceptées par le device flow

Le client doit être de type **« Téléviseurs et périphériques d'entrée
limités »** ; un client *Application Web* est refusé d'emblée.

| Portée | Résultat |
|---|---|
| `drive.file` | **acceptée** |
| `drive` (accès complet) | `invalid_scope` |
| `drive.appdata` | `invalid_scope` |

**Conséquence de conception :** `drive.file` ne donne accès qu'aux fichiers
**créés par l'application**. C'est suffisant — et souhaitable — pour déposer et
relire des audits SobriEau, avec le moindre privilège et un écran de
consentement peu inquiétant. Mais l'application ne pourra **pas** voir un
fichier déposé à la main sur le Drive par l'auditeur : seuls les siens.
