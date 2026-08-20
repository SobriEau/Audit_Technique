# Réseaux ECS

> Spécification extraite de `audit_technique.xlsx`, onglet « Réseaux ECS ».
> 48 cellules, 37 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F9` | Année d'installation (par défaut : année de construction du bâtiment) | Nombre (par défaut : année de construction du bâtiment) | — |
| `F12` | Matériau principal des canalisations | Liste déroulante | Cuivre · Multicouche · PER · PEHD · PE · pvc sous pression · acier galvanisé · fonte |
| `F15` | Diamètre des gaines (mm) | Nombre (mm) | — |
| `F18` | Longueur totale du réseau (si connue) (en m) | Texte libre | — |
| `F21` | Remarques | Texte libre | — |
| `F25` | Calorifugeage des canalisations | Liste déroulante | oui · non · ne sait pas |
| `F28` | Epaisseur de l'isolant (mm) | Nombre (mm) | — |
| `F31` | Matériaux de l'isolant | Liste déroulante | laine de verre · laine de roche · papier et platre · polyruéthane · Mousse synthétique (armaflex,PE…) |
| `F34` | Continuité de l'isolation | Liste déroulante | oui · non · ne sait pas |
| `F37` | Etat de l'isolant* | Liste déroulante | Bon · Moyen · Mauvais |
| `F40` | Remarques | Texte libre | — |
| `F47` | Bouclage | Liste déroulante | oui · non · ne sait pas |
| `F50` | Débit réglé sur la pompe/circulateur (l/s) | Nombre (l/s) | — |
| `F53` | Température affichée du départ ECS (°C) | Nombre (°C) | — |
| `F56` | Température affichée du retour de boucle (°C) | Nombre (°C) | — |
| `F63` | Marque et modèle du circulateur | Texte libre | — |
| `F66` | Mode de fonctionnement du circulateur | Liste déroulante | continu · horloge programmable · piloté par la température · aquastat · GTB · GTC |
| `F69` | Variation de vitesse du circulateur possible | Oui / Non | Oui · Non |
| `F72` | Dégradation / dysfonctionnements observés (traces de fuites,…) | Texte libre | — |
| `F75` | Remarques (circulateur double, …) | Texte libre | — |
| `F80` | Présence d'une vanne thermostatique | Liste déroulante | manuelle · motorisée · non · ne sait pas |
| `F83` | Présence d'un clapet anti-retour | Liste déroulante | oui · non · ne sait pas |
| `F86` | Présence d'un vase d'expansion | Liste déroulante | oui · non · ne sait pas |
| `F93` | Remarques | Texte libre | — |
| `F97` | Présence de bras mort connus | Liste déroulante | oui · non · ne sait pas |
| `F100` | Précisions (nombre, longueur, diamètre, emplacement…) | Nombre (nombre, longueur, diamètre, emplacement…) | — |
| `F104` | Présence d'une purge automatique | Liste déroulante | oui · non · ne sait pas |
| `F107` | Protocole pour le risque légionnelle déjà mis en place ? | Liste déroulante | oui · non · ne sait pas |
| `F110` | Présence d'un traitement complémentaire contre la légionnelle ? (filtration, UV, désinfection etc.) | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Matériau principal des canalisations**

- Cuivre
- Multicouche
- PER
- PEHD
- PE
- pvc sous pression
- acier galvanisé
- fonte

**Calorifugeage des canalisations**

- oui
- non
- ne sait pas

**Matériaux de l'isolant**

- laine de verre
- laine de roche
- papier et platre
- polyruéthane
- Mousse synthétique (armaflex,PE…)

**Continuité de l'isolation**

- oui
- non
- ne sait pas

**Etat de l'isolant***

- Bon
- Moyen
- Mauvais

**Bouclage**

- oui
- non
- ne sait pas

**Mode de fonctionnement du circulateur**

- continu
- horloge programmable
- piloté par la température
- aquastat
- GTB
- GTC

**Présence d'une vanne thermostatique**

- manuelle
- motorisée
- non
- ne sait pas

**Présence d'un clapet anti-retour**

- oui
- non
- ne sait pas

**Présence d'un vase d'expansion**

- oui
- non
- ne sait pas

**Présence de bras mort connus**

- oui
- non
- ne sait pas

**Présence d'une purge automatique**

- oui
- non
- ne sait pas

**Protocole pour le risque légionnelle déjà mis en place ?**

- oui
- non
- ne sait pas

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E2` **Audit SOBRIEAU PARTIE TECHNIQUE** — Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H6` **Réseau de distribution d'Eau Chaude Sanitaire** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression / Si pas d'info : réseau unique par défaut
- `L6` **Réseau de distribution d'Eau Chaude Sanitaire** — Retour à la page "Liste Réseaux ECS"  / - Message avertissement enregistrement
- `F59` **Ecart de température entre le départ et le retour (°C)** — delta T = Tdepart-Tretour
- `G114` **Enregistrer** — Enregistrement des données
- `I114` **Enregistrer** — Prise de photo et ajout au dossier
- `J114` **Enregistrer** — Ajout d'une page pour un réseau ECS / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `K115` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E2` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `G5` | Réseau de distribution d'Eau Chaude Sanitaire |
| `H6` | Numéro |
| `F8` | Année d'installation (par défaut : année de construction du bâtiment) |
| `F11` | Matériau principal des canalisations |
| `F14` | Diamètre des gaines (mm) |
| `F17` | Longueur totale du réseau (si connue) (en m) |
| `F20` | Remarques |
| `E23` | Calorifugeage |
| `F24` | Calorifugeage des canalisations |
| `F27` | Epaisseur de l'isolant (mm) |
| `F30` | Matériaux de l'isolant |
| `F33` | Continuité de l'isolation |
| `F36` | Etat de l'isolant* |
| `F39` | Remarques |
| `E42` | Bon état |
| `F42` | isolant continu, bon état mécanique,épaisseur cohérente, pas d'interruption |
| `E43` | Etat moyen |
| `F43` | isolant incomplet par endroits, écrasement local, vieillissement |
| `E44` | Mauvais état |
| `F44` | écrasement total, déchirement par endroit,  très dégradé, majoritairement absent, traces d'humidités et de moisissures |
| `E45` | Bouclage du réseau ECS |
| `F46` | Bouclage |
| `F49` | Débit réglé sur la pompe/circulateur  (l/s) |
| `F52` | Température affichée du départ ECS (°C) |
| `F55` | Température affichée du retour de boucle (°C) |
| `F58` | Ecart de température entre le départ et le retour (°C) |
| `E61` | Sous-partie bouclage : circulateurs |
| `F62` | Marque et modèle du circulateur |
| `F65` | Mode de fonctionnement du circulateur |
| `F68` | Variation de vitesse du circulateur possible |
| `F71` | Dégradation / dysfonctionnements observés (traces de fuites,…) |
| `F74` | Remarques (circulateur double, …) |
| `E77` | Autres équipements de sécurité, de contrôle et d'entretien |
| `F79` | Présence d'une vanne thermostatique |
| `F82` | Présence d'un clapet anti-retour |
| `F85` | Présence d'un vase d'expansion |
| `F88` | Dégradations / dysfonctionnements observés |
| `F89` | exemple  : Trace de fuite / corrosion etc… |
| `F92` | Remarques |
| `E95` | Bras morts et risque légionnelles |
| `F96` | Présence de bras mort connus |
| `F99` | Précisions (nombre, longueur, diamètre, emplacement…) |
| `F103` | Présence d'une purge automatique |
| `F106` | Protocole pour le risque légionnelle déjà mis en place ? |
| `F109` | Présence d'un traitement complémentaire contre  la légionnelle ?  (filtration, UV, désinfection etc.) |
| `G114` | Enregistrer |

</details>
