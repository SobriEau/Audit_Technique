# Surpresseur1

> Spécification extraite de `audit_technique.xlsx`, onglet « Surpresseur1 ».
> 30 cellules, 23 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F9` | Emplacement (proche du compteur général, local technique, etc.) | Texte libre | — |
| `F13` | Condition d'accès | Texte libre | — |
| `F16` | Marque | Texte libre | — |
| `J16` | Modèle | Texte libre | — |
| `F19` | Type | Texte libre | — |
| `J19` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `F22` | Année de pose | Texte libre | — |
| `J22` | Pression affichée si manomètre (bar) | Nombre (bar) | — |
| `F25` | Pression de consigne actuelle (bar) | Nombre (bar) | — |
| `J25` | Plage de réglage de la pression (bar) | Nombre (bar) | — |
| `F28` | Etat général | Liste déroulante | Bon · Moyen · Mauvais |
| `J28` | Date dernière maintenance | Texte libre | — |
| `F31` | Organes de réseau à proximité (ballon à vessie, variateurs de pression, clapet anti-retour, filtre …) | Nombre (ballon à vessie, variateurs de pression, clapet anti-retour, filtre …) | — |
| `F34` | Dysfonctionnements observés (coups de bélier, vibrations, bruit, …) | Texte libre | — |
| `F37` | Dispositif relié au GTB/GTC ? | Oui / Non | Oui · Non |
| `F40` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Etat général**

- Bon
- Moyen
- Mauvais

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Surpresseur** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `K5` **Surpresseur** — Retour à la page "Liste Surpresseur"  / - Message avertissement enregistrement
- `G47` **Enregistrer** — Enregistrement des données / bascule des infos dans la page "liste des surpresseurs"
- `I47` **Enregistrer** — Prise de photo et ajout au dossier
- `J48` **Enregistrer** — Ajout d'une page pour un surpresseur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `K48` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `R3` | ATTENTION voir comment les surpresseurs sont indiqués dans ECS |
| `H4` | Surpresseur |
| `R4` | est-ce qu'on parle ici uniquement de l'EFS ? |
| `I5` | Numéro |
| `R6` | ou bien on remplace "type" par EFS, ECS, incendie, EAU de pluie, etc. |
| `F8` | Emplacement (proche du compteur général, local technique, etc.) |
| `F12` | Condition d'accès |
| `F15` | Marque |
| `J15` | Modèle |
| `F18` | Type |
| `J18` | Diamètre Nominal (mm) |
| `F21` | Année de pose |
| `J21` | Pression affichée si manomètre (bar) |
| `F24` | Pression de consigne actuelle (bar) |
| `J24` | Plage de réglage de la pression (bar) |
| `F27` | Etat général |
| `J27` | Date dernière maintenance |
| `F30` | Organes de réseau à proximité (ballon à vessie, variateurs de pression, clapet anti-retour, filtre …) |
| `F33` | Dysfonctionnements observés (coups de bélier, vibrations, bruit, …) |
| `F36` | Dispositif relié au GTB/GTC ? |
| `F39` | Remarques |
| `F43` | Bon état |
| `G43` | pas de fuite, pas de corrosion, pas de bruit anormal, pas de vibration excessive, instrumentation lisible, pression stable, démarrage normal, propre |
| `F44` | Etat moyen |
| `G44` | suitements, légère corrosion, bruit modéré, démarrage fréquents, instrumentation peu lisible, vibrations ponctuelles |
| `F45` | Mauvais état |
| `G45` | fuite avérée, corrosion avancée, vibration excessive, bruit anormal, démarrages trop réguliers, instrumentation HS, panne régulière |
| `G47` | Enregistrer |

</details>
