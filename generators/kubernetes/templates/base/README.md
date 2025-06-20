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
│           ├── service.yaml     # Template de service
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
- kubectl configuré pour votre cluster
<% if (deploymentType === 'helm') { %>- Helm 3.0+<% } %>
<% if (deploymentType === 'kustomize') { %>- Kustomize 4.0+<% } %>
<% if (enableServiceMesh) { %>- Istio installé sur votre cluster<% } %>
<% if (configureMonitoring) { %>- Prometheus Operator installé sur votre cluster<% } %>

## Déploiement

### Préparation

1. Assurez-vous que les secrets sont correctement configurés
   <% if (deploymentType === 'raw-manifests') { %>
   ```bash
   # Éditer le fichier de secrets avant le déploiement
   vim kubernetes/base/secrets.yaml
   ```
   <% } else if (deploymentType === 'helm') { %>
   ```bash
   # Créer un fichier values-secrets.yaml pour stocker les valeurs sensibles
   cat > kubernetes/helm/<%= appNameKebab %>/values-secrets.yaml << EOF
   database:
     password: votre_mot_de_passe_sécurisé
   
   security:
     jwtSecret: votre_clé_jwt_sécurisée_très_longue
   EOF
   ```
   <% } else if (deploymentType === 'kustomize') { %>
   ```bash
   # Créer un fichier de secrets pour kustomize
   cat > kubernetes/kustomize/overlays/prod/secrets.env << EOF
   SPRING_DATASOURCE_PASSWORD=votre_mot_de_passe_sécurisé
   JWT_SECRET=votre_clé_jwt_sécurisée_très_longue
   EOF
   
   # Ajouter au fichier kustomization.yaml
   # secretGenerator:
   # - name: <%= appNameKebab %>-secrets
   #   envs:
   #   - secrets.env
   ```
   <% } %>

2. Vérifiez et ajustez les configurations selon vos besoins

### Déploiement de l'application

<% if (deploymentType === 'raw-manifests') { %>
```bash
# Créer le namespace
kubectl apply -f kubernetes/base/namespace.yaml

# Déployer toutes les ressources
kubectl apply -f kubernetes/base/
```
<% } else if (deploymentType === 'helm') { %>
```bash
# Installer le chart avec les valeurs par défaut
helm install <%= appNameKebab %> kubernetes/helm/<%= appNameKebab %>/ --namespace <%= appNameKebab %>-ns --create-namespace

# Ou avec des valeurs personnalisées
helm install <%= appNameKebab %> kubernetes/helm/<%= appNameKebab %>/ --namespace <%= appNameKebab %>-ns --create-namespace -f kubernetes/helm/<%= appNameKebab %>/values-secrets.yaml
```
<% } else if (deploymentType === 'kustomize') { %>
```bash
# Déployer avec kustomize pour l'environnement de développement
kubectl apply -k kubernetes/kustomize/overlays/dev/

# Ou pour l'environnement de production
kubectl apply -k kubernetes/kustomize/overlays/prod/
```
<% } %>

## Vérification du déploiement

```bash
# Vérifier que les pods sont en cours d'exécution
kubectl get pods -n <%= appNameKebab %>-ns

# Vérifier les services
kubectl get svc -n <%= appNameKebab %>-ns

# Vérifier les journaux
kubectl logs -f deployment/<%= appNameKebab %> -n <%= appNameKebab %>-ns
```

<% if (createIngress) { %>
## Accès à l'application

Une fois le déploiement terminé, l'application sera accessible via l'URL configurée dans l'Ingress :

```
https://<%= appNameKebab %>.example.com
```

Note : Assurez-vous de configurer votre DNS pour pointer vers l'adresse IP de votre Ingress Controller.
<% } %>

<% if (enableAutoscaling) { %>
## Autoscaling

L'application est configurée avec un Horizontal Pod Autoscaler (HPA) qui ajuste automatiquement le nombre de pods en fonction de l'utilisation des ressources :

```bash
# Vérifier l'état de l'autoscaler
kubectl get hpa -n <%= appNameKebab %>-ns
```
<% } %>

<% if (enableServiceMesh) { %>
## Service Mesh (Istio)

Cette application est configurée pour fonctionner avec Istio. Les ressources suivantes sont déployées :

- VirtualService : Configure le routage du trafic
- DestinationRule : Configure les politiques de gestion du trafic

```bash
# Vérifier les ressources Istio
kubectl get virtualservice -n <%= appNameKebab %>-ns
kubectl get destinationrule -n <%= appNameKebab %>-ns
```
<% } %>

<% if (configureMonitoring) { %>
## Monitoring

Cette application est configurée pour être surveillée par Prometheus. Un ServiceMonitor est déployé pour collecter les métriques depuis l'endpoint `/actuator/prometheus` :

```bash
# Vérifier le ServiceMonitor
kubectl get servicemonitor -n <%= appNameKebab %>-ns
```

Vous pouvez visualiser ces métriques dans Grafana en important le dashboard pour Spring Boot.
<% } %>

## Nettoyage

<% if (deploymentType === 'raw-manifests') { %>
```bash
# Supprimer toutes les ressources
kubectl delete -f kubernetes/base/
```
<% } else if (deploymentType === 'helm') { %>
```bash
# Désinstaller le chart
helm uninstall <%= appNameKebab %> -n <%= appNameKebab %>-ns
```
<% } else if (deploymentType === 'kustomize') { %>
```bash
# Supprimer les ressources déployées avec kustomize
kubectl delete -k kubernetes/kustomize/overlays/dev/
```
<% } %>

## Configuration avancée

Consultez la documentation spécifique à chaque composant pour des configurations plus avancées :

- [Documentation Kubernetes](https://kubernetes.io/docs/)
<% if (deploymentType === 'helm') { %>- [Documentation Helm](https://helm.sh/docs/)<% } %>
<% if (deploymentType === 'kustomize') { %>- [Documentation Kustomize](https://kubectl.docs.kubernetes.io/guides/introduction/kustomize/)<% } %>
<% if (enableServiceMesh) { %>- [Documentation Istio](https://istio.io/latest/docs/)<% } %>
<% if (configureMonitoring) { %>- [Documentation Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/getting-started.md)<% } %>
