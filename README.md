# Spring-Fullstack-Speed (SFS)

> Générateur rapide d'applications fullstack avec Spring Boot et divers frameworks frontend

SFS est un générateur de code CLI basé sur Yeoman qui permet de créer rapidement des applications web fullstack modernes avec Spring Boot comme backend et divers frameworks frontend (React, Vue.js, Angular, Thymeleaf, JTE). Inspiré par JHipster, ce projet vise à simplifier et accélérer le développement d'applications Java enterprise en automatisant la génération de code boilerplate et l'intégration des technologies modernes.

## Installation

```bash
# Installation globale
npm install -g @enokdev/spring-fullstack-speed

# Ou utilisation directe avec npx
npx @enokdev/spring-fullstack-speed
```

## Utilisation

### Générer une nouvelle application

```bash
# Génère une nouvelle application avec les options interactives
sfs

# Ou avec le nom explicite du générateur
sfs app
```

### Générer une nouvelle entité

```bash
# Génère une nouvelle entité avec les options interactives
sfs entity

# Ou avec le nom de l'entité
sfs entity --name User
```

### Générer des opérations CRUD

```bash
# Génère des opérations CRUD pour une entité existante
sfs crud --entity User
```

### Générer un module fonctionnel

```bash
# Génère un nouveau module fonctionnel
sfs module --name Payment
```

## Options

```
--help, -h     : Affiche l'aide
--version, -v  : Affiche la version du générateur
--skip-install : Saute l'installation des dépendances
```

## Fonctionnalités

- ✅ Génération d'applications Spring Boot complètes
- ✅ Support pour différents frameworks frontend (React, Vue, Angular, Thymeleaf, JTE)
- ✅ Intégration avec Spring Security pour l'authentification
- ✅ Génération d'API REST avec documentation OpenAPI/Swagger
- ✅ Support pour différentes bases de données (MySQL, PostgreSQL, MongoDB, H2)
- ✅ Intégration Docker et Kubernetes
- ✅ Tests automatisés
- ✅ Et bien plus encore!

## Technologies supportées

### Backend
- Spring Boot 3.x
- Spring Security 6.x
- Spring Data JPA
- Inertia4j
- JWT
- OpenAPI 3.0

### Frontend
- React 18+ avec Inertia.js
- Vue.js 3+ avec Inertia.js
- Angular 19+ avec Standalone API
- Thymeleaf 3.x
- JTE templates

## Licence

ISC
