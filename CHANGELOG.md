# Changelog

Tous les changements notables dans ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-21

### Ajouté
- Générateur d'applications Spring Boot avec plusieurs options de base de données (H2, MySQL, PostgreSQL, MongoDB)
- Support pour plusieurs frameworks frontend (React, Vue.js, Angular, Thymeleaf, JTE)
- Générateur d'entités avec validations et relations
- Générateur de DTOs avec plusieurs stratégies de mapping (manuel, MapStruct, ModelMapper)
- Générateur CRUD avec pagination, tri et composants frontend
- Générateur de modules pour organiser le code par domaine fonctionnel
- Générateur de recherche avec support pour Elasticsearch
- Générateur de notifications (email, SMS, push, websocket)
- Générateur de conteneurisation Docker (simple, multi-stage, compose)
- Générateur de déploiement pour différentes plateformes cloud (AWS, Azure, GCP, Heroku)
- Générateur CI/CD pour différentes plateformes (GitHub Actions, GitLab CI, Jenkins)
- Tests unitaires, d'intégration, end-to-end et de cas limites
- Documentation complète des générateurs et cas d'utilisation
- Support multi-plateforme (Windows, Linux, macOS)

### Changé
- Refactoring majeur de l'architecture des générateurs pour plus de modularité
- Amélioration de l'interface utilisateur CLI
- Optimisation des templates pour les dernières versions des frameworks

### Corrigé
- Problèmes de compatibilité ESM/CommonJS
- Inconsistances dans les conventions de nommage
- Bugs dans la génération des relations entre entités

## [Non publié]

### À venir
- Support pour GraphQL
- Génération de tests automatisés pour le code client
- Support pour les microservices
- Assistant d'architecture avec intelligence artificielle
