# Variables GitLab CI pour CI/CD Pipeline

Ce document liste les variables GitLab CI à configurer pour que votre pipeline CI/CD fonctionne correctement.

## Comment configurer les variables

1. Dans votre projet GitLab, accédez à **Settings > CI/CD**
2. Développez la section **Variables**
3. Cliquez sur **Add Variable**
4. Ajoutez chaque variable avec son nom, sa valeur et son scope

## Variables Requises

### Docker Registry

Ces variables sont nécessaires pour publier des images Docker :

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `DOCKER_USERNAME` | Nom d'utilisateur pour le registry Docker | Variable | `myusername` |
| `DOCKER_PASSWORD` | Mot de passe ou token pour le registry Docker | Variable (masquée) | `mypassword` |

<% if (sonarqube) { %>
### SonarQube

Ces variables sont nécessaires pour l'analyse de code avec SonarQube :

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `SONAR_TOKEN` | Token d'accès à SonarQube | Variable (masquée) | `d04f771b7...` |
| `SONAR_HOST_URL` | URL du serveur SonarQube | Variable | `https://sonarqube.example.com` |
<% } %>

### Déploiement

Ces variables sont nécessaires pour les déploiements :

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `DEPLOY_SSH_KEY` | Clé SSH privée pour l'accès au serveur | Variable (masquée) | `-----BEGIN RSA PRIVATE KEY-----\n...` |

<% if (environments && environments.length > 0) { %>
#### Environnements Spécifiques

<% environments.forEach(function(env) { %>
Pour l'environnement **<%= env %>** :

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `DEPLOY_HOST_<%= env.toUpperCase() %>` | Hôte de déploiement pour <%= env %> | Variable | `<%= env %>.example.com` |
| `DEPLOY_USER_<%= env.toUpperCase() %>` | Utilisateur pour le déploiement sur <%= env %> | Variable | `deploy` |
| `APP_URL_<%= env.toUpperCase() %>` | URL de l'application déployée pour <%= env %> | Variable | `<%= env %>.example.com` |
| `APP_PORT_<%= env.toUpperCase() %>` | Port de l'application pour <%= env %> | Variable | `8080` |

<% }); %>
<% } %>

<% if (dockerRegistry) { %>
### Docker Registry Custom

Si vous utilisez le registry Docker personnalisé (<%= dockerRegistry %>) :

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `DOCKER_REGISTRY` | URL du registry Docker | Variable | `<%= dockerRegistry %>` |
<% } %>

<% if (notifications && notifications.length > 0) { %>
### Notifications
<% if (notifications.includes('email')) { %>

#### Email

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `MAIL_SERVER` | Serveur SMTP | Variable | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | Variable | `587` |
| `MAIL_USERNAME` | Nom d'utilisateur SMTP | Variable | `notifications@example.com` |
| `MAIL_PASSWORD` | Mot de passe SMTP | Variable (masquée) | `password` |
| `MAIL_RECIPIENTS` | Destinataires des notifications (séparés par des virgules) | Variable | `team@example.com,admin@example.com` |
<% } %>

<% if (notifications.includes('slack')) { %>
#### Slack

| Nom | Description | Type | Exemple |
|-----|-------------|------|---------|
| `SLACK_WEBHOOK_URL` | URL du webhook Slack | Variable (masquée) | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXX` |
<% } %>
<% } %>

## Comment obtenir ces valeurs

### Docker Registry

1. Créez un compte sur Docker Hub ou utilisez votre registry privé
2. Créez un token d'accès dans les paramètres de sécurité

### Clé SSH pour le déploiement

Générez une paire de clés SSH spécifique pour le déploiement :

```sh
ssh-keygen -t rsa -b 4096 -C "gitlab-ci" -f gitlab-ci-key
```

Ajoutez la clé publique (`gitlab-ci-key.pub`) au fichier `~/.ssh/authorized_keys` sur le serveur de déploiement et utilisez la clé privée comme valeur pour `DEPLOY_SSH_KEY`.

<% if (sonarqube) { %>
### SonarQube Token

1. Connectez-vous à votre instance SonarQube
2. Allez dans Compte > Sécurité
3. Générez un nouveau token
<% } %>

## Variables pour les déploiements manuels

Pour déclencher manuellement un déploiement vers un environnement spécifique, utilisez les variables prédéfinies suivantes dans le déclenchement de pipeline manuel :

<% if (environments && environments.length > 0) { %>
<% environments.forEach(function(env) { %>
| Nom | Valeur pour <%= env %> |
|-----|---------|
| `DEPLOY_TO_<%= env.toUpperCase() %>` | `true` |

<% }); %>
<% } %>

## Exemple de fichier .env pour tester localement

```bash
# Docker
DOCKER_USERNAME=myusername
DOCKER_PASSWORD=mypassword

# Deployment
<% if (environments && environments.length > 0) { %>
<% environments.forEach(function(env) { %>
DEPLOY_HOST_<%= env.toUpperCase() %>=<%= env %>.example.com
DEPLOY_USER_<%= env.toUpperCase() %>=deploy
APP_URL_<%= env.toUpperCase() %>=<%= env %>.example.com
APP_PORT_<%= env.toUpperCase() %>=8080
<% }); %>
<% } %>

<% if (sonarqube) { %>
# SonarQube
SONAR_TOKEN=d04f771b7...
SONAR_HOST_URL=https://sonarqube.example.com
<% } %>

<% if (notifications && notifications.includes('slack')) { %>
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXX
<% } %>
```
