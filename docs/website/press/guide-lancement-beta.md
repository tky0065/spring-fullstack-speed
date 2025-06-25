# Guide de lancement de la version beta de Spring-Fullstack-Speed

Ce document détaille les étapes nécessaires pour lancer la version beta de Spring-Fullstack-Speed et recueillir les retours des utilisateurs.

## Préparation du lancement beta

### 1. Configuration de la version beta

1. **Mise à jour de la version dans package.json**

   Exécutez le script suivant pour préparer la version beta :

   ```bash
   node scripts/prepare-beta.js
   ```
   
   Ce script va :
   - Mettre à jour la version dans package.json avec un suffixe beta (ex: 1.0.0-beta.1)
   - Générer les notes de changement pour la version beta
   - S'assurer que tous les tests passent

2. **Vérification des fonctionnalités essentielles**

   Assurez-vous que les fonctionnalités suivantes fonctionnent correctement :
   
   - [ ] Génération d'une application Spring Boot basique
   - [ ] Génération d'entités et de CRUD
   - [ ] Intégration frontend (React, Vue, Angular)
   - [ ] Authentification (JWT)
   - [ ] Configuration Docker et Kubernetes

### 2. Publication de la version beta sur NPM

1. **Publication avec tag beta**

   ```bash
   npm publish --tag beta
   ```

   Cela publiera le package sur npm avec le tag "beta", ce qui permettra aux utilisateurs de l'installer spécifiquement avec :
   
   ```bash
   npm install -g @enokdev/spring-fullstack-speed@beta
   ```

2. **Création d'une release GitHub beta**

   Créez une nouvelle release sur GitHub avec le tag correspondant (ex: v1.0.0-beta.1) et marquez-la clairement comme "Pre-release".

   ```bash
   git tag -a v1.0.0-beta.1 -m "Version beta 1"
   git push origin v1.0.0-beta.1
   ```

   Puis créez la release via l'interface GitHub ou en utilisant l'API.

### 3. Mise à jour du site web

1. **Ajout d'une annonce de la beta**

   Ajoutez une bannière sur la page d'accueil du site web annonçant la disponibilité de la version beta :

   ```html
   <div class="beta-banner">
     <div class="container">
       <p><strong>🚀 Version beta disponible !</strong> Testez dès maintenant la version 1.0.0-beta.1 et partagez vos retours. <a href="beta.html">En savoir plus</a></p>
     </div>
   </div>
   ```

2. **Création d'une page dédiée à la beta**

   Créez une page `beta.html` détaillant :
   - Comment installer la version beta
   - Les nouvelles fonctionnalités à tester
   - Comment signaler des bugs ou suggérer des améliorations

## Collecte de retours utilisateurs

### 1. Mise en place des canaux de feedback

1. **Création d'une issue template spécifique beta**

   Créez un template d'issue GitHub dédié au feedback beta :
   
   ```markdown
   ---
   name: Retour Beta
   about: Partagez votre expérience avec la version beta
   title: '[BETA] '
   labels: beta-feedback
   assignees: ''
   ---
   
   **Version beta testée**
   <!-- Ex: 1.0.0-beta.1 -->
   
   **Environnement**
   - OS: <!-- Ex: Windows 10, macOS Monterey, Ubuntu 22.04 -->
   - Node.js version: <!-- Ex: v18.12.0 -->
   - Java version: <!-- Ex: OpenJDK 17.0.2 -->
   
   **Ce qui fonctionne bien**
   <!-- Décrivez ce que vous avez apprécié -->
   
   **Ce qui pourrait être amélioré**
   <!-- Décrivez les problèmes rencontrés ou vos suggestions -->
   
   **Screenshots/Logs**
   <!-- Si applicable, ajoutez des captures d'écran ou logs -->
   ```

2. **Configuration d'un canal Discord dédié**

   - Créez un canal #beta-testing sur votre serveur Discord
   - Épinglez un message contenant les instructions de test
   - Configurez un bot pour collecter les retours formatés

3. **Formulaire de feedback en ligne**

   Créez un formulaire Google Forms ou Typeform pour recueillir des retours structurés.

### 2. Programme de beta-testeurs

1. **Recrutement de beta-testeurs**

   - Publiez des annonces sur Twitter, LinkedIn, et les forums de développement Java
   - Contactez directement des développeurs qui pourraient être intéressés
   - Proposez des avantages pour les beta-testeurs actifs (mention dans les crédits, accès anticipé aux futures fonctionnalités)

2. **Création d'un groupe de discussion**

   Créez un groupe privé (Slack, Discord, ou GitHub Discussion) pour les beta-testeurs où ils pourront échanger entre eux et avec l'équipe.

### 3. Suivi des retours

1. **Tableau de bord de suivi des retours**

   Créez un tableau Kanban (Trello, GitHub Projects) pour classifier et prioriser les retours reçus :
   - À examiner
   - Problème confirmé
   - En cours de résolution
   - Résolu dans la prochaine build
   - Ne sera pas traité (avec justification)

2. **Sessions de démo et Q&A**

   Organisez des sessions en ligne hebdomadaires pour démontrer des fonctionnalités et répondre aux questions des beta-testeurs.

## Phase de correction

### 1. Processus de correction

1. **Priorisation des problèmes**

   Classez les problèmes selon leur impact :
   - Critique (bloquant)
   - Majeur (fonctionnalité importante affectée)
   - Mineur (problème cosmétique ou edge case)

2. **Cycle de correction**

   Établissez un cycle de correction rapide :
   - Correction des bugs
   - Tests
   - Publication d'une nouvelle build beta (ex: 1.0.0-beta.2)
   - Communication aux testeurs

### 2. Communication des progrès

1. **Notes de version régulières**

   Publiez des notes de version détaillées pour chaque nouvelle build beta.

2. **Journal de développement**

   Maintenez un journal de développement public détaillant les améliorations en cours.

## Finalisation de la beta

### 1. Critères de sortie de la beta

- [ ] Aucun bug critique ou majeur en suspens
- [ ] Test complet sur toutes les plateformes supportées
- [ ] Documentation mise à jour
- [ ] Performances validées
- [ ] Retours positifs des beta-testeurs sur les fonctionnalités clés

### 2. Préparation de la release candidate

Quand les critères ci-dessus sont remplis, préparez une release candidate :

```bash
node scripts/prepare-release.js --rc
```

### 3. Validation finale et transition vers la release

Après validation de la release candidate par les beta-testeurs, procédez à la publication de la version 1.0.0 finale.

## Calendrier suggéré

- **Semaine 1-2** : Lancement initial de la beta, recrutement de testeurs
- **Semaine 3-5** : Période de test intensive, corrections itératives
- **Semaine 6** : Publication de la release candidate
- **Semaine 7** : Tests finaux et validation
- **Semaine 8** : Publication de la version 1.0.0

---

**Ressources utiles**
- [Modèle d'annonce beta](../press/annonce-beta.md)
- [Checklist de qualité](../docs/quality-checklist.md)
- [Template de communication aux beta-testeurs](../press/email-beta-testers.md)
