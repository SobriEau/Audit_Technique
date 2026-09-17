# Incendie

Entité `incendie` — route `#/qte/incendie`.

21 champ(s), 5 section(s). Colonnes du tableau : `Emplacement`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement (partie du bâtiment concernée par le système) | Obligatoire | Champ libre |
| `F11` | Précision emplacement | Recommandé | Champ libre |

## Système de sécurité incendie — Organes de réseau

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F16` | Nombre de RIA ? | Obligatoire | champ libre |
| `K16` | Nombre de sprinkler ? | Obligatoire | champ libre |
| `F19` | Présence d'un surpresseur pour le réseau incendie ? | Facultatif | liste déroulante oui/non |
| `K19` | Présence d'un sous-compteur sur le réseau incendie ? | Recommandé | liste déroulante oui/non |

## Système de sécurité incendie — Réserve

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F22` | Présence d'une réservie incendie ? | Obligatoire | Liste déroulante Oui/Non |
| `K22` | Type d'eau de la réserve incendie | Recommandé | liste déroulante eau potable eau de pluie eau pluviale mare |
| `F25` | Volume réserve incendie (m3) | Recommandé | champ libre |

## Système de sécurité incendie — Tests

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F28` | Tests réglementaires réalisés (essais RIA, essais sprinklers, essais pompes) sur le système incendie : | Recommandé | champ libre |
| `K28` | Fréquence des tests | Recommandé | liste déroulante hebdomadaire mensuelle semestriel annuelle |
| `F31` | Durée ouverture eau durant les tests | Recommandé | champ libre |
| `K31` | Débit moyen mesuré durant les tests (m3/h) | Recommandé | champ libre |

## Système de sécurité incendie — Purges

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F34` | Présence de purges régulières du réseau incendie? | Facultatif | liste déroulante Oui / Non |
| `K34` | Fréquence des purges | Facultatif | liste déroulante hebdomadaire mensuelle semestrielle biannuelle annuelle autre |
| `F37` | Volume d'eau estimé par purge (L) | Facultatif | Champ libre |
| `K37` | Destination des eaux de tests/purges | Facultatif | liste déroulante : rejet au réseau d'assainissement rejet au réseau pluvial infiltration à la parcelle |
| `F40` | Présence d'un carnet de suivi des tests/purges ? | Recommandé | liste déroulante : Oui/Non |
| `K40` | Personne en charge des tests/purges | Recommandé | champ libre |
| `F43` | Dysfonctionnements observés (fuites, soupape active, débordements, etc.) | Recommandé | champ libre |
| `F46` | Remarques | — | Champ libre |
