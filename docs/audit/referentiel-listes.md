# Référentiel des listes de valeurs

⚠️ **Fichier généré** par `node tools/gen-referentiel.js`, à partir de
`src/app/models/audit-schema.ts`. Ne pas l’éditer à la main.

144 champ(s) à choix, dont 63 adossés à une constante partagée de `value-lists.ts` et 81 avec une liste propre.

## Constantes partagées

| Constante | Valeurs | Champs qui l’emploient |
|---|---|---|
| `TYPE_COMPTEUR` | 9 | `Compteur général!H14`, `Sous-compteur1!F18` |
| `CLASSE_METROLOGIQUE` | 19 | `Compteur général!L14`, `Sous-compteur1!J18` |
| `TYPE_ROBINET` | 5 | `Robinets!F24`, `Douche-baignoire1!E105` |
| `COMMANDE_ROBINET` | 4 | `Robinets!K24` |
| `TEMPORISATION` | 3 | `Robinets!F27`, `Douche-baignoire1!E108` |
| `UTILISATION_ROBINET` | 16 | `Robinets!F15`, `Robinets!I15`, `Robinets!L15` |
| `MATERIAU_TUYAU` | 7 | `Robinets!K30`, `Douche-baignoire1!I114` |
| `TYPE_EQUIPEMENT_DOUCHE` | 2 | `Douche-baignoire1!G8` |
| `JETS_EMETTEUR` | 7 | `Douche-baignoire1!I28`, `Douche-baignoire1!I72` |
| `TYPE_WC` | 15 | `WC1!F18` |
| `COMMANDE_CHASSE` | 8 | `WC1!F36` |
| `EMPLACEMENT_BASSIN` | 3 | `Bassin1!K8` |
| `MODE_NETTOYAGE` | 4 | `Extérieur1!I54`, `Liste Piscines!H41` |
| `MODE_ARROSAGE` | 9 | `Extérieur1!F41` |
| `USAGE_APPAREIL_LAVAGE` | 3 | `Appareils de lavage!E19`, `Appareils de lavage!E50` |
| `EXIGENCE_PROPRETE` | 4 | `Appareils de lavage!K97`, `Appareils de lavage!J141` |
| `MATERIAU_GOUTTIERE` | 10 | `Toiture1!L35`, `Toiture1!L45` |
| `CHEMINEMENT_RESEAU` | 7 | `Structure1!F28`, `Structure1!F37` |
| `POTENTIEL_TECHNIQUE` | 4 | `Opportunités1!F27`, `Opportunités1!F54`, `Opportunités1!F69` |
| `ETAT_GENERAL` | 3 | `Compteur général!L29`, `Compteur général!H53`, `Surpresseur1 (V2, champs figés)`, `Sous-compteur1!J30`, `Réseaux ECS!F41`, `Production Stockage ECS!F42`, `Production Stockage ECS!F65`, `Production Stockage ECS!F82`, `Robinets!F51`, `Douche-baignoire1!E53`, `Douche-baignoire1!E92`, `Douche-baignoire1!E117`, `WC1!F51`, `Appareils de lavage!E37`, `Appareils de lavage!E68`, `Appareils de lavage!E115`, `Appareils de lavage!E153`, `Bassin1!L32` |
| `OUI_NON_NSP` | 3 | `Réseaux ECS!F29`, `Réseaux ECS!F38`, `Réseaux ECS!F51`, `Réseaux ECS!F87`, `Réseaux ECS!F90`, `Réseaux ECS!F101`, `Réseaux ECS!F108`, `Réseaux ECS!F111`, `Production Stockage ECS!F79`, `Production Stockage ECS!F98`, `Production Stockage ECS!F101` |

## Divergences internes au classeur

10 libellé(s) portent des valeurs différentes selon l’endroit. Ce sont des arbitrages à remonter au Cerema, pas des défauts de transcription.

### Type

- `Compteur général!H14` (releve_compteur_general) — `L.TYPE_COMPTEUR`
- `Sous-compteur1!F18` (sous_compteurs) — `L.TYPE_COMPTEUR`
- `Production Stockage ECS!F27` (production_stockage_ecs) — « Chauffage + ECS », « ECS seule », « Ne sait pas »
- `Douche-baignoire1!E105` (douches_baignoires) — `L.TYPE_ROBINET`
- `Appareils de lavage!E8` (appareils_lavage) — « lave linge », « lave vaisselle », « autolaveuse », « lavage du sol manuel »
- `Bassin1!F14` (piscines) — « Enterré », « Semi-enterrée », « Hors sol avec structure », « Hors sol tubulaire », « Hors sol autoportée »
- `Liste Piscines!E27` (zone_piscine) — « passif », « à renouvellement continu », « avec rampes de lavage », « avec injection automatique de désinfectant »
- `Structure1!I8` (structure) — « Structure et réseaux », « Espace technique aménageable », « Ouvrir la suite en fonction du choix »

### Commande du robinet

- `Robinets!K24` (robinets) — `L.COMMANDE_ROBINET`
- `Douche-baignoire1!I105` (douches_baignoires) — « manuelle », « à détection de présence », « à effleurement », « à détection RFID »

### Type d'emetteur

- `Douche-baignoire1!E28` (douches_baignoires) — « tête de douche », « ciel de pluie », « pommeau », « colonne hydromassante », « cascade », « Autre »
- `Douche-baignoire1!E72` (douches_baignoires) — « Robinet seul », « Robinet + pommeau », « Pommeau seul », « Robinet + colonne de douche », « Robinet + buses hydromassante »

### Utilisateurs

- `WC1!F15` (wc) — « Public extérieur », « Personnel », « Autres adultes », « Enfants », « Adolescents », « Personnes âgées », « PMR »
- `Bassin1!K11` (piscines) — « Tout public », « Adultes », « Enfants », « Adolescents », « Personnes âgées », « Patients »

### Origine de l'eau

- `WC1!J36` (wc) — « Eau potable », « Eau de pluie », « Eau forage brute », « Eau grise »
- `Extérieur1!F60` (espace_vert_exterieur) — « eau potable », « eau de pluie », « eau pluviale », « eau grise », « eau souterraine »
- `Liste Piscines!E30` (zone_piscine) — « eau potable », « eau de mer », « eau souterraine », « eau de pluie », « eau pluviale », « eau de surface »

### Utilisations

- `Appareils de lavage!E19` (appareils_lavage) — `L.USAGE_APPAREIL_LAVAGE`
- `Appareils de lavage!E50` (appareils_lavage) — `L.USAGE_APPAREIL_LAVAGE`
- `Appareils de lavage!E82` (appareils_lavage) — « interne », « prestataire externe »

### Type d'alimentation en eau

- `Appareils de lavage!K31` (appareils_lavage) — « EF seul », « EF + ECS », « Eau de pluie »
- `Appareils de lavage!K62` (appareils_lavage) — « EF seul », « ECS seul », « EF + ECS »

### Type de zone lavée

- `Appareils de lavage!K94` (appareils_lavage) — « bureaux », « sanitaire », « salle de cours », « cuisine », « espace de restauration », « zone technique (garage, atelier, etc.) », « zone sportive », « circulation du publique »
- `Appareils de lavage!E138` (appareils_lavage) — « logement », « bureaux », « sanitaire », « salle de cours », « cuisine », « espace de restauration », « zone technique (garage, atelier, etc.) », « zone sportive », « circulation du publique »

### Utilisations extérieures potentielles

- `Opportunités1!F15` (opportunites) — « arrosage », « nettoyage surface », « lavage de véhicule », « bassin », « fontaine », « piscine », « autre »
- `Opportunités1!F48` (opportunites) — « arrosage », « nettoyage surface », « lavage de véhicule », « bassin », « fontaine », « autre »

### Utilisations intérieures potentielles

- `Opportunités1!I15` (opportunites) — « chasse d'eau », « lavage de sol », « lavage de linge », « process technique », « autre »
- `Opportunités1!I48` (opportunites) — « chasse d'eau », « lavage de sol », « process », « tours de refroidissement », « autre »


## Listes propres à un seul champ

| Cellule | Champ | Valeurs |
|---|---|---|
| `Réseaux ECS!F35` | Matériaux de l'isolant | laine de verre · laine de roche · papier et platre · polyruéthane · Mousse synthétique (armaflex,PE…) |
| `Réseaux ECS!F70` | Mode de fonctionnement du circulateur | continu · horloge programmable · piloté par la température · aquastat · GTB · GTC |
| `Réseaux ECS!F84` | Présence d'une ou plusieurs vanne(s) thermostatique | manuelle · motorisée · non · ne sait pas |
| `Production Stockage ECS!F27` | Type | Chauffage + ECS · ECS seule · Ne sait pas |
| `Production Stockage ECS!F30` | Systèmes de production | Chauffe-eau gaz instantané · Accumulateur gaz · Chaudière · Ballon électrique · Chauffe-eau électrique · Chauffe-eau solaire thermique · Solaire photovoltaïque · Système solaire combiné chauffage + ECS · Chauffe-eau thermodynamique individuel (ie PAC) · PAC (indiviuuelle ou collective) · Module thermique d'appartements (MTA) · Kit robinetterie avec module chaufffant · Autre (préciser dans remarques) · Ne sait pas |
| `Production Stockage ECS!F33` | Combustible | gaz · fioul · bois · biomasse · réseau de chaleur urbain · ne sait pas · autre |
| `Production Stockage ECS!F39` | Régulation / pilotage de la production | Pas de pilotage · Pilotage par la température · Pilotage par horloge programmable · Pilotage horaire et température · Pilotage par GTB/GTC · Pilotage intelligent · Ne sait pas · Autre |
| `Production Stockage ECS!F62` | Montage des ballons | série · parallèle · ne sait pas |
| `Douche-baignoire1!E25` | Type de sol | receveur · à l'italienne carrellée · à l'italienne pierre naturelle · chape béton étanche |
| `Douche-baignoire1!E28` | Type d'emetteur | tête de douche · ciel de pluie · pommeau · colonne hydromassante · cascade · Autre |
| `Douche-baignoire1!E66` | Type de baignoire | sur pied · autoportante · encastrée · sabot · îlot · autre |
| `Douche-baignoire1!E72` | Type d'émetteur | Robinet seul · Robinet + pommeau · Pommeau seul · Robinet + colonne de douche · Robinet + buses hydromassante |
| `Douche-baignoire1!I105` | Commande du robinet | manuelle · à détection de présence · à effleurement · à détection RFID |
| `WC1!F15` | Utilisateurs | Public extérieur · Personnel · Autres adultes · Enfants · Adolescents · Personnes âgées · PMR |
| `WC1!J15` | Mixte ou genré ? | Homme · Femme · Mixte |
| `WC1!F33` | Type de chasse | Réservoir apparent · Réservoir encastré · Sans réservoir · Non concerné |
| `WC1!J36` | Origine de l'eau | Eau potable · Eau de pluie · Eau forage brute · Eau grise |
| `WC1!F39` | Volume chasse estimé ou connu | <3 · 2/4 · 3/6 · 6/9 · 6 · 9 · >9 · Inconnu · Non concerné |
| `WC1!F42` | Teste de la feuille de papier toilette dans la cuvette | feuille mouillée - fuite observée · feuille semi-mouillée - fuite suspectée · feuille sèche - pas de fuite |
| `WC1!F45` | Ventilation | pas de ventilation · en continu · intermittente · à détection · indépendante du reste du bâtiment |
| `WC1!J45` | Test de la feuille de papier sur la bouche d'extraction | Feuille aspirée · Feuille repoussée · Rien ne se passe |
| `WC1!F48` | Est-ce que les toilettes ont un mur qui donne sur l'extérieur (sur la parcelle du bâtiment uniquement) ? | non · oui · oui toutes · oui certaines |
| `WC1!J48` | Disponibilité d'un local à proximité pour accueillir un composteur | non · oui à côté · derrière un des murs · oui à l'aplomb aux étages inférieurs |
| `WC1!F54` | Dysfonctionnements observés | Fuite de la chasse · Traces de fuite · Bruits de la chasse en continu · Entartrage · Odeurs · WC bouché · Lunette cassée |
| `Appareils de lavage!E8` | Type | lave linge · lave vaisselle · autolaveuse · lavage du sol manuel |
| `Appareils de lavage!E22` | Taux de remplissage | peu rempli · semi-rempli · plein |
| `Appareils de lavage!K28` | Classe énergétique | A · B · C · D · E · F · G |
| `Appareils de lavage!K31` | Type d'alimentation en eau | EF seul · EF + ECS · Eau de pluie |
| `Appareils de lavage!K34` | Type de textiles lavés | à cocher (plusieurs réponses possibles) : · vêtements quotidien mixte (coton, mélange, soie, laine, synthétique) · vêtements de sport (synthétique) · vêtements laine · textile hébergement (literie, peignoirs, serviette) · textile ameublement (rideaux, housse) · textile de restauration (nappes, torchons, serviettes de table) · textile médical (tenues, draps) · textile de nettoyage (franges, chiffons, microfibres) · vêtements professionnels très sales · textiles à risques infectieux |
| `Appareils de lavage!K59` | Type de chargement | frontal · à capot · à avancement automatique · à convoyeur/tunnel |
| `Appareils de lavage!K62` | Type d'alimentation en eau | EF seul · ECS seul · EF + ECS |
| `Appareils de lavage!E82` | Utilisations | interne · prestataire externe |
| `Appareils de lavage!K94` | Type de zone lavée | bureaux · sanitaire · salle de cours · cuisine · espace de restauration · zone technique (garage, atelier, etc.) · zone sportive · circulation du publique |
| `Appareils de lavage!E100` | Type d'autolaveuse | autotractée · autoportée · industrielle |
| `Appareils de lavage!J100` | Type de brosses | disque · rouleau · autre |
| `Appareils de lavage!J103` | Largeur de travail | <40cm · 40-70cm · 70cm |
| `Appareils de lavage!J106` | Type d'alimentation électrique | sur batterie · câble d'alimentation |
| `Appareils de lavage!E129` | Type de matériel de lavage | balai serpillère à franges (ou balai espagnol) · balai à plat classique · balai à plat avec microfibres pré-imprégnées · balai à plat avec microfibre jetables · balai brosse · balai avec réservoir (spray mop) · Nettoyeur haute-pression (Karcher) · balais à vapeur · Nettoyage au jet · autre |
| `Appareils de lavage!E138` | Type de zone lavée | logement · bureaux · sanitaire · salle de cours · cuisine · espace de restauration · zone technique (garage, atelier, etc.) · zone sportive · circulation du publique |
| `Appareils de lavage!H138` | Type de surface | carrelage (grès, faïence) · pierre (marbre, granit, travertin) · résine époxy / polyuréthane · béton ciré · béton brut · parquet massif · parquet contrecollé · bois stratifié · Linoléum · PVC / vinyle · Moquette en rouleau · dalles de moquette · autre |
| `Appareils de lavage!E150` | Rinçage du sol | pas de rinçage · rinçage systématique · rinçage ponctuel |
| `Incendie!K22` | Type d'eau de la réserve incendie | eau potable · eau de pluie · eau pluviale · mare |
| `Incendie!K28` | Fréquence des tests | hebdomadaire · mensuelle · semestriel · annuelle |
| `Incendie!K34` | Fréquence des purges | hebdomadaire · mensuelle · semestrielle · biannuelle · annuelle · autre |
| `Incendie!K37` | Destination des eaux de tests/purges | rejet au réseau d'assainissement · rejet au réseau pluvial · infiltration à la parcelle |
| `Extérieur1!F38` | Exposition de la parcelle | Ensoleillée · Ombragée · Mi-ombragée |
| `Extérieur1!I38` | Pente de la parcelle | nulle · faible · moyenne · forte |
| `Extérieur1!N38` | Type de paillage | broyat · minéral · copeaux · paille · autre |
| `Extérieur1!I41` | Pilotage de l'arrosage | Manuel · En fonction de la météo · Horloge · Sonde humidité · Connecté |
| `Extérieur1!L41` | Période d'arrosage dans la journée | Matin · Soir · En pleine journée |
| `Extérieur1!F44` | Origine eau pour l'arrosage | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine · eau de surface |
| `Extérieur1!L54` | Motif du nettoyage | esthétique · hygiène · sécurité · entretien · autre |
| `Extérieur1!F60` | Origine de l'eau | eau potable · eau de pluie · eau pluviale · eau grise · eau souterraine |
| `Bassin1!K11` | Utilisateurs | Tout public · Adultes · Enfants · Adolescents · Personnes âgées · Patients |
| `Bassin1!F14` | Type | Enterré · Semi-enterrée · Hors sol avec structure · Hors sol tubulaire · Hors sol autoportée |
| `Bassin1!M14` | Matériaux de revêtement | Carrelage · Résine · Liner · Coque · Plaques aluminium · autre |
| `Bassin1!F17` | Type de couverture | aucune · bâches à bulles (été) · bâche d'hivernage · couverture à barres (4saisons) · volet roulant automatique · volet roulant manuel · abri · terrasse mobile · autre précisé dans remarques |
| `Bassin1!K17` | Origine eau du bassin | eau potable · eau de mer · eau souterraine · eau de pluie · eau pluviale · eau de surface |
| `Bassin1!M17` | Mode de remplissage du bassin | manuel · automatique avec flotteur |
| `Liste Piscines!E27` | Type | passif · à renouvellement continu · avec rampes de lavage · avec injection automatique de désinfectant |
| `Liste Piscines!E30` | Origine de l'eau | eau potable · eau de mer · eau souterraine · eau de pluie · eau pluviale · eau de surface |
| `Liste Piscines!E44` | Eau utilisée pour le lavage | eau potable · eau de mer · eau souterraine · eau de pluie · eau pluviale · eau de surface |
| `Toiture1!I16` | Type de toiture | terrasse · pente · multiple pans |
| `Toiture1!F19` | Matériau de couverture | tuiles terre cuite · tuiles béton · ardoises · bac acier · zinc · aluminium · membrane bitumineuse · PVC/EPDM · fibrociment · toiture végétalisée · chaume · verre/vitre · polycarbonate · gravier |
| `Toiture1!F35` | Type de gouttières | pendante · nantaise · havraise · anglaise |
| `Toiture1!F45` | Type de cheneaux | sur un versant · contre un mur · sur entablement · entre deux pans de toiture |
| `Toiture1!F60` | Type de descentes | apparente (façade) · encastrée (mur ou gaine technique) |
| `Toiture1!L60` | Matériau | PVC · Zinc · aluminium · acier galvanisé · fonte · cuivre |
| `Toiture1!F76` | Dispositif de prétraitement existant | aucun · séparateur premières pluies · filtre sur descente · filtre au sein d'un regard |
| `Toiture1!F79` | Evacuation actuelle des eaux de pluie | réseau séparatif pluvial · réseau unitaire · rejet en surface · rejet dans un fossé · noue d'infiltration · puits d'infiltrtion · bassin · autre |
| `Structure1!I8` | Type | Structure et réseaux · Espace technique aménageable · Ouvrir la suite en fonction du choix |
| `Structure1!F19` | Type de planchers | dalle béton · dalle poutrelle/hourdis · bois · plancher surélevé · dalle structurelle · plots · dalle amovibles · planchers chauffants |
| `Structure1!F25` | Type de cloisons | légère sur ossature (placo) · maçonnée (brique, parpaing, carreau de plâtre) · alvéolaire (prêtes à poser) · techniques (coupe-feu, acoustique renforcé, hydrofuge) · vitrées · démontable/modulaire · bois |
| `Structure1!F42` | Présence d'un local technique ou sous-sol aménageable ? | oui · oui si on réorganise les espaces · oui avec réserve · non |
| `Opportunités1!F15` | Utilisations extérieures potentielles | arrosage · nettoyage surface · lavage de véhicule · bassin · fontaine · piscine · autre |
| `Opportunités1!I15` | Utilisations intérieures potentielles | chasse d'eau · lavage de sol · lavage de linge · process technique · autre |
| `Opportunités1!F18` | Possibilité d'implanter une ou plusieurs cuves sur la parcelle ? | Non · Entérée · Aérienne |
| `Opportunités1!F48` | Utilisations extérieures potentielles | arrosage · nettoyage surface · lavage de véhicule · bassin · fontaine · autre |
| `Opportunités1!I48` | Utilisations intérieures potentielles | chasse d'eau · lavage de sol · process · tours de refroidissement · autre |
| `Opportunités1!K63` | La majorité des toilettes sont-elles positionnées les unes au-dessus des autres dans le bâtiment ? | non · oui toutes les toilettes · oui certaines toilettes |
| `Opportunités1!K66` | A première vue, quel est la taille du gisement urine estimé (nombre de passage dans les toilettes) ? | faible · moyen · élevé · ne sait pas |
