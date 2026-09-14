# Outils de transcription du classeur

`audit_technique.xlsx` est la **spécification de référence** de la partie
technique. Le schéma de l'application et la documentation en sont dérivés par
ces scripts : ne pas les modifier à la main, sinon la prochaine régénération
écrasera le travail.

## Régénérer après une modification du classeur

```bash
# 1. décompresser le classeur dans tools/.cache/xlsx/ (voir ci-dessous)
node tools/xlsx-extract.js      # → tools/.cache/workbook.json
node tools/gen-schema.js        # → src/app/models/audit-schema.ts
node tools/gen-docs.js          # → docs/audit/<onglet>.md
node tools/gen-referentiel.js   # → docs/audit/referentiel-listes.md
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

## Ce que chaque script fait

| Script | Rôle |
|---|---|
| `xlsx-extract.js` | Lit le XML du classeur — cellules, **notes de cellules**, plages nommées — et produit un JSON exploitable. Utilise `sax`, pas des expressions régulières : les chaînes partagées OOXML contiennent du texte enrichi et des entités échappées. |
| `gen-schema.js` | Produit le schéma des entités : champs, types, unités, listes de valeurs, et **la disposition** (les champs d'une même ligne du tableau restent alignés). |
| `gen-docs.js` | Un Markdown par onglet : champs attendus, listes, règles de navigation. |
| `gen-referentiel.js` | Confronte les deux sources de listes de valeurs et signale leurs divergences. |
| `check-coverage.js` | **Contrôle** : ce que le classeur contient et que le schéma n'a pas retenu. Déterministe, chaque signalement porte sa cellule d'origine. À lancer après toute régénération. |
| `check-extract.js` | **Contrôle** : le fichier autonome sait-il encore se reproduire à l'identique ? À lancer après tout `npm run build`. Voir ci-dessous. |

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
  [onglet][libellé exact] → clé, pour l'entité et le libellé concernés : dès
  que de vrais audits circuleront, toute régénération devra y figer les clés
  des entités déjà utilisées sur le terrain **avant** de relancer ce script —
  un libellé retouché dans le classeur ferait sinon dériver une nouvelle clé et
  orphelinerait silencieusement les données déjà saisies. Vide au 2026-08 :
  aucun audit réel n'était encore en circulation à cette régénération.
- Certains onglets n'ont pas de note pour chacun de leurs champs (c'était le
  cas des quatre onglets ECS dans la V1 du classeur) ; leurs champs sont alors
  déduits de la seule disposition des cellules et méritent une relecture
  attentive — `check-coverage.js` les signale.
- **`requirement` (obligatoire/recommandé/facultatif) vient du classeur depuis
  la V3 (2026-08-21).** Sur la ligne d'un champ, la cellule qui porte un de ces
  trois mots — entre l'étiquette et le champ suivant de la même ligne — est
  reprise telle quelle sur le `FieldDef` correspondant. Un champ sans ce
  marqueur (ancien onglet non repassé en V3, ou oubli) n'a pas de
  `requirement` : `entity-form.component.ts` le traite alors comme
  `facultatif` pour l'affichage, jamais comme obligatoire à la validation.
- **`LEGACY_FIELD_LINES` dans `gen-schema.js` fige les champs des entités dont
  l'onglet a disparu du classeur sans équivalent ailleurs** (V3 : Surpresseur1
  seul). Tant qu'aucun onglet ne le redécrit, une régénération conserve ses
  champs à l'identique (copie de la V2) plutôt que de faire disparaître
  l'entité — elle reste d'ailleurs masquée par défaut sur l'accueil du projet,
  réactivable d'une case. Si un onglet réapparaît un jour sous ce nom, il
  reprend la main automatiquement et ce repli devient inutile.
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
