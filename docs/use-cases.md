# Exemples de cas d'utilisation - Spring-Fullstack-Speed

Ce document présente des exemples concrets des cas d'utilisation les plus courants de Spring-Fullstack-Speed pour vous aider à comprendre comment tirer le meilleur parti de cet outil dans des situations réelles de développement.

## Table des matières

1. [Création d'une API REST](#création-dune-api-rest)
2. [Développement d'une application fullstack](#développement-dune-application-fullstack)
3. [Système de gestion avec authentification](#système-de-gestion-avec-authentification)
4. [Microservice avec déploiement Docker](#microservice-avec-déploiement-docker)
5. [Application avec recherche avancée](#application-avec-recherche-avancée)
6. [Portail d'administration](#portail-dadministration)
7. [Application avec notifications](#application-avec-notifications)
8. [API pour application mobile](#api-pour-application-mobile)
9. [Migration d'une application existante](#migration-dune-application-existante)
10. [Intégration avec d'autres systèmes](#intégration-avec-dautres-systèmes)

## Création d'une API REST

### Scénario

Vous devez créer une API REST pour exposer des données produits à des applications tierces.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=product-api --package-name=com.company.productapi --build-tool=maven --database=postgresql --frontend=none --auth=JWT --features=openapi,swagger
```

#### 2. Création des entités

```bash
sfs entity --name=Product --fields=name:string:required,description:text,price:decimal:min(0),sku:string:unique,inStock:boolean --auditable=true

sfs entity --name=Category --fields=name:string:required,description:text --repository=true
```

#### 3. Ajout des relations

```bash
sfs entity --name=Product --relationships=category:ManyToOne
```

#### 4. Génération des DTOs

```bash
sfs dtos --entity=Product --create=true --update=true --summary=true
sfs dtos --entity=Category
```

#### 5. Ajout des opérations CRUD avec pagination

```bash
sfs crud --entity=Product --pageable=true --sorting=true --swagger=true
sfs crud --entity=Category
```

### Résultat

Une API REST complète avec :
- Documentation Swagger
- Authentification JWT
- Endpoints CRUD pour les produits et catégories
- Support de pagination et tri
- Validation des données
- Audit des modifications

## Développement d'une application fullstack

### Scénario

Vous souhaitez créer une application fullstack avec Spring Boot et React pour un système de gestion de tâches.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=task-manager --package-name=com.company.taskmanager --build-tool=gradle --database=mysql --frontend=react --auth=JWT --features=docker,openapi
```

#### 2. Création des entités

```bash
sfs entity --name=Task --fields=title:string:required,description:text,dueDate:date,priority:enum:LOW-MEDIUM-HIGH,status:enum:TODO-IN_PROGRESS-DONE,completed:boolean --auditable=true

sfs entity --name=User --fields=name:string:required,email:string:required:unique,role:enum:ADMIN-USER
```

#### 3. Ajout des relations

```bash
sfs entity --name=Task --relationships=assignee:ManyToOne:User
```

#### 4. Génération du CRUD et DTOs

```bash
sfs dtos --entity=Task
sfs crud --entity=Task --frontend=true --pagination=true
```

#### 5. Ajout de tests

```bash
sfs backend-tests --entities=Task,User
sfs frontend-tests --components=true --e2e=true
```

### Résultat

Une application fullstack complète avec :
- Backend Spring Boot avec API REST
- Frontend React avec composants pour la gestion des tâches
- Authentication et autorisation
- Interface utilisateur responsive
- Tests backend et frontend

## Système de gestion avec authentification

### Scénario

Vous développez un système de gestion interne nécessitant une authentification sécurisée et différents niveaux d'accès.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=admin-system --package-name=com.company.admin --build-tool=maven --database=postgresql --frontend=angular --auth=OAuth2 --features=docker,openapi,i18n
```

#### 2. Configuration des rôles et permissions

```bash
sfs entity --name=Role --fields=name:string:required:unique,description:text
sfs entity --name=Permission --fields=name:string:required:unique,description:text
```

#### 3. Relations de sécurité

```bash
sfs entity --name=Role --relationships=permissions:ManyToMany:Permission
sfs entity --name=User --relationships=roles:ManyToMany:Role
```

#### 4. Ajout de fonctionnalités sécurisées

```bash
sfs module --name=AdminModule --entities=User,Role,Permission
```

#### 5. Génération des profils

```bash
sfs add --feature=profiles --profiles=dev,test,prod
```

### Résultat

Un système d'administration complet avec :
- Authentification OAuth2 sécurisée
- Gestion des rôles et permissions
- Profils pour différents environnements
- Support multilingue
- Interface utilisateur Angular moderne

## Microservice avec déploiement Docker

### Scénario

Vous créez un microservice qui sera déployé dans un environnement containerisé.

### Solution avec Spring-Fullstack-Speed

#### 1. Création du microservice

```bash
sfs app --app-name=inventory-service --package-name=com.company.inventory --build-tool=gradle --database=mysql --frontend=none --features=docker,openapi
```

#### 2. Configuration du service

```bash
sfs entity --name=InventoryItem --fields=productId:string:required,quantity:integer:min(0),location:string,lastUpdated:datetime --auditable=true
```

#### 3. Configuration Docker avancée

```bash
sfs container --type=multi-stage --database=true --production=true
```

#### 4. Configuration Kubernetes

```bash
sfs kubernetes --type=helm --monitoring=true
```

#### 5. Configuration CI/CD

```bash
sfs cicd --platform=github --stages=build,test,deploy
```

### Résultat

Un microservice prêt pour le déploiement avec :
- Configuration Docker optimisée pour la production
- Charts Helm pour Kubernetes
- Pipelines CI/CD
- API documentée avec OpenAPI
- Monitoring intégré

## Application avec recherche avancée

### Scénario

Vous développez une application nécessitant des fonctionnalités de recherche avancées.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=document-manager --package-name=com.company.docs --build-tool=maven --database=postgresql --frontend=react --features=docker,openapi
```

#### 2. Création des entités avec indexation

```bash
sfs entity --name=Document --fields=title:string:required,content:text,tags:string,author:string,createdDate:datetime,category:string --auditable=true
```

#### 3. Ajout de la recherche

```bash
sfs search --entity=Document --engine=elasticsearch --fields=title,content,tags,author
```

#### 4. Interface de recherche

```bash
sfs add --feature=search-ui --entity=Document
```

#### 5. Tests de recherche

```bash
sfs backend-tests --type=integration --entities=Document --test-containers=true
```

### Résultat

Une application avec recherche avancée :
- Intégration Elasticsearch
- Indexation automatique des documents
- Interface utilisateur de recherche avec filtres
- Tests d'intégration avec Testcontainers
- Documentation API complète

## Portail d'administration

### Scénario

Vous créez un portail d'administration pour gérer plusieurs types d'entités.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=admin-portal --package-name=com.company.admin --build-tool=maven --database=postgresql --frontend=vue --auth=JWT --features=docker,openapi
```

#### 2. Création des entités administratives

```bash
sfs entity --name=User --fields=username:string:required:unique,email:string:required:unique,active:boolean,lastLogin:datetime --auditable=true
sfs entity --name=Setting --fields=key:string:required:unique,value:string,description:text,category:string
sfs entity --name=AuditLog --fields=action:string,entity:string,entityId:string,user:string,timestamp:datetime,details:text
```

#### 3. Génération des modules administratifs

```bash
sfs module --name=UserAdmin --entities=User
sfs module --name=Settings --entities=Setting
sfs module --name=Audit --entities=AuditLog
```

#### 4. Interface d'administration

```bash
sfs add --feature=admin-ui --modules=UserAdmin,Settings,Audit
```

#### 5. Gestion des droits

```bash
sfs add --feature=acl --entities=User,Setting,AuditLog
```

### Résultat

Un portail d'administration complet avec :
- Gestion des utilisateurs
- Configuration des paramètres système
- Journal d'audit
- Interface utilisateur adaptative
- Contrôle d'accès basé sur les rôles

## Application avec notifications

### Scénario

Vous développez une application nécessitant d'envoyer des notifications aux utilisateurs par différents canaux.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=notification-system --package-name=com.company.notifications --build-tool=gradle --database=mysql --frontend=angular --auth=JWT
```

#### 2. Création des entités de notification

```bash
sfs entity --name=Notification --fields=title:string:required,message:text:required,type:enum:INFO-WARNING-ERROR,status:enum:PENDING-SENT-FAILED,sentDate:datetime --auditable=true
sfs entity --name=UserPreference --fields=emailEnabled:boolean,pushEnabled:boolean,smsEnabled:boolean,webSocketEnabled:boolean
```

#### 3. Ajout des services de notification

```bash
sfs notification --type=all --entity=Notification --templates=true
```

#### 4. Configuration du temps réel

```bash
sfs add --feature=websocket --entity=Notification
```

#### 5. Interface utilisateur de notifications

```bash
sfs add --feature=notification-ui --entity=Notification
```

### Résultat

Un système de notifications complet :
- Envoi d'emails, SMS, notifications push
- Notifications temps réel via WebSocket
- Templates de messages
- Interface utilisateur de gestion des notifications
- Préférences utilisateur pour les notifications

## API pour application mobile

### Scénario

Vous développez une API backend pour une application mobile.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=mobile-api --package-name=com.company.mobileapi --build-tool=gradle --database=postgresql --frontend=none --auth=JWT --features=openapi
```

#### 2. Création des entités avec optimisation mobile

```bash
sfs entity --name=User --fields=username:string:required,email:string:required:unique,profileImageUrl:string
sfs entity --name=Post --fields=title:string:required,content:text,imageUrl:string,published:boolean --auditable=true
```

#### 3. Configuration pour appareils mobiles

```bash
sfs add --feature=mobile-optimized --entities=User,Post
```

#### 4. Ajout de l'authentification mobile

```bash
sfs add --feature=mobile-auth --type=biometric
```

#### 5. Notifications push

```bash
sfs notification --type=push --entity=Post
```

### Résultat

Une API optimisée pour les applications mobiles :
- Endpoints optimisés pour la consommation de données
- Support des notifications push
- Authentification sécurisée avec support biométrique
- Documentation API pour développeurs mobiles
- Optimisation des performances pour les appareils mobiles

## Migration d'une application existante

### Scénario

Vous modernisez une application Spring Boot existante.

### Solution avec Spring-Fullstack-Speed

#### 1. Analyse de l'application existante

```bash
sfs doctor --analyze=true --path=path/to/existing/app
```

#### 2. Génération d'une application moderne avec entités existantes

```bash
sfs migrate --source=path/to/existing/app --target=new-app --keep-entities=true --update-dependencies=true
```

#### 3. Mise à jour des technologies

```bash
sfs upgrade --spring-boot=3.0.0 --java=17
```

#### 4. Ajout de fonctionnalités modernes

```bash
sfs add --feature=openapi,docker,monitoring
```

#### 5. Tests de régression

```bash
sfs backend-tests --type=regression --coverage=true
```

### Résultat

Une application modernisée :
- Migration vers les dernières versions de Spring Boot et Java
- Ajout de fonctionnalités modernes
- Conservation des entités et de la logique métier
- Tests de régression pour assurer la compatibilité
- Documentation et containerisation

## Intégration avec d'autres systèmes

### Scénario

Vous créez une application qui doit s'intégrer avec des systèmes externes.

### Solution avec Spring-Fullstack-Speed

#### 1. Création de l'application de base

```bash
sfs app --app-name=integration-hub --package-name=com.company.integration --build-tool=maven --database=postgresql --frontend=react --auth=JWT
```

#### 2. Configuration des intégrations

```bash
sfs add --feature=integration --types=rest,soap,messaging
```

#### 3. Ajout du support de messaging

```bash
sfs add --feature=messaging --broker=kafka --topics=orders,invoices,notifications
```

#### 4. Création des adaptateurs

```bash
sfs entity --name=ExternalSystem --fields=name:string:required,url:string:required,apiKey:string,type:enum:REST-SOAP-FTP-DATABASE
sfs add --feature=adapter --entity=ExternalSystem
```

#### 5. Interface de monitoring des intégrations

```bash
sfs add --feature=integration-dashboard
```

### Résultat

Un hub d'intégration complet :
- Support de multiples protocoles d'intégration
- Adaptateurs pour systèmes externes
- Messaging avec Kafka
- Tableau de bord de surveillance des intégrations
- Gestion des erreurs et retries
