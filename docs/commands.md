# Documentation des commandes et options disponibles

Ce document présente toutes les commandes et options disponibles dans Spring-Fullstack-Speed (SFS) pour générer rapidement vos applications Spring Boot.

## Table des matières

- [Commande principale](#commande-principale)
- [Générateurs disponibles](#générateurs-disponibles)
- [Options globales](#options-globales)
- [Générateur d'application](#générateur-dapplication)
- [Générateur d'entités](#générateur-dentités)
- [Générateur de CRUD](#générateur-de-crud)
- [Générateur de DTOs](#générateur-de-dtos)
- [Générateur de conteneur](#générateur-de-conteneur)
- [Générateur de Kubernetes](#générateur-de-kubernetes)
- [Générateur de tests](#générateur-de-tests)
- [Générateur de CI/CD](#générateur-de-cicd)
- [Autres commandes utiles](#autres-commandes-utiles)
- [Mode interactif vs Mode non-interactif](#mode-interactif-vs-mode-non-interactif)

## Commande principale

La commande principale pour utiliser SFS est `sfs`. Si vous l'exécutez sans argument, l'outil démarre en mode interactif.

```bash
sfs
```

## Générateurs disponibles

Le tableau suivant présente tous les générateurs disponibles et leur utilisation :

| Générateur | Description | Commande |
|------------|-------------|----------|
| Application | Génère une application Spring Boot complète | `sfs app` ou `sfs` |
| Entity | Génère une entité JPA | `sfs entity` ou `sfs --entity` |
| CRUD | Génère des opérations CRUD pour une entité | `sfs crud` ou `sfs --crud` |
| DTOs | Génère des DTOs pour une entité | `sfs dtos` ou `sfs --dtos` |
| Container | Ajoute la configuration Docker | `sfs container` ou `sfs --container` |
| Kubernetes | Ajoute la configuration Kubernetes | `sfs kubernetes` ou `sfs --kubernetes` |
| Frontend tests | Génère des tests pour le frontend | `sfs frontend-tests` |
| Backend tests | Génère des tests pour le backend | `sfs backend-tests` |
| CI/CD | Configure l'intégration continue | `sfs cicd` ou `sfs --cicd` |
| Module | Génère un module fonctionnel | `sfs module` |
| Add | Ajoute des fonctionnalités à un projet existant | `sfs add` |
| Search | Ajoute des fonctionnalités de recherche | `sfs search` |
| Notification | Ajoute un système de notifications | `sfs notification` |
| Serve | Lance l'application en mode développement | `sfs serve` |
| Doctor | Diagnostique les problèmes potentiels | `sfs doctor` |
| Upgrade | Met à niveau le projet vers les dernières versions | `sfs upgrade` |

## Options globales

Ces options s'appliquent à tous les générateurs :

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--verbose` | Affiche des informations détaillées durant l'exécution | `false` | `--verbose` |
| `--force` | Force l'écrasement des fichiers existants | `false` | `--force` |
| `--skip-install` | Ignore l'installation des dépendances | `false` | `--skip-install` |
| `--help` | Affiche l'aide pour la commande | - | `--help` |
| `--version` | Affiche la version de l'outil | - | `--version` |
| `--quiet` | Mode silencieux, n'affiche pas les informations non essentielles | `false` | `--quiet` |

## Générateur d'application

Le générateur d'application (`sfs app` ou simplement `sfs`) crée une nouvelle application Spring Boot.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--app-name` | Nom de l'application | - | `--app-name=my-app` |
| `--package-name` | Nom du package Java | `com.example.app` | `--package-name=com.mycompany.app` |
| `--build-tool` | Outil de build | `maven` | `--build-tool=gradle` |
| `--java-version` | Version de Java | `17` | `--java-version=11` |
| `--spring-boot-version` | Version de Spring Boot | `3.0.0` | `--spring-boot-version=2.7.5` |
| `--database` | Type de base de données | `h2` | `--database=postgresql` |
| `--frontend` | Framework frontend | `none` | `--frontend=react` |
| `--auth` | Type d'authentification | `none` | `--auth=JWT` |
| `--template` | Template de projet à utiliser | `default` | `--template=microservice` |
| `--features` | Fonctionnalités additionnelles | - | `--features=docker,openapi,swagger` |
| `--api-prefix` | Préfixe pour les points d'API REST | `/api` | `--api-prefix=/v1/api` |
| `--port` | Port du serveur | `8080` | `--port=3000` |

### Exemples

Créer une application avec des options détaillées :

```bash
sfs app --app-name=todo-app --package-name=com.example.todo --build-tool=maven --database=postgresql --frontend=react --auth=JWT --features=docker,openapi,i18n --java-version=17 --port=8088
```

## Générateur d'entités

Le générateur d'entités (`sfs entity`) crée une nouvelle entité JPA dans votre projet.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--name` | Nom de l'entité | - | `--name=Product` |
| `--fields` | Liste des champs avec leurs types | - | `--fields=name:string,price:decimal` |
| `--relationships` | Relations avec d'autres entités | - | `--relationships=category:ManyToOne,tags:ManyToMany` |
| `--table-name` | Nom de la table en base de données | Nom de l'entité en snake_case | `--table-name=products` |
| `--dto` | Générer automatiquement des DTOs | `false` | `--dto=true` |
| `--service` | Générer automatiquement une couche service | `false` | `--service=true` |
| `--pageable` | Ajouter le support de la pagination | `false` | `--pageable=true` |
| `--auditable` | Ajouter des champs d'audit (created/modified) | `false` | `--auditable=true` |
| `--repository` | Générer automatiquement un repository | `true` | `--repository=false` |

### Exemples

Générer une entité Product avec plusieurs champs et relations :

```bash
sfs entity --name=Product --fields=name:string,description:text,price:decimal,sku:string:unique,inStock:boolean --relationships=category:ManyToOne,reviews:OneToMany --table-name=products --dto=true --service=true --auditable=true
```

## Générateur de CRUD

Le générateur CRUD (`sfs crud`) crée des opérations CRUD pour une entité existante.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--entity` | Nom de l'entité | - | `--entity=Product` |
| `--repository` | Générer un repository | `true` | `--repository=true` |
| `--service` | Générer une couche service | `true` | `--service=true` |
| `--controller` | Générer un contrôleur | `true` | `--controller=true` |
| `--rest` | Utiliser une API REST | `true` | `--rest=true` |
| `--pageable` | Ajouter le support de la pagination | `false` | `--pageable=true` |
| `--dto` | Utiliser des DTOs | `true` | `--dto=true` |
| `--api-prefix` | Préfixe des points API | `/api` | `--api-prefix=/v1/api` |
| `--validation` | Ajouter la validation des données | `true` | `--validation=true` |
| `--swagger` | Ajouter des annotations Swagger | `false` | `--swagger=true` |

### Exemples

Générer des opérations CRUD complètes pour l'entité Product :

```bash
sfs crud --entity=Product --repository=true --service=true --controller=true --rest=true --pageable=true --dto=true --validation=true --swagger=true --api-prefix=/api/v1
```

## Générateur de DTOs

Le générateur de DTOs (`sfs dtos`) crée des objets de transfert de données pour une entité.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--entity` | Nom de l'entité | - | `--entity=Product` |
| `--summary` | Générer un DTO résumé | `true` | `--summary=true` |
| `--create` | Générer un DTO pour la création | `true` | `--create=true` |
| `--update` | Générer un DTO pour la mise à jour | `true` | `--update=true` |
| `--mappings` | Générer des mappeurs | `true` | `--mappings=true` |
| `--validation` | Ajouter des annotations de validation | `true` | `--validation=true` |
| `--mapper-library` | Bibliothèque de mapping à utiliser | `mapstruct` | `--mapper-library=modelMapper` |
| `--include-relationships` | Inclure les entités liées | `true` | `--include-relationships=false` |

### Exemples

Générer des DTOs complets avec MapStruct pour l'entité Product :

```bash
sfs dtos --entity=Product --create=true --update=true --summary=true --mappings=true --validation=true --mapper-library=mapstruct --include-relationships=true
```

## Générateur de conteneur

Le générateur de conteneur (`sfs container`) ajoute une configuration Docker à votre projet.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--type` | Type de configuration | `docker` | `--type=docker` |
| `--database` | Inclure la base de données | `true` | `--database=true` |
| `--frontend` | Inclure le frontend | `true` | `--frontend=true` |
| `--port` | Port à exposer | `8080` | `--port=8080` |
| `--production` | Configuration optimisée pour la production | `false` | `--production=true` |
| `--multistage` | Utiliser un build multi-étapes | `true` | `--multistage=true` |
| `--compose` | Générer un docker-compose.yml | `true` | `--compose=true` |
| `--dev-mode` | Ajouter une configuration de développement | `true` | `--dev-mode=true` |
| `--volumes` | Configurer des volumes persistants | `false` | `--volumes=true` |
| `--network` | Configurer un réseau Docker | `bridge` | `--network=host` |

### Exemples

Ajouter une configuration Docker complète :

```bash
sfs container --type=docker --database=true --frontend=true --port=8080 --production=true --multistage=true --compose=true --volumes=true
```

## Générateur de Kubernetes

Le générateur Kubernetes (`sfs kubernetes`) ajoute une configuration Kubernetes à votre projet.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--namespace` | Namespace Kubernetes | `default` | `--namespace=my-app` |
| `--replicas` | Nombre de réplicas | `1` | `--replicas=3` |
| `--database` | Inclure la base de données | `true` | `--database=true` |
| `--ingress` | Configurer un Ingress | `true` | `--ingress=true` |
| `--service-type` | Type de service | `ClusterIP` | `--service-type=LoadBalancer` |
| `--resource-limits` | Définir des limites de ressources | `false` | `--resource-limits=true` |
| `--monitoring` | Ajouter la configuration de monitoring | `false` | `--monitoring=true` |
| `--helm` | Générer un chart Helm | `false` | `--helm=true` |
| `--istio` | Ajouter la configuration Istio | `false` | `--istio=true` |

### Exemples

Générer une configuration Kubernetes avec Helm et monitoring :

```bash
sfs kubernetes --namespace=my-app --replicas=2 --ingress=true --resource-limits=true --monitoring=true --helm=true
```

## Générateur de tests

Les générateurs de tests (`sfs frontend-tests` et `sfs backend-tests`) ajoutent des tests à votre projet.

### Options spécifiques pour les tests backend

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--type` | Type de tests | `unit` | `--type=integration` |
| `--controllers` | Générer des tests pour les contrôleurs | `true` | `--controllers=true` |
| `--services` | Générer des tests pour les services | `true` | `--services=true` |
| `--repositories` | Générer des tests pour les repositories | `true` | `--repositories=true` |
| `--entities` | Liste des entités à tester | `all` | `--entities=Product,User` |
| `--mock-framework` | Framework de mock à utiliser | `mockito` | `--mock-framework=easymock` |
| `--test-containers` | Utiliser Testcontainers | `false` | `--test-containers=true` |
| `--coverage` | Configurer la couverture de code | `false` | `--coverage=true` |

### Options spécifiques pour les tests frontend

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--framework` | Framework de test | `jest` | `--framework=vitest` |
| `--components` | Tester les composants | `true` | `--components=true` |
| `--services` | Tester les services | `true` | `--services=true` |
| `--e2e` | Ajouter des tests end-to-end | `false` | `--e2e=true` |
| `--e2e-tool` | Outil pour les tests E2E | `cypress` | `--e2e-tool=playwright` |
| `--snapshots` | Utiliser les snapshots | `false` | `--snapshots=true` |
| `--accessibility` | Tests d'accessibilité | `false` | `--accessibility=true` |

### Exemples

Générer des tests backend d'intégration avec Testcontainers :

```bash
sfs backend-tests --type=integration --controllers=true --services=true --repositories=true --test-containers=true --entities=Product,Order --coverage=true
```

Générer des tests frontend complets :

```bash
sfs frontend-tests --framework=vitest --components=true --services=true --e2e=true --e2e-tool=playwright --snapshots=true --accessibility=true
```

## Générateur de CI/CD

Le générateur CI/CD (`sfs cicd`) ajoute une configuration d'intégration continue à votre projet.

### Options spécifiques

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--platform` | Plateforme CI/CD | `github` | `--platform=gitlab` |
| `--build` | Configurer le build automatique | `true` | `--build=true` |
| `--test` | Configurer les tests automatiques | `true` | `--test=true` |
| `--deploy` | Configurer le déploiement automatique | `false` | `--deploy=true` |
| `--docker` | Inclure la construction d'images Docker | `true` | `--docker=true` |
| `--environments` | Environnements à configurer | `development,production` | `--environments=dev,staging,prod` |
| `--branches` | Branches principales | `main` | `--branches=main,develop` |
| `--secrets` | Configurer les secrets nécessaires | `false` | `--secrets=true` |
| `--caching` | Activer le cache pour les builds | `true` | `--caching=true` |

### Exemples

Configurer CI/CD sur GitHub avec déploiement :

```bash
sfs cicd --platform=github --build=true --test=true --deploy=true --docker=true --environments=development,staging,production --branches=main,develop --secrets=true --caching=true
```

## Autres commandes utiles

### Serve

La commande `sfs serve` lance votre application en mode développement.

```bash
sfs serve --frontend=true --backend=true --watch=true --port=8080
```

### Doctor

La commande `sfs doctor` diagnostique les problèmes dans votre projet.

```bash
sfs doctor --fix=true --verbose=true
```

### Upgrade

La commande `sfs upgrade` met à niveau votre projet vers les dernières versions.

```bash
sfs upgrade --spring-boot=3.0.0 --frontend-deps=true --backend-deps=true --dry-run=true
```

## Mode interactif vs Mode non-interactif

Spring-Fullstack-Speed peut être utilisé de deux façons principales :

### Mode interactif

En mode interactif, l'outil vous guide à travers une série de questions pour configurer votre projet. Ce mode est idéal pour les débutants ou lorsque vous explorez les possibilités.

Pour l'utiliser, lancez simplement `sfs` sans arguments ou avec une commande principale sans options :

```bash
sfs
```

ou

```bash
sfs entity
```

### Mode non-interactif

Le mode non-interactif permet d'automatiser la génération via des scripts ou CI/CD en spécifiant toutes les options en ligne de commande :

```bash
sfs app --app-name=api-service --package-name=com.example.api --build-tool=gradle --database=postgresql --frontend=none --auth=JWT
```

Vous pouvez également combiner les deux approches en spécifiant certaines options et en laissant l'outil vous interroger pour les autres.
