# Modifications demandées suite à la première visite terrain
## Permettre d'intégrer un json à ajouter dans un audite en cours
L'idée ets que pour les grands bâtiments deux auditeurs puissent se répartir les pièces au auditer
## Refactoriser les points d'eau locaux par piece
Pour l'instant on travaille par points d'eaux, compteurs, ...
L'idée serait que dans la partie préparation de l'audite les personne définisse les différentes pièces sur les plan, que pour cahcune de ces pièces ils définissent les points d'eau présent (compteur, robinet, wc, etc...)
Puis après lorsqu'ils font l'audite au lieu de rentrer élément par élément ils vont dans la pièce choisissent l'élément et voient la liste des points d'eau correspondants associé à cette pièce (en tableau quand c'est ce qui est fait actuellement comme quand on rentrait directement les robinets, mais pas pour le compteur général) les données elles restent dans le même format mais on ajoute juste a chaque élément une clée étrangère qui est la pièce correspondante
## Solidifier la gestion des images
Pour l'intsant les images enregistrées a coté de la page en tout cas sur mon téléphone s'affichent mal je suis obligé de recharges la page pour que les liens relatifs se chargent correctement et qu'elles s'affichent