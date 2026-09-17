# Réseaux ECS

Entité `reseaux_eau_chaude_sanitaire` — route `#/qte/reseaux-ecs`.

33 champ(s), 5 section(s). Colonnes du tableau : `Emplacement`, `MateriauPrincipalDesCanalisations`, `Bouclage`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F9` | Emplacement (reprendre le nom de la partie du bâtiment ou des points d'eau alimentés) | Obligatoire | Champ libre |
| `F13` | Année d'installation (par défaut : année de construction du bâtiment) | Facultatif | Champ libre |
| `F16` | Matériau principal des canalisations | Obligatoire | Liste déroulante : Cuivre, Multicouche PER, PEHD, PE, pvc sous pression acier galvanisé fonte |
| `F19` | Diamètre des gaines (mm) au départ du générateur ECS | Obligatoire | Champ libre |
| `F22` | Longueur totale du réseau (si connue) (en m) | Facultatif | Champ libre |
| `F25` | Remarques | — | Champ libre |

## Calorifugeage

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F29` | Calorifugeage des canalisations | Recommandé | Liste déroulante : oui / non / ne sait pas |
| `F32` | Epaisseur de l'isolant (mm) | Facultatif | Champ libre |
| `F35` | Matériaux de l'isolant | Facultatif | liste déroulante laine de verre laine de roche papier et platre polyruéthane Mousse synthétique (armaflex,PE…) |
| `F38` | Continuité de l'isolation | Facultatif | liste déroulante oui / non / ne sait pas |
| `F41` | Etat de l'isolant* | Recommandé | liste déroulante Bon / Moyen / Mauvais |
| `F44` | Remarques | — | Champ libre |

## Bouclage du réseau ECS

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F51` | Bouclage | Obligatoire | Liste déroulante : oui / non / ne sait pas |
| `F54` | Débit réglé sur la pompe/circulateur (l/s) | Recommandé | Champ libre |
| `F57` | Température affichée du départ ECS (°C) | Recommandé | Champ libre |
| `F60` | Température affichée du retour de boucle (°C) | Recommandé | Champ libre |
| `F63` | Ecart de température entre le départ et le retour (°C) | Recommandé | delta T = Tdepart-Tretour |

## Sous-partie bouclage : circulateurs

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F67` | Marque et modèle du circulateur | Facultatif | Champ libre |
| `F70` | Mode de fonctionnement du circulateur | Recommandé | liste déroulante : continu/horloge programmable/piloté par la température/aquastat/GTB/GTC |
| `F73` | Variation de vitesse du circulateur possible | Recommandé | liste déroulante O/N |
| `F76` | Dégradation / dysfonctionnements observés (traces de fuites,…) | Recommandé | Champ libre |
| `F79` | Remarques (circulateur double, …) | — | Champ libre |

## Autres équipements de sécurité, de contrôle et d'entretien

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F84` | Présence d'une ou plusieurs vanne(s) thermostatique(s) | Facultatif | Liste déroulante : manuelle / motorisée / non / ne sait pas |
| `F87` | Présence d'un clapet anti-retour | Facultatif | Liste déroulante : oui / non / ne sait pas |
| `F90` | Présence d'un vase d'expansion | Facultatif | Liste déroulante : oui / non / ne sait pas |
| `F93` | Dégradations / dysfonctionnements observés | Recommandé | — |
| `F97` | Remarques | — | Champ libre |

## Bras morts et risque légionnelles

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F101` | Présence de bras mort connus | Recommandé | Liste déroulante : oui / non / ne sait pas. |
| `F104` | Précisions (nombre, longueur, diamètre, emplacement…) | Facultatif | champ libre |
| `F108` | Protocole pour le risque légionnelle déjà mis en place ? | Obligatoire | Liste déroulante : oui / non / ne sait pas |
| `F111` | Présence d'une purge automatique | Recommandé | Liste déroulante : oui / non / ne sait pas |
| `F114` | Présence d'un traitement complémentaire contre la légionnelle ? (filtration, UV, désinfection etc.) | Recommandé | Champ libre |
| `F117` | Remarques | — | Champ libre |
