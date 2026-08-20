# Référentiel des listes de valeurs

Le classeur ne contient **aucune validation de données Excel**. Les valeurs autorisées y sont décrites en langage naturel, dans les notes de cellules — seule source depuis la V2 : l'onglet catalogue de la V1 (« Infos audit partie technique ») n'existe plus.

## Listes de valeurs, par onglet

| Onglet | Cellule | Libellé | Valeurs |
|---|---|---|---|
| Compteur général | `H17` | Type | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| Compteur général | `L17` | Classe métrologique | Classe A · Classe B · Classe C · Classe D · R40 · R50 · R63 · R80 · R100 · R125 · R160 · R200 · R250 · R315 · R400 · R160 · R200 · R400 · R500 · R630 · R800 · Inconnue |
| Compteur général | `H26` | Télétransmission | O · N |
| Compteur général | `L29` | Etat général* | Bon · Moyen · Mauvais |
| Compteur général | `H44` | Dispositif relié au GTB/GTC ? | O · N |
| Sous-compteur1 | `F18` | Type | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| Sous-compteur1 | `J18` | Classe métrologique | Classe A · Classe B · Classe C · Classe D · R40 · R50 · R63 · R80 · R100 · R125 · R160 · R200 · R250 · R315 · R400 · R160 · R200 · R400 · R500 · R630 · R800 · Inconnue |
| Sous-compteur1 | `F27` | Télétransmission | O · N |
| Sous-compteur1 | `J30` | Etat général* | Bon · Moyen · Mauvais |
| Sous-compteur1 | `F45` | Dispoisitif relié au GTB/GTC ? | O · N |
| Réducteur de pression1 | `F19` | Type | Réducteur de pression à membrane · Réducteur de pression à piston · Réducteur de pression à cartouche · Inconnu |
| Réducteur de pression1 | `F28` | Etat général* | Bon · Moyen · Mauvais |
| Réducteur de pression1 | `F37` | Dispoisitif relié au GTB/GTC ? | O · N |
| Surpresseur1 | `F28` | Etat général | Bon · Moyen · Mauvais |
| Surpresseur1 | `F37` | Dispositif relié au GTB/GTC ? | O · N |
| Réseaux ECS | `F12` | Matériau principal des canalisations | Cuivre · Multicouche · PER · PEHD · PE · pvc sous pression · acier galvanisé · fonte |
| Réseaux ECS | `F25` | Calorifugeage des canalisations | oui · non · ne sait pas |
| Réseaux ECS | `F31` | Matériaux de l'isolant | laine de verre · laine de roche · papier et platre · polyruéthane · Mousse synthétique (armaflex,PE…) |
| Réseaux ECS | `F34` | Continuité de l'isolation | oui · non · ne sait pas |
| Réseaux ECS | `F37` | Etat de l'isolant* | Bon · Moyen · Mauvais |
| Réseaux ECS | `F47` | Bouclage | oui · non · ne sait pas |
| Réseaux ECS | `F66` | Mode de fonctionnement du circulateur | continu · horloge programmable · piloté par la température · aquastat · GTB · GTC |
| Réseaux ECS | `F69` | Variation de vitesse du circulateur possible | O · N |
| Réseaux ECS | `F80` | Présence d'une vanne thermostatique | manuelle · motorisée · non · ne sait pas |
| Réseaux ECS | `F83` | Présence d'un clapet anti-retour | oui · non · ne sait pas |
| Réseaux ECS | `F86` | Présence d'un vase d'expansion | oui · non · ne sait pas |
| Réseaux ECS | `F97` | Présence de bras mort connus | oui · non · ne sait pas |
| Réseaux ECS | `F104` | Présence d'une purge automatique | oui · non · ne sait pas |
| Réseaux ECS | `F107` | Protocole pour le risque légionnelle déjà mis en place ? | oui · non · ne sait pas |
| Production Stockage ECS | `F24` | Systèmes de production | Chauffe-eau gaz instantané · Accumulateur gaz · Chaudière · Ballon électrique · Chauffe-eau électrique · Chauffe-eau solaire thermique · Solaire photovoltaïque · Système solaire combiné chauffage + ECS · Chauffe-eau thermodynamique individuel (ie PAC) · PAC (indiviuuelle ou collective) · Module thermique d'appartements (MTA) · Kit robinetterie avec module chaufffant · Autre (préciser dans remarques) · Ne sait pas |
| Production Stockage ECS | `F27` | Combustible (si chaudière) | gaz · fioul · bois · biomasse · réseau de chaleur urbain · ne sait pas · autre |
| Production Stockage ECS | `F36` | Etat apparent du générateur* | Bon · Moyen · Mauvais |
| Production Stockage ECS | `F82` | Continuité de l'isolant sur tout le (les) ballons | oui · non · ne sait pas |
| Production Stockage ECS | `F85` | Etat de l'isolant* | bon · moyen · mauvais |
| Production Stockage ECS | `F101` | Présence d'une soupape de sécurité | oui · non · ne sait pas |
| Production Stockage ECS | `F104` | Présence d'un vase d'expansion entre la soupape de sécurité et le stockage | oui · non · ne sait pas |
| Robinets | `F21` | Type | Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique |
| Robinets | `K21` | Commande | manuelle · fémorale · à pédale · à détection |
| Robinets | `F24` | Temporisation | Aucune · Mécanique · Electronique |
| Robinets | `M32` | Présence d'un limiteur de débit | O · N |
| Robinets | `M44` | Matériau du tuyau d'alimentation | Cuivre · Multicouche · PER · PEHD · PE |
| Robinets | `F47` | Etat général* | Bon · Moyen · Mauvais |
| Douche-baignoire1 | `G8` | Type d'équipement | douche ou baignoire · Affiche ensuite la partie · "Douche et pommeau" · ou · "Baignoire et pommeau" |
| Douche-baignoire1 | `G28` | Type de pommeau | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle · pommeau anti-calcaire |
| Douche-baignoire1 | `K28` | Jets du pommeau | aucune · pluie laminaire · aéré · brumisé · pulsé/massage · concentré/puissant · multi-jets |
| Douche-baignoire1 | `K31` | Présence d'un limiteur de débit | O · N |
| Douche-baignoire1 | `E37` | Etat général | Bon · Moyen · Mauvais |
| Douche-baignoire1 | `G53` | Type de pommeau | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle · pommeau anti-calcaire |
| Douche-baignoire1 | `K53` | Jets du pommeau | aucune · pluie laminaire · aéré · brumisé · pulsé/massage · concentré/puissant · multi-jets |
| Douche-baignoire1 | `K56` | Présence d'un réducteur de débit | O · N |
| Douche-baignoire1 | `E65` | Etat général* | Bon · Moyen · Mauvais |
| Douche-baignoire1 | `E78` | Type | Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique |
| Douche-baignoire1 | `E81` | Temporisation | Aucune · Mécanique · Electronique |
| Douche-baignoire1 | `K87` | Présence d'un limiteur de débit | O · N |
| Douche-baignoire1 | `K90` | Matériau du tuyau d'alimentation | Cuivre · Multicouche · PER · PEHD · PE |
| Douche-baignoire1 | `E93` | Etat général* | Bon · Moyen · Mauvais |
| WC1 | `G8` | Type de pose | suspendu · sur pied |
| WC1 | `E18` | Type d'assise | Adulte non PMR · PMR · Enfants |
| WC1 | `K18` | Utilisateurs | (plusieurs réponses possibles) · Public extérieur · Personnel · Autres adultes · Enfants · Adolescents · Personnes âgées · PMR |
| WC1 | `G27` | Volume chasse | <3 · 2/4 · 3/6 · 6/9 · 6 · 9 · >9 · Inconnu · Non concerné |
| WC1 | `K27` | Volume chasse estimé ou connu | Connu · Estimé · Non connu/non estimé · Non concerné |
| WC1 | `F30` | Commande de la chasse | manuelle double chasse · manuelle simple chasse · manuelle poussoir temporisé · à pédale · à détection · à pas de temps · écoulement en continu · non concerné |
| WC1 | `K30` | Temporisation de l'écoulement | Non concerné · Volume · Mécanique · Electronique |
| WC1 | `G36` | Origine de l'eau | Eau potable · Eau de pluie · Eau souterraine · Eau grise · écrire toutes les eaux utilisées en cas de possibilité de changement |
| WC1 | `G39` | Ventilation ? | pas de ventilation · en continu · intermittente · à détection · indépendante du reste du bâtiment |
| WC1 | `G42` | Test de la feuille de papier sur la bouche d'extraction | Feuille aspirée · Feuille repoussée · Rien ne se passe |
| WC1 | `G45` | Dysfonctionnements | Fuite de la chasse · Bouton chasse cassé ou bloqué · Bruits de la chasse en continu · Entartrage · Odeurs · WC bouché |
| WC1 | `K45` | Disponibilité d'un local à proximité | non · oui à côté · derrière un des murs · oui à l'aplomb aux étages inférieurs |
| Appareils de lavage | `G15` | Type | lave linge · lave vaisselle · autolaveuse · lavage du sol manuel |
| Appareils de lavage | `M19` | Utilisations | domestique · collectif · professionnel |
| Appareils de lavage | `M22` | Classe énergétique (si visible) | A · B · C · D · E · F · G |
| Appareils de lavage | `M25` | Type de textiles | à cocher (plusieurs réponses possibles) : · vêtements quotidien mixte (coton, mélange, soie, laine, synthétique) · vêtements de sport (synthétique) · vêtements laine · textile hébergement (literie, peignoirs, serviette) · textile ameublement (rideaux, housse) · textile de restauration (nappes, torchons, serviettes de table) · textile médical (tenues, draps) · textile de nettoyage (franges, chiffons, microfibres) · vêtements professionnels très sales · textiles à risques infectieux |
| Appareils de lavage | `F28` | Type d'alimentation en eau | EF seul · EF + ECS · Eau de pluie |
| Appareils de lavage | `F31` | Taux de remplissage | peu rempli · semi-rempli · plein |
| Appareils de lavage | `M44` | Utilisations | domestique · collectif · professionnel |
| Appareils de lavage | `F50` | Type de chargement | frontal · à capot · à avancement automatique · à convoyeur/tunnel |
| Appareils de lavage | `I50` | Type d'alimentation en eau | EF seul · ECS seul · EF + ECS |
| Appareils de lavage | `M70` | Utilisations | nettoyage ponctuel · nettoyage régulier · nettoyage quotidien |
| Appareils de lavage | `I73` | Type d'autolaveuse | autotractée · autoportée · industrielle |
| Appareils de lavage | `F76` | Type d'alimentation électrique | sur batterie · câble d'alimentation |
| Appareils de lavage | `I76` | Type de brosses | disque · rouleau · autre |
| Appareils de lavage | `K88` | Personnel formé | Oui · Non |
| Appareils de lavage | `F108` | Type de surface | carrelage (grès, faïence) · pierre (marbre, granit, travertin) · résine époxy / polyuréthane · béton ciré · béton brut · parquet massif · parquet contrecollé · bois stratifié · Linoléum · PVC / vinyle · Moquette en rouleau · dalles de moquette · autre |
| Appareils de lavage | `L108` | Type de matériel de lavage | balai serpillère à franges (ou balai espagnol) · balai à plat classique · balai à plat avec microfibres pré-imprégnées · balai à plat avec microfibre jetables · balai brosse · balai avec réservoir (spray mop) · Nettoyeur haute-pression (Karcher) · balais à vapeur · Nettoyage au jet · autre |
| Appareils de lavage | `F123` | Rinçage du sol | pas de rinçage · rinçage systématique · rinçage ponctuel |
| Appareils de lavage | `I123` | Un protocole de lavage écrit est communiqué au salarié ? | Oui · Non |
| Appareils de lavage | `K123` | Personnel formé | Oui · Non |
| Structure1 | `F8` | Type de la structure | Structure du bâtiment et réseaux · Espace technique aménageable · Ouvrir la suite en fonction du choix |
| Structure1 | `F19` | Type de planchers | dalle béton · dalle poutrelle/hourdis · bois · plancher surélevé · dalle structurelle · plots · dalle amovibles · planchers chauffants |
| Structure1 | `F25` | Présence de gaines techniques ? | aucune · horizontales · verticales |
| Structure1 | `K25` | Type de cloisons | légère sur ossature (placo) · maçonnée (brique, parpaing, carreau de plâtre) · alvéolaire (prêtes à poser) · techniques (coupe-feu, acoustique renforcé, hydrofuge) · vitrées · démontable/modulaire · bois |
| Structure1 | `F28` | Présence de colonnes de chute séparées pour les eaux grises ? | oui · non |
| Structure1 | `K28` | Présence d'une évacuation séparée des eaux de lavage, de process et autres ? | Oui · Non |
| Structure1 | `F31` | Présence de Té de visite à intervalles réguliers sur le réseau de collecte | oui · non |
| Structure1 | `K31` | Accessibilité du réseau de collecte (gaine technique, faux-plafond, etc.) | Oui · Non |
| Structure1 | `F34` | — | oui · non |
| Structure1 | `K34` | Le réseau d'eau potable actuel passe actuellement dans | des faux-plafonds · des gaines techniques · des vides sanitaires · des trémies · en apparent |
| Structure1 | `F45` | Présence d'un local technique ou sous-sol aménageable ? | oui/non · si oui afficher les questions suivantes |
| Structure1 | `K45` | Un camion de livraison de cuve et de vidange peut-il se garer à côté de cet espace ? | oui · non |
| Structure1 | `K51` | Cet espace technique est-il accessible aux engins de livraison de cuve et de vidange ? | oui · non |
| Structure1 | `F54` | Cet espace est-il équipé d'un alimentation électrique ? | oui · non |
| Structure1 | `K54` | L'espace est-il ventilé ? | oui · non |
| Structure1 | `F57` | Le réseau 4G/5G est-il disponible dans cet espace ? | oui · non |
| Structure1 | `K57` | Un système de relevage est il obligatoire entre la collecte et l'espace de stockage ? | oui · non |
| Structure1 | `F60` | Cet espace est-il équipé d'un siphon de sol pour faciliter le nettoyage (débordements) ? | oui · non |
| Structure1 | `K60` | Un by-pass vers le réseau d'eaux usées est-il possible ? | oui · non |
| Structure1 | `F63` | Cet espace est-il protégé du gel ? | oui · non |
| Structure1 | `K63` | Cet espace est-il équipé d'un point d'eau potable ? | oui · non |
| Structure1 | `F66` | — | oui · non |
| Structure1 | `K66` | Cet espace est-il ouvert au public ? | oui · non |
| Structure1 | `K69` | Le local est-il éloigné de la verticale des toilettes présente dans les étages ? | oui · non |
| Ventilation1 | `B11` | Système de ventilation | insuflation · ventilation naturelle · VMC simple flux autoréglable · VMC simple flux hygroréglable · VMC double flux · CTA simple flux · CTA double flux · Ne sait pas · Autre |
| Ventilation1 | `H27` | Système en fonctionnement le jour de l'audit | O · N |
| Incendie | `F16` | Présence de RIA (Robinets d'Incendie Armés) ? | oui · non |
| Incendie | `K16` | Présence de sprinkler ? | Oui · Non |
| Incendie | `F19` | Présence d'un sous-compteur sur le réseau incendie ? | oui · non |
| Incendie | `K19` | Présence d'une réservie incendie ? | Oui · Non |
| Incendie | `K22` | Type d'eau réserve incendie | eau potable · eau de pluie · eau pluviale |
| Incendie | `K25` | Fréquence des tests | hebdomadaire · mensuelle · semestriel · annuelle |
| Incendie | `F31` | Présence de purges régulièrs du réseau incendie? | Oui · Non |
| Incendie | `K31` | Fréquence des purges | hebdomadaire · mensuelle · semestrielle · biannuelle · annuelle |
| Incendie | `K34` | Destination des eaux de tests/purges | rejet au réseau d'assainissement · rejet au réseau pluvial · infiltration à la parcelle |
| Incendie | `F37` | Présence d'un carnet de suivi des tests/purges ? | Oui · Non |
| Toiture1 | `G16` | Toiture accessible ? | Oui · Non |
| Toiture1 | `J16` | Type de toiture | terrasse · pente · multiple pans |
| Toiture1 | `G19` | Matériaux de couverture | tuiles terre cuite · ardoises · bac acier · zinc · aluminium · membrane bitumineuse · PVC/EPDM · fibrociment |
| Toiture1 | `G25` | Si fibrociment, présence d'amiante ? | O · N |
| Toiture1 | `J25` | Présence de plomb ou métaux lourds | Oui · Non |
| Toiture1 | `L25` | Présence de traitement (hydrofuge, biocide, cool roof) | oui · non |
| Toiture1 | `G31` | Arbres à proximité pouvant apporter des feuilles ? | Oui · Non |
| Toiture1 | `J31` | Sources de pollution à proximité (axe routier, industries, cheminées, port, etc.) | oui · non |
| Toiture1 | `G35` | Type de gouttières | pendante · nantaise · havraise · anglaise |
| Toiture1 | `J35` | Type de cheneau | encaissé · posé · rampant · noue |
| Toiture1 | `N35` | Matériau | PVC · Zinc · aluminium · acier galvanisé · fonte · cuivre |
| Toiture1 | `I41` | Accessibilité des gouttières pour entretien | oui · non |
| Toiture1 | `G45` | Type de descentes | apparente (façade) · encastrée (mur ou gaine technique) |
| Toiture1 | `N45` | Matériau | PVC · Zinc · aluminium · acier galvanisé · fonte · cuivre |
| Toiture1 | `F55` | Présence de regards accessibles en pied de descente | Oui · Non |
| Toiture1 | `K55` | Présence d'avaloirs en pied de descente | Oui · Non |
| Toiture1 | `F58` | Les évacuations des descentes se regoupent-elles en un seul point ? | Oui · Non |
| Toiture1 | `L58` | Présence d'une grille ou crapaudine sur les gouttières | Oui · Non |
| Toiture1 | `I61` | Dispositif de prétraitement existant | aucun · séparateur premières pluies · filtre sur descente · filtre au sein d'un regard |
| Toiture1 | `I64` | Evacuation actuelle des eaux de pluie | réseau séparatif pluvial · réseau unitaire · rejet en surface · rejet dans un fossé · noue d'infiltration · puits d'infiltrtion · bassin · autre |
| Liste Piscines | `E27` | Type | passif · à renouvellement continu · avec rampes de lavage · avec injection automatique de désinfectant |
| Liste Piscines | `I41` | Mode de nettoyage | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| Liste Piscines | `F44` | Utlisation d'eau NC | O · N |
| Bassin1 | `N8` | Emplacement | Intérieure · Extérieure · Extérieure avec possibilté d'être couverte |
| Bassin1 | `G14` | Type | Enterré · Semi-enterrée · Hors sol avec structure · Hors sol tubulaire · Hors sol autoportée |
| Bassin1 | `N14` | Matériaux de revêtement | Carrelage · Résine · Liner · Coque · Plaques aluminium |
| Bassin1 | `G17` | Type de couverture | bâches à bulles (été) · bâche d'hivernage · couverture à barres (4saisons) · volet roulant automatique · volet roulant manuel · abri · terrasse mobile · autre précisé dans remarques |
| Bassin1 | `G20` | Présence connue de fuites | O · N |
| Bassin1 | `G23` | Etat général* | Bon · Moyen · Mauvais |
| Bassin1 | `N26` | Mode de remplissage du bassin | manuel · automatique avec flotteur |
| Bassin1 | `F29` | Origine eau du bassin | eau potable · eau de mer · eau souterraine · eau de pluie · eau pluviale · eau de surface |
| Bassin1 | `L32` | Traitements automatisé | O · N |
| Bassin1 | `F38` | Possibilité de créer une zone de stockage des eaux rejetées | O · N · existe déjà |
| Liste Extérieur | `G11` | Fonctions de l'eau sur ces espaces | arrosage · arrosage et nettoyage · arrosage et autre · nettoyage · nettoyage et autre · autre · arrosage · nettoyage et autre |
| Extérieur1 | `N15` | Type de gestion des eaux pluviales (ruissellement) | aucune (ruissellement libre) · infiltration à la parcelle directe · stockage + infiltraion à la parcelle · stockage + réutilisation · rejet au réseau pluvial enterré · rejet au réseau unitaire enterré · rejet vers le milieu superficiel (fossé, cours d'eau) |
| Extérieur1 | `J22` | Possibilité de rediriger ces eaux pour infiltration sur la parcelle | O · N |
| Extérieur1 | `J25` | Possibilité de rediriger ces eaux pour stockage sur la parcelle | O · N |
| Extérieur1 | `G35` | Exposition de la parcelle | Ensoleillée · Ombragée · Mi-ombragée |
| Extérieur1 | `J35` | Pente de la parcelle | nulle · faible · moyenne · forte |
| Extérieur1 | `M35` | Présence de paillage | O · N |
| Extérieur1 | `G38` | Mode d'arrosage | Tuyau manuel · Arrosoir · Oyas · Micro asperseur · Arrosage goutte à goutte · Arrosage tuyaux poreux · Tuyères · Arrosage non sélectif · Autre |
| Extérieur1 | `J38` | Pilotage de l'arrosage | Manuel · En fonction de la météo · Horloge · Sonde humidité · Connecté |
| Extérieur1 | `G41` | Signes de surarrosage | aucun · ruissellement · flaques · mousse · sol détrempé |
| Extérieur1 | `J41` | Signes de sous-arrosage | aucun · végétaux stressés · zones sèches · jaunissement |
| Extérieur1 | `N41` | Période d'arrosage dans la journée | Matin · Soir · En pleine journée |
| Extérieur1 | `F44` | Origine eau pour l'arrosage | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| Extérieur1 | `J57` | Mode de nettoyage | auto laveuse · nettoyeur haute pression · tuyaux simple · autre |
| Extérieur1 | `N57` | Motif du nettoyage | esthétique · hygiène · sécurité · entretien · autre |
| Extérieur1 | `F63` | Origine eau pour le nettoyage | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| Extérieur1 | `F79` | Origine eau | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| Opportunités1 | `G17` | Utilisations extérieures potentielles | arrosage · nettoyage surface · nettoyage véhicule · bassin · fontaine · piscine · autre |
| Opportunités1 | `J17` | Utilisations intérieures potentielles | chasse d'eau · lavage de sol · lavage de linge · process technique · autre |
| Opportunités1 | `F20` | Possibilité d'implanter une cuve sur la parcelle ? | Non · Entérée · Aérienne |
| Opportunités1 | `K20` | Espace disponible pour une cuve en toiture ? | Oui · Non |
| Opportunités1 | `F26` | Accès possible aux engins et camion de livraison de cuve | Oui · Non |
| Opportunités1 | `K26` | By-pass possible de la cuve vers une aire d'infiltration ou le réseau pluvial | Oui · Non |
| Opportunités1 | `F29` | Quel est le potentiel technique de réutilisation de l'eau de pluie sur ce bâtiment ? | fort · moyen · faible · à aproffondir |
| Opportunités1 | `K37` | L'évacuation du lave-linge peut elle être dissociée des autres évacuations d'eaux grises ? | Oui · Non |
| Opportunités1 | `G46` | Utilisations extérieures potentielles | arrosage · nettoyage surface · nettoyage véhicule · bassin · fontaine · autre |
| Opportunités1 | `J46` | Utilisations intérieures potentielles | chasse d'eau · lavage de sol · process · tours de refroidissement · autre |
| Opportunités1 | `F49` | Est-ce que le bâtiment est innocupé pendant de longue période (>3 semaines) ? | oui · non |
| Opportunités1 | `F52` | Quel est le potentiel technique de recyclage des eaux ménagères sur ce bâtiment ? | fort · moyen · faible · à aproffondir |
| Opportunités1 | `F60` | Valorisation des nutriments sur place intéressante (espaces verts, potager, etc.) ? | oui · non |
| Opportunités1 | `K60` | Valorisation des nutriments sur place intéressante (espaces verts, potager, etc.) ? | faible · moyen · élevé |
| Opportunités1 | `F63` | Quel est le potentiel technique de collecte des urines dans ce bâtiment ? | fort · moyen · faible · à aproffondir |
| Opportunités1 | `K63` | Quel est le potentiel technique de collecte des urines dans ce bâtiment ? | Oui · Non |
| Autre1 | `F8` | Choix | ouvrant les champs à la suite en question : · Autre information · Autre utilisation de l'eau |

## Divergences à arbitrer

Un même libellé de champ apparaît parfois à plusieurs endroits du classeur — sur plusieurs onglets, ou plusieurs fois sur le même onglet quand une page a des sections répétées (ex. « Opportunités1 » traite successivement l'eau de pluie et les eaux ménagères) — avec des jeux d'options qui ne concordent pas toujours. Ces écarts sont signalés plutôt qu'arbitrés : trancher revient à choisir quelle saisie de terrain future sera acceptée, ce qui dépasse une régénération mécanique.

### Type

- **Compteur général** `H17` — Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu
- **Sous-compteur1** `F18` — Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu
- **Réducteur de pression1** `F19` — Réducteur de pression à membrane · Réducteur de pression à piston · Réducteur de pression à cartouche · Inconnu
- **Robinets** `F21` — Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique
- **Douche-baignoire1** `E78` — Simple EF · Simple ECS · Mélangeur · Mitigeur classique · Mitigeur thermostatique
- **Appareils de lavage** `G15` — lave linge · lave vaisselle · autolaveuse · lavage du sol manuel
- **Liste Piscines** `E27` — passif · à renouvellement continu · avec rampes de lavage · avec injection automatique de désinfectant
- **Bassin1** `G14` — Enterré · Semi-enterrée · Hors sol avec structure · Hors sol tubulaire · Hors sol autoportée

### Utilisations

- **Appareils de lavage** `M19` — domestique · collectif · professionnel
- **Appareils de lavage** `M44` — domestique · collectif · professionnel
- **Appareils de lavage** `M70` — nettoyage ponctuel · nettoyage régulier · nettoyage quotidien

### Type d'alimentation en eau

- **Appareils de lavage** `F28` — EF seul · EF + ECS · Eau de pluie
- **Appareils de lavage** `I50` — EF seul · ECS seul · EF + ECS

### Utilisations extérieures potentielles

- **Opportunités1** `G17` — arrosage · nettoyage surface · nettoyage véhicule · bassin · fontaine · piscine · autre
- **Opportunités1** `G46` — arrosage · nettoyage surface · nettoyage véhicule · bassin · fontaine · autre

### Utilisations intérieures potentielles

- **Opportunités1** `J17` — chasse d'eau · lavage de sol · lavage de linge · process technique · autre
- **Opportunités1** `J46` — chasse d'eau · lavage de sol · process · tours de refroidissement · autre

### Valorisation des nutriments sur place intéressante (espaces verts, potager, etc.) ?

- **Opportunités1** `F60` — oui · non
- **Opportunités1** `K60` — faible · moyen · élevé

### Quel est le potentiel technique de collecte des urines dans ce bâtiment ?

- **Opportunités1** `F63` — fort · moyen · faible · à aproffondir
- **Opportunités1** `K63` — Oui · Non

