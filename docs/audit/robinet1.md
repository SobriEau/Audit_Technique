# Robinet1

> Spécification extraite de `audit_technique.xlsx`, onglet « Robinet1 ».
> 20 cellules, 22 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B8` | Emplacement | Texte libre | — |
| `B11` | Précision emplacement | Texte libre | — |
| `E15` | Usages | Texte libre | — |
| `I15` | Type | Liste déroulante | Simple EF · Simple EF de puisage extérieur · Mélangeur · Mitigeur classique · Mitigeur à butée · Mitigeur thermostatique |
| `C18` | Commande | Liste déroulante | manuelle · au genou · à pédale · à détection |
| `F18` | Temporisation | Liste déroulante | Aucune · Mécanique · Electronique |
| `I18` | Présence d'un cool-start | Oui / Non | Oui · Non |
| `E21` | Débit en sortie du robinet (L/min) | Nombre (L/min) | — |
| `I21` | Présence d'un réducteur de débit | Oui / Non | Oui · Non |
| `E24` | Temps obtention ECS (s) | Nombre (s) | — |
| `E27` | Diamètre Nominal de l'alimentation (mm) | Nombre (mm) | — |
| `I27` | Matériau du tuyau d'alimentation | Liste déroulante | Cuivre · Multicouche · PER · PEHD · PE |
| `E30` | Nombre d'utlisation/semaine | Nombre | — |
| `I30` | Nombre d'équipements identiques | Nombre | — |
| `B33` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Simple EF
- Simple EF de puisage extérieur
- Mélangeur
- Mitigeur classique
- Mitigeur à butée
- Mitigeur thermostatique

**Commande**

- manuelle
- au genou
- à pédale
- à détection

**Temporisation**

- Aucune
- Mécanique
- Electronique

**Matériau du tuyau d'alimentation**

- Cuivre
- Multicouche
- PER
- PEHD
- PE

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H5` **Robinet** — Retour à la page "Liste Robinet"  / - Message avertissement enregistrement
- `T20` **Présence d'un réducteur de débit** — Mesurer la témpérature d'eau chaude au robinet  ?
- `I24` **Numéro réseau ECS d'appartenance** — préciser le n° d'équipement d'ECS auquel le robinet est relié ? / Même raisonnement pour les compteurs ?
- `C36` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `G37` **Enregistrer** — Ajout d'un page pour réducteur de pression / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `H37` **Enregistrer** — Suppression de la page ? / Ajouter l'impossibilité de supprimer la 1ere page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Robinet |
| `E5` | Numéro |
| `B7` | Emplacement |
| `B10` | Précision emplacement |
| `B14` | Usages |
| `G14` | Type |
| `B17` | Commande |
| `E17` | Temporisation |
| `H17` | Présence d'un cool-start |
| `B20` | Débit en sortie du robinet (L/min) |
| `G20` | Présence d'un réducteur de débit |
| `B23` | Temps obtention ECS (s) |
| `G23` | Numéro réseau ECS d'appartenance |
| `B26` | Diamètre Nominal de l'alimentation (mm) |
| `G26` | Matériau du tuyau d'alimentation |
| `B29` | Nombre d'utlisation/semaine |
| `G29` | Nombre d'équipements identiques |
| `B32` | Remarques |
| `C36` | Enregistrer |

</details>
