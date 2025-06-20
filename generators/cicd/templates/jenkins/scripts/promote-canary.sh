#!/bin/bash
# Script de promotion canary pour Jenkins

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arguments
ENV=$1
IMAGE=$2

if [ -z "$ENV" ] || [ -z "$IMAGE" ]; then
    echo -e "${RED}Erreur: Tous les paramètres sont requis${NC}"
    echo "Usage: $0 <ENV> <IMAGE>"
    exit 1
fi

echo -e "${YELLOW}Promotion du déploiement Canary pour l'environnement $ENV${NC}"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl non trouvé. Installation nécessaire.${NC}"
    exit 1
fi

# Vérifier le namespace
kubectl get namespace $ENV || {
    echo -e "${RED}Namespace $ENV n'existe pas.${NC}"
    exit 1
}

# Vérifier si le déploiement canary existe
kubectl get deployment app-canary -n $ENV || {
    echo -e "${RED}Le déploiement canary n'existe pas. Impossible de faire une promotion.${NC}"
    exit 1
}

# Préparer les fichiers de configuration
cd /tmp/k8s/$ENV
sed -i "s|IMAGE_PLACEHOLDER|$IMAGE|g" deployment-production.yaml

# Sauvegarder l'ancienne version comme annotation pour permettre le rollback
CURRENT_IMAGE=$(kubectl get deployment app-production -n $ENV -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
if [ -n "$CURRENT_IMAGE" ]; then
    # Sauvegarde de l'image actuelle comme annotation pour le rollback
    kubectl annotate deployment app-production -n $ENV previous-version="$CURRENT_IMAGE" --overwrite
fi

# Promouvoir canary à la production complète
kubectl apply -f deployment-production.yaml
kubectl apply -f service-production.yaml

# Attendre que le déploiement soit prêt
kubectl rollout status deployment/app-production -n $ENV

# Vérifier le health check
READY=$(kubectl get deployment app-production -n $ENV -o jsonpath='{.status.readyReplicas}')
if [ "$READY" -lt "1" ]; then
    echo -e "${RED}Le déploiement n'est pas prêt. Rollback...${NC}"

    if [ -n "$CURRENT_IMAGE" ]; then
        kubectl set image deployment/app-production app=$CURRENT_IMAGE -n $ENV
        kubectl rollout status deployment/app-production -n $ENV
    fi

    exit 1
fi

# Supprimer la version canary
kubectl delete deployment app-canary -n $ENV

echo -e "${GREEN}Promotion Canary terminée avec succès!${NC}"
echo -e "${GREEN}Le déploiement est maintenant en production à 100%.${NC}"
