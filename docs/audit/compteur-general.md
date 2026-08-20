# Compteur général

> Spécification extraite de `audit_technique.xlsx`, onglet « Compteur général ».
> 31 cellules, 27 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `H7` | Emplacement (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) | Nombre (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) | — |
| `H11` | Condition d'accès | Texte libre | — |
| `H14` | Marque | Texte libre | — |
| `L14` | Modèle | Texte libre | — |
| `H17` | Type | Liste déroulante | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| `L17` | Classe métrologique | Liste déroulante | Classe A · Classe B · Classe C · Classe D · R40 · R50 · R63 · R80 · R100 · R125 · R160 · R200 · R250 · R315 · R400 · R160 · R200 · R400 · R500 · R630 · R800 · Inconnue |
| `H20` | Numéro de série | Nombre | — |
| `L20` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `H23` | Année de pose | Texte libre | — |
| `L23` | Index le jour de l'audit (m3) | Nombre (m3) | — |
| `H26` | Télétransmission | Oui / Non | Oui · Non |
| `L26` | Précisions télétransmission (radio, filaire, 4G/5G) | Texte libre | — |
| `H29` | Présence de protection (chocs, gel) ? | Texte libre | — |
| `L29` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `H32` | Propriétaire du compteur | Texte libre | — |
| `L32` | Date dernière maintenance | Texte libre | — |
| `H35` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) | Nombre (tourne sans débit, bloqué, bruit,…) | — |
| `H38` | Organes de réseau à proximité (vanne amont/aval, clapet anti-retour, filtre …) | Nombre (vanne amont/aval, clapet anti-retour, filtre …) | — |
| `H41` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Texte libre | — |
| `H44` | Dispositif relié au GTB/GTC ? | Oui / Non | Oui · Non |
| `H47` | Remarques | Texte libre | — |

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
- R40
- R50
- R63
- R80
- R100
- R125
- R160
- R200
- R250
- R315
- R400
- R160
- R200
- R400
- R500
- R630
- R800
- Inconnue

**Etat général***

- Bon
- Moyen
- Mauvais

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `G1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `M4` **Compteur général** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `I49` **Enregistrer** — Enregistrement des données
- `K49` **Enregistrer** — Prise de photo et ajout au dossier
- `L50` **Enregistrer** — Ajout d'une page pour un sous compteur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `N50` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `H1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `J4` | Compteur général |
| `H6` | Emplacement (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) |
| `H10` | Condition d'accès |
| `H13` | Marque |
| `L13` | Modèle |
| `H16` | Type |
| `L16` | Classe métrologique |
| `H19` | Numéro de série |
| `L19` | Diamètre Nominal (mm) |
| `H22` | Année de pose |
| `L22` | Index le jour de l'audit (m3) |
| `H25` | Télétransmission |
| `L25` | Précisions télétransmission (radio, filaire, 4G/5G) |
| `H28` | Présence de protection (chocs, gel) ? |
| `L28` | Etat général* |
| `H31` | Propriétaire du compteur |
| `L31` | Date dernière maintenance |
| `H34` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) |
| `H37` | Organes de réseau à proximité (vanne amont/aval, clapet anti-retour, filtre …) |
| `H40` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons |
| `H43` | Dispositif relié au GTB/GTC ? |
| `H46` | Remarques |
| `I49` | Enregistrer |
| `H52` | Bon état |
| `I52` | lisible, pas de corrosion significative, pas de fuite, index cohérent, plombage présent, installation stable. |
| `H53` | Etat moyen |
| `I53` | légère corrosion, partiellement lisible, léger vieillissement, vlégère vibration, doute sur la précision |
| `H54` | Mauvais état |
| `I54` | présence d'une fuite, forte corrosion, compteur bloqué ou illisible,, traces d'humiditées importantes |

</details>
