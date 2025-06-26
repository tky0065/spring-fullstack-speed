# Liste des tâches pour améliorer le générateur Spring-Fullstack-Speed

## Problèmes identifiés et corrections à apporter

### 1. Problèmes de génération des entités de base
- [x] Ajouter la génération du `BaseEntity.java` dans la méthode `generateBaseDirectories` ou créer une méthode dédiée `generateBaseClasses`
- [x] Ajouter la génération du `BaseRepository.java` dans la méthode `generateBaseDirectories` ou créer une méthode dédiée `generateBaseRepositories`

### 2. Problèmes avec les configurations d'authentification
- [x] Modifier la méthode `generateAuth` pour ne générer que les fichiers correspondant au type d'authentification choisi (JWT, OAuth2, etc.)
- [x] Corriger le `AuthController.java` pour n'inclure que la configuration JWT lorsque seule l'option JWT est sélectionnée
- [x] Revoir la logique conditionnelle dans `generate-auth.js` pour éviter d'inclure des fichiers non pertinents

### 3. Package incorrects dans les fichiers générés
- [x] Corriger tous les templates pour utiliser `<%= packageName %>` au lieu de `com.example` fixe
- [x] Vérifier tous les imports dans les templates pour s'assurer qu'ils utilisent également `<%= packageName %>`

### 4. Génération de frontend inutile pour les projets API-only
- [x] Améliorer la logique conditionnelle dans `index.ts` pour ne pas générer les configurations frontend lorsque l'option "API seulement" est sélectionnée

### 5. Utilisation de Lombok pour les entités et DTOs
- [x] S'assurer que tous les templates d'entités utilisent les annotations Lombok (`@Getter`, `@Setter`, `@Data`, etc.)
- [x] S'assurer que tous les templates de DTOs utilisent les annotations Lombok
- [x] Ajouter la dépendance Lombok dans les fichiers `pom.xml.ejs` et `build.gradle.kts.ejs`

### 6. Fichiers de sécurité manquants dans la génération
- [x] Identifier les fichiers de sécurité essentiels et s'assurer qu'ils sont générés correctement
- [x] Créer une méthode `generateSecurityClasses` plus complète qui génère tous les fichiers nécessaires en fonction du type d'authentification

### 7. Amélioration de la génération en fonction des choix utilisateur
- [x] Revoir toutes les méthodes de génération pour respecter les choix de l'utilisateur (database, auth, frontend, etc.)
- [x] Ajouter des conditions dans chaque méthode de génération pour éviter de générer des fichiers inutiles

### 8. Correction des chemins et des noms de packages
- [x] Normaliser l'utilisation des chemins dans toutes les méthodes de génération
- [x] S'assurer que `javaPackagePath` est correctement utilisé dans toutes les méthodes

### 9. Docker
- [x] Corriger la génération des fichiers Docker pour qu'ils soient conformes aux choix de l'utilisateur
- [x] Ajouter des templates pour les configurations Docker spécifiques aux bases de données et aux frameworks frontend
- [x] S'assurer que les fichiers Docker sont générés dans le bon package


## Actions prioritaires

1. ~~Corriger la génération des classes de base (BaseEntity, BaseRepository)~~ ✅
2. ~~Corriger les packages dans les fichiers générés~~ ✅
3. ~~Améliorer la sélection conditionnelle des fichiers en fonction des choix utilisateur~~ ✅
4. ~~Implémenter l'utilisation systématique de Lombok~~ ✅
5. ~~Corriger la génération des fichiers de sécurité~~ ✅
6. ~~Corriger la génération des fichiers Docker~~ ✅

## Résumé des modifications effectuées

- Ajout de la génération automatique de `BaseEntity.java` et `BaseRepository.java`
- Mise à jour de la fonction `generateAuth` pour ne générer que les fichiers spécifiques au type d'authentification sélectionné
- Correction des déclarations de package dans les templates pour utiliser `<%= packageName %>`
- Amélioration de la logique conditionnelle pour la génération du frontend
- Ajout des annotations Lombok dans les DTOs et entités
- Ajout de la dépendance Lombok dans les fichiers `pom.xml.ejs` et `build.gradle.kts.ejs`
- Normalisation de l'utilisation des chemins de génération avec `javaPackagePath`
- Refonte complète de la génération des fichiers Docker pour tenir compte des choix de l'utilisateur
- Ajout du support pour les différentes bases de données (PostgreSQL, MySQL, MongoDB) dans les configurations Docker
- Création de Dockerfiles spécifiques selon l'outil de build (Maven ou Gradle)
- Génération conditionnelle des configurations pour les services additionnels (Redis, Elasticsearch, Kafka, RabbitMQ)
