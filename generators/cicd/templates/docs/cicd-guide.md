# Guide CI/CD

Ce document présente les pipelines CI/CD générés pour votre projet Spring Boot.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Outils supportés](#outils-supportés)
3. [Étapes du pipeline](#étapes-du-pipeline)
4. [Stratégies de déploiement](#stratégies-de-déploiement)
5. [Configuration des secrets](#configuration-des-secrets)
6. [Utilisation quotidienne](#utilisation-quotidienne)
7. [Personnalisation](#personnalisation)

## Vue d'ensemble

Les pipelines CI/CD générés pour votre projet permettent d'automatiser les étapes suivantes :

<% if (stages.includes('static-analysis')) { %>- **Analyse statique du code** : Vérification de la qualité du code et identification des problèmes potentiels<% } %>
<% if (stages.includes('tests')) { %>- **Tests** : Exécution des tests unitaires et d'intégration<% } %>
<% if (stages.includes('build')) { %>- **Build** : Compilation de l'application et génération des artefacts<% } %>
<% if (stages.includes('docker')) { %>- **Docker** : Création et publication d'images Docker<% } %>
<% if (stages.includes('deploy')) { %>- **Déploiement** : Déploiement automatisé sur différents environnements<% } %>
<% if (stages.includes('release')) { %>- **Release** : Création de versions et de tags<% } %>
<% if (stages.includes('notify')) { %>- **Notifications** : Envoi de notifications sur les résultats du pipeline<% } %>

## Outils supportés

Vous avez configuré les outils CI/CD suivants :

<% ciTools.forEach(function(tool) { %>
### <%= tool === 'github' ? 'GitHub Actions' : tool === 'gitlab' ? 'GitLab CI' : 'Jenkins' %>

<% if (tool === 'github') { %>
Les workflows GitHub Actions sont configurés dans le dossier `.github/workflows` :
- `ci-cd.yml` : Pipeline principal pour l'intégration et le déploiement continus
- `pull-request.yml` : Vérifie la qualité du code pour chaque pull request
<% if (stages.includes('deploy')) { %>- `deploy.yml` : Permet le déploiement manuel vers un environnement spécifique<% } %>
<% if (stages.includes('release')) { %>- `release.yml` : Création de releases GitHub<% } %>

Pour plus d'informations sur la configuration des secrets GitHub Actions, consultez le document [github-secrets-example.md](github-secrets-example.md).
<% } else if (tool === 'gitlab') { %>
La configuration GitLab CI est définie dans le fichier `.gitlab-ci.yml` à la racine du projet. Ce fichier configure toutes les étapes du pipeline CI/CD.

Pour plus d'informations sur la configuration des variables GitLab CI, consultez le document [gitlab-variables-example.md](gitlab-variables-example.md).
<% } else { %>
La configuration Jenkins est définie dans le fichier `Jenkinsfile` à la racine du projet. Ce fichier configure toutes les étapes du pipeline CI/CD.

Pour plus d'informations sur la configuration de Jenkins, consultez le document [jenkins-setup.md](jenkins-setup.md).
<% } %>
<% }); %>

## Étapes du pipeline

Votre pipeline CI/CD comprend les étapes suivantes :

<% if (stages.includes('static-analysis')) { %>
### Analyse statique du code

Cette étape vérifie la qualité du code source et identifie les problèmes potentiels comme :
- Style de code non conforme
- Bugs potentiels
- Code smell
- Dette technique

<% if (sonarqube) { %>Elle utilise SonarQube pour analyser en profondeur la qualité du code et suivre son évolution au fil du temps.<% } %>
<% } %>

<% if (stages.includes('tests')) { %>
### Tests

Cette étape exécute les tests unitaires et d'intégration pour vérifier que le code fonctionne correctement. Elle :
- Exécute tous les tests unitaires
- Vérifie que le code ne régresse pas
<% if (qualityGates.includes('test-coverage')) { %>- Assure une couverture de code minimale de 80%<% } %>
<% if (qualityGates.includes('performance')) { %>- Vérifie les performances des tests<% } %>
<% } %>

<% if (stages.includes('build')) { %>
### Build

Cette étape compile l'application et génère les artefacts déployables :
- Compilation du code source
- Génération du fichier JAR exécutable
- Archivage des artefacts pour utilisation ultérieure
<% } %>

<% if (stages.includes('docker')) { %>
### Docker

Cette étape construit et publie les images Docker de l'application :
- Construction de l'image Docker optimisée
- Tag de l'image avec des identifiants uniques (numéro de build, SHA du commit, etc.)
- Publication de l'image sur le registry Docker<% if (dockerRegistry) { %> (<%= dockerRegistry %>)<% } %>
<% } %>

<% if (stages.includes('deploy')) { %>
### Déploiement

Cette étape déploie automatiquement l'application sur différents environnements :
<% environments.forEach(function(env) { %>
- **<%= env %>** : <% if (env === 'dev') { %>Déploiement automatique pour chaque commit sur la branche develop<% } else if (env === 'staging') { %>Déploiement automatique pour chaque commit sur la branche master<% } else if (env === 'prod') { %>Déploiement automatique pour chaque commit sur la branche main<% } %>
<% }); %>

Le déploiement utilise la stratégie "<%= deploymentStrategy === 'blue-green' ? 'Blue/Green' : deploymentStrategy === 'canary' ? 'Canary' : 'Simple' %>" pour minimiser les temps d'arrêt et réduire les risques.
<% } %>

<% if (stages.includes('release')) { %>
### Release

Cette étape crée des versions officielles de l'application :
- Tag du code source avec un numéro de version
- Génération du changelog basé sur les commits
- Création d'une release GitHub/GitLab avec les artefacts
- Publication de l'image Docker avec un tag de version
<% } %>

<% if (stages.includes('notify')) { %>
### Notifications

Cette étape envoie des notifications sur le statut du pipeline via :
<% if (notifications.includes('email')) { %>- Email<% } %>
<% if (notifications.includes('slack')) { %>- Slack<% } %>
<% if (notifications.includes('discord')) { %>- Discord<% } %>
<% } %>

## Stratégies de déploiement

<% if (deploymentStrategy === 'blue-green') { %>
### Blue/Green Deployment

La stratégie Blue/Green consiste à maintenir deux environnements identiques (Blue et Green) et à basculer le trafic de l'un à l'autre lors d'un déploiement :

1. L'environnement actif (ex: Blue) sert tout le trafic
2. Le nouvel environnement (ex: Green) est déployé et testé en parallèle
3. Une fois le nouvel environnement validé, le trafic est basculé vers lui
4. L'ancien environnement reste en place pour permettre un rollback rapide si nécessaire

Cette approche permet des mises à jour sans temps d'arrêt et un rollback instantané en cas de problème.
<% } else if (deploymentStrategy === 'canary') { %>
### Canary Deployment

La stratégie Canary consiste à déployer progressivement la nouvelle version de l'application :

1. L'application existante sert la totalité du trafic
2. Une nouvelle version (canary) est déployée et reçoit un petit pourcentage du trafic (10%)
3. La performance et les métriques de la version canary sont surveillées
4. Si tout va bien, la version canary remplace progressivement l'ancienne version
5. En cas de problème, le trafic est immédiatement redirigé vers l'ancienne version

Cette approche permet de tester une nouvelle version en production avec un risque minimal.
<% } else { %>
### Déploiement simple

La stratégie de déploiement simple consiste à remplacer directement l'ancienne version par la nouvelle :

1. L'application existante est arrêtée
2. La nouvelle version est déployée
3. La nouvelle version est démarrée

Cette approche est simple mais peut entraîner un court temps d'indisponibilité pendant le déploiement.
<% } %>

## Configuration des secrets

Pour que votre pipeline CI/CD fonctionne correctement, vous devez configurer plusieurs secrets et variables :

<% ciTools.forEach(function(tool) { %>
### <%= tool === 'github' ? 'GitHub Actions' : tool === 'gitlab' ? 'GitLab CI' : 'Jenkins' %>

Consultez le document [<%= tool === 'github' ? 'github-secrets-example.md' : tool === 'gitlab' ? 'gitlab-variables-example.md' : 'jenkins-setup.md' %>] pour la liste complète des secrets à configurer.
<% }); %>

## Utilisation quotidienne

### Workflow quotidien

1. Créez une branche à partir de `develop` pour votre fonctionnalité ou correction
2. Effectuez vos modifications et committez votre code
3. Créez une pull request/merge request vers `develop`
4. Le pipeline de PR/MR vérifiera automatiquement votre code
5. Une fois approuvée, fusionnez la PR/MR
6. Le pipeline principal s'exécutera automatiquement et déploiera sur l'environnement de développement
7. Pour déployer manuellement sur d'autres environnements, utilisez le workflow de déploiement manuel

### Déploiement manuel

<% ciTools.forEach(function(tool) { %>
<% if (tool === 'github') { %>
Pour GitHub Actions :
1. Accédez à l'onglet "Actions" de votre dépôt
2. Sélectionnez le workflow "Manual Deployment"
3. Cliquez sur "Run workflow"
4. Sélectionnez la branche et l'environnement cible
5. Cliquez sur "Run workflow" pour lancer le déploiement
<% } else if (tool === 'gitlab') { %>
Pour GitLab CI :
1. Accédez à CI/CD > Pipelines
2. Cliquez sur "Run pipeline"
3. Sélectionnez la branche
4. Ajoutez la variable `DEPLOY_TO_<ENV>` avec la valeur `true`
5. Cliquez sur "Run pipeline" pour lancer le déploiement
<% } else { %>
Pour Jenkins :
1. Accédez à votre pipeline Jenkins
2. Cliquez sur "Build with Parameters"
3. Sélectionnez l'environnement cible
4. Cliquez sur "Build" pour lancer le déploiement
<% } %>
<% }); %>

## Personnalisation

Les fichiers de configuration CI/CD générés sont un excellent point de départ, mais vous pouvez les personnaliser selon vos besoins spécifiques :

- Ajout d'étapes supplémentaires (sécurité, performance, etc.)
- Modification des environnements de déploiement
- Ajout de validation manuelle pour certains environnements
- Intégration avec d'autres outils et services

Pour en savoir plus sur les bonnes pratiques CI/CD, consultez le document [best-practices.md](best-practices.md).
