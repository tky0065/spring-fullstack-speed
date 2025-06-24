# TODO Liste des corrections à apporter au générateur Spring-Fullstack-Speed

## Problèmes identifiés

D'après les erreurs dans errors.txt, les problèmes suivants ont été identifiés lors de la génération du projet :

1. ❌ Erreur lors de la génération du fichier pom.xml (bien que le fichier semble présent)
2. ❌ Erreur lors de la génération du fichier AppApplication.java (bien que le fichier semble présent)
3. Fonctionnalités d'authentification JWT potentiellement incomplètes (dossier security/jwt existe mais pourrait être vide ou incomplet)

## Tâches à réaliser

### 1. Vérification de la structure des générateurs
- [x] Examiner la structure complète du dossier `generators/`
- [x] Vérifier les templates utilisés pour la génération des fichiers
- [x] Analyser les logs de génération pour identifier les erreurs spécifiques

### 2. Correction du générateur de fichier pom.xml
- [x] Examiner le contenu actuel du fichier pom.xml généré
- [x] Vérifier le template utilisé pour la génération du fichier pom.xml
- [x] Identifier la cause de l'erreur lors de la génération
- [x] Corriger le template ou le code de génération

### 3. Correction du générateur de fichier AppApplication.java
- [x] Examiner le contenu actuel du fichier AppApplication.java généré
- [x] Vérifier le template `generators/app/templates/Application.java.ejs`
- [x] Identifier pourquoi une erreur est signalée lors de la génération
- [x] Corriger le template ou le code de génération

### 4. Implémentation correcte de l'authentification JWT
- [x] Vérifier le contenu actuel du dossier security/jwt dans le projet généré
- [x] S'assurer que tous les fichiers nécessaires sont générés:
  - [x] JwtTokenProvider
  - [x] JwtAuthenticationFilter
  - [x] SecurityConfig
  - [x] UserDetailsService implementation
  - [x] Classes d'utilisateur et rôles
- [x] Corriger les templates ou le code de génération pour l'authentification

### 5. Configuration Kubernetes
- [x] Examiner les fichiers Kubernetes générés dans le dossier test-generator-folder/kubernetes
- [x] Vérifier que les fichiers deployment.yaml et service.yaml sont correctement configurés
- [x] S'assurer que la structure de base/overlays est correctement générée pour kustomize
- [x] Corriger les templates si nécessaires

### 6. Vérification de la génération Docker
- [x] Examiner les fichiers Docker générés dans le dossier test-generator-folder
- [x] Vérifier que les Dockerfiles et docker-compose sont correctement générés et configurés
- [x] Tester la construction des images Docker pour détecter d'éventuels problèmes
- [x] Corriger les templates si nécessaires

### 7. Validation de la configuration OpenAPI/Swagger
- [x] Examiner les fichiers de configuration OpenAPI dans src/main/java/com/dev/app/config
- [x] Vérifier que les URLs et configurations dans OpenApiConfig.java et SwaggerUIConfig.java sont correctes
- [x] S'assurer que les annotations OpenAPI sont présentes dans les contrôleurs

### 8. Quand on choisit React les fichiers ne sont pas générés
- [x] Vérifier le template de génération pour React
- [x] S'assurer que les fichiers React sont correctement générés dans le dossier frontend
- [x] Corriger les templates ou le code de génération pour React

### 9. Tests de génération
- [ ] Effectuer un test complet de génération après chaque correction
- [ ] Documenter les résultats des tests
- [ ] Vérifier que tous les fichiers sont générés sans erreurs

### 10. Amélioration des templates Java avec Lombok
- [x] Intégrer Lombok dans les templates pour réduire le code boilerplate
- [x] Mettre à jour les templates d'entités et de DTOs pour utiliser les annotations Lombok
- [x] Vérifier que les dépendances Lombok sont correctement ajoutées dans le pom.xml

## Instructions pour les tests

Avant de commencer chaque tâche, exécuter les commandes suivantes pour voir l'état actuel des fichiers générateurs et du projet généré :

```bash
# Examiner la structure des générateurs
find ./generators -name "*.ts" | sort
find ./generators -name "*.ejs" | sort

# Examiner le contenu des fichiers problématiques
cat ./test-generator-folder/pom.xml
cat ./test-generator-folder/src/main/java/com/dev/app/AppApplication.java
```

Une fois une tâche terminée, la marquer comme complétée en remplaçant `[ ]` par `[x]`.

## Fichiers à examiner en priorité

1. Les templates de base pour générer pom.xml et AppApplication.java
2. Les templates pour l'authentification JWT
3. Les fichiers de configuration Docker et Kubernetes
