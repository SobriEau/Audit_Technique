# WC1

> Spécification extraite de `audit_technique.xlsx`, onglet « WC1 ».
> 33 cellules, 34 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `D8` | Type | Liste déroulante | WC à eau suspendu · WC à eau sur pied · Urinoir masculin à eau · Urinoir masculin sans eau · Urinoir féminin sans eau |
| `H8` | Emplacement | Texte libre | — |
| `B11` | Précision emplacement (préciser si H/F séparé) | Nombre (préciser si H/F séparé) | — |
| `H15` | Référence du modèle si connu | Texte libre | — |
| `D21` | Année d'installation | Texte libre | — |
| `D24` | Date dernier réglage chasse d'eau | Texte libre | — |
| `C30` | Commande de la chasse | Liste déroulante | manuelle double chasse · manuelle simple chasse · manuelle poussoir temporisé · à pédale · à détection · à pas de temps · écoulement en continu · non concerné |
| `H30` | Temporisation de l'écoulement | Liste déroulante | Non concerné · Volume · Mécanique · Electronique |
| `D33` | Durée de l'écoulement(s) ou remplissage chasse | Nombre (s) | — |
| `H33` | Nombre d'équipement identique | Nombre | — |
| `H36` | Volume eau NC disponible (L) | Texte libre | — |
| `B54` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- WC à eau suspendu
- WC à eau sur pied
- Urinoir masculin à eau
- Urinoir masculin sans eau
- Urinoir féminin sans eau

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

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `E5` **WC** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G5` **WC** — Retour à la page "Liste WC"  / - Message avertissement enregistrement
- `D15` **Type de toilette ou urinoir** — Aucune / Urinoir avec siphon à eau / Urinoir avec siphon sec / Stalle d'urinoir / Urinoir à produit chimique / Toilette avec broyeur / Toilette avec rince main intégré* / Toilette japonaise / Toilette à la turque / Toilette à produit chimique / Toilette sèche unitaire / Toilette à litière biomaitrisée / Toilette sèche à séparation / Toilette à eau à séparation / Latrine / Latrine ventilée
- `B18` **Type d'assise** — Menu déroulant : / Adulte non PMR / PMR / Enfants
- `H18` **Usagers** — A cocher (plusieurs réponses possibles) / Public extérieur / Eleves / Personnel
- `H24` **Type de réservoir de chasse** — Apparent / Encastré / Sans réservoir / Non concerné
- `D27` **Volume chasse** — Menu déroulant / 3/6 / 6/9 / 6 / 9 / >9 / Inconnu / Non concerné
- `H27` **Volume chasse estimé ou connu** — menu déroulant : / Connu / Estimé / Non connu/non estimé / Non concerné
- `D36` **Origine de l'eau** — A cocher :  / Eau potable / Eau pluviale / Eau souterraine / Eau grise /   / écrire toutes les eaux utilisées en cas de possibilité de changement
- `D39` **Ventilation ?** — Menu déroulant : / pas de ventilation / en continu / intermittente / à détection
- `H39` **Tester la pression à l'ouverture de la porte** — Menu déroulant : / Rien à déclarer / Pièce WC en dépression / Pièce WC en surpression
- `D42` **Disponibilité d'un local à proximité** — Caches à cocher : / non / oui à côté, derrière un des murs / oui à l'aplomb aux étages inférieurs
- `D45` **Dysfonctionnements** — Cases à cocher : / Fuite de la chasse / Bouton chasse cassé ou bloqué / Bruits de la chasse en continu
- `H45` **Etat visuel général des sanitaires** — Neufs / Bon état / Mauvais état
- `D48` **Dysfonctionnements** — Cases à cocher : / Fuite de la chasse / Bouton chasse cassé ou bloqué / Bruits de la chasse en continu
- `H48` **Etat visuel général des sanitaires** — Neufs / Bon état / Mauvais état
- `D51` non / oui toutes les toilettes / oui certaines toilettes
- `H51` **Est-ce que certaines toilettes ont un mur qui donne sur l'extérieur ?** — non / oui toutes / oui certaines
- `C58` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `F59` **Enregistrer** — Ajout d'un page pour WC / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `G59` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `E5` | Numéro |
| `B7` | Type |
| `F7` | Emplacement |
| `B10` | Précision emplacement (préciser si H/F séparé) |
| `B14` | Type de toilette ou urinoir |
| `F14` | Référence du modèle si connu |
| `B17` | Type d'assise |
| `F17` | Usagers |
| `B20` | Année d'installation |
| `B23` | Date dernier réglage chasse d'eau |
| `F23` | Type de réservoir de chasse |
| `B26` | Volume chasse |
| `F26` | Volume chasse estimé ou connu |
| `B29` | Commande de la chasse |
| `F29` | Temporisation de l'écoulement |
| `B32` | Durée de l'écoulement(s) ou remplissage chasse |
| `F32` | Nombre d'équipement identique |
| `B35` | Origine de l'eau |
| `F35` | Volume eau NC disponible (L) |
| `B38` | Ventilation ? |
| `F38` | Tester la pression à l'ouverture de la porte |
| `B41` | Disponibilité d'un local à proximité |
| `B44` | Dysfonctionnements |
| `F44` | Etat visuel général des sanitaires |
| `B47` | Dysfonctionnements |
| `F47` | Etat visuel général des sanitaires |
| `F50` | Est-ce que certaines toilettes ont un mur qui donne sur l'extérieur ? |
| `B53` | Remarques |
| `C58` | Enregistrer |

</details>
