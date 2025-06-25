# Guide de contribution à Spring-Fullstack-Speed

## Introduction

Merci de votre intérêt pour contribuer au projet Spring-Fullstack-Speed! Ce document vous explique comment participer efficacement au développement du projet.

## Prérequis

- Node.js 14+ et npm
- Connaissance de Yeoman et des générateurs
- Familiarité avec Spring Boot et les frameworks frontend supportés

## Installation pour le développement

1. Cloner le dépôt:
```bash
git clone https://github.com/votreorganisation/spring-fullstack-speed.git
cd spring-fullstack-speed
```

2. Installer les dépendances:
```bash
npm install
```

3. Créer un lien symbolique pour tester localement:
```bash
npm link
```

## Structure du projet

Le projet est organisé comme suit:
- `generators/`: Contient tous les sous-générateurs
  - `app/`: Générateur principal pour une nouvelle application
  - `entity/`, `crud/`, etc.: Sous-générateurs spécialisés
- `docs/`: Documentation utilisateur
- `scripts/`: Scripts utilitaires
- `utils/`: Utilitaires communs aux générateurs

## Workflow de contribution

1. **Forker** le dépôt principal
2. Créer une **branche** avec un nom descriptif
3. **Implémenter** vos changements avec des commits atomiques
4. **Tester** vos changements (voir section Tests)
5. Soumettre une **Pull Request** avec une description détaillée

## Conventions de code

- Utiliser TypeScript pour tous les fichiers de code
- Suivre les règles ESLint configurées dans le projet
- Documenter les fonctions publiques avec JSDoc
- Utiliser les types stricts

## Tests

Exécuter les tests unitaires:
```bash
npm test
```

Exécuter les tests d'intégration:
```bash
npm run test:integration
```

Pour les tests complets de génération:
```bash
npm test -- -t "Tests complets de génération"
```

## Création de templates

Les templates utilisent EJS et se trouvent dans les dossiers `templates/` de chaque sous-générateur. Respectez ces principes:

- Pas de logique complexe dans les templates
- Utiliser les commentaires pour clarifier le code généré
- Maintenir la cohérence avec les templates existants

## Soumission des PR

1. Assurez-vous que tous les tests passent
2. Documentez vos changements dans le CHANGELOG.md
3. Référencez les issues concernées
4. Attendez la revue de code et les tests CI

## Ressources supplémentaires

- [Documentation Yeoman](https://yeoman.io/authoring/)
- [Guide de style TypeScript](https://github.com/basarat/typescript-book)
- [Guide Spring Boot](https://spring.io/guides/gs/spring-boot/)

Merci de contribuer à rendre Spring-Fullstack-Speed plus performant et utile pour tous!
