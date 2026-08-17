# Extérieur1

> Spécification extraite de `audit_technique.xlsx`, onglet « Extérieur1 ».
> 45 cellules, 44 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B8` | Emplacement | Texte libre | — |
| `B11` | Précision emplacement | Texte libre | — |
| `C16` | Surface à arroser (m2) | Texte libre | — |
| `F16` | Mode d'arrosage | Liste déroulante | Arrosage goutte à goutte · Arrossage tuyaux poreux · Arrossage non sélectif · Autre |
| `J16` | Précisions | Texte libre | — |
| `C19` | Présence de paillage | Oui / Non | Oui · Non |
| `F19` | Arrosage automatique | Oui / Non | Oui · Non |
| `J19` | Arrosage en fonction de la météo | Oui / Non | Oui · Non |
| `B22` | Végétaux sur cette surface | Texte libre | — |
| `C25` | Utilisation d'eau NC | Oui / Non | Oui · Non |
| `F25` | Origine eau NC | Texte libre | — |
| `J25` | Volume eau NC disponible (L) | Texte libre | — |
| `C28` | Nb de mois d'arrosage / an | Texte libre | — |
| `F28` | Durée d'un arrosage | Texte libre | — |
| `J28` | Nb d'arrosage à l'eau potable / mois | Texte libre | — |
| `E31` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `J31` | Numéros des robinets correspondants | Nombre | — |
| `C35` | Usage | Texte libre | — |
| `F35` | Mode de nettoyage | Liste déroulante | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| `J35` | Précisions | Texte libre | — |
| `C38` | Utlisation d'eau NC | Oui / Non | Oui · Non |
| `F38` | Origine eau NC | Texte libre | — |
| `J38` | Volume eau NC disponible (L) | Texte libre | — |
| `C41` | Durée d'un nettoyage | Texte libre | — |
| `H41` | Nb de nettoyage à l'eau potable/mois | Texte libre | — |
| `E44` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `J44` | Numéros des robinets correspondants | Nombre | — |
| `C48` | Usage | Texte libre | — |
| `E48` | Précisions | Texte libre | — |
| `C51` | Utlisation d'eau NC | Oui / Non | Oui · Non |
| `F51` | Origine eau NC | Texte libre | — |
| `J51` | Volume eau NC disponible (l) | Texte libre | — |
| `E54` | Volume d'eau potable utlisé / mois (l) | Texte libre | — |
| `I54` | Fréquence/mois | Texte libre | — |
| `E57` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `J57` | Numéros des robinets correspondants | Nombre | — |
| `B60` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Mode d'arrosage**

- Arrosage goutte à goutte
- Arrossage tuyaux poreux
- Arrossage non sélectif
- Autre

**Mode de nettoyage**

- auto laveuse
- nettoyeur haute pression
- tuyaux simple
- autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `F5` **Espace Vert / Extérieur** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `I5` **Espace Vert / Extérieur** — Retour à la page "Liste Robinet"  / - Message avertissement enregistrement
- `C63` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `H64` **Enregistrer** — Ajout d'un page pour espace vert/extérieur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `I64` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation
- `Q67` Mesurer ma témpératire d'eau chaude au robinet  ?

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `E4` | Espace Vert / Extérieur |
| `F5` | Numéro |
| `B7` | Emplacement |
| `B10` | Précision emplacement |
| `B14` | Arrosage |
| `B15` | Surface à arroser (m2) |
| `E15` | Mode d'arrosage |
| `H15` | Précisions |
| `B18` | Présence de paillage |
| `E18` | Arrosage automatique |
| `H18` | Arrosage en fonction de la météo |
| `B21` | Végétaux sur cette surface |
| `B24` | Utilisation d'eau NC |
| `E24` | Origine eau NC |
| `H24` | Volume eau NC disponible (L) |
| `L24` | NC = non conventionnelle (pluie, eau grise etc…) |
| `B27` | Nb de mois d'arrosage / an |
| `E27` | Durée d'un arrosage |
| `H27` | Nb d'arrosage à l'eau potable / mois |
| `B30` | Nombre de robinet d'eau potable utilisés |
| `H30` | Numéros des robinets correspondants |
| `B33` | Nettoyage |
| `B34` | Usage |
| `E34` | Mode de nettoyage |
| `H34` | Précisions |
| `B37` | Utlisation d'eau NC |
| `E37` | Origine eau NC |
| `H37` | Volume eau NC disponible (L) |
| `B40` | Durée d'un nettoyage |
| `E40` | Nb de nettoyage à l'eau potable/mois |
| `B43` | Nombre de robinet d'eau potable utilisés |
| `H43` | Numéros des robinets correspondants |
| `B46` | Autre |
| `B47` | Usage |
| `E47` | Précisions |
| `B50` | Utlisation d'eau NC |
| `E50` | Origine eau NC |
| `H50` | Volume eau NC disponible (l) |
| `B53` | Volume d'eau potable utlisé / mois (l) |
| `H53` | Fréquence/mois |
| `B56` | Nombre de robinet d'eau potable utilisés |
| `H56` | Numéros des robinets correspondants |
| `B59` | Remarques |
| `C63` | Enregistrer |

</details>
