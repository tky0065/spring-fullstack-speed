#!/bin/bash
# Script de rollback pour GitLab CI

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
STRATEGY=$4  # blue-green ou canary

if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$ENV" ] || [ -z "$STRATEGY" ]; then
    echo -e "${RED}Erreur: Tous les paramètres sont requis${NC}"
    echo "Usage: $0 <DEPLOY_HOST> <DEPLOY_USER> <ENV> <STRATEGY>"
    exit 1
fi

echo -e "${YELLOW}Rollback sur $DEPLOY_HOST pour l'environnement $ENV avec stratégie $STRATEGY${NC}"

# Connexion SSH et exécution du rollback
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    set -e
    echo "Rollback pour $ENV avec stratégie $STRATEGY..."

    # Vérifier kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "kubectl non trouvé. Installation nécessaire."
        exit 1
    fi

    # Vérifier le namespace
    kubectl get namespace $ENV || {
        echo "Namespace $ENV n'existe pas. Impossible de faire un rollback."
        exit 1
    }

    if [ "$STRATEGY" == "blue-green" ]; then
        # Déterminer le slot actif (blue ou green)
        CURRENT_SLOT=\$(kubectl get service app-service -n $ENV -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "none")

        if [ "\$CURRENT_SLOT" == "blue" ]; then
            PREVIOUS_SLOT="green"
        elif [ "\$CURRENT_SLOT" == "green" ]; then
            PREVIOUS_SLOT="blue"
        else
            echo "Aucun slot actif trouvé. Impossible de faire un rollback."
            exit 1
        fi

        # Vérifier si le slot précédent existe
        kubectl get deployment app-\$PREVIOUS_SLOT -n $ENV || {
            echo "Le déploiement app-\$PREVIOUS_SLOT n'existe pas. Impossible de faire un rollback."
            exit 1
        }

        echo "Rollback du slot \$CURRENT_SLOT vers \$PREVIOUS_SLOT"

        # Basculer le service vers le slot précédent
        kubectl patch service app-service -n $ENV -p '{"spec":{"selector":{"slot":"\$PREVIOUS_SLOT"}}}'

        echo "Rollback Blue/Green terminé avec succès!"

    elif [ "$STRATEGY" == "canary" ]; then
        # Vérifier si le déploiement de production existe
        kubectl get deployment app-production -n $ENV || {
            echo "Le déploiement app-production n'existe pas. Impossible de faire un rollback."
            exit 1
        }

        # Supprimer le déploiement canary s'il existe
        kubectl delete deployment app-canary -n $ENV --ignore-not-found=true

        # Obtenir la version précédente (avant canary)
        PREVIOUS_VERSION=\$(kubectl get deployment app-production -n $ENV -o jsonpath='{.metadata.annotations.previous-version}' 2>/dev/null || echo "")

        if [ -n "\$PREVIOUS_VERSION" ]; then
            echo "Rollback vers la version précédente: \$PREVIOUS_VERSION"

            # Mettre à jour le déploiement de production avec l'ancienne image
            kubectl set image deployment/app-production app=\$PREVIOUS_VERSION -n $ENV

            # Attendre que le rollback soit terminé
            kubectl rollout status deployment/app-production -n $ENV
        else
            echo "Aucune version précédente trouvée. Impossible de faire un rollback."
            exit 1
        fi

        echo "Rollback Canary terminé avec succès!"
    else
        echo "Stratégie de déploiement non reconnue: $STRATEGY"
        echo "Les stratégies supportées sont: blue-green, canary"
        exit 1
    fi
EOF

echo -e "${GREEN}Rollback terminé avec succès!${NC}"
