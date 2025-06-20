#!/bin/bash
# Script de déploiement Blue/Green pour Jenkins

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

echo -e "${YELLOW}Déploiement Blue/Green pour l'environnement $ENV${NC}"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl non trouvé. Installation nécessaire.${NC}"
    exit 1
fi

# Vérifier le namespace
kubectl get namespace $ENV || kubectl create namespace $ENV

# Déterminer le slot actif (blue ou green)
CURRENT_SLOT=$(kubectl get service app-service -n $ENV -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "none")

if [ "$CURRENT_SLOT" == "blue" ] || [ "$CURRENT_SLOT" == "none" ]; then
    NEW_SLOT="green"
    echo -e "${YELLOW}Déploiement vers le slot GREEN (slot actuel: $CURRENT_SLOT)${NC}"
else
    NEW_SLOT="blue"
    echo -e "${YELLOW}Déploiement vers le slot BLUE (slot actuel: $CURRENT_SLOT)${NC}"
fi

# Préparer les fichiers de configuration
cd /tmp/k8s/$ENV
sed -i "s|IMAGE_PLACEHOLDER|$IMAGE|g" deployment-$NEW_SLOT.yaml

# Appliquer la configuration
kubectl apply -f deployment-$NEW_SLOT.yaml

# Attendre que le déploiement soit prêt
kubectl rollout status deployment/app-$NEW_SLOT -n $ENV

# Vérifier le health check
READY=$(kubectl get deployment app-$NEW_SLOT -n $ENV -o jsonpath='{.status.readyReplicas}')
if [ "$READY" -lt "1" ]; then
    echo -e "${RED}Le déploiement n'est pas prêt. Rollback...${NC}"
    exit 1
fi

# Basculer le service
kubectl apply -f service-switch-to-$NEW_SLOT.yaml

echo -e "${GREEN}Déploiement Blue/Green terminé avec succès!${NC}"
