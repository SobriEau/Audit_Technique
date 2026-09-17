# Compteur général

Entité `releve_compteur_general` — route `#/qte/compteur-general` (fiche unique).

22 champ(s), 7 section(s). Colonnes du tableau : —.


## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H7` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `H11` | Condition d'accès (colonne montante, derrière la chaudière, en regard, sous-clé, etc.) | Facultatif | Champ libre |

## Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H14` | Type | Obligatoire | Liste déroulante : Compteur à jet unique, Compteur à jet multiple, Compteur à palettes, Compteur volumétrique, Compteur électromagnétique, Compteur ultrasonique |
| `L14` | Classe métrologique | Obligatoire | Liste déroulante : Classe A Classe B Classe C Classe D R40 R50 R63 R80 R100 R125 R160 R200 R250 R315 R400 R160 R200 R400 R500 R630 R800 Inconnue |
| `H17` | Année de pose | Facultatif | Champ Libre |
| `L17` | Propriétaire du compteur | Facultatif | Champ Libre |
| `H20` | Nombre d'abonnement eau potable du bâtiment | Facultatif | Champ Libre |

## Connexion

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H23` | Télétransmission | Obligatoire | Liste déroulante O/N |
| `L23` | Précisions télétransmission (radio, filaire, 4G/5G) | Facultatif | Champ Libre |
| `H26` | Dispositif relié au GTB/GTC ? | Facultatif | Liste déroulante O/N |

## Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H29` | Présence de protection (chocs, gel) ? | Facultatif | Champ Libre |
| `L29` | Etat général* | Obligatoire | Liste déroulante Bon Moyen Mauvais |
| `H32` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) | Obligatoire | Champ Libre |
| `H35` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Facultatif | Champ libre |
| `H43` | Présence d'un réducteur de pression à proximité ? | Obligatoire | liste déroulante Oui Non Si oui, afficher les champs dudessous. Si non, ne pas les afficher. |

## Réducteur de pression — Réglage

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H47` | Pression de consigne actuelle (bar) | Recommandé | Champ Libre |
| `L47` | Pression affichée si manomètre (bar) | Facultatif | Champ Libre |
| `H50` | Plage de réglage de la pression (bar) | Facultatif | Champ Libre |
| `L50` | Dispositif relié au GTB/GTC ? | Facultatif | Liste déroulante O/N |

## Réducteur de pression — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `H53` | Etat général* | Obligatoire | Liste déroulante Bon Moyen Mauvais |
| `H56` | Dysfonctionnements observés (coups de bélier, vibrations, bruit, vis de réglage bloquée, …) | Obligatoire | Champ Libre |
| `H63` | Remarques | — | Champ libre |
