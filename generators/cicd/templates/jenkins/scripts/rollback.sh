#!/bin/bash
# Script de rollback pour Jenkins

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arguments
ENV=$1
STRATEGY=$2  # blue-green ou canary

if [ -z "$ENV" ] || [ -z "$STRATEGY" ]; then
    echo -e "${RED}Erreur: Tous les paramètres sont requis${NC}"
    echo "Usage: $0 <ENV> <STRATEGY>"
    exit 1
fi

echo -e "${YELLOW}Rollback pour l'environnement $ENV avec stratégie $STRATEGY${NC}"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl non trouvé. Installation nécessaire.${NC}"
    exit 1
fi

# Vérifier le namespace
kubectl get namespace $ENV || {
    echo -e "${RED}Namespace $ENV n'existe pas. Impossible de faire un rollback.${NC}"
    exit 1
}

if [ "$STRATEGY" == "blue-green" ]; then
    # Déterminer le slot actif (blue ou green)
    CURRENT_SLOT=$(kubectl get service app-service -n $ENV -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "none")

    if [ "$CURRENT_SLOT" == "blue" ]; then
        PREVIOUS_SLOT="green"
    elif [ "$CURRENT_SLOT" == "green" ]; then
        PREVIOUS_SLOT="blue"
    else
        echo -e "${RED}Aucun slot actif trouvé. Impossible de faire un rollback.${NC}"
        exit 1
    fi

    # Vérifier si le slot précédent existe
    kubectl get deployment app-$PREVIOUS_SLOT -n $ENV || {
        echo -e "${RED}Le déploiement app-$PREVIOUS_SLOT n'existe pas. Impossible de faire un rollback.${NC}"
        exit 1
    }

    echo -e "${YELLOW}Rollback du slot $CURRENT_SLOT vers $PREVIOUS_SLOT${NC}"

    # Basculer le service vers le slot précédent
    cd /tmp/k8s/$ENV
    kubectl apply -f service-switch-to-$PREVIOUS_SLOT.yaml

    echo -e "${GREEN}Rollback Blue/Green terminé avec succès!${NC}"

elif [ "$STRATEGY" == "canary" ]; then
    # Vérifier si le déploiement de production existe
    kubectl get deployment app-production -n $ENV || {
        echo -e "${RED}Le déploiement app-production n'existe pas. Impossible de faire un rollback.${NC}"
        exit 1
    }

    # Supprimer le déploiement canary s'il existe
    kubectl delete deployment app-canary -n $ENV --ignore-not-found=true

    # Obtenir la version précédente (avant canary)
    PREVIOUS_VERSION=$(kubectl get deployment app-production -n $ENV -o jsonpath='{.metadata.annotations.previous-version}' 2>/dev/null || echo "")

    if [ -n "$PREVIOUS_VERSION" ]; then
        echo -e "${YELLOW}Rollback vers la version précédente: $PREVIOUS_VERSION${NC}"

        # Mettre à jour le déploiement de production avec l'ancienne image
        kubectl set image deployment/app-production app=$PREVIOUS_VERSION -n $ENV

        # Attendre que le rollback soit terminé
        kubectl rollout status deployment/app-production -n $ENV

        echo -e "${GREEN}Rollback Canary terminé avec succès!${NC}"
    else
        echo -e "${RED}Aucune version précédente trouvée. Impossible de faire un rollback.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Stratégie de déploiement non reconnue: $STRATEGY${NC}"
    echo -e "${YELLOW}Les stratégies supportées sont: blue-green, canary${NC}"
    exit 1
fi
