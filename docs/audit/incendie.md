# Incendie

> Spécification extraite de `audit_technique.xlsx`, onglet « Incendie ».
> 25 cellules, 27 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F8` | Emplacement (bâtiment concerné) | Texte libre | — |
| `F11` | Précision emplacement | Texte libre | — |
| `F16` | Présence de RIA (Robinets d'Incendie Armés) ? | Liste déroulante | oui · non |
| `K16` | Présence de sprinkler ? | Liste déroulante | Oui · Non |
| `F19` | Présence d'un sous-compteur sur le réseau incendie ? | Liste déroulante | oui · non |
| `K19` | Présence d'une réservie incendie ? | Liste déroulante | Oui · Non |
| `F22` | Volume réserve incendie (m3) | Nombre (m3) | — |
| `K22` | Type d'eau réserve incendie | Liste déroulante | eau potable · eau de pluie · eau pluviale |
| `F25` | Tests réglémentaires réalisés (essais RIA, essais sprinklers, essais pompes) sur le système incendie : | Texte libre | — |
| `K25` | Fréquence des tests | Liste déroulante | hebdomadaire · mensuelle · semestriel · annuelle |
| `F28` | Durée ouverture eau durant les tests | Texte libre | — |
| `K28` | Volume d'eau estimé utilisé par test (L) | Texte libre | — |
| `F31` | Présence de purges régulièrs du réseau incendie? | Liste déroulante | Oui · Non |
| `K31` | Fréquence des purges | Liste déroulante | hebdomadaire · mensuelle · semestrielle · biannuelle · annuelle |
| `F34` | Volume d'eau estimé par purge (L) | Texte libre | — |
| `K34` | Destination des eaux de tests/purges | Liste déroulante | rejet au réseau d'assainissement · rejet au réseau pluvial · infiltration à la parcelle |
| `F37` | Présence d'un carnet de suivi des tests/purges ? | Liste déroulante | Oui · Non |
| `K37` | Personne en charge des tests/purges | Texte libre | — |
| `F40` | Dysfonctionnements observés (fuites, soupape active, débordements, etc.) | Texte libre | — |
| `F43` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Présence de RIA (Robinets d'Incendie Armés) ?**

- oui
- non

**Présence de sprinkler ?**

- Oui
- Non

**Présence d'un sous-compteur sur le réseau incendie ?**

- oui
- non

**Présence d'une réservie incendie ?**

- Oui
- Non

**Type d'eau réserve incendie**

- eau potable
- eau de pluie
- eau pluviale

**Fréquence des tests**

- hebdomadaire
- mensuelle
- semestriel
- annuelle

**Présence de purges régulièrs du réseau incendie?**

- Oui
- Non

**Fréquence des purges**

- hebdomadaire
- mensuelle
- semestrielle
- biannuelle
- annuelle

**Destination des eaux de tests/purges**

- rejet au réseau d'assainissement
- rejet au réseau pluvial
- infiltration à la parcelle

**Présence d'un carnet de suivi des tests/purges ?**

- Oui
- Non

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `J5` **Incendie** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `M5` **Incendie** — Retour à la page "Liste Incendie"  / - Message avertissement enregistrement
- `G46` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste incendie
- `J47` **Enregistrer** — Prise de photo et ajout au dossier
- `L47` **Enregistrer** — Ajout d'un page pour incendie / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `M47` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `I4` | Incendie |
| `J5` | Numéro |
| `F7` | Emplacement (bâtiment concerné) |
| `F10` | Précision emplacement |
| `F14` | Système de sécurité incendie |
| `F15` | Présence de RIA (Robinets d'Incendie Armés) ? |
| `K15` | Présence de sprinkler ? |
| `F18` | Présence d'un sous-compteur sur le réseau incendie ? |
| `K18` | Présence d'une réservie incendie ? |
| `F21` | Volume réserve incendie (m3) |
| `K21` | Type d'eau réserve incendie |
| `F24` | Tests réglémentaires réalisés (essais RIA, essais sprinklers, essais pompes) sur le système incendie : |
| `K24` | Fréquence des tests |
| `F27` | Durée ouverture eau durant les tests |
| `K27` | Volume d'eau estimé utilisé par test (L) |
| `F30` | Présence de purges régulièrs du réseau incendie? |
| `K30` | Fréquence des purges |
| `F33` | Volume d'eau estimé par purge (L) |
| `K33` | Destination des eaux de tests/purges |
| `F36` | Présence d'un carnet de suivi des tests/purges  ? |
| `K36` | Personne en charge des tests/purges |
| `F39` | Dysfonctionnements observés (fuites, soupape active, débordements, etc.) |
| `F42` | Remarques |
| `G46` | Enregistrer |

</details>
