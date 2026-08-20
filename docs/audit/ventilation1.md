# Ventilation1

> Spécification extraite de `audit_technique.xlsx`, onglet « Ventilation1 ».
> 11 cellules, 14 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B11` | Système de ventilation | Liste déroulante | insuflation · ventilation naturelle · VMC simple flux autoréglable · VMC simple flux hygroréglable · VMC double flux · CTA simple flux · CTA double flux · Ne sait pas · Autre |
| `H16` | Marque et modèle du système | Texte libre | — |
| `H19` | Emplacement du système (caisson VMC, CTA etc…) | Texte libre | — |
| `H23` | Année d'installation | Texte libre | — |
| `H27` | Système en fonctionnement le jour de l'audit | Oui / Non | Oui · Non |
| `H31` | Dégradations / dysfontionnement observés | Texte libre | — |
| `H35` | Remarques (concommation d'eau de la CTA,…) | Nombre (concommation d'eau de la CTA,…) | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Système de ventilation**

- insuflation
- ventilation naturelle
- VMC simple flux autoréglable
- VMC simple flux hygroréglable
- VMC double flux
- CTA simple flux
- CTA double flux
- Ne sait pas
- Autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A2` **Audit SOBRIEAU PARTIE TECHNIQUE** — Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `D5` **Ventilation** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G6` **Ventilation** — Retour à la page "Liste Ventilation"  / - Message avertissement enregistrement
- `C39` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste ventilation
- `E39` **Enregistrer** — Prise de photo et ajout au dossier
- `F39` **Enregistrer** — Ajout d'une page pour un système de ventilation / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `G39` **Enregistrer** — Suppression du système de ventilation pièce / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `A2` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D5` | Ventilation |
| `E6` | Numéro |
| `B10` | Système de ventilation |
| `B14` | Marque et modèle du système |
| `B18` | Emplacement du système (caisson VMC, CTA etc…) |
| `B22` | Année d'installation |
| `B26` | Système en fonctionnement le jour de l'audit |
| `B30` | Dégradations / dysfontionnement observés |
| `B34` | Remarques (concommation d'eau de la CTA,…) |
| `C39` | Enregistrer |

</details>
