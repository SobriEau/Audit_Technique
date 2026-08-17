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
