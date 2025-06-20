#!/bin/bash
# Script de déploiement Blue/Green pour GitLab CI

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

echo -e "${YELLOW}Déploiement Blue/Green sur $DEPLOY_HOST pour l'environnement $ENV${NC}"

# Déployer les fichiers de configuration Kubernetes si nécessaire
if [ -d "k8s/$ENV" ]; then
    echo -e "${YELLOW}Copie des fichiers Kubernetes...${NC}"
    scp -r k8s/$ENV $DEPLOY_USER@$DEPLOY_HOST:/tmp/k8s-$ENV
fi

# Connexion SSH et exécution du déploiement
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    set -e
    echo "Déploiement Blue/Green pour $ENV..."

    # Vérifier kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "kubectl non trouvé. Installation nécessaire."
        exit 1
    fi

    # Vérifier le namespace
    kubectl get namespace $ENV || kubectl create namespace $ENV

    # Déterminer le slot actif (blue ou green)
    CURRENT_SLOT=\$(kubectl get service app-service -n $ENV -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "none")

    if [ "\$CURRENT_SLOT" == "blue" ] || [ "\$CURRENT_SLOT" == "none" ]; then
        NEW_SLOT="green"
        echo "Déploiement vers le slot GREEN (slot actuel: \$CURRENT_SLOT)"
    else
        NEW_SLOT="blue"
        echo "Déploiement vers le slot BLUE (slot actuel: \$CURRENT_SLOT)"
    fi

    # Préparer les fichiers de configuration
    cd /tmp/k8s-$ENV
    sed -i "s|IMAGE_PLACEHOLDER|$IMAGE|g" deployment-\$NEW_SLOT.yaml

    # Appliquer la configuration
    kubectl apply -f deployment-\$NEW_SLOT.yaml

    # Attendre que le déploiement soit prêt
    kubectl rollout status deployment/app-\$NEW_SLOT -n $ENV

    # Vérifier le health check
    READY=\$(kubectl get deployment app-\$NEW_SLOT -n $ENV -o jsonpath='{.status.readyReplicas}')
    if [ "\$READY" -lt "1" ]; then
        echo "Le déploiement n'est pas prêt. Rollback..."
        exit 1
    fi

    # Basculer le service
    kubectl apply -f service-switch-to-\$NEW_SLOT.yaml

    echo "Déploiement Blue/Green terminé avec succès!"

    # Nettoyer les ressources temporaires
    rm -rf /tmp/k8s-$ENV
EOF

echo -e "${GREEN}Déploiement Blue/Green terminé avec succès!${NC}"
