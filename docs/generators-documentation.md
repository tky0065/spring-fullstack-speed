# Documentation Complète des Générateurs - Spring-Fullstack-Speed

Ce document fournit une documentation détaillée pour tous les générateurs disponibles dans Spring-Fullstack-Speed, leurs options, et des exemples d'utilisation.

## Table des matières

- [Générateur d'applications (app)](#générateur-dapplications-app)
- [Générateur d'entités (entity)](#générateur-dentités-entity)
- [Générateur de DTOs (dtos)](#générateur-de-dtos-dtos)
- [Générateur d'opérations CRUD (crud)](#générateur-dopérations-crud-crud)
- [Générateur de modules (module)](#générateur-de-modules-module)
- [Générateur de recherche (search)](#générateur-de-recherche-search)
- [Générateur de notifications (notification)](#générateur-de-notifications-notification)
- [Générateur de conteneurisation (container)](#générateur-de-conteneurisation-container)
- [Générateur de déploiement (deploy)](#générateur-de-déploiement-deploy)
- [Générateur Kubernetes (kubernetes)](#générateur-kubernetes-kubernetes)
- [Générateur CI/CD (cicd)](#générateur-cicd-cicd)

## Générateur d'applications (app)

Le générateur d'applications est le générateur principal qui crée la structure de base de votre projet Spring Boot avec optionnellement un frontend.

### Description

Ce générateur vous permet de créer une application Spring Boot complète avec toutes les configurations nécessaires. Vous pouvez choisir entre différentes options de base de données, frameworks frontend, outils de build, et fonctionnalités additionnelles.

### Structure du projet généré

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
│   │   │   ├── security/      # Configuration sécurité (si activée)
│   │   │   └── Application.java  # Point d'entrée
│   │   └── resources/
│   │       ├── static/        # Ressources statiques
│   │       └── application.properties  # Configuration
│   └── test/                  # Tests unitaires et d'intégration
├── frontend/                  # Code frontend (React/Angular/Vue)
└── pom.xml ou build.gradle    # Configuration du build
```

### Options disponibles

| Option | Description | Valeur par défaut | Valeurs possibles |
|--------|-------------|-------------------|-------------------|
| `--app-name` | Nom de l'application | - | Tout nom valide pour un projet Java |
| `--package-name` | Nom du package Java | `com.example.app` | Tout nom de package Java valide |
| `--build-tool` | Outil de build | `maven` | `maven`, `gradle` |
| `--java-version` | Version de Java | `17` | `11`, `17`, `21` |
| `--spring-boot-version` | Version de Spring Boot | `3.0.0` | Toute version valide de Spring Boot |
| `--database` | Type de base de données | `h2` | `h2`, `postgresql`, `mysql`, `mongodb` |
| `--frontend` | Framework frontend | `none` | `none`, `react`, `angular`, `vue`, `thymeleaf`, `jte` |
| `--auth` | Type d'authentification | `none` | `none`, `JWT`, `OAuth2` |
| `--features` | Fonctionnalités additionnelles | - | `docker`, `kubernetes`, `openapi`, `swagger`, `i18n`, `monitoring` |

### Utilisation

#### Mode interactif

```bash
sfs
```

Ou spécifiquement le générateur d'application :

```bash
sfs app
```

#### Mode non-interactif (avec paramètres)

```bash
sfs app --app-name=my-app --package-name=com.example.app --build-tool=maven --database=postgresql --frontend=react --auth=JWT --features=docker,openapi
```

### Exemples d'utilisation

#### Créer une API REST avec PostgreSQL

```bash
sfs app --app-name=rest-api --package-name=com.example.api --build-tool=maven --database=postgresql --frontend=none --auth=JWT --features=openapi,swagger
```

#### Créer une application fullstack avec React et MongoDB

```bash
sfs app --app-name=fullstack-app --package-name=com.example.fullstack --build-tool=gradle --database=mongodb --frontend=react --auth=JWT --features=docker,i18n,openapi
```

#### Créer une application avec interface utilisateur traditionnelle (serveur)

```bash
sfs app --app-name=webapp --package-name=com.example.web --build-tool=maven --database=mysql --frontend=thymeleaf --auth=OAuth2
```

### Fonctionnalités générées

Selon les options choisies, le générateur d'applications crée :

- **Structure du projet** - Organisation des dossiers et fichiers selon les conventions de Spring Boot
- **Configuration de base de données** - Connexion à la base choisie et configuration JPA/Hibernate
- **Entités de base** - Entité User et Role pour l'authentification (si activée)
- **Configuration de sécurité** - JWT ou OAuth2 selon le choix
- **API REST** - Contrôleurs de base et documentation OpenAPI (si activée)
- **Frontend** - Application frontend complète avec authentification
- **Tests** - Tests unitaires et d'intégration de base
- **Docker** - Configuration Docker et docker-compose (si activée)
- **Internationalisation** - Support i18n (si activée)

### Recommandations

- Utilisez des noms simples pour l'application, sans espaces ni caractères spéciaux
- Pour les noms de packages, suivez les conventions Java (ex: com.entreprise.projet)
- Si vous débutez, commencez avec H2 comme base de données pour simplifier la configuration
- Pour les applications de production, activez les fonctionnalités Docker et OpenAPI

### Dépannage

#### Erreur: Package name is invalid

Le nom du package doit suivre les conventions Java (lettres minuscules, séparées par des points).
Exemple correct : `com.example.app`

#### Erreur: Application already exists

Un projet avec ce nom existe déjà dans le répertoire courant. Utilisez un autre nom ou supprimez le projet existant.

#### Erreur: Could not resolve dependencies

Vérifiez votre connexion internet et assurez-vous que les dépendances Maven/Gradle sont accessibles.

## Générateur d'entités (entity)

Le générateur d'entités vous permet de créer facilement des entités Java pour votre application Spring Boot, avec support JPA et validation.

### Description

Ce générateur crée des classes d'entité Java avec annotations JPA, getters/setters, constructeurs appropriés et optionnellement des validations. Il peut également générer automatiquement des repositories, services et DTOs associés.

### Structure générée

Pour une entité nommée "Product", le générateur crée :

```
src/main/java/com/example/app/
├── entity/
│   └── Product.java           # Classe d'entité JPA
├── repository/
│   └── ProductRepository.java # Repository Spring Data (optionnel)
├── service/
│   └── ProductService.java    # Service (optionnel)
└── dto/
    └── ProductDTO.java        # DTO (optionnel)
```

### Options disponibles

| Option | Description | Valeur par défaut | Valeurs possibles |
|--------|-------------|-------------------|-------------------|
| `--name` | Nom de l'entité | - | Tout nom valide pour une classe Java |
| `--fields` | Liste des champs avec leurs types | - | Format: `nom:type[:validation]`, séparés par des virgules |
| `--relationships` | Relations avec d'autres entités | - | Format: `entité:type[:propriété]`, séparés par des virgules |
| `--table-name` | Nom de la table en base de données | Nom de l'entité en snake_case | Tout nom valide pour une table SQL |
| `--repository` | Générer un repository | `true` | `true`, `false` |
| `--service` | Générer une couche service | `false` | `true`, `false` |
| `--dto` | Générer des DTOs | `false` | `true`, `false` |
| `--pageable` | Support de pagination | `false` | `true`, `false` |
| `--auditable` | Ajouter des champs d'audit | `false` | `true`, `false` |

### Types de champs supportés

| Type | Description | Exemple de valeur | Annotation JPA |
|------|-------------|-------------------|---------------|
| `string` | Chaîne de caractères | `"texte"` | `@Column` |
| `integer` | Nombre entier | `42` | `@Column` |
| `long` | Nombre entier long | `9999999999L` | `@Column` |
| `float` | Nombre décimal | `3.14f` | `@Column` |
| `double` | Nombre décimal double précision | `3.14159` | `@Column` |
| `boolean` | Valeur booléenne | `true`/`false` | `@Column` |
| `date` | Date | `2023-01-01` | `@Temporal(TemporalType.DATE)` |
| `time` | Heure | `14:30:00` | `@Temporal(TemporalType.TIME)` |
| `datetime` | Date et heure | `2023-01-01T14:30:00` | `@Temporal(TemporalType.TIMESTAMP)` |
| `text` | Texte long | `"Long texte..."` | `@Column(columnDefinition="TEXT")` |
| `blob` | Données binaires | - | `@Lob @Basic(fetch=FetchType.LAZY)` |
| `enum` | Énumération | - | `@Enumerated(EnumType.STRING)` |
| `uuid` | Identifiant unique universel | - | `@Column` avec conversion UUID |
| `decimal` | Nombre décimal précis | `19.99` | `@Column(precision=19, scale=2)` |

### Relations supportées

| Type | Description | Annotation JPA |
|------|-------------|---------------|
| `OneToOne` | Relation un-à-un | `@OneToOne` |
| `ManyToOne` | Relation plusieurs-à-un | `@ManyToOne` |
| `OneToMany` | Relation un-à-plusieurs | `@OneToMany` |
| `ManyToMany` | Relation plusieurs-à-plusieurs | `@ManyToMany` |

### Utilisation

#### Mode interactif

```bash
sfs entity
```

#### Mode non-interactif (avec paramètres)

```bash
sfs entity --name=Product --fields=name:string:required,description:text,price:decimal:min(0),sku:string:unique --relationships=category:ManyToOne,tags:ManyToMany --repository=true --service=true --dto=true
```

### Exemples d'utilisation

#### Créer une entité Simple

```bash
sfs entity --name=Customer --fields=firstName:string,lastName:string,email:string:unique:required,age:integer:min(18)
```

#### Créer une entité avec relations

```bash
sfs entity --name=Order --fields=orderDate:datetime,total:decimal --relationships=customer:ManyToOne,products:ManyToMany,address:OneToOne --table-name=customer_orders
```

#### Créer une entité auditable avec support complet

```bash
sfs entity --name=Article --fields=title:string:required,content:text,published:boolean --relationships=author:ManyToOne,comments:OneToMany --repository=true --service=true --dto=true --auditable=true --pageable=true
```

### Recommandations

- Utilisez le PascalCase pour les noms d'entités (Product, Customer) et le camelCase pour les champs (firstName, orderDate)
- Pour les relations bidirectionnelles, créez d'abord les deux entités, puis utilisez la commande `sfs add` pour configurer les relations
- Utilisez toujours les validations pour les champs critiques
- Activez l'option auditable pour les entités qui nécessitent un suivi des modifications

### Dépannage

#### Erreur: Invalid entity name

Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres, chiffres et underscores.

#### Erreur: Referenced entity does not exist

Dans une relation, l'entité référencée n'existe pas. Créez d'abord cette entité.

#### Erreur: Invalid field type

Le type de champ spécifié n'est pas reconnu. Consultez la liste des types supportés.

## Générateur de DTOs (dtos)

Le générateur de DTOs crée des objets de transfert de données pour vos entités, facilitant les échanges entre couches.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--entity` | Nom de l'entité pour laquelle créer des DTOs | Chaîne de caractères | N/A (Requis) |
| `--types` | Types de DTOs à générer | `basic`, `create`, `update`, `view`, `all` | `all` |
| `--mapping` | Outil de mapping à utiliser | `manual`, `mapstruct`, `modelmapper` | `manual` |

### Exemples d'utilisation

```bash
# DTOs basiques pour une entité
sfs dtos --entity=Product

# DTOs spécifiques avec MapStruct
sfs dtos --entity=User --types=create,update,view --mapping=mapstruct
```

### Fichiers générés

- Classes DTO (par exemple, ProductDTO, CreateProductDTO, UpdateProductDTO)
- Classes de mapping (si un outil de mapping est sélectionné)
- Tests unitaires de base

## Générateur d'opérations CRUD (crud)

Le générateur CRUD crée un ensemble complet d'opérations Create, Read, Update, Delete pour une entité.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--entity` | Nom de l'entité pour laquelle générer les opérations CRUD | Chaîne de caractères | N/A (Requis) |
| `--pagination` | Ajouter la pagination | `true`, `false` | `true` |
| `--sorting` | Ajouter le tri | `true`, `false` | `true` |
| `--frontend` | Générer également des composants frontend | `true`, `false` | `false` |

### Exemples d'utilisation

```bash
# CRUD basique pour une entité
sfs crud --entity=Product

# CRUD avec pagination et tri désactivés
sfs crud --entity=Category --pagination=false --sorting=false

# CRUD avec génération frontend
sfs crud --entity=User --frontend=true
```

### Fichiers générés

- Service avec méthodes CRUD
- Contrôleur REST avec endpoints CRUD
- Tests pour le service et le contrôleur
- Composants frontend (si spécifié)

## Générateur de modules (module)

Le générateur de modules crée un module fonctionnel regroupant plusieurs entités reliées.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--name` | Nom du module | Chaîne de caractères | N/A (Requis) |
| `--entities` | Liste d'entités à inclure dans le module | Liste de noms séparés par des virgules | N/A (Requis) |
| `--package` | Sous-package pour le module | Format package Java | `module` |

### Exemples d'utilisation

```bash
# Module de gestion des utilisateurs
sfs module --name=UserManagement --entities=User,Role,Permission

# Module de commerce avec package personnalisé
sfs module --name=Commerce --entities=Product,Order,Payment --package=com.example.commerce
```

### Fichiers générés

- Structure de package pour le module
- Façades de services regroupant les fonctionnalités
- Configuration spécifique au module
- Tests d'intégration

## Générateur de recherche (search)

Le générateur de recherche ajoute des capacités de recherche avancée à vos entités.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--entity` | Nom de l'entité pour laquelle ajouter la recherche | Chaîne de caractères | N/A (Requis) |
| `--engine` | Moteur de recherche à utiliser | `database`, `elasticsearch`, `solr` | `database` |
| `--fields` | Champs à indexer pour la recherche | Liste de noms séparés par des virgules | Tous les champs de type String |

### Exemples d'utilisation

```bash
# Recherche basique avec la base de données
sfs search --entity=Product

# Recherche avancée avec Elasticsearch
sfs search --entity=Article --engine=elasticsearch --fields=title,content,tags
```

### Fichiers générés

- Repository avec méthodes de recherche
- Service de recherche
- Contrôleur de recherche
- Configuration du moteur de recherche
- Index (pour Elasticsearch/Solr)

## Générateur de notifications (notification)

Le générateur de notifications ajoute des capacités d'envoi de notifications via différents canaux.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--type` | Type de notification | `email`, `sms`, `push`, `websocket`, `all` | N/A (Requis) |
| `--entity` | Entité liée aux notifications (optionnel) | Chaîne de caractères | N/A |
| `--templates` | Générer des templates | `true`, `false` | `true` |

### Exemples d'utilisation

```bash
# Notification par email
sfs notification --type=email --entity=User

# Toutes les notifications
sfs notification --type=all
```

### Fichiers générés

- Services de notification
- Templates de messages
- Configuration des services de notification
- Tests unitaires

## Générateur de conteneurisation (container)

Le générateur de conteneurisation ajoute des fichiers Docker pour containeriser votre application.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--type` | Type de conteneurisation | `simple`, `multi-stage`, `compose` | `simple` |
| `--services` | Services supplémentaires à inclure | Liste séparée par des virgules | `[]` |

### Exemples d'utilisation

```bash
# Dockerfile simple
sfs container --type=simple

# Docker Compose avec services
sfs container --type=compose --services=db,redis,elasticsearch
```

### Fichiers générés

- Dockerfile
- .dockerignore
- docker-compose.yml (si spécifié)
- Scripts de build et déploiement Docker

## Générateur de déploiement (deploy)

Le générateur de déploiement crée des configurations pour déployer votre application dans différents environnements.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--platform` | Plateforme de déploiement | `heroku`, `aws`, `azure`, `gcp` | N/A (Requis) |
| `--type` | Type de déploiement | `basic`, `advanced` | `basic` |

### Exemples d'utilisation

```bash
# Déploiement Heroku
sfs deploy --platform=heroku

# Déploiement AWS avancé
sfs deploy --platform=aws --type=advanced
```

### Fichiers générés

- Fichiers de configuration spécifiques à la plateforme
- Scripts de déploiement
- Documentation de déploiement

## Générateur Kubernetes (kubernetes)

Le générateur Kubernetes crée des configurations pour déployer votre application sur Kubernetes.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--type` | Type de configuration | `basic`, `helm`, `kustomize` | `basic` |
| `--resources` | Ressources à générer | `all`, `deployment`, `service`, `ingress`, `config` | `all` |

### Exemples d'utilisation

```bash
# Configuration Kubernetes de base
sfs kubernetes --type=basic

# Configuration Helm
sfs kubernetes --type=helm
```

### Fichiers générés

- Fichiers YAML de configuration Kubernetes
- Charts Helm (si spécifié)
- Kustomize overlays (si spécifié)

## Générateur CI/CD (cicd)

Le générateur CI/CD crée des pipelines d'intégration et de déploiement continus.

### Options

| Option | Description | Valeurs possibles | Par défaut |
|--------|-------------|-------------------|------------|
| `--platform` | Plateforme CI/CD | `github`, `gitlab`, `jenkins`, `azure` | `github` |
| `--stages` | Étapes à inclure | `build`, `test`, `analyze`, `deploy`, `all` | `all` |

### Exemples d'utilisation

```bash
# Pipeline GitHub Actions
sfs cicd --platform=github

# Pipeline Jenkins avec étapes spécifiques
sfs cicd --platform=jenkins --stages=build,test,deploy
```

### Fichiers générés

- Fichiers de configuration CI/CD
- Scripts de pipeline
- Documentation du processus CI/CD
