# Production Stockage ECS

> Spécification extraite de `audit_technique.xlsx`, onglet « Production Stockage ECS ».
> 58 cellules, 35 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F10` | Numéro de réseau ECS associé | Liste déroulante | correspondant aux champs "numéro de réseau ECS" précedemment remplis |
| `F24` | Systèmes de production | Liste déroulante | Chauffe-eau gaz instantané · Accumulateur gaz · Chaudière · Ballon électrique · Chauffe-eau électrique · Chauffe-eau solaire thermique · Solaire photovoltaïque · Système solaire combiné chauffage + ECS · Chauffe-eau thermodynamique individuel (ie PAC) · PAC (indiviuuelle ou collective) · Module thermique d'appartements (MTA) · Kit robinetterie avec module chaufffant · Autre (préciser dans remarques) · Ne sait pas |
| `F27` | Combustible (si chaudière) | Liste déroulante | gaz · fioul · bois · biomasse · réseau de chaleur urbain · ne sait pas · autre |
| `F30` | Marque et modèle du générateur | Texte libre | — |
| `F36` | Etat apparent du générateur* | Liste déroulante | Bon · Moyen · Mauvais |
| `F39` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) | Texte libre | — |
| `F42` | Emplacement du générateur (ex : local technique, garage, etc…) | Texte libre | — |
| `F45` | Remarques | Texte libre | — |
| `F53` | Nombre de ballon de stockage | Nombre | — |
| `F56` | Emplacement du (des) ballon(s) (ex : local technique, garage, etc…) | Texte libre | — |
| `F62` | Volume total de stockage (L) (somme des volumes si plusieurs ballons) | Texte libre | — |
| `F71` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) | Texte libre | — |
| `F82` | Continuité de l'isolant sur tout le (les) ballons | Liste déroulante | oui · non · ne sait pas |
| `F85` | Etat de l'isolant* | Liste déroulante | bon · moyen · mauvais |
| `F88` | Remarques (épaisseur isolant, matériaux isolant,…) | Nombre (épaisseur isolant, matériaux isolant,…) | — |
| `F96` | Température affichée sur le ballon (°C) | Nombre (°C) | — |
| `F101` | Présence d'une soupape de sécurité | Liste déroulante | oui · non · ne sait pas |
| `F104` | Présence d'un vase d'expansion entre la soupape de sécurité et le stockage | Liste déroulante | oui · non · ne sait pas |
| `F107` | Dégradation / dysfonctionnements observés (ex : corrosion, écoulement continu de la soupape) | Texte libre | — |
| `F110` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Numéro de réseau ECS associé**

- correspondant aux champs "numéro de réseau ECS" précedemment remplis

**Systèmes de production**

- Chauffe-eau gaz instantané
- Accumulateur gaz
- Chaudière
- Ballon électrique
- Chauffe-eau électrique
- Chauffe-eau solaire thermique
- Solaire photovoltaïque
- Système solaire combiné chauffage + ECS
- Chauffe-eau thermodynamique individuel (ie PAC)
- PAC (indiviuuelle ou collective)
- Module thermique d'appartements (MTA)
- Kit robinetterie avec module chaufffant
- Autre (préciser dans remarques)
- Ne sait pas

**Combustible (si chaudière)**

- gaz
- fioul
- bois
- biomasse
- réseau de chaleur urbain
- ne sait pas
- autre

**Etat apparent du générateur***

- Bon
- Moyen
- Mauvais

**Continuité de l'isolant sur tout le (les) ballons**

- oui
- non
- ne sait pas

**Etat de l'isolant***

- bon
- moyen
- mauvais

**Présence d'une soupape de sécurité**

- oui
- non
- ne sait pas

**Présence d'un vase d'expansion entre la soupape de sécurité et le stockage**

- oui
- non
- ne sait pas

## Valeurs inscrites directement dans les cellules

Contrairement aux listes ci-dessus, ces valeurs sont écrites dans la cellule elle-même plutôt que dans une note. Le classeur ne portant aucune validation de données, elles restent indicatives : à confirmer au cas par cas.

| Cellule | Rattaché à | Valeurs |
|---|---|---|
| `F15` | Mode de production/stockage d'ECS | Mode de production · stockage d'ECS |

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E2` **Audit SOBRIEAU PARTIE TECHNIQUE** — Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H6` **Production / Stockage d' Eau Chaude Sanitaire** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `K6` **Production / Stockage d' Eau Chaude Sanitaire** — Retour à la page "Liste Production Stockage ECS"  / - Message avertissement enregistrement
- `L13` **Type de système de production/stockage d'ECS** — indiviudel / collective / collective individualisée / Ne sait pas
- `L16` **Mode de production/stockage d'ECS** — Instantané / Accumulation / Semi-instantané / Semi-accumulation / Ne sait pas
- `F21` **Type** — Chauffage + ECS / ECS seule / Ne sait pas
- `F33` **Régulation / pilotage de la production** — Pas de pilotage / Pilotage par la température / Pilotage par horloge programmable / Pilotage horaire et température / Pilotage par GTB/GTC / Pilotage intelligent / Ne sait pas / Autre
- `F59` **Chauffage du local** — Local chauffé / Local non chauffé / Ne sait pas
- `F65` **Montage des ballons** — série / parallèle / ne sait pas
- `F68` **Etat apparent du (des) ballons*** — Bon/  Moyen / Mauvais
- `F79` **Isolation du (des) ballons** — oui/non
- `G113` **Enregistrer** — Enregistrement des données
- `I113` **Enregistrer** — Prise de photo et ajout au dossier
- `J114` **Enregistrer** — Ajout d'une page pour un équipement ECS / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `K114` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E2` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `G5` | Production / Stockage d' Eau Chaude Sanitaire |
| `H6` | Numéro |
| `F9` | Numéro de réseau ECS associé |
| `F12` | Type de système de production/stockage d'ECS |
| `F15` | Mode de production/stockage d'ECS |
| `E18` | Production d'ECS |
| `F20` | Type |
| `F23` | Systèmes de production |
| `F26` | Combustible (si chaudière) |
| `F29` | Marque et modèle du générateur |
| `F32` | Régulation / pilotage de la production |
| `F35` | Etat apparent du générateur* |
| `F38` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) |
| `F41` | Emplacement du générateur (ex : local technique, garage, etc…) |
| `F44` | Remarques |
| `F47` | Bon état |
| `G47` | fonctionnement normal, pas de fuite, peu de corrosion, équipement relativement récent |
| `F48` | Etat moyen |
| `G48` | équipement plus ancien, légère corrosion, rendement probablement dégradé, doute sur la régulation |
| `F49` | Mauvais état |
| `G49` | équipement ancien, panne fréquente, fuite visible, corrosion importante, rendement  dégradé, dysfonctionnement de la régulation |
| `E50` | Stockage d'ECS |
| `F52` | Nombre de ballon de stockage |
| `F55` | Emplacement du (des) ballon(s) (ex : local technique, garage, etc…) |
| `F58` | Chauffage du local |
| `F61` | Volume total de stockage (L) (somme des volumes si plusieurs ballons) |
| `F64` | Montage des ballons |
| `F67` | Etat apparent du (des) ballons* |
| `F70` | Dégradation / dysfonctionnements observés (ex : corrosion, fuites, traces de surchauffe) |
| `F73` | Bon état |
| `G73` | équipement récent, peu de corrosion, pas de fuite, soupape propre, fonctionnement normal, pas d'entartrage |
| `F74` | Etat moyen |
| `G74` | équipement plus ancien, légère corrosion, entartrage moyen ou léger |
| `F75` | Mauvais état |
| `G75` | équipement ancien, fuite visible, corrosion importante, entartrage important, soupape dégradée |
| `E76` | Isolation du ballon |
| `F78` | Isolation du (des) ballons |
| `F81` | Continuité de l'isolant sur tout le (les) ballons |
| `F84` | Etat de l'isolant* |
| `F87` | Remarques (épaisseur isolant, matériaux isolant,…) |
| `F90` | Bon état |
| `G90` | isolation complète,  propre, sans déchirure |
| `F91` | Etat moyen |
| `G91` | isolation localement dégradée, ponts thermiques visibles, quelques déchirures |
| `F92` | Mauvais état |
| `G92` | isolation absente, fortement dégradée, nombreuses déchirures visibles |
| `E93` | Température du ballon |
| `F95` | Température affichée sur le ballon (°C) |
| `E98` | Autres |
| `F100` | Présence d'une soupape de sécurité |
| `F103` | Présence d'un vase d'expansion entre la soupape de sécurité et le stockage |
| `F106` | Dégradation / dysfonctionnements observés (ex : corrosion, écoulement continu de la soupape) |
| `F109` | Remarques |
| `G113` | Enregistrer |

</details>
