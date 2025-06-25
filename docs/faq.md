# Foire Aux Questions (FAQ) - Spring-Fullstack-Speed

Cette FAQ répond aux questions les plus fréquemment posées sur Spring-Fullstack-Speed (SFS). Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à consulter notre [documentation complète](https://spring-fullstack-speed.io/docs) ou à rejoindre notre communauté.

## Table des matières

1. [Questions générales](#questions-générales)
2. [Installation et configuration](#installation-et-configuration)
3. [Génération de projets](#génération-de-projets)
4. [Entités et CRUD](#entités-et-crud)
5. [Frontend](#frontend)
6. [Sécurité](#sécurité)
7. [Base de données](#base-de-données)
8. [Déploiement](#déploiement)
9. [Performance](#performance)
10. [Personnalisation](#personnalisation)
11. [Dépannage](#dépannage)

## Questions générales

### Qu'est-ce que Spring-Fullstack-Speed (SFS) ?

Spring-Fullstack-Speed est un générateur d'applications fullstack basé sur Spring Boot. Il permet de créer rapidement des applications web modernes avec un backend Spring Boot et différents frameworks frontend (React, Angular, Vue.js, Thymeleaf ou JTE). SFS automatise la génération de code boilerplate, l'intégration des technologies modernes et la mise en place de bonnes pratiques.

### En quoi SFS est-il différent de JHipster ?

Bien que SFS s'inspire de JHipster, il se différencie par :
- Une focus sur la simplicité et la rapidité de développement
- Une meilleure intégration avec les technologies frontend modernes
- Des configurations par défaut optimisées pour la production
- Un système de plugins plus flexible
- Une génération de code plus légère et maintenable
- Une meilleure intégration des technologies cloud natives

### SFS est-il gratuit et open-source ?

Oui, Spring-Fullstack-Speed est un projet open-source sous licence MIT. Vous pouvez l'utiliser librement, même pour des projets commerciaux.

### Comment puis-je contribuer à SFS ?

Vous pouvez contribuer de plusieurs façons :
- En signalant des bugs ou en proposant des améliorations via les issues GitHub
- En soumettant des pull requests pour corriger des bugs ou ajouter des fonctionnalités
- En améliorant la documentation
- En créant des plugins ou des templates personnalisés
- En partageant votre expérience et en aidant d'autres utilisateurs

Pour plus d'informations, consultez notre [guide de contribution](./contributing.md).

## Installation et configuration

### Quels sont les prérequis pour utiliser SFS ?

Pour utiliser Spring-Fullstack-Speed, vous avez besoin de :
- Node.js (v18 ou supérieur)
- npm (v8 ou supérieur)
- JDK (v17 ou supérieur)
- Maven (3.8+) ou Gradle (7.0+)
- Git (optionnel, mais recommandé)

### Comment installer SFS ?

```bash
npm install -g @enokdev/spring-fullstack-speed
```

### Comment vérifier que l'installation a réussi ?

```bash
sfs --version
```

### Puis-je utiliser SFS sans l'installer globalement ?

Oui, vous pouvez l'utiliser avec npx :

```bash
npx @enokdev/spring-fullstack-speed
```

### Comment mettre à jour SFS vers la dernière version ?

```bash
npm update -g @enokdev/spring-fullstack-speed
```

## Génération de projets

### Comment créer un nouveau projet avec SFS ?

```bash
mkdir mon-projet && cd mon-projet
sfs
```
Suivez ensuite les instructions interactives.

### Puis-je générer un projet sans interface interactive ?

Oui, vous pouvez utiliser les options en ligne de commande :

```bash
sfs --name=mon-projet --package=com.example.app --database=mysql --frontend=react --auth=jwt
```

### Quels frameworks frontend sont supportés par SFS ?

SFS supporte actuellement :
- React (avec TypeScript)
- Angular (avec TypeScript)
- Vue.js (avec TypeScript)
- Thymeleaf (templates côté serveur)
- JTE (templates côté serveur)

### Puis-je changer de framework frontend après avoir généré mon projet ?

Non, le framework frontend est une décision architecturale fondamentale. Si vous souhaitez changer de framework, il est recommandé de générer un nouveau projet.

### Quelle est la structure de projet recommandée pour une application SFS ?

SFS génère une structure de projet suivant les meilleures pratiques Spring Boot :
- Package par feature pour le backend
- Organisation modulaire pour le frontend
- Séparation claire des responsabilités
- Configuration externalisée

## Entités et CRUD

### Comment générer une nouvelle entité ?

```bash
sfs generate entity NomEntité
```

### Comment définir les champs d'une entité via la ligne de commande ?

```bash
sfs generate entity Product --fields="name:String required, price:BigDecimal required, description:Text"
```

### Quels types de champs sont supportés ?

SFS supporte tous les types JPA courants : String, Integer, Long, Float, Double, BigDecimal, LocalDate, ZonedDateTime, Instant, Boolean, Enumeration, etc.

### Comment définir des relations entre entités ?

```bash
sfs generate entity Product --relationships="manyToOne category:Category, oneToMany reviews:Review"
```

### Comment générer un CRUD complet pour une entité ?

```bash
sfs generate crud --entity=Product
```

### Puis-je personnaliser la pagination pour une entité ?

Oui, vous pouvez choisir parmi :
- `pagination` (pagination classique par pages)
- `infinite-scroll` (chargement dynamique)
- `none` (pas de pagination)

```bash
sfs generate crud --entity=Product --pagination=infinite-scroll
```

### Comment générer des DTOs pour une entité ?

```bash
sfs generate dtos --entity=Product
```

## Frontend

### Comment structurer les composants frontend générés ?

SFS génère une structure frontend modulaire avec :
- Composants réutilisables
- Pages pour chaque fonctionnalité
- Services pour la communication API
- États/stores pour la gestion de l'état global

### Comment SFS gère-t-il la communication entre le backend et le frontend ?

SFS génère des clients API typés basés sur OpenAPI :
- Pour React : axios + hooks personnalisés
- Pour Angular : HttpClient + services typés
- Pour Vue.js : axios + composables

### Puis-je utiliser GraphQL au lieu de REST ?

Oui, SFS propose une option GraphQL :

```bash
sfs --features=graphql
```

### Comment personnaliser le thème de l'interface utilisateur ?

SFS génère des projets avec support pour :
- TailwindCSS
- Bootstrap
- Material UI
- Custom CSS/SCSS

Vous pouvez modifier les configurations dans les fichiers respectifs.

## Sécurité

### Quelles options d'authentification sont disponibles ?

SFS propose plusieurs options d'authentification :
- JWT (JSON Web Tokens)
- OAuth2 / OpenID Connect
- Session classique
- Pas d'authentification

### Comment SFS gère-t-il les autorisations ?

SFS implémente un système d'autorisation basé sur :
- Rôles (ROLE_USER, ROLE_ADMIN, etc.)
- Permissions granulaires
- Annotations de sécurité Spring
- Vérifications côté client et serveur

### Comment implémenter une authentification à deux facteurs ?

SFS peut générer une implémentation 2FA :

```bash
sfs add 2fa --type=totp
```

### Les mots de passe sont-ils stockés de manière sécurisée ?

Oui, SFS utilise BCrypt pour le hachage des mots de passe, conformément aux meilleures pratiques de sécurité.

## Base de données

### Quelles bases de données sont supportées ?

SFS supporte :
- MySQL
- PostgreSQL
- MariaDB
- H2 (développement)
- MongoDB
- Oracle
- Microsoft SQL Server

### Comment configurer les migrations de base de données ?

SFS configure automatiquement Liquibase ou Flyway selon votre choix :

```bash
sfs --database-migration=liquibase
```

### Comment SFS gère-t-il les environnements multiples ?

SFS génère des configurations spécifiques à chaque environnement :
- `application-dev.yml`
- `application-prod.yml`
- `application-test.yml`

### Puis-je utiliser plusieurs bases de données dans mon application ?

Oui, SFS peut configurer plusieurs sources de données :

```bash
sfs add datasource --name=secondary --type=mysql
```

## Déploiement

### Comment déployer une application SFS sur Docker ?

SFS génère des fichiers Docker optimisés :

```bash
sfs deploy docker
```

### Comment déployer sur Kubernetes ?

```bash
sfs deploy kubernetes
```

SFS génère tous les fichiers K8s nécessaires (deployments, services, ingress, etc.).

### SFS supporte-t-il les déploiements cloud natifs ?

Oui, SFS génère des configurations pour :
- AWS
- Google Cloud
- Azure
- Heroku

### Comment configurer CI/CD pour mon application ?

SFS génère des fichiers de configuration pour :
- GitHub Actions
- GitLab CI
- Jenkins
- Circle CI

## Performance

### Comment SFS optimise-t-il les performances du backend ?

SFS implémente plusieurs optimisations :
- Configuration du pool de connexions
- Mise en cache avec Redis
- Lazy loading des relations
- Optimisation des requêtes JPQL/HQL
- Pagination efficiente

### Comment SFS optimise-t-il les performances du frontend ?

- Code splitting
- Lazy loading des composants
- Minification et bundling optimisés
- Stratégies de cache pour les assets
- SSR optionnel (pour React et Vue)

### Comment configurer le monitoring de mon application ?

SFS intègre :
- Micrometer pour les métriques
- Prometheus pour la collecte
- Grafana pour la visualisation

## Personnalisation

### Comment personnaliser les templates utilisés par SFS ?

```bash
sfs extract-templates
```

Cela extrait tous les templates dans `.sfs/templates/` où vous pouvez les modifier.

### Puis-je créer mes propres générateurs ?

Oui, vous pouvez créer des générateurs personnalisés :

```bash
sfs create-generator mon-generateur
```

### Comment créer un plugin pour SFS ?

Créez un package npm suivant la convention de nommage `sfs-plugin-*` avec la structure appropriée. Voir [documentation des plugins](./plugins.md) pour plus de détails.

### Puis-je personnaliser les commandes générées par SFS ?

Oui, vous pouvez modifier les scripts générés dans `package.json` et les classes Java générées.

## Dépannage

### Comment diagnostiquer les problèmes dans mon application ?

```bash
sfs doctor
```
Cette commande analyse votre projet et identifie les problèmes courants.

### Comment résoudre les problèmes de dépendances incompatibles ?

```bash
sfs fix-dependencies
```

### Que faire en cas d'erreur pendant la génération ?

1. Vérifiez les logs d'erreur
2. Assurez-vous que tous les prérequis sont installés
3. Vérifiez la compatibilité des versions
4. Consultez les issues GitHub connues
5. Essayez de nettoyer le cache npm (`npm cache clean --force`)

### Comment signaler un bug ?

Créez une issue sur notre dépôt GitHub avec :
- La version de SFS utilisée
- Les étapes pour reproduire le bug
- Les logs d'erreur
- L'environnement (OS, Node.js, Java)

---

Si vous avez d'autres questions qui ne sont pas couvertes ici, n'hésitez pas à consulter notre documentation complète ou à rejoindre notre communauté sur Discord.
