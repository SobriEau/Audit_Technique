# Compteur général

> Spécification extraite de `audit_technique.xlsx`, onglet « Compteur général ».
> 33 cellules, 21 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B7` | Emplacement | Texte libre | — |
| `B11` | Condition d'accès | Texte libre | — |
| `B14` | Marque | Texte libre | — |
| `F14` | Modèle | Texte libre | — |
| `B17` | Type | Liste déroulante | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| `F17` | Classe métrologique | Liste déroulante | Classe A · Classe B · Classe C · Classe D · Inconnue |
| `B20` | Numéro de série | Nombre | — |
| `F20` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `B23` | Année de pose | Texte libre | — |
| `F23` | Index le jour de l'audit (m3) | Nombre (m3) | — |
| `B26` | Télétransmission - Précisez | Texte libre | — |
| `F26` | Présence de protection (chocs, gel) ? | Texte libre | — |
| `B29` | Etat général | Texte libre | — |
| `F29` | Etat général | Texte libre | — |
| `B32` | Propriétaire du compteur | Texte libre | — |
| `F32` | Organes de réseau à proximité | Texte libre | — |
| `B35` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Texte libre | — |
| `B38` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Compteur à jet unique
- Compteur à jet multiple
- Compteur à palettes
- Compteur volumétrique
- Compteur électromagnétique
- Compteur ultrasonique
- Compteur à pression différentielle
- Compteur à insertion
- Inconnu

**Classe métrologique**

- Classe A
- Classe B
- Classe C
- Classe D
- Inconnue

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `G4` **Compteur général** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `C40` **Enregistrer** — Enregistrement des données

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Compteur général |
| `B6` | Emplacement |
| `B10` | Condition d'accès |
| `B13` | Marque |
| `F13` | Modèle |
| `B16` | Type |
| `F16` | Classe métrologique |
| `K17` | Avec Q1 = débit minimum mesurable avec précision |
| `K18` | Q3 = débit nominal |
| `B19` | Numéro de série |
| `F19` | Diamètre Nominal (mm) |
| `B22` | Année de pose |
| `F22` | Index le jour de l'audit (m3) |
| `B25` | Télétransmission - Précisez |
| `F25` | Présence de protection (chocs, gel) ? |
| `B28` | Etat général |
| `B31` | Propriétaire du compteur |
| `F31` | Organes de réseau à proximité |
| `K32` | vannes amont |
| `K33` | vanne aval |
| `K34` | clapet anti-retour |
| `K35` | disconnecteur |
| `K36` | réducteur de pression |
| `B37` | Remarques |
| `K37` | filtre à tamis ? |
| `C40` | Enregistrer |

</details>
