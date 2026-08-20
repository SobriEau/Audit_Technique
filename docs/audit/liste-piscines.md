# Liste Piscines

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste Piscines ».
> 30 cellules, 24 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `E27` | Type | Liste déroulante | passif · à renouvellement continu · avec rampes de lavage · avec injection automatique de désinfectant |
| `M27` | Précisions | Texte libre | — |
| `E30` | Origine eau (potable, souterraine, mer, etc.) | Texte libre | — |
| `M30` | Volume pédiluve (L) | Texte libre | — |
| `H33` | Fréquence de vidange / semaine | Texte libre | — |
| `M33` | Nombre d'équipements identiques | Nombre | — |
| `E36` | Remarques | Texte libre | — |
| `F41` | Fréquence | Texte libre | — |
| `I41` | Mode de nettoyage | Liste déroulante | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| `M41` | Précisions | Texte libre | — |
| `F44` | Utlisation d'eau NC | Oui / Non | Oui · Non |
| `I44` | Origine eau NC (pluviale, grise, etc.) | Texte libre | — |
| `M44` | Volume eau NC disponible (L) | Texte libre | — |
| `F47` | Durée d'un nettoyage | Texte libre | — |
| `K47` | Nb de nettoyage à l'eau potable/mois | Texte libre | — |
| `H50` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `M50` | Numéros des robinets correspondants | Nombre | — |
| `E53` | Remarques | Texte libre | — |
| `E56` | Remarques Générales / Règles d'accès (ex : short de bain interdit) | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- passif
- à renouvellement continu
- avec rampes de lavage
- avec injection automatique de désinfectant

**Mode de nettoyage**

- auto laveuse
- nettoyeur haute pression
- tuyaux simple
- autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `D1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `L5` **Liste Piscines** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `E8` **Numéro** — Données reprises sur les pages "bassin"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page du robinet en question
- `F59` **Enregistrer** — Enregistrement des données
- `J60` **Enregistrer** — Ajout d'une page pour un bassin / - Ajouter  un message de confirmation / - Message avertissement enregistrement ?

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `H4` | Liste Piscines |
| `E6` | Bassins |
| `E7` | Numéro |
| `F7` | Nom |
| `I7` | Emplacement |
| `K7` | Volume (m3) |
| `L7` | Remarques |
| `E25` | Pédiluve |
| `E26` | Type |
| `K26` | Précisions |
| `E29` | Origine eau (potable, souterraine, mer, etc.) |
| `K29` | Volume pédiluve (L) |
| `E32` | Fréquence de vidange / semaine |
| `K32` | Nombre d'équipements identiques |
| `E35` | Remarques |
| `E39` | Nettoyage des plages |
| `E40` | Fréquence |
| `H40` | Mode de nettoyage |
| `K40` | Précisions |
| `E43` | Utlisation d'eau NC |
| `H43` | Origine eau NC (pluviale, grise, etc.) |
| `K43` | Volume eau NC disponible (L) |
| `E46` | Durée d'un nettoyage |
| `H46` | Nb de nettoyage à l'eau potable/mois |
| `E49` | Nombre de robinet d'eau potable utilisés |
| `K49` | Numéros des robinets correspondants |
| `E52` | Remarques |
| `E55` | Remarques Générales / Règles d'accès (ex : short de bain interdit) |
| `F59` | Enregistrer |

</details>
