#!/bin/bash
# Script de déploiement Canary pour Jenkins

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

echo -e "${YELLOW}Déploiement Canary pour l'environnement $ENV${NC}"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl non trouvé. Installation nécessaire.${NC}"
    exit 1
fi

# Vérifier le namespace
kubectl get namespace $ENV || kubectl create namespace $ENV

# Préparer les fichiers de configuration
cd /tmp/k8s/$ENV
sed -i "s|IMAGE_PLACEHOLDER|$IMAGE|g" deployment-canary.yaml

# Déployer la version canary (10% du trafic)
kubectl apply -f deployment-canary.yaml
kubectl apply -f service-canary.yaml

# Attendre que le déploiement canary soit prêt
kubectl rollout status deployment/app-canary -n $ENV

# Vérifier le health check
READY=$(kubectl get deployment app-canary -n $ENV -o jsonpath='{.status.readyReplicas}')
if [ "$READY" -lt "1" ]; then
    echo -e "${RED}Le déploiement canary n'est pas prêt. Rollback...${NC}"
    kubectl delete -f deployment-canary.yaml
    exit 1
fi

echo -e "${GREEN}Déploiement Canary terminé avec succès!${NC}"
echo -e "${YELLOW}La version canary reçoit maintenant 10% du trafic.${NC}"
echo -e "${YELLOW}Surveillez les métriques et utilisez promote-canary.sh pour la promotion complète.${NC}"
