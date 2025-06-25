# Guide de développement Spring-Fullstack-Speed

Ce guide fournit des instructions détaillées pour le développement et l'extension du générateur Spring-Fullstack-Speed (SFS).

## Environnement de développement

### Prérequis
- Node.js (v14+)
- npm ou yarn
- JDK 11+ (pour tester les applications générées)
- Maven ou Gradle
- Docker (pour les tests d'intégration)
- IDE recommandé: VS Code ou IntelliJ IDEA

### Configuration initiale

1. **Clone du dépôt**
```bash
git clone https://github.com/votreorganisation/spring-fullstack-speed.git
cd spring-fullstack-speed
```

2. **Installation des dépendances**
```bash
npm install
```

3. **Configuration du lien symbolique**
```bash
npm link
```

4. **Vérification de l'installation**
```bash
sfs --version
```

## Structure du projet

```
spring-fullstack-speed/
├── generators/        # Tous les générateurs
├── docs/             # Documentation
├── scripts/          # Scripts utilitaires
├── utils/            # Utilitaires communs
├── cli.js            # Point d'entrée CLI
├── package.json      # Configuration npm
└── tsconfig.json     # Configuration TypeScript
```

## Cycle de développement

### 1. Création d'une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 2. Développement

Développez votre fonctionnalité en suivant les standards du projet.

### 3. Tests

Exécutez les tests pour vous assurer que votre code fonctionne correctement:

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests complets de génération
npm test -- -t "Tests complets de génération"
```

### 4. Validation

Vérifiez la qualité du code:

```bash
# Linting
npm run lint

# Formatting
npm run format
```

### 5. Soumission

Poussez vos modifications et créez une Pull Request:

```bash
git add .
git commit -m "feat: ajout de nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

## Développement de générateurs

### Création d'un nouveau sous-générateur

1. Créez un dossier pour votre générateur:

```bash
mkdir -p generators/mon-generateur/templates
```

2. Créez le fichier principal du générateur:

```typescript
// generators/mon-generateur/index.ts
import { BaseGenerator } from '../base-generator.js';

export default class MonGenerator extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    
    this.desc('Description de mon générateur');
    
    this.argument('name', {
      type: String,
      required: true,
      description: 'Nom pour la génération'
    });
  }
  
  async promptOptions() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description:'
      }
    ]);
    
    this.context = {
      name: this.options.name,
      description: answers.description
    };
  }
  
  writing() {
    this.renderTemplate(
      this.templatePath('template.java.ejs'),
      this.destinationPath(`src/main/java/${this.packagePath}/MonFichier.java`),
      this.context
    );
  }
}
```

3. Créez les templates EJS dans le dossier templates.

4. Exportez votre générateur dans `generators/index.ts`.

### Modification d'un générateur existant

1. Identifiez le générateur à modifier dans `generators/`.
2. Comprenez sa structure et son fonctionnement.
3. Effectuez vos modifications en conservant la compatibilité.
4. Testez vos modifications avec différentes configurations.

## Extension des fonctionnalités

### Ajout d'une nouvelle commande CLI

1. Modifiez `cli.js` pour ajouter votre nouvelle commande.
2. Créez le générateur correspondant.
3. Mettez à jour la documentation.

### Ajout d'une nouvelle technologie

Par exemple, pour ajouter le support d'un nouveau framework frontend:

1. Créez des templates pour ce framework dans `generators/app/templates/frontend/nouveau-framework/`.
2. Modifiez `questions.ts` pour ajouter le framework dans les options.
3. Mettez à jour `generate-frontend.ts` pour gérer le nouveau framework.
4. Ajoutez des tests pour cette nouvelle option.

### Ajout de nouveaux templates

1. Créez vos nouveaux templates EJS dans le dossier templates approprié.
2. Référencez-les dans le code du générateur.

## Bonnes pratiques de développement

### Structure du code

- Utilisez des classes TypeScript pour les générateurs.
- Séparez la logique de génération de l'interface utilisateur.
- Mutualisez le code commun dans des classes de base.

### Documentation

- Documentez chaque nouvelle fonctionnalité.
- Ajoutez des commentaires JSDoc pour les fonctions publiques.
- Maintenez le CHANGELOG à jour.

### Tests

- Écrivez des tests unitaires pour les fonctions utilitaires.
- Écrivez des tests d'intégration pour les générateurs.
- Testez différentes configurations.

### Gestion des erreurs

- Utilisez des try/catch pour gérer les erreurs.
- Fournissez des messages d'erreur clairs.
- Journalisez les informations pertinentes.

## Déploiement et publication

### Préparation d'une release

1. Mettez à jour la version dans package.json.
2. Générez le CHANGELOG.
3. Exécutez tous les tests.
4. Créez un tag Git pour la version.

### Publication sur npm

```bash
npm run build
npm publish
```

### Documentation des changements

Documentez tous les changements importants:
- Nouvelles fonctionnalités
- Corrections de bugs
- Changements de comportement
- Mises à jour de dépendances

## Ressources de développement

### Bibliothèques principales

- [Yeoman](https://yeoman.io/)
- [EJS](https://ejs.co/)
- [Inquirer](https://www.npmjs.com/package/inquirer)
- [Commander.js](https://www.npmjs.com/package/commander)

### Documentation utile

- [Yeoman Generator API](https://yeoman.io/authoring/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/index.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Résolution de problèmes courants

### Debug d'un générateur

```typescript
// Ajouter des logs de debug
this.log.debug('Debug info:', someVariable);

// Exécuter en mode debug
NODE_DEBUG=yeoman node --inspect cli.js app
```

### Tests qui échouent

- Vérifiez les changements récents.
- Exécutez les tests spécifiques en isolation.
- Utilisez `console.log` pour déboguer.

### Problèmes de génération

- Vérifiez les templates EJS pour des erreurs de syntaxe.
- Vérifiez les données passées aux templates.
- Utilisez le mode verbose du générateur.

## Conclusion

Ce guide vous a fourni les bases pour le développement et l'extension du générateur Spring-Fullstack-Speed. Pour toute question supplémentaire, n'hésitez pas à consulter la documentation complète ou à contacter l'équipe de développement.
