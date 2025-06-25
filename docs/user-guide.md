# Guide de l'Utilisateur Spring-Fullstack-Speed

Ce guide complet vous accompagne dans l'utilisation de Spring-Fullstack-Speed (SFS), un générateur d'applications fullstack basées sur Spring Boot qui vous permet de créer rapidement des applications web modernes et robustes.

## Table des matières

1. [Installation](#installation)
2. [Commandes principales](#commandes-principales)
3. [Création d'un nouveau projet](#création-dun-nouveau-projet)
4. [Génération d'entités et de CRUD](#génération-dentités-et-de-crud)
5. [Personnalisation des templates](#personnalisation-des-templates)
6. [Options de déploiement](#options-de-déploiement)
7. [Bonnes pratiques](#bonnes-pratiques)
8. [Troubleshooting](#troubleshooting)
9. [FAQs](#faqs)
10. [Guides de migration](#guides-de-migration)

## Installation

### Prérequis

Avant d'installer Spring-Fullstack-Speed, assurez-vous que votre environnement répond aux exigences suivantes :

- **Node.js** (v18 ou supérieur)
- **npm** (v8 ou supérieur)
- **JDK** (v17 ou supérieur)
- **Maven** ou **Gradle**

### Installation globale

Pour installer Spring-Fullstack-Speed globalement sur votre système :

```bash
npm install -g @enokdev/spring-fullstack-speed
```

Vérifiez que l'installation s'est bien déroulée :

```bash
sfs --version
```

### Installation locale (projet spécifique)

Si vous préférez installer SFS localement pour un projet spécifique :

```bash
mkdir mon-projet && cd mon-projet
npm init -y
npm install --save-dev @enokdev/spring-fullstack-speed
```

Dans ce cas, utilisez la commande avec npx :

```bash
npx sfs
```

## Commandes principales

Spring-Fullstack-Speed fournit plusieurs commandes utiles pour générer et gérer votre application :

| Commande | Description | Options |
|----------|-------------|---------|
| `sfs` | Lance le générateur principal | `--skip-install`, `--skip-git` |
| `sfs generate entity` | Génère une nouvelle entité | `--fields`, `--relationships` |
| `sfs generate crud` | Génère des opérations CRUD | `--entity`, `--pagination` |
| `sfs generate dtos` | Génère des DTOs pour une entité | `--entity`, `--validation` |
| `sfs add` | Ajoute des composants à votre projet | `--component`, `--path` |
| `sfs serve` | Démarre le serveur de développement | `--port`, `--profile` |
| `sfs test` | Lance les tests | `--backend`, `--frontend`, `--all` |
| `sfs build` | Construit l'application | `--prod`, `--optimize` |
| `sfs deploy` | Déploie l'application | `--target`, `--env` |
| `sfs migrate` | Gère les migrations de base de données | `--up`, `--down`, `--to` |
| `sfs doctor` | Diagnostique les problèmes | `--fix`, `--verbose` |
| `sfs upgrade` | Met à jour votre projet | `--latest`, `--force` |

## Création d'un nouveau projet

### Génération interactive

La manière la plus simple de créer un nouveau projet est d'utiliser le générateur interactif :

```bash
mkdir mon-projet && cd mon-projet
sfs
```

Le générateur vous posera une série de questions pour configurer votre projet selon vos besoins :

1. **Nom du projet** : Le nom de votre application
2. **Package** : Le nom du package Java (ex: `com.example.application`)
3. **Base de données** : MySQL, PostgreSQL, MongoDB ou H2
4. **Frontend** : React, Angular, Vue, Thymeleaf, ou JTE
5. **Authentification** : JWT, OAuth2, Session ou aucune
6. **Fonctionnalités supplémentaires** : WebSocket, Redis, Docker, etc.

### Génération non-interactive

Pour une génération non-interactive (utile pour l'automatisation) :

```bash
sfs --name=mon-projet --package=com.example.app --database=mysql --frontend=react --auth=jwt --features=websocket,docker --skip-install
```

### Structure du projet généré

Une fois le projet généré, vous obtiendrez une structure similaire à celle-ci :

```
mon-projet/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/app/
│   │   │       ├── config/
│   │   │       ├── controllers/
│   │   │       ├── entities/
│   │   │       ├── repositories/
│   │   │       ├── services/
│   │   │       └── Application.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── templates/
│   │       └── static/
│   └── test/
│       └── java/
│           └── com/example/app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── k8s/
│   └── deployment.yml
├── .gitignore
├── pom.xml
└── README.md
```

## Génération d'entités et de CRUD

### Création d'une entité

Pour générer une nouvelle entité dans votre projet :

```bash
sfs generate entity Product
```

Vous serez guidé à travers une série de questions pour définir :
- Les champs de l'entité (nom, type, validation)
- Les relations avec d'autres entités
- Les options de pagination
- La génération de DTOs et services associés

### Exemple d'entité complète

```bash
sfs generate entity Product --fields="name:String required, price:BigDecimal required, description:Text, category:Enumeration(ELECTRONICS,BOOKS,CLOTHING), rating:Float, active:Boolean required" --relationships="manyToOne category:Category, oneToMany reviews:Review"
```

### Génération de CRUD

Une fois votre entité créée, vous pouvez générer les opérations CRUD associées :

```bash
sfs generate crud --entity=Product
```

Cela générera :
- Un service pour gérer les opérations métier
- Un contrôleur REST avec endpoints CRUD
- Documentation OpenAPI pour les endpoints
- Tests unitaires et d'intégration

### Personnalisation du CRUD

Vous pouvez personnaliser le CRUD généré :

```bash
sfs generate crud --entity=Product --pagination=infinite-scroll --dto=true --service=serviceClass --search=elasticsearch
```

### Génération de DTOs

Pour générer uniquement des DTOs pour une entité existante :

```bash
sfs generate dtos --entity=Product --validation=true --mapstruct=true
```

## Personnalisation des templates

Spring-Fullstack-Speed utilise des templates pour générer le code. Vous pouvez personnaliser ces templates pour adapter le code généré à vos besoins.

### Extraction des templates

Extrayez les templates par défaut pour les personnaliser :

```bash
sfs extract-templates
```

Cela créera un dossier `.sfs/templates` dans votre projet avec tous les templates utilisables.

### Modification des templates

Modifiez les templates extraits selon vos besoins. Par exemple, pour personnaliser le template d'entité :

1. Ouvrez `.sfs/templates/entity/entity.java.ejs`
2. Modifiez le template selon vos besoins
3. Lors de la prochaine génération, SFS utilisera vos templates personnalisés

### Templates disponibles

- **Entity** : Templates pour les entités JPA
- **Repository** : Templates pour Spring Data repositories
- **Service** : Templates pour la couche service
- **Controller** : Templates pour les contrôleurs REST
- **DTO** : Templates pour les objets de transfert de données
- **Frontend** : Templates pour les composants frontend

## Options de déploiement

Spring-Fullstack-Speed génère des projets prêts pour différentes options de déploiement.

### Déploiement Docker

Pour construire et lancer votre application avec Docker :

```bash
sfs build docker
sfs deploy docker
```

Ou manuellement :

```bash
docker-compose up -d
```

### Déploiement Kubernetes

Pour déployer sur Kubernetes :

```bash
sfs deploy kubernetes --namespace=my-app
```

Cela utilisera les fichiers générés dans le dossier `k8s/`.

### Déploiement Cloud

SFS prend en charge les déploiements vers différentes plateformes cloud :

```bash
# AWS
sfs deploy aws --region=eu-west-1 --profile=production

# Azure
sfs deploy azure --resource-group=my-app

# Google Cloud
sfs deploy gcp --project=my-project
```

## Bonnes pratiques

### Architecture

- Utilisez des modules cohésifs pour organiser votre code
- Séparez clairement les responsabilités entre les couches
- Utilisez des DTOs pour les transferts de données API
- Documentez vos API avec OpenAPI

### Sécurité

- Utilisez HTTPS en production
- Activez CSRF pour les applications web
- Définissez des politiques de mot de passe strictes
- Validez toutes les entrées utilisateur

### Performance

- Utilisez le cache pour les données statiques
- Implémentez la pagination pour les grandes collections
- Optimisez les requêtes de base de données
- Utilisez des projections pour les requêtes de lecture

## Troubleshooting

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Erreur de compilation | Vérifiez les versions de Java et Maven/Gradle |
| Erreur de connexion à la BD | Vérifiez les informations de connexion dans `application.yml` |
| Erreurs NPM | Nettoyez le cache avec `npm cache clean --force` |
| Erreurs de packages | Assurez-vous que toutes les dépendances sont installées |
| Problèmes Docker | Vérifiez que Docker Desktop est en cours d'exécution |

### Diagnostic

Utilisez la commande `sfs doctor` pour diagnostiquer les problèmes courants :

```bash
sfs doctor --fix
```

### Logs

Pour activer les logs de débogage dans Spring Boot :

1. Modifiez `src/main/resources/application.yml`
2. Ajoutez ou modifiez la section suivante :
   ```yaml
   logging:
     level:
       root: INFO
       com.example: DEBUG
       org.springframework.web: DEBUG
   ```

## FAQs

### Questions générales

**Q: SFS est-il compatible avec Spring Boot 3.x ?**
R: Oui, SFS génère des projets compatibles avec les dernières versions de Spring Boot.

**Q: Puis-je utiliser Kotlin au lieu de Java ?**
R: Oui, utilisez l'option `--language=kotlin` lors de la génération du projet.

**Q: Comment mettre à jour SFS ?**
R: Exécutez `npm update -g @enokdev/spring-fullstack-speed`.

**Q: Est-ce que SFS est compatible avec MariaDB ?**
R: Oui, vous pouvez choisir MariaDB comme option de base de données.

**Q: Comment contribuer au projet ?**
R: Consultez notre [guide de contribution](./contributing.md).

### Questions techniques

**Q: Comment ajouter des validations personnalisées ?**
R: Créez des annotations de validation personnalisées dans un package `validation`.

**Q: Comment personnaliser la configuration de sécurité ?**
R: Modifiez la classe `SecurityConfiguration` générée.

**Q: Comment ajouter des migrations de base de données manuelles ?**
R: Ajoutez des fichiers SQL dans `src/main/resources/db/migration/`.

**Q: Comment configurer CORS pour mon API ?**
R: Modifiez la méthode `corsFilter` dans la classe de configuration.

## Guides de migration

### Migration de Spring Boot 2.x vers 3.x

Si vous avez un projet SFS basé sur Spring Boot 2.x, voici comment migrer vers Spring Boot 3.x :

1. Mettez à jour votre `pom.xml` ou `build.gradle` :
   ```xml
   <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>3.2.0</version>
   </parent>
   ```

2. Mettez à niveau Java vers la version 17 minimum

3. Mettez à jour vos dépendances Jakarta EE :
   - Remplacez `javax.*` par `jakarta.*`
   - Utilisez `sfs upgrade --jakarta` pour automatiser ce processus

4. Exécutez les tests pour vérifier la compatibilité

### Migration entre les versions de SFS

Pour migrer entre les versions de SFS :

```bash
# Installez la nouvelle version
npm install -g @enokdev/spring-fullstack-speed@latest

# Exécutez la commande de mise à niveau dans votre projet
sfs upgrade
```

---

Pour plus d'informations, consultez la [documentation complète](https://spring-fullstack-speed.io/docs) ou rejoignez notre [communauté](https://discord.gg/spring-fullstack-speed).
