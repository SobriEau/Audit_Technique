# Piscine

> Spécification extraite de `audit_technique.xlsx`, onglet « Piscine ».
> 27 cellules, 28 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `E8` | Nom | Texte libre | — |
| `J8` | Emplacement | Liste déroulante | Intérieure · Extérieure · Extérieure avec possibilté d'être couverte |
| `B11` | Précision emplacement | Texte libre | — |
| `C14` | Année de construction | Texte libre | — |
| `E14` | Année de rénovation | Texte libre | — |
| `H14` | Présence connue de fuites | Oui / Non | Oui · Non |
| `I14` | Volume estimé des fuites/an | Liste déroulante | non concerné · manuelle · à pédale · à détection · à pas de temps · écoulement en continu |
| `C17` | Volume du bassin (m3) | Nombre (m3) | — |
| `E17` | Utilisation du bassin | Texte libre | — |
| `H17` | Nb de jour d'ouverture /an | Texte libre | — |
| `J17` | Fréquentation journalière | Texte libre | — |
| `D20` | Consigne apport quotidien / baigneur (L) | Texte libre | — |
| `G20` | Volume d'apport quotidien (L) | Texte libre | — |
| `J20` | Origine de l'eau du bassin | Texte libre | — |
| `E23` | Désinfection de l'eau | Texte libre | — |
| `J23` | Température de consigne du bassin (°C) | Nombre (°C) | — |
| `C26` | Nb de lavage de filtre / mois | Texte libre | — |
| `E26` | Volume rejeté / mois (m3) | Nombre (m3) | — |
| `H26` | Nb de vidange/an | Texte libre | — |
| `J26` | Volume rejeté (m3) | Nombre (m3) | — |
| `E29` | Volume d'eau devant être rejetées réutilisé/stocké (m3) | Nombre (m3) | — |
| `J29` | Possibilité de créer une zone de stockage des eaux rejetées | Oui / Non | Oui · Non |
| `B32` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Emplacement**

- Intérieure
- Extérieure
- Extérieure avec possibilté d'être couverte

**Volume estimé des fuites/an**

- non concerné
- manuelle
- à pédale
- à détection
- à pas de temps
- écoulement en continu

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Piscine** — Retour à la page "Liste WC"  / - Message avertissement enregistrement
- `D36` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `G37` **Enregistrer** — Ajout d'un page pour une piscine / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `I37` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `E4` | Piscine |
| `E5` | Numéro |
| `B7` | Nom |
| `G7` | Emplacement |
| `B10` | Précision emplacement |
| `B13` | Année de construction |
| `D13` | Année de rénovation |
| `G13` | Présence connue de fuites |
| `I13` | Volume estimé des fuites/an |
| `B16` | Volume du bassin (m3) |
| `D16` | Utilisation du bassin |
| `G16` | Nb de jour d'ouverture /an |
| `I16` | Fréquentation journalière |
| `B19` | Consigne apport quotidien / baigneur (L) |
| `E19` | Volume d'apport quotidien (L) |
| `H19` | Origine de l'eau du bassin |
| `B22` | Désinfection de l'eau |
| `G22` | Température de consigne du bassin (°C) |
| `B25` | Nb de lavage de filtre / mois |
| `D25` | Volume rejeté / mois (m3) |
| `G25` | Nb de vidange/an |
| `I25` | Volume rejeté (m3) |
| `B28` | Volume d'eau devant être rejetées réutilisé/stocké (m3) |
| `G28` | Possibilité de créer une zone de stockage des eaux rejetées |
| `B31` | Remarques |
| `D36` | Enregistrer |

</details>
