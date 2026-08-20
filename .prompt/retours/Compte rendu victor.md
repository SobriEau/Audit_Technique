##260818 - échange KAPT - ergonomie
Personnes présentes :
Adrien Delhorme - KAPT
Sacha Mailler - Cerema
Victor Ledoux - APTI

ACCUEIL
la logique est de décorréler l'adresse du site du nom de l'audit et du fichier. Si l'adresse est modifiée, l'outil propose de changer l'audit et de passer à un nouveau fichier. ça évite d'avoir pleins de fichiers différents. Du coup, pour faire un nouvel audit, il faut soit cliquer sur "nouvel audit", soit changer l'adresse. ==> peut être que c'est de trop 

Faire un écran d'accueil plus simple avec le logo sobriEAu

- continuer le projet existant dans le local storage 
- charger un fichier depuis son disque dur 
- charge un nouveau projet 
- ajouter les logos à cet endroit là mais pas dans le bandeau du haut

On enregistre tout localement sur le stockage du navigateur de manière temporaire. A quelle fréquence il faut enregistrer ? a priori, ça s'enregistre automatiquement en réalité donc le bouton enregister permet en réalité d'exporter le json mais faut garder le mot enregistrer. ==> il faudra vraiment dire aux utilisateurs qu'il faut enregistrer/exporter pour télécharger le fichier. Les gens devront gérer une V1, V2, V3.
Sur Mozilla, ça peut arriver régulièrement de devoir vider les caches, l'historique et donc le local storage. 

- renommer le bouton "enregistrer" du bandeau par "sauvegarder le projet" ou "enregistrer l'audit"

- le bouton connexion permet de se connecter à son google drive pour enregistrer les données sur son drive. ==> est-ce qu'on autorise l'utilisation de google drive en terme de souveraineté des données ? ne pas mettre un bouton à part entière mais le faire apparaitre dans les boutons enregistrer et charger. mais attention car il faudrait un compte google commun ou est-ce qu'on enregistre sur son compte gmail perso. peut être que dans la première version on ne met pas le google drive ? 

- dans le fichier exporter : nommer le fichier par le nom de l'audit et la date de l'audit
- mettre un champ libre pour le nom qui se remplit par défaut avec l'adresse

on ne peut pas empêcher les utilisateurs de faire plusieurs versions

ACCUEIL DU PROJET

- dans le champ adresse il faut détailler dans une petite ligne en gris (texte d'aide) : nom de la rue, numéro de la rue, ville, code postal
- nom du site audité : nom du site et nom du bâtiment
- renommer "info" par "information complémentaire". et dans le play solder : indiquer ici toute information complémentaire.


- priorisation des champs à remplir : soit faire un petit point rouge/vert/jaune à côté du champ. ou mettre d'une certaine couleur un texte de type après l'intitulé du champ : priorité bas / moyen / haut
      - niveau 1 : pas de point car non obligatoire
      - niveau 2 : orange clair
      - niveau 3 : orange semi-foncé
      - niveau 4 : orange foncé

- nom de l'auditeur : mettre dans l'intitulé "nom de l'auditeur" et le play solder (texte d'aide) soit un exemple : nom et prénom
- renommer date par "date de début de la visite terrain" si l'audit dure plusieurs jours.
- dans la page "démarrage de l'audit" / "tableau de bord" ==> indiquer les sections présentes dans le bâtiment pour n'avoir que les usages de l'eau qui concerne l'audit de ce bâtiment dans l'onglet d'après. 

- pour le plan chargé, il faut indiquer la date du plan pour chaque fichier chargé. mettre"titre du plan" et demander en playsolder la caractéristique du plan + la date du plan
est-ce que le dwg est plus léger que le format image ? plus il y a d'images, plus le json est long à charger. 
est-ce que ça tient encore avec 100 à 150 photos prise lors de la visite ? ==> c'est un gros sujet car ça peut faire planter le fichier JSON. peut être se limiter à 10 photos seulement. 

- remplacer l'icone de la croix par une icone de "petite poubelle" pour indiquer qu'on veut supprimer le fichier. 
- Galerie photo sur l'écran d'accueil pour visualiser toutes les photos chargées dans les onglets précédents. 

- supprimer questionnaire gestionnaire et questionnaire usager
- remplacer "audit technique" par "démarrer l'audit technique"
- supprimer la ligne " les données sont sauvegardées automatiquement" ==> le utilisateurs peuvent avoir tendance à ne pas enregistrer si cela apparait. 

TABLEAU DE BORD
- dans l'onglet "audit technique", on pourrait faire blocs pour chaque liste : arrivée d'eau (compteur général, sous-compteurs, réducteurs de pression) / réseaux de distribution (EFS, ECS) / ECS (production, stockage, équipements) / points d'eau (Robinets, dohe et baignoires, piscine, lavage du sol) / extérieurs (extérieurs, toiture) / autres


ROBINET
- remplacer "cool start" par "cold start"
- afficher le fil d'ariane : accueil - Accueil projet - audit technique - robients - robinetsn°2
- supprimer le bouton retour car on peut utiliser le retour du navigateur ou le laisser si jamais c'est trop compliqué à faire le bouton retour des téléphones du cerema
- ajout de la possibilité de "localiser sur plan" dans chaque onglet en pointant la pièce. ==> le déplacer en haut de la page juste en dessous de emplacement.
maintenir tout de même le  champ texte "emplacement" pour pouvoir mieux identifier les points d'eau mais ajouter un texte d'aide "reprendre le nom de la pièce indiquée sur le plan". 
A côté d'emplacement, il faudrait un bouton qui dit "ouvrir le plan" et ça permet de le localiser dans le plan sans avoir un encart précis. 
- ajouter la possibilité de "dupliquer" le robinet dans l'onglet robinet si c'est exactement le même robinet -le mettre à côté de "modifier" / "supprimer". ou bien le mettre dans "ajouter en prenant le modèle 1, 2 ou 3. 
- dans les onglets, c'est bien de pouvoir faire des blocs/ des sections permettant d'alléger un peu la page et de faciliter la lecture. 
- renommer le bouton "enregistrer" par "valider" et le transformer en une barre blanche toujours présente à l'écran "valider" et "annuler". 



A faire par @Victor Ledoux 
 besoin d'un champ d'aide sur un max de plan 
 prioriser des champs 
 faire des sections pour regrouper les champs pertinents entre eux. 