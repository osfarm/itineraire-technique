# Projet TIKA - Visualisation d'itineraires techniques

Les itinéraires techniques désignent l'ensemble des interventions qui sont opérées sur une parcelle donnée, de la préparation du sol à la récolte. Les itinéraires techniques sont intéressants à étudier, en particulier quand il s'agit de successions de cultures sur plusieurs années, afin de comprendre la stratégie d'un agriculteur ou bien d'expliciter le bénéfice de telle ou telle rotation.

En revanche, la visualisation d'un itinéraire technique (aussi appelé schémas décisionnel) se fait souvent aujourd'hui avec des outils tels que powerpoint à défaut d'autre chose. Outre le fait que ces outils ne gèrent pas bien les proportionalités entre les séquences de temps, ils sont rapidement limités dans leur capacité d'afficher beaucoup d'information.

Ce projet vise à proposer une alternative, pour décrire un itinéraire technique complet, avec un maximum d'interventions et d'informations annexes (par exemple l'écartement du rang, la variété ou la densité de semis).

![Le rendu peut se faire au format frise, avec un zoom temporel, et la possibilité de cliquer sur chaque étape de la rotation ou chaque intervention pour en savoir plus](https://www.osfarm.org/itineraire-technique/images/rendu_frise.png)

Le rendu peut se faire au format frise, avec un zoom temporel, et la possibilité de cliquer sur chaque étape de la rotation ou chaque intervention pour en savoir plus.

![L'utilisateur peut passer au format rotation pour voir l'ensemble de la rotation sur un cercle](https://www.osfarm.org/itineraire-technique/images/rendu_rotation.png)

L'utilisateur peut passer au format rotation pour voir l'ensemble de la rotation sur un cercle

### Rendu démo
[Cliquez ici](https://osfarm.github.io/itineraire-technique/visualisateur.html) pour accéder à la démo !

### Editeur
Le visualisateur est fourni avec un éditeur qui permet de créer son propre itinéraire technique et l'intégrer facilement dans n'importe quel contexte. [Cliquez ici](https://www.osfarm.org/itineraire-technique/editor.html) pour accéder à l'éditeur.

## Triple Performance
Ce visualisateur est avant tout conçu pour être utilisé sur [Triple Performance](https://wiki.tripleperformance.fr/). Vous y trouverez de [nombreux](https://wiki.tripleperformance.fr/wiki/Retours_d%27exp%C3%A9rience) [retours d'expérience](https://wiki.tripleperformance.fr/wiki/Ferme_de_Longueil) documentés avec des données technico-économiques ainsi que les itinéraires techniques associés. Les itinéraires peuvent être créés alors directement dans [Google Spreadsheet](https://wiki.tripleperformance.fr/wiki/Aide:Ins%C3%A9rer_des_graphiques_dans_une_page) grâce à l'[add-on](https://workspace.google.com/marketplace/app/triple_performance/427792115089) spécifiquement conçu pour Google Workspace.

## Utilisation dans un autre contexte / logiciel
Il est possible d'utiliser cette librairie très facilement dans n'importe quel outil. Le visualisateur a été conçu pour être très facile à intégrer dans une page HTML, il ne dépend que de briques Javascript (Apache Echarts, JQuery et Bootstrap). N'hésitez pas à nous contacter si vous décidez de l'utiliser et à contribuer si vous faites des évolutions !
 

Pour utiliser le package, le plus simple est d'utiliser npm :

```
npm i @osfarm/itineraire-technique
```
Puis de copier les fichiers js et css dans votre code :
```
{
  "private": true,
  "dependencies": {
    "@osfarm/itineraire-technique": "^1.0.0"
  },
  "scripts": {
     "build": "cp node_modules/@osfarm/itineraire-technique/js/chart-render.js js/ && cp node_modules/@osfarm/itineraire-technique/css/styles-rendering.css css"
   }
}
```
Dans votre HTML, inclure les fichiers d'echarts : 
```
<link  href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"  rel="stylesheet" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65"  crossorigin="anonymous">
<script  src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.js"></script>
<script  src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script  src="https://cdn.jsdelivr.net/npm/underscore@1.13.7/underscore-umd-min.js"></script>

<link  href="./css/styles-rendering.css"  rel="stylesheet">
<script  src="./js/chart-render.js"></script>
```

Puis appeler la fonction de rendu sur votre JSON (vous devez avoir deux div dans votre html, un pour le graphique et un pour la liste textuelle des étapes) : 
```
let  renderer = new  RotationRenderer('itk_chart_div', 'itk_transcription_div', jsonData);
renderer.render();
```
