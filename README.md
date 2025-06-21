# Spring-Fullstack-Speed (SFS)

> Générateur rapide d'applications fullstack avec Spring Boot et divers frameworks frontend

SFS est un générateur de code CLI basé sur Yeoman qui permet de créer rapidement des applications web fullstack modernes avec Spring Boot comme backend et divers frameworks frontend (React, Vue.js, Angular, Thymeleaf, JTE). Inspiré par JHipster, ce projet vise à simplifier et accélérer le développement d'applications Java enterprise en automatisant la génération de code boilerplate et l'intégration des technologies modernes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Java](https://img.shields.io/badge/java-%3E%3D17-orange.svg)

## 📋 Table des matières

- [Installation](#installation)
- [Démarrage Rapide](#démarrage-rapide)
- [Utilisation](#utilisation)
  - [Générer une application](#générer-une-nouvelle-application)
  - [Générer une entité](#générer-une-nouvelle-entité)
  - [Générer des DTOs](#générer-des-dtos)
  - [Générer des opérations CRUD](#générer-des-opérations-crud)
  - [Générer un module](#générer-un-module-fonctionnel)
  - [Recherche et Indexation](#recherche-et-indexation)
  - [Notifications](#notifications)
  - [Conteneurisation](#conteneurisation)
  - [Déploiement](#déploiement)
  - [CI/CD](#cicd)
- [Documentation](#documentation)
- [Technologies supportées](#technologies-supportées)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Développement](#développement)
- [Tests](#tests)
- [Contribuer](#contribuer)
- [Licence](#licence)

## 🚀 Installation

```bash
# Installation globale
npm install -g @enokdev/spring-fullstack-speed

# Ou utilisation directe avec npx
npx @enokdev/spring-fullstack-speed
```

### Prérequis

- **Node.js** : v20.0.0 ou supérieure
- **NPM** : v10.0.0 ou supérieure
- **Java** : JDK 17 ou supérieure
- **Maven** ou **Gradle** : pour la compilation des projets Spring Boot

## ⚡ Démarrage Rapide

Pour générer rapidement une application complète avec une interface utilisateur React et une base de données PostgreSQL :

```bash
# Installation globale si ce n'est pas déjà fait
npm install -g @enokdev/spring-fullstack-speed

# Création d'un nouveau projet
sfs app --name=my-awesome-app --package=com.example.myapp --db=postgresql --frontend=react

# Génération d'une entité
cd my-awesome-app
sfs entity --name=Product --fields=name:string,description:string,price:double

# Ajout des DTOs et opérations CRUD
sfs dtos --entity=Product
sfs crud --entity=Product --frontend=true

# Lancement de l'application
./mvnw spring-boot:run
```

Voir notre [Guide de démarrage rapide](docs/quick-start.md) pour plus d'options et d'explications.

## 🧰 Utilisation

### Générer une nouvelle application

```bash
# Mode interactif
sfs app

# Mode avec options
sfs app --name=my-app --package=com.example --db=mysql --frontend=react --build=maven
```

Options disponibles :
- `--name` : Nom de l'application
- `--package` : Package Java de base
- `--db` : Base de données (h2, mysql, postgresql, mongodb)
- `--build` : Outil de build (maven, gradle)
- `--frontend` : Framework frontend (none, react, vue, angular, thymeleaf, jte)
- `--auth` : Type d'authentification (none, jwt, oauth2, basic)
- `--cache` : Solution de cache (none, redis, ehcache)
- `--messaging` : Solution de messagerie (none, kafka, rabbitmq)

### Générer une nouvelle entité

```bash
sfs entity --name=Product --fields=name:string,price:double,description:string
```

Options pour les champs :
- Types : string, integer, long, float, double, boolean, date, time, datetime, enum, blob, uuid
- Validations : [required], [min=x], [max=y], [pattern=regex], [email], etc.

### Générer des DTOs

```bash
sfs dtos --entity=Product --mapping=mapstruct
```

Options :
- `--entity` : Nom de l'entité
- `--types` : Types de DTOs (basic, create, update, view, all)
- `--mapping` : Outil de mapping (manual, mapstruct, modelmapper)

### Générer des opérations CRUD

```bash
sfs crud --entity=Product --pagination=true --sorting=true --frontend=true
```

Options :
- `--entity` : Nom de l'entité
- `--pagination` : Activer la pagination
- `--sorting` : Activer le tri
- `--frontend` : Générer des composants frontend

### Générer un module fonctionnel

```bash
sfs module --name=Inventory --entities=Product,Category,Supplier
```

Options :
- `--name` : Nom du module
- `--entities` : Liste d'entités à inclure
- `--package` : Package spécifique pour le module

### Recherche et Indexation

```bash
sfs search --entity=Article --engine=elasticsearch --fields=title,content,tags
```

Options :
- `--entity` : Entité à indexer
- `--engine` : Moteur de recherche (database, elasticsearch, solr)
- `--fields` : Champs à indexer

### Notifications

```bash
sfs notification --type=email --entity=User
```

Options :
- `--type` : Type de notification (email, sms, push, websocket, all)
- `--entity` : Entité liée aux notifications
- `--templates` : Générer des templates (true, false)

### Conteneurisation

```bash
sfs container --type=compose --services=db,redis,elasticsearch
```

Options :
- `--type` : Type de configuration (simple, multi-stage, compose)
- `--services` : Services supplémentaires à inclure

### Déploiement

```bash
sfs deploy --platform=aws --type=advanced
```

Options :
- `--platform` : Plateforme de déploiement (heroku, aws, azure, gcp)
- `--type` : Type de configuration (basic, advanced)

### CI/CD

```bash
sfs cicd --platform=github --stages=build,test,deploy
```

Options :
- `--platform` : Plateforme CI/CD (github, gitlab, jenkins, azure)
- `--stages` : Étapes à inclure

## 📚 Documentation

- [Guide de démarrage rapide](docs/quick-start.md)
- [Documentation des générateurs](docs/generators-documentation.md)
- [Guide des cas d'utilisation](docs/use-cases.md)
- [Documentation des entités](docs/entities.md)
- [Documentation des DTOs](docs/dtos.md)
- [Liste des commandes](docs/commands.md)

## 🛠 Technologies supportées

### Backend
- **Spring Boot** : 3.x
- **Bases de données** : MySQL, PostgreSQL, MongoDB, H2
- **JPA/Hibernate** pour la persistance
- **Spring Security** pour l'authentification et l'autorisation
- **Spring Data JPA/MongoDB** pour l'accès aux données
- **MapStruct/ModelMapper** pour la conversion DTO
- **Redis/EhCache** pour la mise en cache
- **Kafka/RabbitMQ** pour la messagerie
- **Elasticsearch** pour la recherche avancée
- **Liquibase/Flyway** pour les migrations de base de données

### Frontend
- **React** avec hooks et context API
- **Vue.js** avec composition API
- **Angular** avec composants et services
- **Thymeleaf** pour le rendu côté serveur
- **JTE** pour les templates haute performance
- **TailwindCSS/Bootstrap** pour le styling
- **Jest/Testing Library/Vitest** pour les tests frontend

### DevOps
- **Docker** pour la conteneurisation
- **Kubernetes** pour l'orchestration
- **GitHub Actions/GitLab CI** pour CI/CD
- **AWS/Azure/GCP/Heroku** pour le déploiement

## ✨ Fonctionnalités

- Génération complète d'applications prêtes à l'emploi
- Création d'entités avec validations et relations
- Génération automatique d'API RESTful
- Authentification JWT et OAuth2
- Interfaces utilisateur cohérentes et réactives
- Pagination et tri côté serveur
- Recherche full-text avec Elasticsearch
- Mises en cache pour les performances
- Tests unitaires et d'intégration
- Documentation Swagger/OpenAPI
- Support multi-langues
- Conteneurisation Docker
- Scripts de déploiement
- Configuration CI/CD

## 🏗 Architecture

SFS génère des applications suivant une architecture en couches classique:

```
+----------------+
|   Frontend     |
| React/Vue/etc. |
+--------+-------+
         |
  REST/GraphQL API
         |
+--------v-------+
|  Controllers   |
+----------------+
|   Services     |
+----------------+
| Repositories   |
+----------------+
|   Entities     |
+----------------+
|   Database     |
+----------------+
```

## 🧪 Tests

Le projet comprend plusieurs niveaux de tests:

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests end-to-end
npm run test:e2e

# Tests des cas limites
npm run test:edge-cases

# Tests de compatibilité multi-plateforme
npm run test:platform-compatibility

# Tous les tests
npm run test:all
```

## 💻 Développement

Pour contribuer au développement de Spring-Fullstack-Speed:

```bash
# Cloner le dépôt
git clone https://github.com/tky0065/spring-fullstack-speed.git
cd spring-fullstack-speed

# Installer les dépendances
npm install

# Lier le package pour les tests locaux
npm link

# Lancer en mode développement
npm run dev
```

## 👥 Contribuer

Les contributions sont les bienvenues! Consultez notre [guide de contribution](CONTRIBUTING.md) pour plus d'informations.

## 📄 Licence

Ce projet est sous licence ISC. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
