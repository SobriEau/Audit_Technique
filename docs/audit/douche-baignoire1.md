# Douche-baignoire1

> Spécification extraite de `audit_technique.xlsx`, onglet « Douche-baignoire1 ».
> 77 cellules, 58 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `G8` | Type d'équipement | Liste déroulante | douche ou baignoire · Affiche ensuite la partie · "Douche et pommeau" · ou · "Baignoire et pommeau" |
| `K8` | Emplacement | Texte libre | — |
| `E11` | Précision emplacement | Texte libre | — |
| `E15` | Utilisations (lavage du corps, nettoyage de matériel, etc.) | Texte libre | — |
| `I15` | Année de pose | Texte libre | — |
| `E18` | Usagers (personnels, public, enfants, patients, adultes, PMR, etc.) | Nombre (personnels, public, enfants, patients, adultes, PMR, etc.) | — |
| `G21` | Nombre d'utilisation/semaine | Nombre | — |
| `K21` | Nombre d'équipements identiques | Nombre | — |
| `E25` | Particularités de la douche (pommeau manuel ou douchette, ciel de pluie, tête de douche fixe ou murale, colonne de douche seule, système mixte (tête + douchette), encastrée, hydromassante (jet latéraux), etc.) | Nombre (pommeau manuel ou douchette, ciel de pluie, tête de douche fixe ou murale, colonne de douche seule, système mixte (tête + douchette) | — |
| `G28` | Type de pommeau | Liste déroulante | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle · pommeau anti-calcaire |
| `K28` | Jets du pommeau | Liste déroulante | aucune · pluie laminaire · aéré · brumisé · pulsé/massage · concentré/puissant · multi-jets |
| `G31` | Débit en sortie du pommeau (L/min) | Nombre (L/min) | — |
| `K31` | Présence d'un limiteur de débit | Oui / Non | Oui · Non |
| `F34` | Température max ECS (°C) | Nombre (°C) | — |
| `H34` | Temps d'obtention (s) | Nombre (s) | — |
| `K34` | Numéro réseau ECS d'appartenance | Liste déroulante | avec les choix de la liste des réseaux ECS |
| `E37` | Etat général | Liste déroulante | Bon · Moyen · Mauvais |
| `I37` | Date dernière maintenance | Texte libre | — |
| `E40` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) | Texte libre | — |
| `E43` | Remarques | Texte libre | — |
| `E50` | Particularités de la baignoire (sur pieds, portante, encastrée, hydromassante (jet latéraux), etc.) | Nombre (sur pieds, portante, encastrée, hydromassante (jet latéraux) | — |
| `G53` | Type de pommeau | Liste déroulante | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle · pommeau anti-calcaire |
| `K53` | Jets du pommeau | Liste déroulante | aucune · pluie laminaire · aéré · brumisé · pulsé/massage · concentré/puissant · multi-jets |
| `G56` | Débit en sortie du pommeau (L/min) | Nombre (L/min) | — |
| `K56` | Présence d'un réducteur de débit | Oui / Non | Oui · Non |
| `G59` | Baignoire - Indiquer ses dimensions (cm) | Nombre (cm) | — |
| `K59` | Baignoire - Indiquer son volume (L) | Texte libre | — |
| `F62` | Température max ECS (°C) | Nombre (°C) | — |
| `H62` | Temps d'obtention (s) | Nombre (s) | — |
| `K62` | Numéro réseau ECS d'appartenance | Liste déroulante | avec les choix de la liste des réseaux ECS |
| `E65` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `I65` | Date dernière maintenance | Texte libre | — |
| `E68` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) | Texte libre | — |
| `E71` | Remarques | Texte libre | — |
| `E78` | Type | Liste déroulante | Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique |
| `I78` | Particularité (cold start, double butée, …) | Texte libre | — |
| `E81` | Temporisation | Liste déroulante | Aucune · Mécanique · Electronique |
| `I81` | Temps de la temporisation (s) | Nombre (s) | — |
| `E84` | Informations sur le bec du robinet de la baignoire (hauteur, bec fixe, orientable, col de cygne, etc.) | Texte libre | — |
| `H87` | Débit en sortie du robinet de la baignoire (L/min) | Nombre (L/min) | — |
| `K87` | Présence d'un limiteur de débit | Oui / Non | Oui · Non |
| `E90` | Diamètre Nominal de l'alimentation (mm) | Nombre (mm) | — |
| `K90` | Matériau du tuyau d'alimentation | Liste déroulante | Cuivre · Multicouche · PER · PEHD · PE |
| `E93` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `I93` | Date dernière maintenance | Texte libre | — |
| `E96` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, présences d'éclaboussures excessives, etc,…) | Texte libre | — |
| `E99` | Remarques (infos complémentaires, etc..) | Texte libre | — |
| `E106` | Remarques générales (eau adoucie, …) | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type d'équipement**

- douche ou baignoire
- Affiche ensuite la partie
- "Douche et pommeau"
- ou
- "Baignoire et pommeau"

**Type de pommeau**

- Pommeau de douche classique
- Pommeau de douche hydroéconome
- Pommeau de douche anti-légionnelle
- pommeau anti-calcaire

**Jets du pommeau**

- aucune
- pluie laminaire
- aéré
- brumisé
- pulsé/massage
- concentré/puissant
- multi-jets

**Numéro réseau ECS d'appartenance**

- avec les choix de la liste des réseaux ECS

**Etat général**

- Bon
- Moyen
- Mauvais

**Type de pommeau**

- Pommeau de douche classique
- Pommeau de douche hydroéconome
- Pommeau de douche anti-légionnelle
- pommeau anti-calcaire

**Jets du pommeau**

- aucune
- pluie laminaire
- aéré
- brumisé
- pulsé/massage
- concentré/puissant
- multi-jets

**Numéro réseau ECS d'appartenance**

- avec les choix de la liste des réseaux ECS

**Etat général***

- Bon
- Moyen
- Mauvais

**Type**

- Simple EF
- Simple ECS
- Mélangeur
- Mitigeur classique
- Mitigeur thermostatique

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

**Etat général***

- Bon
- Moyen
- Mauvais

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `D1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H5` **Douche-Baignoire** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `J5` **Douche-Baignoire** — Retour à la page "Liste Douches-baignoires"  / - Message avertissement enregistrement
- `E23` **Douche et pommeau** — Partie affichée en fonction du choix de l'équipement
- `E48` **Mauvais état** — Partie affichée en fonction du choix de l'équipement
- `E76` **Mauvais état** — Partie affichée systématiquement, indépendament du choix de l'équipement
- `F112` **Enregistrer** — Enregistrement des données / bascule des infos dans la page "liste douches-baignoires"
- `H113` **Enregistrer** — Prise de photo et ajout au dossier
- `I113` **Enregistrer** — Ajout d'un page pour Douche / Baignoire / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `J113` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `G4` | Douche-Baignoire |
| `H5` | Numéro |
| `E7` | Type d'équipement |
| `I7` | Emplacement |
| `E10` | Précision emplacement |
| `E14` | Utilisations (lavage du corps, nettoyage de matériel, etc.) |
| `I14` | Année de pose |
| `E17` | Usagers (personnels, public, enfants, patients, adultes, PMR, etc.) |
| `E20` | Nombre d'utilisation/semaine |
| `I20` | Nombre d'équipements identiques |
| `E23` | Douche et pommeau |
| `E24` | Particularités de la douche (pommeau manuel ou douchette, ciel de pluie, tête de douche fixe ou murale, colonne de douche seule,  système mixte (tête + douchette), encastrée, hydromassante (jet latéraux), etc.) |
| `E27` | Type de pommeau |
| `I27` | Jets du pommeau |
| `E30` | Débit en sortie du pommeau (L/min) |
| `I30` | Présence d'un limiteur de débit |
| `E33` | Température max ECS (°C) |
| `G33` | Temps d'obtention (s) |
| `I33` | Numéro réseau ECS d'appartenance |
| `E36` | Etat général |
| `I36` | Date dernière maintenance |
| `E39` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) |
| `E42` | Remarques |
| `E45` | Bon état |
| `F45` | équipement récent, pommeau fonctionnel, pas d'entartrage, pas de fuite, jet régulier, bon état joint receveur |
| `E46` | Etat moyen |
| `F46` | équipement plus ancien, léger entartrage, jet irrégulier par moment, flexible usé, légère fuite état des joints moyen |
| `E47` | Mauvais état |
| `F47` | équipement ancien, fuite permanente, entartrage important, flexible abîmé, jets irréguliers en permanence, mauvais état des joints du receveur |
| `E48` | Baignoire et pommeau |
| `E49` | Particularités de la baignoire (sur pieds, portante, encastrée, hydromassante (jet latéraux), etc.) |
| `E52` | Type de pommeau |
| `I52` | Jets du pommeau |
| `E55` | Débit en sortie du pommeau (L/min) |
| `I55` | Présence d'un réducteur de débit |
| `E58` | Baignoire - Indiquer ses dimensions (cm) |
| `I58` | Baignoire - Indiquer son volume (L) |
| `E61` | Température max ECS (°C) |
| `G61` | Temps d'obtention (s) |
| `I61` | Numéro réseau ECS d'appartenance |
| `E64` | Etat général* |
| `I64` | Date dernière maintenance |
| `E67` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) |
| `E70` | Remarques |
| `E73` | Bon état |
| `F73` | équipement récent, pommeau fonctionnel, pas d'entartrage, pas de fuite, jet régulier, bon état joint receveur |
| `E74` | Etat moyen |
| `F74` | équipement plus ancien, léger entartrage, jet irrégulier par moment, flexible usé, légère fuite état des joints moyen |
| `E75` | Mauvais état |
| `F75` | équipement ancien, fuite permanente, entartrage important, flexible abîmé, jets irréguliers en permanence, mauvais état des joints du receveur |
| `E76` | Robinet |
| `E77` | Type |
| `I77` | Particularité (cold start, double butée, …) |
| `E80` | Temporisation |
| `I80` | Temps de la temporisation (s) |
| `E83` | Informations sur le bec du robinet de la baignoire (hauteur, bec fixe, orientable, col de cygne, etc.) |
| `E86` | Débit en sortie du robinet de la baignoire (L/min) |
| `I86` | Présence d'un limiteur de débit |
| `E89` | Diamètre Nominal de l'alimentation (mm) |
| `I89` | Matériau du tuyau d'alimentation |
| `E92` | Etat général* |
| `I92` | Date dernière maintenance |
| `E95` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, présences d'éclaboussures excessives, etc,…) |
| `E98` | Remarques (infos complémentaires, etc..) |
| `E101` | Bon état |
| `F101` | équipement récent, pas de fuite, commande en bon état, propre visuellement, pas d'entartrage visible, pas de corrosion, pas de rayures |
| `E102` | Etat moyen |
| `F102` | équipement plus ancien, débit irrégulier, quelques rayures visibles, légère corrosion, goutte à goutte occasionnel, commande légèrement grippée |
| `E103` | Mauvais état |
| `F103` | équipement ancien, fuite permanente, commande gripée, sale visuellement, nombreuses rayures, corrosion forte |
| `E105` | Remarques générales (eau adoucie, …) |
| `F112` | Enregistrer |

</details>
