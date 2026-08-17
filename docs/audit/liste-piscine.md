# Liste Piscine

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste Piscine ».
> 21 cellules, 15 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `C27` | Fréquence | Texte libre | — |
| `F27` | Mode de nettoyage | Liste déroulante | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| `J27` | Précisions | Texte libre | — |
| `C30` | Utlisation d'eau NC | Oui / Non | Oui · Non |
| `F30` | Origine eau NC | Texte libre | — |
| `J30` | Volume eau NC disponible (L) | Texte libre | — |
| `C33` | Durée d'un nettoyage | Texte libre | — |
| `H33` | Nb de nettoyage à l'eau potable/mois | Texte libre | — |
| `E36` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `J36` | Numéros des robinets correspondants | Nombre | — |
| `B39` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Mode de nettoyage**

- auto laveuse
- nettoyeur haute pression
- tuyaux simple
- autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Liste des Piscines** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `B8` **Numéro** — Données reprises sur les pages "piscine"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page du robinet en question
- `G43` **Enregistrer** — Ajout d'une page pour une piscine / - Ajouter  un message de confirmation / - Message avertissement enregistrement ?

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `E4` | Liste des Piscines |
| `B7` | Numéro |
| `C7` | Nom |
| `F7` | Emplacement |
| `H7` | Volume (m3) |
| `I7` | Remarques |
| `B25` | Nettoyage des plages |
| `B26` | Fréquence |
| `E26` | Mode de nettoyage |
| `H26` | Précisions |
| `B29` | Utlisation d'eau NC |
| `E29` | Origine eau NC |
| `H29` | Volume eau NC disponible (L) |
| `B32` | Durée d'un nettoyage |
| `E32` | Nb de nettoyage à l'eau potable/mois |
| `B35` | Nombre de robinet d'eau potable utilisés |
| `H35` | Numéros des robinets correspondants |
| `B38` | Remarques |
| `C42` | Enregistrer |

</details>
