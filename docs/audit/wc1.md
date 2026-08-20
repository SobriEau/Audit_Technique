# WC1

> Spécification extraite de `audit_technique.xlsx`, onglet « WC1 ».
> 40 cellules, 34 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `G8` | Type de pose | Liste déroulante | suspendu · sur pied |
| `K8` | Emplacement | Texte libre | — |
| `E11` | Précision emplacement (préciser si H/F séparé) | Nombre (préciser si H/F séparé) | — |
| `K15` | Référence du modèle si connu | Texte libre | — |
| `E18` | Type d'assise | Liste déroulante | Adulte non PMR · PMR · Enfants |
| `K18` | Utilisateurs | Liste déroulante | (plusieurs réponses possibles) · Public extérieur · Personnel · Autres adultes · Enfants · Adolescents · Personnes âgées · PMR |
| `G21` | Année d'installation | Texte libre | — |
| `K21` | Nombre d'équipements identiques | Nombre | — |
| `G24` | Date dernier réglage chasse d'eau | Texte libre | — |
| `G27` | Volume chasse | Liste déroulante | <3 · 2/4 · 3/6 · 6/9 · 6 · 9 · >9 · Inconnu · Non concerné |
| `K27` | Volume chasse estimé ou connu | Liste déroulante | Connu · Estimé · Non connu/non estimé · Non concerné |
| `F30` | Commande de la chasse | Liste déroulante | manuelle double chasse · manuelle simple chasse · manuelle poussoir temporisé · à pédale · à détection · à pas de temps · écoulement en continu · non concerné |
| `K30` | Temporisation de l'écoulement | Liste déroulante | Non concerné · Volume · Mécanique · Electronique |
| `G33` | Durée de l'écoulement(s) ou remplissage chasse | Nombre (s) | — |
| `K33` | Nombre d'équipement identique | Nombre | — |
| `G36` | Origine de l'eau | Liste déroulante | Eau potable · Eau de pluie · Eau souterraine · Eau grise · écrire toutes les eaux utilisées en cas de possibilité de changement |
| `K36` | Volume eau NC disponible (L) | Texte libre | — |
| `G39` | Ventilation ? | Liste déroulante | pas de ventilation · en continu · intermittente · à détection · indépendante du reste du bâtiment |
| `G42` | Test de la feuille de papier sur la bouche d'extraction | Liste déroulante | Feuille aspirée · Feuille repoussée · Rien ne se passe |
| `G45` | Dysfonctionnements | Liste déroulante | Fuite de la chasse · Bouton chasse cassé ou bloqué · Bruits de la chasse en continu · Entartrage · Odeurs · WC bouché |
| `K45` | Disponibilité d'un local à proximité | Liste déroulante | non · oui à côté · derrière un des murs · oui à l'aplomb aux étages inférieurs |
| `E51` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type de pose**

- suspendu
- sur pied

**Type d'assise**

- Adulte non PMR
- PMR
- Enfants

**Utilisateurs**

- (plusieurs réponses possibles)
- Public extérieur
- Personnel
- Autres adultes
- Enfants
- Adolescents
- Personnes âgées
- PMR

**Volume chasse**

- <3
- 2/4
- 3/6
- 6/9
- 6
- 9
- >9
- Inconnu
- Non concerné

**Volume chasse estimé ou connu**

- Connu
- Estimé
- Non connu/non estimé
- Non concerné

**Commande de la chasse**

- manuelle double chasse
- manuelle simple chasse
- manuelle poussoir temporisé
- à pédale
- à détection
- à pas de temps
- écoulement en continu
- non concerné

**Temporisation de l'écoulement**

- Non concerné
- Volume
- Mécanique
- Electronique

**Origine de l'eau**

- Eau potable
- Eau de pluie
- Eau souterraine
- Eau grise
- écrire toutes les eaux utilisées en cas de possibilité de changement

**Ventilation ?**

- pas de ventilation
- en continu
- intermittente
- à détection
- indépendante du reste du bâtiment

**Test de la feuille de papier sur la bouche d'extraction**

- Feuille aspirée
- Feuille repoussée
- Rien ne se passe

**Dysfonctionnements**

- Fuite de la chasse
- Bouton chasse cassé ou bloqué
- Bruits de la chasse en continu
- Entartrage
- Odeurs
- WC bouché

**Disponibilité d'un local à proximité**

- non
- oui à côté
- derrière un des murs
- oui à l'aplomb aux étages inférieurs

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `D1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H5` **WC** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `J5` **WC** — Retour à la page "Liste WC"  / - Message avertissement enregistrement
- `G15` **Type de toilette ou urinoir** — Urinoir masculin à eau / Urinoir masculin sans eau / Urinoir féminin sans eau / Urinoir féminin à eau / Stalle d'urinoir / Urinoir à produit chimique / Toilette à eau standard / Toilette avec broyeur / Toilette avec rince main intégré* / Toilette japonaise / Toilette à la turque / Toilette à produit chimique / Toilette sans eau unitaire / Toilette sans eau à séparation / Toilette à eau à séparation / Latrine / Latrine ventilée
- `K24` **Type de réservoir de chasse** — Apparent / Encastré / Sans réservoir / Non concerné
- `K42` **Etat visuel général des sanitaires** — Bon / Moyen / Mauvais
- `G48` **La majorité des toilettes sont-elles positionnées les unes au-dessus des autres dans le bâtiment ?** — non / oui toutes les toilettes / oui certaines toilettes
- `K48` **Est-ce que certaines toilettes ont un mur qui donne sur l'extérieur ?** — non / oui toutes / oui certaines
- `F55` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste WC
- `H56` **Enregistrer** — Prise de photo et ajout au dossier
- `I56` **Enregistrer** — Ajout d'un page pour WC / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `J56` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `H5` | Numéro |
| `E7` | Type de pose |
| `I7` | Emplacement |
| `E10` | Précision emplacement (préciser si H/F séparé) |
| `E14` | Type de toilette ou urinoir |
| `I14` | Référence du modèle si connu |
| `P16` | Est-ce qu'on demande à l'auditeur de vérifier l'absence de fuite sur chaque chasse d'eau ? |
| `E17` | Type d'assise |
| `I17` | Utilisateurs |
| `E20` | Année d'installation |
| `I20` | Nombre d'équipements identiques |
| `E23` | Date dernier réglage chasse d'eau |
| `I23` | Type de réservoir de chasse |
| `E26` | Volume chasse |
| `I26` | Volume chasse estimé ou connu |
| `E29` | Commande de la chasse |
| `I29` | Temporisation de l'écoulement |
| `E32` | Durée de l'écoulement(s) ou remplissage chasse |
| `I32` | Nombre d'équipement identique |
| `E35` | Origine de l'eau |
| `I35` | Volume eau NC disponible (L) |
| `E38` | Ventilation ? |
| `E41` | Test de la feuille de papier sur la bouche d'extraction |
| `I41` | Etat visuel général des sanitaires |
| `E44` | Dysfonctionnements |
| `I44` | Disponibilité d'un local à proximité |
| `E47` | La majorité des toilettes sont-elles positionnées les unes au-dessus des autres dans le bâtiment ? |
| `I47` | Est-ce que certaines toilettes ont un mur qui donne sur l'extérieur ? |
| `E50` | Remarques |
| `E53` | * Le cas échéant, précisez le débit du rince main intégré dans les remarques |
| `F55` | Enregistrer |
| `E58` | Bon état |
| `F58` | équipement récent, pas de fuite, remplissage normal de la chasse, mécanisme de chasse fonctionnel, pas d'entartrage, pas de traces de dépôt dans la cuvette |
| `E59` | Etat moyen |
| `F59` | équipement plus ancien, remplissage lent de la chasse, léger entartrage, légère fuite intermittente, quelques traces dépôts au fond de la  cuvette |
| `E60` | Mauvais état |
| `F60` | équipement ancien, fuite continue, mécanisme de chasse deffecteux, entartrage, nombreuses traces de dépôt au fond de la cuvette |

</details>
