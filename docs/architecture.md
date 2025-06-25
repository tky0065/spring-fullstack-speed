# Architecture de Spring-Fullstack-Speed

## Vue d'ensemble

Spring-Fullstack-Speed (SFS) est un générateur CLI basé sur Yeoman qui crée des applications fullstack modernes avec Spring Boot et divers frameworks frontend. Ce document présente l'architecture globale du générateur et de l'application générée.

## Architecture du générateur

### Structure principale

```
generators/
├── app/ - Générateur principal
│   ├── index.ts - Point d'entrée
│   ├── questions.ts - Prompts utilisateur
│   ├── generator-methods.ts - Méthodes de génération
│   └── templates/ - Templates EJS
├── entity/ - Générateur d'entités
├── crud/ - Générateur CRUD
├── dtos/ - Générateur de DTOs
└── ... autres sous-générateurs
```

### Flux d'exécution

1. **Initialisation** : L'utilisateur lance une commande `sfs [generateur]`
2. **Questions** : Le générateur pose des questions via Inquirer
3. **Configuration** : Les réponses sont transformées en configuration
4. **Génération** : Les templates sont rendus avec les données de configuration
5. **Installation** : Les dépendances sont installées si nécessaire

### Principes de conception

- **Modularité** : Chaque sous-générateur est indépendant mais partage des utilitaires communs
- **Composition** : Les générateurs peuvent s'appeler entre eux
- **Configuration** : Toutes les préférences sont stockées et réutilisées
- **Extension** : Architecture plugin pour ajouter de nouvelles fonctionnalités

## Architecture de l'application générée

### Backend (Spring Boot)

```
src/main/java/com/example/app/
├── config/ - Configuration Spring
│   ├── SecurityConfig.java
│   └── ... 
├── domain/ - Entités JPA
├── repository/ - Spring Data repositories
├── service/ - Couche service
├── controller/ - REST controllers
├── dto/ - Data Transfer Objects
└── security/ - Configuration sécurité
```

### Frontend (React/Angular/Vue/Thymeleaf/JTE)

```
src/main/webapp/ (ou frontend/)
├── components/ - Composants UI
├── services/ - Services API
├── pages/ - Pages principales
└── ... structure spécifique au framework
```

### Composants d'infrastructure

```
kubernetes/ - Manifests Kubernetes
├── base/ - Configuration de base
└── overlays/ - Configurations spécifiques aux environnements

docker/ - Configuration Docker
├── Dockerfile
└── docker-compose.yml
```

## Flux de données et communication

```
Frontend <--> REST API <--> Services <--> Repositories <--> Base de données
```

### Technologies d'intégration

- **API REST** : Communication standard client-serveur
- **WebSocket** : Pour les fonctionnalités temps réel
- **GraphQL** : Pour les requêtes flexibles (option)

## Sécurité

L'architecture sécurité s'appuie sur Spring Security avec :

- **JWT** : Authentification sans état
- **OAuth2/OIDC** : Authentification fédérée (option)
- **RBAC** : Contrôle d'accès basé sur les rôles

## Extensibilité

Le système est conçu pour être étendu via :

1. **Générateurs personnalisés** : Création de nouveaux sous-générateurs
2. **Templates personnalisés** : Modification des templates existants
3. **Hooks** : Points d'extension à différentes étapes de la génération

## Monitoring et observabilité

L'application générée intègre :

- **Micrometer** : Collecte de métriques
- **Spring Boot Actuator** : Endpoints de monitoring
- **Prometheus/Grafana** : Visualisation (option)

## Déploiement

L'architecture supporte plusieurs modèles de déploiement :

- **Monolithique** : Application unique
- **Microservices** : Services indépendants
- **Cloud-native** : Déploiement sur Kubernetes, Cloud Foundry, etc.

## Conclusion

Cette architecture assure une génération cohérente d'applications robustes et maintenables, tout en offrant la flexibilité nécessaire pour s'adapter à différents cas d'utilisation et technologies.
