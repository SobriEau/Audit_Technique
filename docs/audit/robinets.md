# Robinets

> Spécification extraite de `audit_technique.xlsx`, onglet « Robinets ».
> 43 cellules, 39 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F8` | Emplacement | Texte libre | — |
| `F11` | Précision emplacement (évier plonge / lavabo de droite, etc …) | Texte libre | — |
| `F15` | Utilisation (lavage de main, rasage, boire, faire la vaisselle, arroser, nettoyer le sol, remplir une gourde, etc.) | Texte libre | — |
| `F18` | Usagers (personnels, public, enfants, patients, adultes, PMR, etc.) | Nombre (personnels, public, enfants, patients, adultes, PMR, etc.) | — |
| `F21` | Type | Liste déroulante | Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique |
| `K21` | Commande | Liste déroulante | manuelle · fémorale · à pédale · à détection |
| `F24` | Temporisation | Liste déroulante | Aucune · Mécanique · Electronique |
| `K24` | Temps de la temporisation (s) | Nombre (s) | — |
| `F29` | _(non identifié)_ | Texte libre | — |
| `K29` | _(non identifié)_ | Texte libre | — |
| `F32` | Année de pose | Texte libre | — |
| `M32` | Présence d'un limiteur de débit | Oui / Non | Oui · Non |
| `H36` | Temps (s) | Nombre (s) | — |
| `J36` | Volume (L) | Texte libre | — |
| `H37` | 1 | Texte libre | — |
| `J37` | 1 | Texte libre | — |
| `H38` | 2 | Texte libre | — |
| `J38` | 2 | Texte libre | — |
| `G41` | Température max ECS (°C) | Nombre (°C) | — |
| `I41` | Temps d'obtention (s) | Nombre (s) | — |
| `M41` | Numéro réseau ECS d'appartenance | Liste déroulante | avec les choix de la liste des réseaux ECS |
| `I44` | Diamètre Nominal de l'alimentation (mm) | Nombre (mm) | — |
| `M44` | Matériau du tuyau d'alimentation | Liste déroulante | Cuivre · Multicouche · PER · PEHD · PE |
| `F47` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `K47` | Date dernière maintenance | Texte libre | — |
| `I50` | Nombre d'utilisation/semaine | Nombre | — |
| `M50` | Nombre d'équipements identiques | Nombre | — |
| `F53` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, mauvais mélange, retour d'eau chaude, entartrage, etc,…) | Nombre (fuites, goutte à goutte, bloqué, mauvais mélange, retour d'eau chaude, entartrage, etc,…) | — |
| `F56` | Remarques (infos complémentaires / présences d'éclaboussures excessives, eau adoucie, etc..) | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Simple EF
- Simple ECS
- Mélangeur
- Mitigeur classique
- Mitigeur thermostatique

**Commande**

- manuelle
- fémorale
- à pédale
- à détection

**Temporisation**

- Aucune
- Mécanique
- Electronique

**Numéro réseau ECS d'appartenance**

- avec les choix de la liste des réseaux ECS

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

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Robinet (hors douche et baignoire)** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `L5` **Robinet (hors douche et baignoire)** — Retour à la page "Liste Robinet"  / - Message avertissement enregistrement
- `L36` **Débit (L/min)** — Calcul automatique :  / Débit = volume/temps/60
- `L37` **1** — Calcul automatique :  / Débit = volume/temps/60
- `L38` **2** — Calcul automatique :  / Débit = volume/temps/60
- `G59` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste des robinets
- `J60` **Enregistrer** — Prise de photo et ajout au dossier
- `K60` **Enregistrer** — Ajout d'une page pour robinet / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `L60` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `H4` | Robinet (hors douche et baignoire) |
| `I5` | Numéro |
| `F7` | Emplacement |
| `F10` | Précision emplacement (évier plonge / lavabo de droite, etc …) |
| `F14` | Utilisation (lavage de main, rasage, boire, faire la vaisselle, arroser, nettoyer le sol, remplir une gourde, etc.) |
| `F17` | Usagers (personnels, public, enfants, patients, adultes, PMR, etc.) |
| `F20` | Type |
| `K20` | Commande |
| `F23` | Temporisation |
| `K23` | Temps de la temporisation (s) |
| `F26` | Informations sur le bec du robinet (hauteur, bec fixe, orientable, col de cygne, extractible, douchette, rabatable) |
| `K26` | Particularité (cold start, double butée, aérateur encastré , antivol, accessibilité des organes du robinet…) |
| `F31` | Année de pose |
| `K31` | Présence d'un limiteur de débit |
| `F34` | Débit en sortie du robinet (L/min) |
| `F35` | Mesure |
| `H35` | Temps (s) |
| `J35` | Volume (L) |
| `L35` | Débit (L/min) |
| `Y38` | Particularité (cold start, double butée, aérateur encastré …) |
| `F40` | Température max ECS (°C) |
| `H40` | Temps d'obtention (s) |
| `K40` | Numéro réseau ECS d'appartenance |
| `F43` | Diamètre Nominal de l'alimentation (mm) |
| `K43` | Matériau du tuyau d'alimentation |
| `F46` | Etat général* |
| `K46` | Date dernière maintenance |
| `F49` | Nombre d'utilisation/semaine |
| `K49` | Nombre d'équipements identiques |
| `F52` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, mauvais mélange, retour d'eau chaude,  entartrage, etc,…) |
| `F55` | Remarques (infos complémentaires / présences d'éclaboussures excessives, eau adoucie, etc..) |
| `G59` | Enregistrer |
| `F62` | Bon état |
| `G62` | équipement récent, pas de fuite, commande en bon état, propre visuellement, pas d'entartrage visible, pas de corrosion, pas de rayures |
| `F63` | Etat moyen |
| `G63` | équipement plus ancien, débit irrégulier, quelques rayures visibles, légère corrosion, goutte à goutte occasionnel, commande légèrement grippée |
| `F64` | Mauvais état |
| `G64` | équipement ancien, fuite permanente, commande gripée, sale visuellement, nombreuses rayures, corrosion forte |

</details>
