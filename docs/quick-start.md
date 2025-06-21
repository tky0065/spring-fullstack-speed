# Guide de démarrage rapide - Spring-Fullstack-Speed

Ce guide vous aidera à démarrer rapidement avec Spring-Fullstack-Speed pour générer une application fullstack basée sur Spring Boot.

## Prérequis

- **Node.js**: Version 16.x ou supérieure
- **Java**: JDK 17 ou supérieur
- **Maven** ou **Gradle**: Pour la construction des projets Spring Boot

## Installation

Installez Spring-Fullstack-Speed via npm :

```bash
npm install -g @enokdev/spring-fullstack-speed
```

## Commandes de base

### Créer une nouvelle application

```bash
# Utilisation interactive
sfs

# Utilisation avec des options spécifiques
sfs --app-name=my-app --package-name=com.example.myapp --build-tool=maven --database=postgresql --frontend=react
```

### Options principales

- `--app-name` : Nom de l'application (ex: my-awesome-app)
- `--package-name` : Nom du package Java (ex: com.example.myapp)
- `--build-tool` : Outil de build - `maven` ou `gradle`
- `--database` : Type de base de données - `h2`, `postgresql`, `mysql`, etc.
- `--frontend` : Framework frontend - `react`, `vue`, `angular` ou `none`
- `--auth` : Type d'authentification - `JWT` ou `OAuth2`
- `--features` : Fonctionnalités additionnelles (séparées par des virgules) - `docker`, `kubernetes`, `openapi`, etc.

## Exemples d'utilisation

### Créer une application Spring Boot avec React et PostgreSQL

```bash
sfs --app-name=todo-app --package-name=com.example.todo --build-tool=maven --database=postgresql --frontend=react --auth=JWT --features=docker,openapi
```

### Créer une application Spring Boot avec Angular et MySQL

```bash
sfs --app-name=blog-app --package-name=com.example.blog --build-tool=gradle --database=mysql --frontend=angular --auth=JWT --features=docker,openapi,i18n
```

### Créer une application Spring Boot avec Vue.js et MongoDB

```bash
sfs --app-name=user-management --package-name=com.example.users --build-tool=maven --database=mongodb --frontend=vue --auth=OAuth2 --features=docker,kubernetes,openapi
```

### Créer une application Spring Boot sans frontend (API Backend uniquement)

```bash
sfs --app-name=microservice-api --package-name=com.example.api --build-tool=gradle --database=postgresql --frontend=none --auth=JWT --features=docker,openapi,swagger
```

### Ajouter une entité au projet existant

Naviguez d'abord dans le répertoire de votre projet, puis exécutez :

```bash
sfs entity --name=Product --fields=name:string,description:text,price:decimal,category:string
```

### Générer des opérations CRUD pour une entité existante

```bash
sfs crud --entity=Product --repository=true --service=true --controller=true --rest=true
```

### Générer des DTOs pour une entité

```bash
sfs dtos --entity=Product --mappings=true --validation=true
```

### Ajouter la configuration Docker à un projet existant

```bash
sfs container --type=docker --database=true --frontend=true --port=8080
```

## Structure du projet généré

Voici un aperçu de la structure typique d'un projet généré par Spring-Fullstack-Speed :

```
my-app/
├── .github/            # Configuration CI/CD GitHub (si activée)
├── src/
│   ├── main/
│   │   ├── java/com/example/myapp/
│   │   │   ├── config/        # Configuration Spring
│   │   │   ├── controller/    # Contrôleurs REST
│   │   │   ├── entity/        # Entités JPA
│   │   │   ├── repository/    # Repositories Spring Data
│   │   │   ├── service/       # Couche service
│   │   │   ├── dto/           # Objets de transfert de données
│   │   │   ├── exception/     # Gestion des exceptions
│   │   │   ├── util/          # Classes utilitaires
│   │   │   └── Application.java  # Point d'entrée
│   │   └── resources/
│   │       ├── static/        # Ressources statiques
│   │       └── application.properties  # Configuration
│   └── test/                  # Tests unitaires et d'intégration
├── frontend/                  # Code frontend (React/Angular/Vue)
├── docker/                    # Configuration Docker
│   ├── Dockerfile
│   └── docker-compose.yml
├── kubernetes/                # Manifestes Kubernetes (si activés)
└── pom.xml ou build.gradle    # Configuration du build
```

## Étapes suivantes

Après avoir généré votre application, vous pouvez :

1. Explorer le code généré pour comprendre sa structure
2. Lancer l'application avec les commandes standard de Spring Boot
3. Ajouter de nouvelles entités et fonctionnalités selon vos besoins
4. Consulter la [documentation complète](./README.md) pour des informations détaillées

## Ressources additionnelles

- [Documentation complète des commandes](./commands.md)
- [Guide des entités](./entities.md)
- [Guide des DTOs](./dtos.md)
- [Cas d'utilisation courants](./use-cases.md)
