KAPT

# Compte rendu

18 août 2026

Revue ergonomiques de l'application SobriEAU

## Participants

- Sacha MAILLER, CEREMA
- Victor LEDOUX, SobriEAU
- Adrien DELHORME, KAPT

## Ordre du jour

- Revue ergonomique de l'application

## Revue ergonomique de l'application

### Toutes les pages

#### Barre du haut

- Le bouton « connexion » n'est peut-être pas nécessaire dans la v1, ou alors au moment de l'import ou de l'export des projets en JSON
- Le bouton « Enregistrer » peut, sur certaines pages, être confondu avec l'enregistrement du formulaire de la page. Le renommer en « Enregistrer le projet » ou « Enregistrer l'audit » permettrait de réduire cette ambiguïté.
- Le bouton « Charger » ne sera présent que sur la page d'accueil

#### Textes d'aide sur les champs

Lorsque les libellés des champs ne sont pas évidents, il est conseillé d'ajouter un texte d'aide en dessous

KAPT, Bâtiment INEED 1, rue Marc Seguin 26300 ALIXAN

KAPT

## Regroupement de champs

Pour rendre plus facile à lire les formulaires les plus complets, ne pas hésiter à faire des groupes de champs espacés visuellement. Par exemple « Emplacement », puis « Consommation », etc.

## Page Accueil

Il serait pertinent que l'écran d'accueil soit une page ne contenant que :

- La liste des projets stockés dans le navigateur (local storage)
- Un bouton pour importer un projet (depuis un JSON)
- Un bouton « Nouveau projet »

## Page d'accueil du projet

- Ajouter champ texte libre « nom du projet » facultatif, pour nommer et identifier le projet
- Ajouter un champ « nom du site » et préciser quelles informations sont attendues
- Ajouter un texte d'aide sur le champ adresse : préciser ce qui est attendu (voie, code postal, commune, etc)
- Ajouter un badge [Priorité : basse], [Priorité : moyenne] ou [Priorité : haute] à droite des libellés des champs pour indiquer que la saisie ou non d'un champ a un impact sur la qualité de l'audit
- Préciser le libellé du champ « Info » : « Informations générales » par exemple
- Préciser quelle date on attends dans le champ Date de la section Audit (date de début d'audit ? date de fin ?)
- Après discussion, il a été convenu qu'il n'est pas nécessaire de demander la date des plans car seuls les dernières versions seront chargées
- Ne pas permettre l'ajout de photos sur l'écran général du projet, seulement la consultation
- Supprimer les boutons « questionnaires ... »
- Renommer le bouton « Audit technique » en « Démarrer l'audit technique »
- Ajouter une section avec des cases à cocher qui permettent de pré-sélectionner les formulaires qui seront accessibles dans l'audit technique

## Audit technique

- Ajouter le fil d'Ariane pour aider au repérage et à la navigation dans l'application : Au maximum on devrait attendre cinq niveaux de profondeur (Accueil > Nom du Projet > Audit technique > Section > Ajout/modification d'un élément)
- Le fil d'Ariane pourra remplacer le bouton retour
- Supprimer le champ « infos » en haut de page qui n'est pas nécessaire
- La liste des sections pourrait être rendue plus lisible en regroupant certaines sections en catégories (par exemple : ECS, EFS, extérieur, etc)

## Fiche d'un élément technique

- Champ Emplacement : dans tous les cas il sera nécessaire de remplir ce champ au format texte pour identifier l'emplacement d'un élément. Indiquer dans le texte d'aide de s'appuyer sur le plan pour nommer les emplacements. Pour aider l'utilisateur il est

KAPT, Bâtiment INEED 1, rue Marc Seguin 26300 ALIXAN

ikapt

possible de lui demander d'associer l'une des images de plans à cet élément technique et de permettre d'ouvrir facilement cette image dans un nouvel onglet, en grande taille. La localisation avec un curseur sur le plan est un plus.

- Dans les listes d'éléments, pouvoir dupliquer un élément peut parfois être un vrai gain de temps.
- Aussi, pouvoir indiquer le nombre d'éléments strictement identiques à un même emplacement peut être intéressant.
- Le bouton Enregistrer en bas du formulaire, doit être un point de passage obligatoire. Il serait préférable qu'il soit toujours visible à l'écran : par exemple dans une barre qui reste « collée » en bas de l'écran.

![img-0.jpeg](img-0.jpeg)

KAPT, Bâtiment INEED 1, rue Marc Seguin 26300 ALIXAN