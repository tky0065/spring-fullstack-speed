#!/bin/bash
# Script de déploiement Canary pour GitLab CI

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arguments
DEPLOY_HOST=$1
DEPLOY_USER=$2
ENV=$3
IMAGE=$4

if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$ENV" ] || [ -z "$IMAGE" ]; then
    echo -e "${RED}Erreur: Tous les paramètres sont requis${NC}"
    echo "Usage: $0 <DEPLOY_HOST> <DEPLOY_USER> <ENV> <IMAGE>"
    exit 1
fi

echo -e "${YELLOW}Déploiement Canary sur $DEPLOY_HOST pour l'environnement $ENV${NC}"

# Déployer les fichiers de configuration Kubernetes si nécessaire
if [ -d "k8s/$ENV" ]; then
    echo -e "${YELLOW}Copie des fichiers Kubernetes...${NC}"
    scp -r k8s/$ENV $DEPLOY_USER@$DEPLOY_HOST:/tmp/k8s-$ENV
fi

# Connexion SSH et exécution du déploiement
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    set -e
    echo "Déploiement Canary pour $ENV..."

    # Vérifier kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "kubectl non trouvé. Installation nécessaire."
        exit 1
    fi

    # Vérifier le namespace
    kubectl get namespace $ENV || kubectl create namespace $ENV

    # Préparer les fichiers de configuration
    cd /tmp/k8s-$ENV
    sed -i "s|IMAGE_PLACEHOLDER|$IMAGE|g" deployment-canary.yaml

    # Déployer la version canary (10% du trafic)
    kubectl apply -f deployment-canary.yaml
    kubectl apply -f service-canary.yaml

    # Attendre que le déploiement canary soit prêt
    kubectl rollout status deployment/app-canary -n $ENV

    # Vérifier le health check
    READY=\$(kubectl get deployment app-canary -n $ENV -o jsonpath='{.status.readyReplicas}')
    if [ "\$READY" -lt "1" ]; then
        echo "Le déploiement canary n'est pas prêt. Rollback..."
        kubectl delete -f deployment-canary.yaml
        exit 1
    fi

    echo "Déploiement Canary terminé avec succès!"
    echo "La version canary reçoit maintenant 10% du trafic."
    echo "Surveillez les métriques et exécutez la promotion manuelle si tout va bien."

    # Note: La promotion complète sera effectuée manuellement après validation
EOF

echo -e "${GREEN}Déploiement Canary terminé avec succès!${NC}"
echo -e "${YELLOW}La version canary reçoit maintenant 10% du trafic.${NC}"
echo -e "${YELLOW}Pour promouvoir la version canary à 100% du trafic, exécutez:${NC}"
echo -e "${GREEN}./promote-canary.sh $DEPLOY_HOST $DEPLOY_USER $ENV $IMAGE${NC}"
