# Changelog

Tous les changements notables dans ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-20

### Ajouté
- Générateur principal d'applications Spring Boot avec différentes options de frontend
- Support pour React , Vue.js a, Angular, Thymeleaf et JTE
- Support pour différentes bases de données (PostgreSQL, MySQL, MongoDB, H2)
- Générateur d'entités JPA avec relations
- Générateur de DTOs et mappeurs
- Générateur de modules applicatifs
- Générateur d'opérations CRUD
- Générateur de tests unitaires et d'intégration
- Support pour l'authentification JWT et OAuth2
- Configuration automatique de Docker et docker-compose
- Support pour Maven et Gradle
- Interface utilisateur CLI interactive avec menus de navigation
- Système de templates extensible
- Documentation utilisateur complète

### Corrigé
- Résolution des problèmes de compilation TypeScript
- Correction des erreurs de typage avec prompt() dans les générateurs
- Correction des problèmes avec les promesses non résolues
- Amélioration de la cohérence des options entre générateurs
- Ajout de la propriété authType manquante dans tous les objets de configuration

## [0.9.0] - 2025-05-15

### Ajouté
- Version bêta avec les fonctionnalités de base
- Premier support pour Spring Boot avec React
- Génération de projets Maven
- Support initial pour PostgreSQL
- Tests unitaires de base

### Connu
- Problèmes de compilation TypeScript
- Incohérences entre certains générateurs
