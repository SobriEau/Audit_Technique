# Production Stockage ECS

Entité `production_stockage_ecs` — route `#/qte/production-stockage-ecs`.

27 champ(s), 5 section(s). Colonnes du tableau : `Emplacement`, `TypeDeSystemeDeProduction`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F9` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `F13` | Chauffage du local où se situe le stockage | Recommandé | menu déroulant : Local chauffé / Local non chauffé / Ne sait pas |
| `F16` | Numéro de réseau ECS associé | Obligatoire | menu déroulant correspondant aux champs "numéro de réseau ECS" précedemment remplis |
| `F19` | Type de système de production/stockage d'ECS | Obligatoire | menu déroulant : indiviudel / collective / collective individualisée / Ne sait pas |
| `F22` | Mode de production/stockage d'ECS | Obligatoire | menu déroulant : Instantané / Accumulation / Semi-instantané / Ne sait pas |

## Production d'ECS

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F27` | Type | Obligatoire | menu déroulant : Chauffage + ECS / ECS seule / Ne sait pas |
| `F30` | Systèmes de production | Obligatoire | Liste déroulante : Chauffe-eau gaz instantané Accumulateur gaz Chaudière Ballon électrique Chauffe-eau électrique Chauffe-eau solaire thermique Solaire photovol |
| `F33` | Combustible (si chaudière) | Obligatoire | liste déroulante gaz / fioul / bois / biomasse / réseau de chaleur urbain / ne sait pas / autre |
| `F36` | Marque et modèle du générateur | Facultatif | champ libre |
| `F39` | Régulation / pilotage de la production | Recommandé | Pas de pilotage Pilotage par la température Pilotage par horloge programmable Pilotage horaire et température Pilotage par GTB/GTC Pilotage intelligent Ne sait  |
| `F42` | Etat apparent du générateur* | Recommandé | liste déroulante Bon / Moyen / Mauvais |
| `F45` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) | Recommandé | champ libre |
| `F48` | Remarques | — | champ libre |

## Stockage d'ECS

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F56` | Nombre de ballon de stockage | Obligatoire | champ libre |
| `F59` | Volume total de stockage (L) (somme des volumes si plusieurs ballons) | Obligatoire | champ libre |
| `F62` | Montage des ballons | Facultatif | menu déroulant : série / parallèle / ne sait pas |
| `F65` | Etat apparent du (des) ballons* | Recommandé | menu déroulant : Bon/ Moyen / Mauvais |
| `F68` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) | Recommandé | champ libre |

## Stockage d'ECS — Isolation du ballon

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F76` | Isolation du (des) ballons | Obligatoire | menu déroulant : oui/non |
| `F79` | Continuité de l'isolant sur tout le (les) ballons | Facultatif | liste déroulante oui / non / ne sait pas |
| `F82` | Etat de l'isolant* | Recommandé | liste déroulante bon / moyen / mauvais |
| `F85` | Remarques (épaisseur isolant, matériaux isolant,…) | — | champ libre |

## Stockage d'ECS — Température du ballon

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F93` | Température affichée sur le ballon (°C) | Obligatoire | champ libre |

## Stockage d'ECS — Autres

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F98` | Présence d'une soupape de sécurité | Facultatif | liste déroulante oui / non / ne sait pas |
| `F101` | Présence d'un vase d'expansion entre la soupape de sécurité et le stockage | Facultatif | Liste déroulante : oui / non / ne sait pas |
| `F104` | Dégradation / dysfonctionnements observés (ex : corrosion, écoulement continu de la soupape) | Recommandé | champ libre |
| `F107` | Remarques | — | champ libre |
