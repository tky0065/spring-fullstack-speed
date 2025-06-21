# Kubernetes Configuration pour <%= appName %>

Ce dossier contient les configurations Kubernetes nécessaires pour déployer l'application <%= appName %> dans un cluster Kubernetes.

## Structure des fichiers

```
kubernetes/
├── README.md                    # Ce fichier
<% if (deploymentType === 'raw-manifests') { %>
├── base/                        # Manifests Kubernetes de base
│   ├── namespace.yaml           # Définition du namespace
│   ├── deployment.yaml          # Déploiement de l'application
│   ├── service.yaml             # Service pour exposer l'application
│   ├── configmap.yaml           # Variables de configuration
│   ├── secrets.yaml             # Données sensibles (encodées en base64)
│   ├── pvc.yaml                 # Stockage persistant
│   ├── ingress.yaml             # Configuration d'entrée pour l'accès externe
│   └── hpa.yaml                 # Autoscaling horizontal
<% } else if (deploymentType === 'helm') { %>
├── helm/                        # Helm Chart
│   └── <%= appNameKebab %>/     # Chart pour l'application
│       ├── Chart.yaml           # Métadonnées du chart
│       ├── values.yaml          # Valeurs par défaut
│       └── templates/           # Templates Helm
│           ├── deployment.yaml  # Template de déploiement
│           ��── service.yaml     # Template de service
│           ├── ingress.yaml     # Template d'ingress
│           ├── configmap.yaml   # Template de configmap
│           ├── secrets.yaml     # Template de secrets
│           └── pvc.yaml         # Template de stockage persistant
<% } else if (deploymentType === 'kustomize') { %>
├── kustomize/                   # Configurations Kustomize
│   ├── base/                    # Configuration de base
│   │   ├── kustomization.yaml   # Fichier de configuration principal
│   │   ├── deployment.yaml      # Déploiement de l'application
│   │   ├── service.yaml         # Service pour exposer l'application
│   │   └── ... (autres ressources)
│   └── overlays/                # Superpositions pour différents environnements
│       ├── dev/                 # Environnement de développement
│       │   ├── kustomization.yaml
│       │   └── deployment-patch.yaml
│       └── prod/                # Environnement de production
│           ├── kustomization.yaml
│           └── deployment-patch.yaml
<% } %>
```

## Prérequis

- Kubernetes 1.19+
- kubectl installé et configuré
- accès à un cluster Kubernetes
<% if (deploymentType === 'helm') { %>- Helm 3+ installé<% } %>
<% if (deploymentType === 'kustomize') { %>- kustomize installé<% } %>

## Commandes de déploiement

### Préparation

```bash
# Créer le namespace
kubectl apply -f namespace.yaml

# Créer les secrets (si applicable)
kubectl apply -f secrets.yaml

# Créer les configmaps
kubectl apply -f configmap.yaml
```

<% if (deploymentType === 'raw-manifests') { %>
### Déploiement avec les manifests Kubernetes standards

```bash
# Déployer l'application
kubectl apply -f deployment.yaml

# Déployer le service
kubectl apply -f service.yaml

<% if (createIngress === true) { %># Déployer l'ingress
kubectl apply -f ingress.yaml
<% } %>

<% if (createPVC === true) { %># Déployer le volume persistant (si applicable)
kubectl apply -f pvc.yaml
<% } %>

<% if (enableAutoscaling === true) { %># Déployer la configuration d'autoscaling
kubectl apply -f hpa.yaml
<% } %>

# Déployer tous les composants d'un coup
kubectl apply -f .
```
<% } else if (deploymentType === 'helm') { %>
### Déploiement avec Helm

```bash
# Ajouter le repo Helm (si applicable)
# helm repo add <repo-name> <repo-url>
# helm repo update

# Installation du chart
helm install <%= appNameKebab %> ./helm/<%= appNameKebab %> \
  --namespace <%= appNameKebab %> \
  --create-namespace

# Mise à jour du chart
helm upgrade <%= appNameKebab %> ./helm/<%= appNameKebab %> \
  --namespace <%= appNameKebab %>

# Visualiser les ressources déployées
helm list -n <%= appNameKebab %>

# Supprimer le déploiement
helm uninstall <%= appNameKebab %> -n <%= appNameKebab %>
```
<% } else if (deploymentType === 'kustomize') { %>
### Déploiement avec Kustomize

```bash
# Déploiement de l'environnement de développement
kubectl apply -k ./kustomize/overlays/dev

# Déploiement de l'environnement de production
kubectl apply -k ./kustomize/overlays/prod

# Visualiser les ressources qui seraient appliquées (sans les déployer)
kubectl kustomize ./kustomize/overlays/dev

# Supprimer les ressources
kubectl delete -k ./kustomize/overlays/dev
```
<% } %>

## Vérification du déploiement

```bash
# Vérifier les déploiements
kubectl get deployments -n <%= appNameKebab %>

# Vérifier les pods
kubectl get pods -n <%= appNameKebab %>

# Vérifier les services
kubectl get services -n <%= appNameKebab %>

<% if (createIngress === true) { %># Vérifier les ingress
kubectl get ingress -n <%= appNameKebab %>
<% } %>

# Afficher les logs d'un pod (remplacer <pod-name>)
kubectl logs <pod-name> -n <%= appNameKebab %>

# Entrer dans un pod en mode shell
kubectl exec -it <pod-name> -n <%= appNameKebab %> -- /bin/sh
```

## Monitoring et dépannage

```bash
# Afficher les détails d'un pod
kubectl describe pod <pod-name> -n <%= appNameKebab %>

# Afficher les détails d'un déploiement
kubectl describe deployment <%= appNameKebab %> -n <%= appNameKebab %>

# Surveiller les ressources utilisées par les pods
kubectl top pod -n <%= appNameKebab %>

# Vérifier les événements du namespace
kubectl get events -n <%= appNameKebab %>
```

<% if (enableServiceMesh === true) { %>
## Service Mesh (Istio)

```bash
# Vérifier les virtual services
kubectl get virtualservices -n <%= appNameKebab %>

# Vérifier les destination rules
kubectl get destinationrules -n <%= appNameKebab %>

# Vérifier les gateways
kubectl get gateways -n <%= appNameKebab %>
```
<% } %>

## Mise à jour de l'application

<% if (deploymentType === 'raw-manifests') { %>
```bash
# Modifier l'image ou la configuration dans deployment.yaml, puis:
kubectl apply -f deployment.yaml
```
<% } else if (deploymentType === 'helm') { %>
```bash
# Mettre à jour les valeurs dans values.yaml ou passer directement des valeurs:
helm upgrade <%= appNameKebab %> ./helm/<%= appNameKebab %> \
  --namespace <%= appNameKebab %> \
  --set image.tag=nouvelle-version
```
<% } else if (deploymentType === 'kustomize') { %>
```bash
# Modifier les patchs dans le dossier overlays, puis:
kubectl apply -k ./kustomize/overlays/dev
```
<% } %>

## Nettoyer les ressources

```bash
<% if (deploymentType === 'raw-manifests') { %># Supprimer toutes les ressources
kubectl delete -f .<% } else if (deploymentType === 'helm') { %># Désinstaller le helm chart
helm uninstall <%= appNameKebab %> -n <%= appNameKebab %><% } else if (deploymentType === 'kustomize') { %># Supprimer toutes les ressources
kubectl delete -k ./kustomize/overlays/dev<% } %>

# Supprimer le namespace (attention: supprime toutes les ressources du namespace)
kubectl delete namespace <%= appNameKebab %>
```
