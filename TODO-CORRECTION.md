# TODO-CORRECTION: Spring-Fullstack-Speed

Ce document liste les problèmes identifiés et les corrections à apporter au générateur Spring-Fullstack-Speed.

## Problèmes identifiés

### 1. Erreurs de génération des fichiers Maven
- ❌ Erreur lors de la génération des fichiers Maven Wrapper: AssertionError [ERR_ASSERTION]: When copying multiple files, provide a directory as destination
- ❌ Erreur lors de la génération du fichier pom.xml
- ❌ Erreur lors de la génération du script mvnw
- ❌ Erreur lors de la génération du script mvnw.cmd

### 2. Erreur de génération de l'application principale
- ❌ Erreur lors de la génération du fichier TodoApplication.java

### 3. Fichiers Frontend manquants
- ❌ frontend/package.json
- ❌ frontend/vite.config.ts
- ❌ frontend/src/App.vue
- ❌ frontend/src/main.ts

### 4. Problèmes avec les fichiers de sécurité JWT
- ❌ src/main/java/undefined/security/config/WebSecurityConfig.java
- ❌ src/main/java/undefined/security/model/User.java
- ❌ src/main/java/undefined/security/model/Role.java
- ❌ src/main/java/undefined/security/service/JwtUtils.java

### 5. Problèmes avec la commande d'entité et de DTOs
- ❌ La commande sfs e (générateur d'entités) ne fait rien
- ❌ La commande sfs d (générateur de DTOs) ne génère pas les fichiers dans le bon dossier

### 6. Problèmes de configuration Kubernetes
- ❌ Bien que l'option Kubernetes ait été sélectionnée, les fichiers de configuration Kubernetes ne semblent pas être générés correctement

## Plan de correction

### 1. Correction des fichiers Maven
- [ ] Corriger le générateur app/index.ts pour résoudre les problèmes de copie des fichiers Maven Wrapper
- [ ] Assurer que le chemin de destination est bien un répertoire

### 2. Correction de la génération de l'application principale
- [ ] Identifier pourquoi TodoApplication.java n'est pas généré correctement
- [ ] Corriger le générateur app/index.ts ou les templates correspondants

### 3. Correction des fichiers Frontend (Vue.js)
- [ ] Ajouter les templates manquants pour Vue.js dans le générateur frontend
- [ ] S'assurer que package.json, vite.config.ts, App.vue et main.ts sont générés

### 4. Correction des fichiers de sécurité JWT
- [ ] Corriger la génération des fichiers de sécurité pour utiliser le package correct au lieu de "undefined"
- [ ] Vérifier et corriger les templates des fichiers de sécurité

### 5. Correction des générateurs d'entité et de DTOs
- [ ] Corriger le générateur entity/index.ts pour qu'il fonctionne correctement
- [ ] Corriger le générateur dtos/index.ts pour placer les fichiers dans le package spécifié

### 6. Configuration Kubernetes
- [ ] Corriger la génération des fichiers de configuration Kubernetes
- [ ] Vérifier si les templates existent dans le dossier kubernetes/ du générateur

## Comment procéder
1. Examiner le code source des générateurs concernés
2. Corriger les problèmes un par un
3. Tester chaque correction
4. Documenter les modifications apportées
