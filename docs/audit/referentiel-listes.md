# Référentiel des listes de valeurs

Le classeur ne contient **aucune validation de données Excel**. Les valeurs autorisées y sont décrites en langage naturel, à deux endroits qui ne concordent pas toujours.

## Source 1 — catalogue « Infos audit partie technique »

Cet onglet porte en cellule `A1` la mention *« Cet onglet va servir à la constitution des menus déroulant ? »*. Il est donc l'origine voulue des listes, mais il est resté à l'état de brouillon : le point d'interrogation est des auteurs, et plusieurs entrées portent des questions non tranchées.

### Robinet

- Simple EF classique à tête
- Simple EF de puisage extérieur (même principe hydraulique que le premier mais certains intègre un clapet anti-retour aussi ou système antigel)
- Simple EF temporisé poussoir
- Simple EF temporisé électronique (à détection)
- Mélangeur
- Mitigeur classique (mécanique)
- Mitigeur thermostatique
  - ⚠️ *peut être que l'on peut sinon ajouter une autre colone avec le type de commande : manuelle, manuelle avec butée, temporisée mécanique, temporisée électronique*
- Mitigeur temporisé
  - ⚠️ *faudrait aussi ajouter si cold start ou pas*
- Mitigeur double butée
  - ⚠️ *Pour l'évier, on pourrait également ajouter le type de bec : fixe, orientable, col de cygne, extractible (douchette), pivotant, rabatable*

### Bains / Douches - pommeaux

- Mitigeur classique
  - ⚠️ *Faut différencier ici le mitigeur de la douche du pommeau de douche je pense*
- Mitigeur thermostatique
  - ⚠️ *idem pour le type de commande :butée ou non, etc.*
- Pommeau de douche classique
- Pommeau de douche anti-légionnelle
- Pommeau de douche hydroéconome

### WC

- Urinoir sans eau
- Urinoir chasse d'eau temporisé
- Toilette sans eau
  - ⚠️ *On pourrait dissocier ici les toilettes sans eau unitaire des toilettes sans eau à séparation.*
- Toilette chasse d'eau simple
  - ⚠️ *C'est plutôt le volume de chasse que le débit qu'il faudrait avoir ici.*
- Toilette chasse d'eau double débit
- WC suspendu
- WC sur pied
- Accès à la chasse (réglage du flotteur)

### Espace vert / extérieur

- Sans arrosage
- Arrosage goutte à goutte
- Arrossage tuyaux poreux
- Arrossage non sélectif
  - ⚠️ *surface arrosée  Utilisation EP Volume EP dispo Nombre de mois avec arrossage  Nombre d'arrosage / semaine Durée d'un arrosage Robinet?*
- Nettoyage au nettoyeur haute pression
- Nettoyage tuyaux simple
- Nettoyage tuyaux simple

### Appareil de lavage

- Machine à laver le linge ancienne
- Machine à laver le linge économe
  - ⚠️ *on pourrait demander la classe d'efficacité énergétique (A à G)*
- lave vaisselle ancien
  - ⚠️ *on pourrait relevr ici si la machine est raccordé uniquement à l'EF ou si ECS aussi*
- lave vaisselle économe

### Piscine

- Hors sol
- Entérée

### Récupération d'eau

- Pluviale
- Grise

### Ventilation

- Absence
- VMC simple flux
- Vmc double flux
- VMI

### Réseaux de distribution EF

- en série (ou dérivation successive)
  - ⚠️ *Multicouche*
- en pieuvre (ou en nourrice/collecteur)
  - ⚠️ *Cuivre*
- bouclage
  - ⚠️ *Acier inox*
- mixte
  - ⚠️ *Acier galvanisé*

### Réseaux de distribution ECS

- en série (ou dérivation successive)
  - ⚠️ *PER*
- en pieuvre (ou en nourrice/collecteur)
  - ⚠️ *PE*
- bouclage
  - ⚠️ *PVC pression*
- mixte

### Réseaux d'évacuation

- nombre de colonnes de chute
  - ⚠️ *PVC acoustique ou renforcé*

## Source 2 — listes écrites dans les notes des pages

| Page | Cellule | Valeurs |
|---|---|---|
| Compteur général | `B17` | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| Compteur général | `F17` | Classe A · Classe B · Classe C · Classe D · Inconnue |
| Sous-compteurs1 | `B18` | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| Sous-compteurs1 | `F18` | Classe A · Classe B · Classe C · Classe D · Inconnue |
| Réducteur de Pression1 | `B19` | Réducteur de pression à membrane · Réducteur de pression à piston · Réducteur de pression à cartouche · Inconnu |
| Robinet1 | `I15` | Simple EF · Simple EF de puisage extérieur · Mélangeur · Mitigeur classique · Mitigeur à butée · Mitigeur thermostatique |
| Robinet1 | `C18` | manuelle · au genou · à pédale · à détection |
| Robinet1 | `F18` | Aucune · Mécanique · Electronique |
| Robinet1 | `I27` | Cuivre · Multicouche · PER · PEHD · PE |
| Douche-baignoire1 | `H15` | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle |
| WC1 | `D8` | WC à eau suspendu · WC à eau sur pied · Urinoir masculin à eau · Urinoir masculin sans eau · Urinoir féminin sans eau |
| WC1 | `C30` | manuelle double chasse · manuelle simple chasse · manuelle poussoir temporisé · à pédale · à détection · à pas de temps · écoulement en continu · non concerné |
| WC1 | `H30` | Non concerné · Volume · Mécanique · Electronique |
| Liste Piscine | `F27` | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| Piscine | `J8` | Intérieure · Extérieure · Extérieure avec possibilté d'être couverte |
| Piscine | `I14` | non concerné · manuelle · à pédale · à détection · à pas de temps · écoulement en continu |
| Collecte eau de pluie | `J8` | Intérieure · Extérieure · Extérieure avec possibilté d'être couverte |
| Collecte eau de pluie | `I14` | non concerné · manuelle · à pédale · à détection · à pas de temps · écoulement en continu |
| Liste Extérieur | `D11` | arrosage · arrosage et nettoyage · arrosage et autre · nettoyage · nettoyage et autre · autre · arrosage · nettoyage et autre |
| Extérieur1 | `F16` | Arrosage goutte à goutte · Arrossage tuyaux poreux · Arrossage non sélectif · Autre |
| Extérieur1 | `F35` | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |

## Divergences à arbitrer

Là où les deux sources décrivent la même notion, elles ne disent pas la même chose. Ces écarts doivent être tranchés **avant** d'être codés en dur dans l'application.

### Robinet — catalogue vs page « Robinet1 » (`I15`)

- Catalogue : **9** entrées
- Note de la page : **6** entrées
- Communes : **4**

**Seulement dans le catalogue**

- Simple EF classique à tête
- Simple EF temporisé poussoir
- Simple EF temporisé électronique (à détection)
- Mitigeur temporisé
- Mitigeur double butée

**Seulement dans la note de page**

- Simple EF
- Mitigeur à butée

### WC — catalogue vs page « WC1 » (`D8`)

- Catalogue : **8** entrées
- Note de la page : **5** entrées
- Communes : **0**

**Seulement dans le catalogue**

- Urinoir sans eau
- Urinoir chasse d'eau temporisé
- Toilette sans eau
- Toilette chasse d'eau simple
- Toilette chasse d'eau double débit
- WC suspendu
- WC sur pied
- Accès à la chasse (réglage du flotteur)

**Seulement dans la note de page**

- WC à eau suspendu
- WC à eau sur pied
- Urinoir masculin à eau
- Urinoir masculin sans eau
- Urinoir féminin sans eau

### Bains / Douches - pommeaux — catalogue vs page « Douche-baignoire1 » (`H15`)

- Catalogue : **5** entrées
- Note de la page : **3** entrées
- Communes : **3**

**Seulement dans le catalogue**

- Mitigeur classique
- Mitigeur thermostatique

### Espace vert / extérieur — catalogue vs page « Extérieur1 » (`F16`)

- Catalogue : **7** entrées
- Note de la page : **4** entrées
- Communes : **3**

**Seulement dans le catalogue**

- Sans arrosage
- Nettoyage au nettoyeur haute pression
- Nettoyage tuyaux simple
- Nettoyage tuyaux simple

**Seulement dans la note de page**

- Autre
