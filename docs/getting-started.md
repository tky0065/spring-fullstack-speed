# Guide de démarrage rapide

Ce guide vous aidera à démarrer rapidement avec Spring-Fullstack-Speed (SFS), un générateur d'applications fullstack Spring Boot.

## Prérequis

- Node.js (v18 ou supérieur)
- npm (v8 ou supérieur)
- JDK (v17 ou supérieur)
- Maven ou Gradle

## Installation

```bash
# Installation globale
npm install -g @enokdev/spring-fullstack-speed
```

## Générer votre première application

1. Créez un nouveau dossier pour votre projet et placez-vous dedans :

```bash
mkdir mon-projet && cd mon-projet
```

2. Exécutez le générateur :

```bash
sfs
```

3. Répondez aux questions interactives pour configurer votre application.

4. Une fois la génération terminée, vous pouvez lancer votre application :

```bash
# Pour les projets Maven
./mvnw spring-boot:run

# Pour les projets Gradle
./gradlew bootRun
```

5. Accédez à votre application dans un navigateur web :

```
http://localhost:8080
```

## Structure du projet généré

Votre application générée aura une structure similaire à celle-ci :

```
mon-projet/
├── src/
│   ├── main/java/          # Code source Java
│   ├── main/resources/     # Ressources (config, templates, etc.)
│   └── test/               # Tests unitaires et d'intégration
├── frontend/               # Code frontend (si applicable)
└── pom.xml ou build.gradle # Configuration du build
```

## Prochaines étapes

- [Guide des entités](./entities.md)
- [Guide des DTOs](./dtos.md)
- [Guide des opérations CRUD](./crud.md)
- [Guide des modules](./modules.md)
