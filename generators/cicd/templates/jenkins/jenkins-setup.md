# Configuration Jenkins pour CI/CD Pipeline

Ce document explique comment configurer Jenkins pour utiliser le Jenkinsfile généré dans votre projet.

## Table des matières
1. [Prérequis](#prérequis)
2. [Configuration du serveur Jenkins](#configuration-du-serveur-jenkins)
3. [Configuration du pipeline](#configuration-du-pipeline)
4. [Credentials requis](#credentials-requis)
5. [Plugins recommandés](#plugins-recommandés)
6. [Variables d'environnement](#variables-denvironnement)
7. [Troubleshooting](#troubleshooting)

## Prérequis

- Jenkins (version 2.346 ou supérieure)
- Pipeline Plugin
- Docker installé sur le serveur Jenkins
- Accès au registry Docker
- JDK 17 configuré dans Jenkins
- Maven configuré dans Jenkins

## Configuration du serveur Jenkins

### Installation des plugins nécessaires

1. Accédez à la page d'administration Jenkins
2. Cliquez sur "Gérer Jenkins" > "Gestion des plugins"
3. Allez dans l'onglet "Disponible"
4. Recherchez et installez les plugins suivants :
   - Pipeline
   - Docker Pipeline
   - Git Integration
   - SSH Agent
   - Credentials
   - Email Extension
<% if (notifications && notifications.includes('slack')) { %>
   - Slack Notification
<% } %>

### Configuration des outils

1. Accédez à "Gérer Jenkins" > "Configuration globale des outils"
2. Configurez JDK 17 :
   - Nom : `JDK17`
   - JAVA_HOME : chemin vers votre installation JDK 17
3. Configurez Maven :
   - Nom : `Maven 3.8`
   - Installation automatique ou chemin vers votre installation Maven

## Configuration du pipeline

### Créer un nouveau pipeline

1. Depuis le tableau de bord Jenkins, cliquez sur "Nouveau Item"
2. Entrez un nom pour votre pipeline et sélectionnez "Pipeline"
3. Cliquez sur "OK"
4. Dans la section "Pipeline", sélectionnez "Pipeline script from SCM"
5. Sélectionnez "Git" comme SCM
6. Entrez l'URL de votre dépôt Git
7. Spécifiez les branches à construire (par exemple: `*/main, */develop`)
8. Dans "Script Path", entrez `Jenkinsfile`
9. Cliquez sur "Sauvegarder"

## Credentials requis

Dans Jenkins, vous devez configurer les identifiants suivants :

### Docker Registry

1. Accédez à "Gérer Jenkins" > "Manage Credentials"
2. Cliquez sur "Global credentials" > "Add Credentials"
3. Sélectionnez "Username with password"
4. ID : `docker-credentials`
5. Description : `Docker Registry Credentials`
6. Username : Votre nom d'utilisateur Docker
7. Password : Votre mot de passe/token Docker
8. Cliquez sur "OK"

### SSH Deployment Keys

1. Accédez à "Gérer Jenkins" > "Manage Credentials"
2. Cliquez sur "Global credentials" > "Add Credentials"
3. Sélectionnez "SSH Username with private key"
4. ID : `ssh-deployment-key`
5. Description : `SSH Key for Deployment`
6. Username : utilisateur SSH
7. Private Key : Collez votre clé privée SSH ici
8. Cliquez sur "OK"

<% if (sonarqube) { %>
### SonarQube

1. Accédez à "Gérer Jenkins" > "Manage Credentials"
2. Cliquez sur "Global credentials" > "Add Credentials"
3. Sélectionnez "Secret text"
4. ID : `sonarqube-token`
5. Description : `SonarQube Token`
6. Secret : Votre token SonarQube
7. Cliquez sur "OK"
<% } %>

## Plugins recommandés

Pour améliorer votre pipeline CI/CD, nous vous recommandons d'installer ces plugins supplémentaires :

- Blue Ocean : Interface moderne pour les pipelines
- Warnings Next Generation : Analyse des problèmes de qualité de code
- Dashboard View : Vue d'ensemble de tous vos jobs
- Job DSL : Automatisation de la création de jobs
- Configuration as Code (JCasC) : Gérer la configuration de Jenkins en tant que code

## Variables d'environnement

Vous devez configurer les variables d'environnement suivantes dans votre pipeline Jenkins :

<% if (environments && environments.length > 0) { %>
<% environments.forEach(function(env) { %>
### Environnement <%= env %>

| Nom | Description | Exemple |
|-----|-------------|---------|
| `<%= env.toUpperCase() %>_DEPLOY_HOST` | Hôte de déploiement pour <%= env %> | `<%= env %>.example.com` |
| `<%= env.toUpperCase() %>_DEPLOY_USER` | Utilisateur pour le déploiement sur <%= env %> | `deploy` |
| `<%= env.toUpperCase() %>_APP_PORT` | Port de l'application pour <%= env %> | `8080` |
<% }); %>
<% } %>

<% if (dockerRegistry) { %>
### Docker Registry

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DOCKER_REGISTRY` | URL du registry Docker | `<%= dockerRegistry %>` |
<% } %>

<% if (notifications && notifications.includes('slack')) { %>
### Slack

| Nom | Description | Exemple |
|-----|-------------|---------|
| `SLACK_CHANNEL` | Canal Slack pour les notifications | `#cicd-notifications` |
<% } %>

## Comment configurer des variables d'environnement

1. Accédez à votre pipeline Jenkins
2. Cliquez sur "Pipeline Syntax" dans le menu de gauche
3. Dans "Sample Step", sélectionnez "withEnv: Set environment variables"
4. Ajoutez vos variables sous forme de paires clé/valeur
5. Cliquez sur "Generate Pipeline Script" et intégrez le script généré dans votre Jenkinsfile

## Troubleshooting

### Pipeline échoue avec une erreur Docker

Si votre pipeline échoue avec une erreur Docker comme "permission denied", assurez-vous que :
1. L'utilisateur Jenkins est dans le groupe Docker
2. Le daemon Docker est en cours d'exécution
3. Jenkins a les permissions nécessaires pour accéder au socket Docker

### Problèmes de déploiement SSH

Si les déploiements SSH échouent :
1. Vérifiez que la clé privée SSH est correctement configurée dans Jenkins
2. Assurez-vous que la clé publique est ajoutée au fichier `authorized_keys` sur le serveur cible
3. Vérifiez que l'utilisateur a les permissions nécessaires sur le serveur cible

### Erreur "No such file or directory" lors du déploiement

Cette erreur se produit souvent quand les chemins des fichiers sont incorrects sur le serveur de déploiement. Assurez-vous que :
1. Les dossiers nécessaires existent sur le serveur cible
2. Les chemins dans les scripts de déploiement correspondent à votre environnement
