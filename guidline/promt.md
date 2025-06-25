# Prompt Optimisé pour Développement Spring-Fullstack CLI

## 🎯 CONTEXTE DU PROJET

Tu travailles sur le développement du projet **Spring-Fullstack CLI**, un générateur de code basé sur Yeoman qui crée des applications fullstack modernes avec Spring Boot et divers frameworks frontend (React, Vue.js, Angular, Thymeleaf, JTE).
environnement de développement : on est sur windows 11

## 📋 INSTRUCTIONS PRINCIPALES  :
   
 * IMPORTANT *  ## AVANT DE COMMENCER UNE TÂCHE FAIT `tree -a generators `  Pour vérifier la structure du projet pour éviter les erreurs de structure. et la duplication de code  

### 1. GESTION DES TÂCHES
- Consulte le fichier [spring-fullstack-planning.md](spring-fullstack-planning.md) qui contient le planning détaillé avec toutes les tâches
- Identifie la prochaine tâche non terminée (marquée avec `[ ]`)
- Travaille UNIQUEMENT sur UNE tâche à la fois
- Une fois la tâche terminée et les tests tu doit executer voir si les tests passe sinon corriger, marque-la comme complétée avec `[x]` dans le fichier `ffff.md`

### 2. QUALITÉ DU CODE
- **ZÉRO ERREUR** : Assure-toi que le code généré compile et fonctionne sans erreur
- **TESTS SYSTÉMATIQUES** : Teste chaque fonctionnalité après implémentation
- **COMPATIBILITÉ** : Vérifie que le nouveau code ne casse pas l'existant
- **BONNES PRATIQUES** : Respecte les standards de codage et architecture

### 3. VALIDATION AVANT SOUMISSION
Avant de marquer une tâche comme terminée, effectue ces vérifications :

#### ✅ Checklist Technique
- [ ] Le code compile sans erreur
- [ ] Aucun warning critique
- [ ] Les imports sont corrects
- [ ] La syntaxe est valide
- [ ] Les dépendances sont cohérentes

#### ✅ Checklist Fonctionnelle
- [ ] La fonctionnalité fonctionne comme attendue
- [ ] Les cas d'erreur sont gérés
- [ ] L'intégration avec l'existant est OK
- [ ] Les tests passent (si applicable)

#### ✅ Checklist Documentation
- [ ] Le code est commenté si nécessaire
- [ ] Les fichiers README sont à jour
- [ ] Les exemples d'usage sont corrects

### 4. STRUCTURE DE RÉPONSE ATTENDUE

```markdown
## 🎯 TÂCHE EN COURS
**Module** : [Nom du module]
**Tâche** : [Description de la tâche]
**Statut** : En cours → Terminée

## 💻 IMPLÉMENTATION
[Code généré ou modifié]

## ✅ TESTS EFFECTUÉS
- [ ] Test 1 : [Description]
- [ ] Test 2 : [Description]
- [ ] Test 3 : [Description]

## 🔍 VÉRIFICATIONS
- [x] Compilation OK
- [x] Pas de régression
- [x] Fonctionnalité testée
- [x] Documentation mise à jour

## 📝 MISE À JOUR DU FICHIER ffff.md
[Marquer la tâche comme terminée et indiquer la prochaine]

## 🚀 PROCHAINE ÉTAPE
**Prochaine tâche** : [Description de la tâche suivante]
```

### 5. RÈGLES SPÉCIFIQUES

#### 🔧 Développement
- Utilise les dernières versions stables des frameworks
- Respecte l'architecture Yeoman generator
- Implémente les templates avec EJS
- Suis les conventions de nommage du projet

#### 🧪 Tests
- Teste manuellement chaque fonctionnalité
- Vérifie l'intégration avec les autres modules
- Assure-toi que les templates se génèrent correctement
- Valide que les fichiers de configuration sont corrects

#### 📁 Structure
```
generator-spring-fullstack/
├── generators/
│   ├── app/           # Code principal ici
│   ├── entity/        
│   └── crud/          
├── templates/         # Templates EJS ici
├── utils/            # Utilitaires ici
└── test/             # Tests ici
```

### 6. GESTION DES ERREURS

Si tu rencontres une erreur :
1. **STOP** : Arrête immédiatement le développement
2. **ANALYSE** : Identifie la cause racine
3. **CORRECTION** : Corrige l'erreur
4. **VALIDATION** : Re-teste complètement
5. **DOCUMENTATION** : Note la correction dans les commentaires

### 7. PRIORITÉS

1. **SÉCURITÉ** : Pas de vulnérabilités introduites
2. **STABILITÉ** : Pas de régression du code existant
3. **FONCTIONNALITÉ** : La tâche fonctionne comme attendu
4. **PERFORMANCE** : Code optimisé
5. **MAINTENABILITÉ** : Code propre et documenté

### 8. COMMUNICATION

Pour chaque tâche, communique :
- **CE QUE TU FAIS** : Explication claire
- **POURQUOI** : Justification des choix techniques
- **COMMENT** : Approche d'implémentation
- **RÉSULTAT** : Ce qui fonctionne maintenant

## 🎯 OBJECTIF FINAL

Créer un générateur Spring-Fullstack CLI robuste, fiable et professionnel qui :
- Génère du code de qualité production
- Fonctionne sans erreur
- Respecte les bonnes pratiques
- Est facilement maintenable et extensible

## 📞 COMMANDE POUR COMMENCER

"Consulte le fichier [spring-fullstack-planning.md](spring-fullstack-planning.md), identifie la prochaine tâche non terminée de la Phase 1 (Setup & Architecture) et commence son implémentation en suivant exactement les instructions ci-dessus."

---

**Rappel important** : Une seule tâche à la fois, zéro erreur acceptée, tests obligatoires avant validation !