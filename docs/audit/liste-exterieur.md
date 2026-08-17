# Liste Extérieur

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste Extérieur ».
> 16 cellules, 11 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `D8` | Surface Espace extérieur (m2) | Texte libre | — |
| `F8` | Surface Espace Vert (m2) | Texte libre | — |
| `D11` | Fonctions de l'eau sur ces espaces | Liste déroulante | arrosage · arrosage et nettoyage · arrosage et autre · nettoyage · nettoyage et autre · autre · arrosage · nettoyage et autre |
| `F11` | Si autre - Précisez | Texte libre | — |
| `B30` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Fonctions de l'eau sur ces espaces**

- arrosage
- arrosage et nettoyage
- arrosage et autre
- nettoyage
- nettoyage et autre
- autre
- arrosage
- nettoyage et autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H5` **Espace Vert / Extérieur** — Retour à la page "Liste Robinet"  / - Message avertissement enregistrement
- `B15` **Numéro** — Données reprises sur les pages "Espace vert/extérieur"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page du robinet en question
- `C33` **Enregistrer** — Enregistrement des données
- `G34` **Enregistrer** — Ajout d'un page pour espace vert/extérieur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `O37` Mesurer ma témpératire d'eau chaude au robinet  ?

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Espace Vert / Extérieur |
| `B7` | Surface Espace extérieur (m2) |
| `F7` | Surface Espace Vert (m2) |
| `B10` | Fonctions de l'eau sur ces espaces |
| `F10` | Si autre - Précisez |
| `B13` | Numéro |
| `C13` | Emplacement |
| `F13` | Arrosage |
| `G13` | Nettoyage |
| `H13` | Autre |
| `F14` | Surface à arroser (m2) |
| `G14` | Usage |
| `H14` | Usage |
| `B29` | Remarques |
| `C33` | Enregistrer |

</details>
