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

## Points de vigilance

- **Le classeur ne contient aucune validation de données.** Les valeurs
  autorisées sont écrites en langage naturel, dans les notes ou dans les
  cellules. Leur extraction reste heuristique : relire le résultat.
- **`value-lists.ts` est curé à la main.** Le générateur y fait référence quand
  un ensemble d'options correspond exactement à une constante existante ; sinon
  il produit une liste en dur, à reprendre dans le référentiel.
- **Les clés de stockage des robinets sont figées** par `KEY_OVERRIDES` dans
  `gen-schema.js` : des audits existent avec ces clés, les changer les casserait.
- Les quatre onglets ECS ne portent aucune note ; leurs champs sont déduits de
  la seule disposition des cellules et méritent une relecture attentive.

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
