# Réducteur de pression1

> Spécification extraite de `audit_technique.xlsx`, onglet « Réducteur de pression1 ».
> 28 cellules, 23 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F9` | Emplacement (colonne montante, proche du compteur général, local technique, en regard, etc.) | Nombre (colonne montante, proche du compteur général, local technique, en regard, etc.) | — |
| `F13` | Condition d'accès | Texte libre | — |
| `F16` | Marque | Texte libre | — |
| `J16` | Modèle | Texte libre | — |
| `F19` | Type | Liste déroulante | Réducteur de pression à membrane · Réducteur de pression à piston · Réducteur de pression à cartouche · Inconnu |
| `J19` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `F22` | Année de pose | Texte libre | — |
| `J22` | Pression affichée si manomètre (bar) | Nombre (bar) | — |
| `F25` | Pression de consigne actuelle (bar) | Nombre (bar) | — |
| `J25` | Plage de réglage de la pression (bar) | Nombre (bar) | — |
| `F28` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `J28` | Date dernière maintenance | Texte libre | — |
| `F31` | Organes de réseau à proximité (vanne amont/aval, manomètre amont/aval, clapet anti-retour, filtre …) | Nombre (vanne amont/aval, manomètre amont/aval, clapet anti-retour, filtre …) | — |
| `F34` | Dysfonctionnements observés (coups de bélier, vibrations, bruit, vis de réglage bloquée, …) | Texte libre | — |
| `F37` | Dispoisitif relié au GTB/GTC ? | Oui / Non | Oui · Non |
| `F40` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Réducteur de pression à membrane
- Réducteur de pression à piston
- Réducteur de pression à cartouche
- Inconnu

**Etat général***

- Bon
- Moyen
- Mauvais

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Réducteur de Pression** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `K5` **Réducteur de Pression** — Retour à la page "Liste Réducteur de Pression"  / - Message avertissement enregistrement
- `G45` **Enregistrer** — Enregistrement des données / bascule des infos dans la page "liste des réducteurs de pression"
- `I45` **Enregistrer** — Prise de photo et ajout au dossier
- `J46` **Enregistrer** — Ajout d'une page pour un réducteur de pression / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `K46` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `H4` | Réducteur de Pression |
| `I5` | Numéro |
| `F8` | Emplacement (colonne montante, proche du compteur général, local technique, en regard, etc.) |
| `F12` | Condition d'accès |
| `F15` | Marque |
| `J15` | Modèle |
| `A18` | Type de réducteurs existant à confirmer par un.e expert.e |
| `F18` | Type |
| `J18` | Diamètre Nominal (mm) |
| `F21` | Année de pose |
| `J21` | Pression affichée si manomètre (bar) |
| `F24` | Pression de consigne actuelle (bar) |
| `J24` | Plage de réglage de la pression (bar) |
| `F27` | Etat général* |
| `J27` | Date dernière maintenance |
| `F30` | Organes de réseau à proximité (vanne amont/aval, manomètre amont/aval, clapet anti-retour, filtre …) |
| `F33` | Dysfonctionnements observés (coups de bélier, vibrations, bruit, vis de réglage bloquée, …) |
| `F36` | Dispoisitif relié au GTB/GTC ? |
| `F39` | Remarques |
| `G45` | Enregistrer |
| `F48` | Bon état |
| `G48` | pas de fuite, réglage cohérent (2 à 4 bars selon usage),  manomètre lisible, absence de vibration/bruit |
| `F49` | Etat moyen |
| `G49` | légère corrosion, partiellement lisible, léger vieillissement, légère vibration, pression fluctuante, réglage inconnu |
| `F50` | Mauvais état |
| `G50` | présence d'une fuite, forte corrosion, manomètre ilisible, pression excessive ou instable, traces d'humiditées importantes, bruit important |

</details>
