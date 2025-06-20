# Guide de dépannage CI/CD

Ce document vous aide à diagnostiquer et résoudre les problèmes courants rencontrés dans les pipelines CI/CD.

## Table des matières

1. [Problèmes généraux](#problèmes-généraux)
2. [Problèmes spécifiques par outil](#problèmes-spécifiques-par-outil)
3. [Problèmes de build](#problèmes-de-build)
4. [Problèmes de tests](#problèmes-de-tests)
5. [Problèmes de Docker](#problèmes-de-docker)
6. [Problèmes de déploiement](#problèmes-de-déploiement)

## Problèmes généraux

### Le pipeline échoue sans raison claire

**Symptôme** : Le pipeline échoue sans message d'erreur explicite.

**Solutions** :
1. Vérifiez les logs complets du pipeline
2. Augmentez le niveau de verbosité des logs
3. Exécutez localement l'étape qui échoue pour reproduire le problème
4. Vérifiez les ressources disponibles (mémoire, CPU, espace disque)

### Le pipeline est lent

**Symptôme** : Le pipeline prend beaucoup de temps à s'exécuter.

**Solutions** :
1. Identifiez les étapes les plus lentes et optimisez-les
2. Utilisez ou augmentez le cache des dépendances
3. Parallélisez les tâches indépendantes
4. Utilisez des images Docker pré-construites avec les dépendances
5. Ajustez les ressources allouées aux runners/agents

### Échec intermittent

**Symptôme** : Le pipeline échoue parfois sans raison apparente.

**Solutions** :
1. Identifiez les tests non déterministes (flaky tests)
2. Vérifiez les dépendances externes (API, services)
3. Configurez des retry automatiques pour les étapes instables
4. Vérifiez la stabilité des ressources (runners, agents)

## Problèmes spécifiques par outil

<% if (ciTools.includes('github')) { %>
### GitHub Actions

**Problème**: Permissions insuffisantes

**Solution**: Vérifiez les permissions du workflow dans le fichier YAML:
```yaml
permissions:
  contents: read
  packages: write
```

**Problème**: Échec lors de l'utilisation des secrets

**Solution**: Vérifiez que les secrets sont correctement configurés dans Settings > Secrets and variables > Actions

**Problème**: Actions limitées par rate limiting

**Solution**: Utilisez GitHub-hosted runners plus puissants ou configurez des self-hosted runners
<% } %>

<% if (ciTools.includes('gitlab')) { %>
### GitLab CI

**Problème**: Le pipeline ne démarre pas

**Solution**: Vérifiez que les runners sont configurés et actifs dans Settings > CI/CD > Runners

**Problème**: Variables non accessibles

**Solution**: Vérifiez la portée des variables (global vs. specific environment) dans Settings > CI/CD > Variables

**Problème**: Échec des jobs en cascade

**Solution**: Utilisez `allow_failure: true` pour les jobs non critiques
<% } %>

<% if (ciTools.includes('jenkins')) { %>
### Jenkins

**Problème**: Le pipeline ne peut pas accéder aux credentials

**Solution**: Vérifiez les permissions du job et le contexte d'utilisation des credentials

**Problème**: Espace disque insuffisant

**Solution**: Nettoyez régulièrement l'espace de travail avec l'option `cleanWs()`

**Problème**: Agent déconnecté pendant l'exécution

**Solution**: Configurez une reconnexion automatique et des timeouts plus longs
<% } %>

## Problèmes de build

### Erreurs de compilation

**Symptôme**: Le build échoue avec des erreurs de compilation.

**Solutions**:
1. Vérifiez que le code compile localement
2. Assurez-vous que les versions de Java/Maven/Gradle sont compatibles
3. Vérifiez la configuration du build dans le pipeline
4. Examinez les erreurs de compilation spécifiques dans les logs

### Problèmes de dépendances

**Symptôme**: Le build échoue avec des erreurs de dépendances.

**Solutions**:
1. Vérifiez la connectivité aux registres de dépendances (Maven Central, etc.)
2. Assurez-vous que toutes les dépendances sont accessibles
3. Utilisez des miroirs locaux si nécessaire
4. Vérifiez les conflits de dépendances

## Problèmes de tests

### Tests qui échouent dans le pipeline mais pas localement

**Symptôme**: Les tests passent localement mais échouent dans le pipeline.

**Solutions**:
1. Vérifiez les différences d'environnement (variables, timezone, locale)
2. Recherchez des tests dépendant d'un état spécifique
3. Vérifiez les ressources disponibles (mémoire, CPU)
4. Augmentez les timeouts pour les tests lents

### Tests intermittents (flaky)

**Symptôme**: Certains tests échouent de manière aléatoire.

**Solutions**:
1. Isolez les tests problématiques
2. Ajoutez des logs de diagnostic
3. Augmentez les timeouts
4. Réécrivez les tests pour éliminer les dépendances externes
5. Marquez-les comme @Flaky et configurez des retry

## Problèmes de Docker

### Erreur "permission denied"

**Symptôme**: Les commandes Docker échouent avec "permission denied".

**Solutions**:
1. Assurez-vous que l'utilisateur a les permissions Docker
2. Ajoutez l'utilisateur au groupe Docker
3. Utilisez sudo (si possible dans votre environnement CI)

### Images Docker trop grandes

**Symptôme**: Le build et le push des images prennent trop de temps.

**Solutions**:
1. Utilisez des multi-stage builds
2. Choisissez des images de base plus légères (Alpine)
3. Nettoyez les caches et fichiers temporaires
4. Utilisez .dockerignore pour exclure les fichiers inutiles

### Erreur "image not found"

**Symptôme**: Le pipeline ne trouve pas une image Docker.

**Solutions**:
1. Vérifiez les credentials du registry Docker
2. Assurez-vous que l'image existe avec le tag spécifié
3. Vérifiez la connectivité au registry Docker

## Problèmes de déploiement

### Échec lors du déploiement SSH

**Symptôme**: Le déploiement échoue lors de la connexion SSH.

**Solutions**:
1. Vérifiez les credentials SSH et leur format
2. Assurez-vous que l'hôte cible est accessible
3. Vérifiez que la clé publique est dans le fichier authorized_keys
4. Désactivez temporairement StrictHostKeyChecking

### Problèmes de permissions sur le serveur

**Symptôme**: Le déploiement échoue avec des erreurs de permission.

**Solutions**:
1. Vérifiez les permissions de l'utilisateur de déploiement
2. Assurez-vous que les répertoires ont les bonnes permissions
3. Utilisez sudo pour les commandes nécessitant plus de privilèges

### Erreur Kubernetes

**Symptôme**: Les déploiements Kubernetes échouent.

**Solutions**:
1. Vérifiez la configuration du kubeconfig
2. Assurez-vous que le cluster est accessible
3. Vérifiez les permissions RBAC
4. Utilisez `kubectl describe` pour diagnostiquer les problèmes
5. Examinez les logs des pods

### Rollback automatique après déploiement

**Symptôme**: Le déploiement est automatiquement annulé peu après son démarrage.

**Solutions**:
1. Vérifiez les health checks et leur configuration
2. Examinez les logs de l'application
3. Assurez-vous que toutes les dépendances sont disponibles
4. Vérifiez que les variables d'environnement sont correctement définies

---

Si vous rencontrez un problème qui n'est pas couvert ici, n'hésitez pas à consulter la documentation spécifique de l'outil CI/CD que vous utilisez, ou à demander de l'aide à la communauté.
