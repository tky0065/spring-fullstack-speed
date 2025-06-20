# GitHub Secrets pour CI/CD Pipeline

Ce document liste les secrets GitHub à configurer pour que votre pipeline CI/CD fonctionne correctement.

## Comment configurer les secrets

1. Accédez aux paramètres de votre dépôt GitHub
2. Cliquez sur "Secrets and variables" > "Actions"
3. Cliquez sur "New repository secret"
4. Ajoutez chaque secret avec son nom et sa valeur

## Secrets Requis

### Docker Registry

Ces secrets sont nécessaires pour publier des images Docker :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DOCKER_USERNAME` | Nom d'utilisateur pour le registry Docker | `myusername` |
| `DOCKER_PASSWORD` | Mot de passe ou token pour le registry Docker | `mypassword` |

<% if (sonarqube) { %>
### SonarQube

Ces secrets sont nécessaires pour l'analyse de code avec SonarQube :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `SONAR_TOKEN` | Token d'accès à SonarQube | `d04f771b7...` |
| `SONAR_HOST_URL` | URL du serveur SonarQube | `https://sonarqube.example.com` |
<% } %>

### Déploiement

Ces secrets sont nécessaires pour les déploiements :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DEPLOY_SSH_KEY` | Clé SSH privée pour l'accès au serveur | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `DEPLOY_HOST` | Hôte de déploiement | `app.example.com` |
| `DEPLOY_USER` | Utilisateur pour le déploiement | `deploy` |
| `APP_URL` | URL de l'application déployée | `app.example.com` |
<% if (environments && environments.length > 0) { %>

#### Environnements Spécifiques

<% environments.forEach(function(env) { %>
Pour l'environnement **<%= env %>** :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `<%= env.toUpperCase() %>_DEPLOY_HOST` | Hôte de déploiement pour <%= env %> | `<%= env %>.example.com` |
| `<%= env.toUpperCase() %>_APP_URL` | URL de l'application déployée pour <%= env %> | `<%= env %>.example.com` |
<% }); %>
<% } %>

<% if (dockerRegistry) { %>
### Docker Registry Custom

Si vous utilisez le registry Docker personnalisé (<%= dockerRegistry %>) :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DOCKER_REGISTRY` | URL du registry Docker | `<%= dockerRegistry %>` |
<% } %>

<% if (notifications && notifications.length > 0) { %>
### Notifications
<% if (notifications.includes('email')) { %>

#### Email

| Nom | Description | Exemple |
|-----|-------------|---------|
| `MAIL_SERVER` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Nom d'utilisateur SMTP | `notifications@example.com` |
| `MAIL_PASSWORD` | Mot de passe SMTP | `password` |
| `MAIL_RECIPIENTS` | Destinataires des notifications (séparés par des virgules) | `team@example.com,admin@example.com` |
<% } %>

<% if (notifications.includes('slack')) { %>
#### Slack

| Nom | Description | Exemple |
|-----|-------------|---------|
| `SLACK_WEBHOOK_URL` | URL du webhook Slack | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXX` |
<% } %>

<% if (notifications.includes('discord')) { %>
#### Discord

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DISCORD_WEBHOOK` | URL du webhook Discord | `https://discord.com/api/webhooks/000000000000000000/XXXXXXXXXXXX` |
<% } %>
<% } %>

## Kubectl Configuration

Si vous utilisez Kubernetes pour le déploiement (stratégies Blue/Green ou Canary) :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `KUBE_CONFIG` | Contenu complet du fichier kubeconfig encodé en base64 | `apiVersion: v1\nkind: Config\n...` |

## Comment obtenir ces valeurs

### Docker Registry

1. Créez un compte sur Docker Hub ou utilisez votre registry privé
2. Créez un token d'accès dans les paramètres de sécurité

### Clé SSH pour le déploiement

Générez une paire de clés SSH spécifique pour le déploiement :

```sh
ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions-key
```

Ajoutez la clé publique (`github-actions-key.pub`) au fichier `~/.ssh/authorized_keys` sur le serveur de déploiement et utilisez la clé privée comme valeur pour `DEPLOY_SSH_KEY`.

### Kubeconfig

Pour obtenir la valeur de `KUBE_CONFIG` :

```sh
cat ~/.kube/config | base64 -w 0
```

<% if (sonarqube) { %>
### SonarQube Token

1. Connectez-vous à votre instance SonarQube
2. Allez dans Compte > Sécurité
3. Générez un nouveau token
<% } %>

## Exemple de fichier .env pour tester localement

```bash
# Docker
DOCKER_USERNAME=myusername
DOCKER_PASSWORD=mypassword

# Deployment
DEPLOY_HOST=app.example.com
DEPLOY_USER=deploy
APP_URL=app.example.com

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
