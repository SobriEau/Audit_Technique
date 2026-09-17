# Structure1

Entité `structure` — route `#/qte/structure`.

32 champ(s), 4 section(s). Colonnes du tableau : `Emplacement`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `I8` | Type | — | liste déroulante Structure et réseaux Espace technique aménageable Ouvrir la suite en fonction du choix |
| `F11` | Emplacement (partie du bâtiment concernée) | Obligatoire | Champ libre |
| `F14` | Précision emplacement | Recommandé | Champ libre |

## Structure du bâtiment et réseaux — Structure

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F19` | Type de planchers | Facultatif | liste déroulante dalle béton dalle poutrelle/hourdis bois plancher surélevé dalle structurelle plots dalle amovibles planchers chauffants |
| `K19` | Si plancher avec vide technique, hauteur du vide technique (cm) | Facultatif | champ libre |
| `F22` | Si pas de faux-plafond, hauteur sous plafond (m) | Facultatif | champ libre |
| `K22` | Si présence d'un faux-plafond, hauteur disponible dans le plénum (cm) | Facultatif | champ libre |
| `F25` | Type de cloisons | Facultatif | liste déroulante légère sur ossature (placo), maçonnée (brique, parpaing, carreau de plâtre), alvéolaire (prêtes à poser), techniques (coupe-feu, acoustique ren |
| `K25` | Emplacement des gaines techniques | Facultatif | champ libre |

## Structure du bâtiment et réseaux — Réseaux

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F28` | Le réseau d'eau potable passe actuellement dans | Recommandé | liste déroulante des faux-plafonds, des gaines techniques, des vides sanitaires, des trémies en apparent la dalle autre |
| `K28` | Possibilité d'installer un réseau supplémentaire dans les gaines techniques ou le faux-plafond ? | Facultatif | oui/non |
| `F31` | Présence de colonnes de chute séparées pour les eaux grises ? | Recommandé | liste déroulante oui/non |
| `K31` | Présence d'une évacuation séparée des eaux de lavage, de process et autres ? | Recommandé | liste déroulante Oui/Non |
| `F34` | Présence de Té de visite à intervalles réguliers sur le réseau de collecte | Facultatif | liste déroulante oui/non |
| `K34` | Les eaux usées et les eaux pluviales sont séparées dans le collecteur principal ? | Obligatoire | liste déroulante oui/non |
| `F37` | Le réseau d'évacuation des eaux usées passe actuellement dans | Recommandé | liste déroulante des faux-plafonds, des gaines techniques, des vides sanitaires, des trémies en apparent la dalle autre |
| `K37` | Est-ce que tous les réseaux EU arrivent au même endroit dans le bâtiment ? (local technique, sous-sol,…) | Recommandé | champ libre |

## Espace technique aménageable

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F42` | Présence d'un local technique ou sous-sol aménageable ? | Obligatoire | liste déroulante oui oui si on réorganise les espaces oui avec réserve non |
| `K42` | Un camion de livraison de cuve et de vidange peut-il se garer à côté de cet espace ? | Recommandé | liste déroulante oui/non |
| `F45` | Emplacement | Obligatoire | champ libre |
| `K45` | Le route (rue + chemin d'accès) permettant d'accéder à cet espace est il accessible pour un camion de livraison ou de vidange (fils électriques, largeur de route, etc.)? | Recommandé | liste déroulante Oui / Non |
| `F48` | Surface disponible (m²) | Recommandé | champ libre |
| `K48` | Les interventions techniques de vidange des cuves peuvent elles se faire durant les horaires d'ouverture sans perturber le fonctionnement du bâtiment ? | Recommandé | liste déroulante Oui / Non |
| `F51` | Hauteur disponible (m) | Recommandé | champ libre |
| `K51` | Cet espace est-il ouvert au public ? | Facultatif | liste déroulante oui/non |
| `F54` | Présence d'une alimentation électrique à proximité ? | Facultatif | liste déroulante oui/non |
| `K54` | Un système de relevage sera-t-il nécessaire entre la collecte et l'espace de stockage ? | Facultatif | liste déroulante oui/non |
| `F57` | Le réseau 4G/5G est-il disponible dans cet espace ? | Facultatif | liste déroulante oui/non |
| `K57` | Un by-pass vers le réseau d'eaux usées est-il possible ? | Facultatif | liste déroulante oui/non |
| `F60` | L'espace est-il ventilé ? | Facultatif | liste déroulante oui/non |
| `K60` | Cet espace est-il équipé d'un point d'eau potable ? | Facultatif | liste déroulante oui/non |
| `F65` | Remarques | — | Champ libre |
