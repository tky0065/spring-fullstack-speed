# Spring-Fullstack-Speed (SFS)

> Générateur rapide d'applications fullstack avec Spring Boot et divers frameworks frontend

SFS est un générateur de code CLI basé sur Yeoman qui permet de créer rapidement des applications web fullstack modernes avec Spring Boot comme backend et divers frameworks frontend (React, Vue.js, Angular, Thymeleaf, JTE). Inspiré par JHipster, ce projet vise à simplifier et accélérer le développement d'applications Java enterprise en automatisant la génération de code boilerplate et l'intégration des technologies modernes.

## 📋 Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
  - [Générer une application](#générer-une-nouvelle-application)
  - [Générer une entité](#générer-une-nouvelle-entité)
  - [Générer des DTOs](#générer-des-dtos)
  - [Générer des opérations CRUD](#générer-des-opérations-crud)
  - [Générer un module](#générer-un-module-fonctionnel)
- [Technologies supportées](#technologies-supportées)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Développement](#développement)
- [Contribuer](#contribuer)
- [Licence](#licence)

## 🚀 Installation

```bash
# Installation globale
npm install -g @enokdev/spring-fullstack-speed

# Ou utilisation directe avec npx
npx @enokdev/spring-fullstack-speed
```

## 🛠️ Utilisation

### Générer une nouvelle application

```bash
# Génère une nouvelle application avec les options interactives
sfs

# Ou avec le nom explicite du générateur
sfs app
```

Vous serez guidé à travers plusieurs questions pour configurer votre application :
- Nom de l'application
- Nom du package Java
- Outil de build (Maven ou Gradle)
- Framework frontend
- Base de données
- Options d'authentification
- Fonctionnalités supplémentaires

### Générer une nouvelle entité

```bash
# Génère une nouvelle entité avec les options interactives
sfs entity

# Ou avec le nom de l'entité
sfs entity --entity-name User --package-name com.example.domain
```

### Générer des DTOs

```bash
# Génère des DTOs pour une entité existante
sfs dtos --entity-name Product
```

### Générer des opérations CRUD

```bash
# Génère des opérations CRUD pour une entité existante
sfs crud --entity-name User
```

### Générer un module fonctionnel

```bash
# Génère un nouveau module fonctionnel
sfs module --module-name Payment
```

## 🔧 Technologies supportées

### Backend
- **Spring Boot** : dernières versions supportées
- **Spring Security** : JWT, OAuth2
- **Bases de données** : MySQL, PostgreSQL, MongoDB, H2
- **ORM** : JPA/Hibernate, Spring Data JPA
- **Tests** : JUnit 5, Mockito, TestContainers

### Frontend
- **React avec Inertia.js** : pour une expérience SPA sans API
- **Vue.js avec Inertia.js** : alternative à React
- **Angular** : en mode standalone
- **Templates traditionnels** : Thymeleaf, JTE

### DevOps & Tooling
- **Docker** : conteneurisation de l'application
- **CI/CD** : configurations pour GitHub Actions, GitLab CI
- **Documentation API** : OpenAPI/Swagger

## ✨ Fonctionnalités

- ✅ Génération complète d'une application Spring Boot
- ✅ Intégration Inertia.js pour frontend React/Vue
- ✅ Authentification et autorisation pré-configurées
- ✅ Génération CRUD automatique
- ✅ Support des DTOs avec mappers
- ✅ Modules fonctionnels pré-configurés
- ✅ Documentation API avec OpenAPI
- ✅ Tests unitaires et d'intégration
- ✅ Configuration Docker

## 🏗️ Architecture

```
Application générée
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   ├── config/        # Configuration Spring Boot
│   │   │   ├── controller/    # Contrôleurs REST et Inertia
│   │   │   ├── dto/           # DTOs pour la couche API
│   │   │   ├── entity/        # Entités JPA
│   │   │   ├── mapper/        # Mappers entité-DTO
│   │   │   ├── repository/    # Repositories Spring Data
│   │   │   ├── security/      # Configuration sécurité
│   │   │   └── service/       # Services métier
│   │   └── resources/
│   │       ├── application.yml # Configuration application
│   │       ├── static/         # Assets statiques
│   │       └── templates/      # Templates Thymeleaf/JTE (si utilisés)
│   └── test/                  # Tests unitaires et d'intégration
├── frontend/                  # Code frontend (React/Vue)
│   ├── src/
│   │   ├── components/        # Composants React/Vue
│   │   ├── pages/             # Pages Inertia
│   │   └── styles/            # CSS/SCSS
│   └── package.json
├── Dockerfile                 # Configuration Docker
├── docker-compose.yml         # Services Docker (DB, etc.)
└── pom.xml/build.gradle       # Configuration Maven/Gradle
```

## 👨‍💻 Développement

Pour contribuer au développement de SFS, suivez ces étapes :

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/spring-fullstack-speed.git
cd spring-fullstack-speed

# Installer les dépendances
npm install

# Lier globalement pour les tests
npm link

# Exécuter les tests
npm test
```

### Scripts disponibles

- `npm run build` : Compile le code TypeScript
- `npm run dev` : Compile en mode watch
- `npm test` : Lance tous les tests
- `npm run lint` : Vérifie le style du code
- `npm run format` : Formate le code

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'feat: add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC. Voir le fichier `LICENSE` pour plus d'informations.
