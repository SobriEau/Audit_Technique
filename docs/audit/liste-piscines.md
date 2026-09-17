# Liste Piscines

Entité `zone_piscine` — route `#/qte/piscines-zone` (fiche unique).

17 champ(s), 2 section(s). Colonnes du tableau : —.


## Pédiluve

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E27` | Type | Obligatoire | Liste déroulante passif, à renouvellement continu, avec rampes de lavage, avec injection automatique de désinfectant |
| `K27` | Précisions | Facultatif | Champ libre |
| `E30` | Origine de l'eau | Facultatif | liste déroulante eau potable, eau de mer, eau souterraine, eau de pluie, eau pluviale, eau de surface |
| `K30` | Volume pédiluve (L) | Recommandé | Champ libre |
| `E33` | Fréquence de vidange / semaine | Recommandé | Champ libre |
| `K33` | Nombre d'équipements identiques | Obligatoire | Champ libre |
| `E36` | Remarques | Facultatif | champs libre |

## Nettoyage des plages

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E41` | Fréquence | Recommandé | Champ libre |
| `H41` | Mode de nettoyage | Recommandé | liste déroulante auto laveuse nettoyeur haute pression tuyaux simple autre |
| `K41` | Précisions | Facultatif | Champ libre |
| `E44` | Eau utilisée pour le lavage | Facultatif | liste déroulante eau potable, eau de mer, eau souterraine, eau de pluie, eau pluviale, eau de surface |
| `H44` | Origine eau NC (pluviale, grise, etc.) | Facultatif | Champ libre |
| `K44` | Volume eau NC disponible (L) | Facultatif | Champ libre |
| `E47` | Durée d'un nettoyage | Facultatif | Champ libre |
| `K47` | Numéros des robinets correspondants | Facultatif | Champ libre |
| `E50` | Remarques | Facultatif | champs libre |
| `E53` | Remarques Générales / Règles d'accès (ex : short de bain interdit) | — | champs libre |
