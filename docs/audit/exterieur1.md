# Extérieur1

> Spécification extraite de `audit_technique.xlsx`, onglet « Extérieur1 ».
> 58 cellules, 57 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F8` | Emplacement | Texte libre | — |
| `F11` | Précision emplacement | Texte libre | — |
| `G15` | Surface de cette parcelle (m2) | Texte libre | — |
| `J15` | Dont surface imperméable (m2) | Texte libre | — |
| `N15` | Type de gestion des eaux pluviales (ruissellement) | Liste déroulante | aucune (ruissellement libre) · infiltration à la parcelle directe · stockage + infiltraion à la parcelle · stockage + réutilisation · rejet au réseau pluvial enterré · rejet au réseau unitaire enterré · rejet vers le milieu superficiel (fossé, cours d'eau) |
| `N19` | Précision (présences de noues, fossés, regards, bassins de récupérations, etc.) | Nombre (présences de noues, fossés, regards, bassins de récupérations, etc.) | — |
| `J22` | Possibilité de rediriger ces eaux pour infiltration sur la parcelle | Oui / Non | Oui · Non |
| `K22` | Précision | Texte libre | — |
| `J25` | Possibilité de rediriger ces eaux pour stockage sur la parcelle | Oui / Non | Oui · Non |
| `K25` | Précision | Texte libre | — |
| `G29` | Surface arrosée (m2) | Texte libre | — |
| `I29` | type de surface à arroser (pelouse stade ou hornement, massif, haies, potager, arbres, etc.) | Texte libre | — |
| `F32` | Précisions des végétaux sur cette surface | Texte libre | — |
| `G35` | Exposition de la parcelle | Liste déroulante | Ensoleillée · Ombragée · Mi-ombragée |
| `J35` | Pente de la parcelle | Liste déroulante | nulle · faible · moyenne · forte |
| `M35` | Présence de paillage | Oui / Non | Oui · Non |
| `G38` | Mode d'arrosage | Liste déroulante | Tuyau manuel · Arrosoir · Oyas · Micro asperseur · Arrosage goutte à goutte · Arrosage tuyaux poreux · Tuyères · Arrosage non sélectif · Autre |
| `J38` | Pilotage de l'arrosage | Liste déroulante | Manuel · En fonction de la météo · Horloge · Sonde humidité · Connecté |
| `N38` | Précisions | Texte libre | — |
| `G41` | Signes de surarrosage | Liste déroulante | aucun · ruissellement · flaques · mousse · sol détrempé |
| `J41` | Signes de sous-arrosage | Liste déroulante | aucun · végétaux stressés · zones sèches · jaunissement |
| `N41` | Période d'arrosage dans la journée | Liste déroulante | Matin · Soir · En pleine journée |
| `F44` | Origine eau pour l'arrosage | Liste déroulante | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| `N44` | Capacité stockage eau NC (m3) | Nombre (m3) | — |
| `G47` | Nb de mois d'arrosage / an | Texte libre | — |
| `J47` | Durée d'un arrosage | Texte libre | — |
| `N47` | Nb d'arrosage / mois | Texte libre | — |
| `I50` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `N50` | Numéros des robinets correspondants | Liste déroulante | depuis la liste des robinets |
| `F53` | Remarques | Texte libre | — |
| `G57` | Utilisation (nettoyage véhicule/parking,..) | Texte libre | — |
| `J57` | Mode de nettoyage | Liste déroulante | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| `N57` | Motif du nettoyage | Liste déroulante | esthétique · hygiène · sécurité · entretien · autre |
| `N60` | Précisions | Texte libre | — |
| `F63` | Origine eau pour le nettoyage | Liste déroulante | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| `N63` | Capacité stockage eau NC (m3) | Nombre (m3) | — |
| `G66` | Durée d'un nettoyage | Texte libre | — |
| `L66` | Nb de nettoyage/mois | Texte libre | — |
| `I69` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `N69` | Numéros des robinets correspondants | Liste déroulante | depuis la liste des robinets |
| `F72` | Remarques | Texte libre | — |
| `F76` | Usage (IRDEFA, CTA adiabatique, mare,..) | Texte libre | — |
| `L76` | Précisions | Texte libre | — |
| `F79` | Origine eau | Liste déroulante | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| `N79` | Capacité stockage eau NC (m3) | Nombre (m3) | — |
| `I82` | Volume d'eau utlisé / mois (m3) | Nombre (m3) | — |
| `N82` | Fréquence : nombre de mois / an | Nombre | — |
| `I85` | Nombre de robinet d'eau potable utilisés | Nombre | — |
| `N85` | Numéros des robinets correspondants | Liste déroulante | depuis la liste des robinets |
| `F88` | Remarques générales | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type de gestion des eaux pluviales (ruissellement)**

- aucune (ruissellement libre)
- infiltration à la parcelle directe
- stockage + infiltraion à la parcelle
- stockage + réutilisation
- rejet au réseau pluvial enterré
- rejet au réseau unitaire enterré
- rejet vers le milieu superficiel (fossé, cours d'eau)

**Exposition de la parcelle**

- Ensoleillée
- Ombragée
- Mi-ombragée

**Pente de la parcelle**

- nulle
- faible
- moyenne
- forte

**Mode d'arrosage**

- Tuyau manuel
- Arrosoir
- Oyas
- Micro asperseur
- Arrosage goutte à goutte
- Arrosage tuyaux poreux
- Tuyères
- Arrosage non sélectif
- Autre

**Pilotage de l'arrosage**

- Manuel
- En fonction de la météo
- Horloge
- Sonde humidité
- Connecté

**Signes de surarrosage**

- aucun
- ruissellement
- flaques
- mousse
- sol détrempé

**Signes de sous-arrosage**

- aucun
- végétaux stressés
- zones sèches
- jaunissement

**Période d'arrosage dans la journée**

- Matin
- Soir
- En pleine journée

**Origine eau pour l'arrosage**

- eau potable
- eau de pluie
- eau pluviale
- eau grise
- eau souterraine

**Numéros des robinets correspondants**

- depuis la liste des robinets

**Mode de nettoyage**

- auto laveuse
- nettoyeur haute pression
- tuyaux simple
- autre

**Motif du nettoyage**

- esthétique
- hygiène
- sécurité
- entretien
- autre

**Origine eau pour le nettoyage**

- eau potable
- eau de pluie
- eau pluviale
- eau grise
- eau souterraine

**Numéros des robinets correspondants**

- depuis la liste des robinets

**Origine eau**

- eau potable
- eau de pluie
- eau pluviale
- eau grise
- eau souterraine

**Numéros des robinets correspondants**

- depuis la liste des robinets

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `J5` **Extérieur** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `M5` **Extérieur** — Retour à la page "Liste Extérieur"  / - Message avertissement enregistrement
- `G91` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste des espaces verts /extérieurs
- `J92` **Enregistrer** — Prise de photo et ajout au dossier
- `L92` **Enregistrer** — Ajout d'un page pour espace vert/extérieur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `M92` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `I4` | Extérieur |
| `J5` | Numéro |
| `F7` | Emplacement |
| `F10` | Précision emplacement |
| `F14` | Surface de cette parcelle (m2) |
| `I14` | Dont surface imperméable (m2) |
| `L14` | Type de gestion des eaux pluviales (ruissellement) |
| `F17` | Précision (présences de noues, fossés, regards, bassins de récupérations, etc.) |
| `F21` | Possibilité de rediriger ces eaux pour infiltration sur la parcelle |
| `K21` | Précision |
| `F24` | Possibilité de rediriger ces eaux pour stockage sur la parcelle |
| `K24` | Précision |
| `F27` | Arrosage |
| `F28` | Surface arrosée (m2) |
| `I28` | type de surface à arroser (pelouse stade ou hornement, massif, haies, potager, arbres, etc.) |
| `F31` | Précisions des végétaux sur cette surface |
| `F34` | Exposition de la parcelle |
| `I34` | Pente de la parcelle |
| `L34` | Présence de paillage |
| `F37` | Mode d'arrosage |
| `I37` | Pilotage de l'arrosage |
| `L37` | Précisions |
| `F40` | Signes de surarrosage |
| `I40` | Signes de sous-arrosage |
| `L40` | Période d'arrosage dans la journée |
| `F43` | Origine eau pour l'arrosage |
| `L43` | Capacité stockage eau NC (m3) |
| `P43` | NC = non conventionnelle (pluie, eau grise etc…) |
| `F46` | Nb de mois d'arrosage / an |
| `I46` | Durée d'un arrosage |
| `L46` | Nb d'arrosage / mois |
| `F49` | Nombre de robinet d'eau potable utilisés |
| `L49` | Numéros des robinets correspondants |
| `F52` | Remarques |
| `F55` | Nettoyage |
| `F56` | Utilisation (nettoyage véhicule/parking,..) |
| `I56` | Mode de nettoyage |
| `L56` | Motif du nettoyage |
| `F59` | Précisions |
| `F62` | Origine eau pour le nettoyage |
| `L62` | Capacité stockage eau NC (m3) |
| `F65` | Durée d'un nettoyage |
| `I65` | Nb de nettoyage/mois |
| `F68` | Nombre de robinet d'eau potable utilisés |
| `L68` | Numéros des robinets correspondants |
| `F71` | Remarques |
| `F74` | Autre |
| `F75` | Usage (IRDEFA, CTA adiabatique, mare,..) |
| `L75` | Précisions |
| `F78` | Origine eau |
| `L78` | Capacité stockage eau NC (m3) |
| `F81` | Volume d'eau utlisé / mois (m3) |
| `L81` | Fréquence : nombre de mois / an |
| `F84` | Nombre de robinet d'eau potable utilisés |
| `L84` | Numéros des robinets correspondants |
| `F87` | Remarques générales |
| `G91` | Enregistrer |

</details>
