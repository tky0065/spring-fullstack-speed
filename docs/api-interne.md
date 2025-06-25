# API Interne de Spring-Fullstack-Speed

Ce document décrit l'API interne utilisée par les développeurs qui souhaitent étendre ou modifier le générateur Spring-Fullstack-Speed.

## Classes principales

### BaseGenerator

La classe `BaseGenerator` est la classe de base pour tous les générateurs. Elle étend `Generator` de Yeoman et fournit des méthodes utilitaires communes.

```typescript
class BaseGenerator extends Generator {
  // Méthodes principales
  promptOptions(): Promise<void>; // Pose les questions à l'utilisateur
  configuring(): void; // Configure le générateur
  writing(): void; // Écrit les fichiers
  install(): void; // Installe les dépendances
  end(): void; // Actions de finalisation
  
  // Méthodes utilitaires
  renderTemplate(templatePath: string, destinationPath: string, context: object): void;
  copyFiles(files: string[], src: string, dest: string): void;
  addDependency(dependency: string, version: string, isDev?: boolean): void;
  installDependencies(): Promise<void>;
}
```

### Types principaux

```typescript
interface GeneratorOptions {
  name: string;
  packageName: string;
  database: 'mysql' | 'postgresql' | 'mongodb' | 'h2';
  frontend: 'react' | 'angular' | 'vue' | 'thymeleaf' | 'jte';
  auth: 'jwt' | 'oauth2' | 'session' | 'none';
  features: string[];
  skipInstall: boolean;
  interactive: boolean;
}

interface EntityOptions {
  name: string;
  packageName: string;
  fields: Field[];
  relationships: Relationship[];
  validation: boolean;
  dto: boolean;
  service: boolean;
  pagination: 'pagination' | 'infinite-scroll' | 'none';
  skipInstall: boolean;
}

interface Field {
  name: string;
  type: string;
  validation?: string[];
  required?: boolean;
  unique?: boolean;
  description?: string;
}
```

## API des générateurs spécifiques

### AppGenerator

Le générateur principal qui crée une nouvelle application.

```typescript
class AppGenerator extends BaseGenerator {
  // Méthodes spécifiques
  promptOptions(): Promise<void>; // Questions spécifiques à l'application
  configuring(): void; // Configuration de l'application
  writing(): void; // Écriture des fichiers de l'application
  
  // Méthodes internes
  _generateBackendStructure(): void;
  _generateFrontendStructure(): void;
  _setupSecurity(): void;
  _setupDatabase(): void;
  _setupDocker(): void;
  _setupKubernetes(): void;
}
```

### EntityGenerator

Génère une nouvelle entité avec son repository.

```typescript
class EntityGenerator extends BaseGenerator {
  // Méthodes spécifiques
  promptFields(): Promise<void>; // Questions sur les champs
  promptRelationships(): Promise<void>; // Questions sur les relations
  writing(): void; // Écriture des fichiers d'entité
  
  // Méthodes internes
  _generateEntity(): void;
  _generateRepository(): void;
  _updateLiquibaseChangelog(): void;
}
```

### CrudGenerator

Génère les opérations CRUD pour une entité existante.

```typescript
class CrudGenerator extends BaseGenerator {
  // Méthodes spécifiques
  promptEntity(): Promise<void>; // Sélection de l'entité
  writing(): void; // Écriture des fichiers CRUD
  
  // Méthodes internes
  _generateService(): void;
  _generateController(): void;
  _generateTests(): void;
  _updateOpenAPI(): void;
}
```

### PaymentGenerator

Génère un système complet de paiement avec support pour différentes plateformes de paiement.

```typescript
class PaymentGenerator extends BaseGenerator {
  // Options disponibles
  provider: string[]; // Providers de paiement ('stripe', 'paypal', 'braintree', etc.)
  subscription: boolean; // Support des abonnements
  webhook: boolean; // Configuration des webhooks
  invoicing: boolean; // Système de facturation
  taxes: boolean; // Gestion des taxes
  refunds: boolean; // Gestion des remboursements
  reporting: boolean; // Rapports financiers
  packageName: string; // Nom du package pour le système de paiement
  lombok: boolean; // Utilisation de Lombok pour réduire le code boilerplate

  // Méthodes principales
  async initializing(): Promise<void>; // Initialisation et vérifications
  async prompting(): Promise<void>; // Questions à l'utilisateur
  configuring(): void; // Configuration des dépendances
  writing(): void; // Écriture des fichiers
  install(): void; // Installation des dépendances
  end(): void; // Actions finales

  // Méthodes internes
  private _generateEntities(context: any): void; // Générer les entités de paiement
  private _generateRepositories(context: any): void; // Générer les repositories
  private _generateServices(context: any): void; // Générer les services de paiement
  private _generateControllers(context: any): void; // Générer les controllers
  private _generateDtos(context: any): void; // Générer les DTOs avec Lombok
  private _generateConfigurations(context: any): void; // Générer les configurations
  private _generateWebhooks(context: any): void; // Générer les webhooks
  private _generateSubscriptions(context: any): void; // Générer le système d'abonnements
  private _generateInvoicing(context: any): void; // Générer le système de facturation
  private _generateTaxes(context: any): void; // Générer la gestion des taxes
  private _generateRefunds(context: any): void; // Générer la gestion des remboursements
  private _generateReports(context: any): void; // Générer les rapports financiers
  private _generateTests(context: any): void; // Générer les tests
  private _updateConfigurations(context: any): void; // Mettre à jour les configurations
}
```

## Utilitaires

### TemplateEngine

```typescript
class TemplateEngine {
  static render(template: string, context: object): string;
  static renderFile(filePath: string, context: object): string;
  static renderDirectory(dirPath: string, destPath: string, context: object): void;
}
```

### FileUtils

```typescript
class FileUtils {
  static createDir(path: string): void;
  static copyTpl(src: string, dest: string, context: object): void;
  static copy(src: string, dest: string): void;
  static exists(path: string): boolean;
  static read(path: string): string;
  static write(path: string, content: string): void;
}
```

### ValidationUtils

```typescript
class ValidationUtils {
  static validatePackageName(packageName: string): boolean;
  static validateEntityName(entityName: string): boolean;
  static validateFieldName(fieldName: string): boolean;
  static validateFieldType(fieldType: string): boolean;
}
```

## Événements et hooks

Le système d'événements permet d'étendre le générateur à différentes étapes du processus :

```typescript
// Émission d'un événement
this.emit('entity:created', entityName);

// Écoute d'un événement
this.on('entity:created', (entityName) => {
  // Actions personnalisées
});
```

Hooks principaux :
- `initializing`: Au début du processus
- `prompting`: Pendant les questions
- `configuring`: Pendant la configuration
- `default`: Actions par défaut
- `writing`: Pendant l'écriture des fichiers
- `conflicts`: Gestion des conflits
- `install`: Installation des dépendances
- `end`: Fin du processus

## Intégration avec les plugins

Les plugins peuvent étendre les générateurs en ajoutant de nouvelles fonctionnalités :

```typescript
// Exemple d'un plugin
module.exports = {
  name: 'sfs-plugin-example',
  hooks: {
    'entity:created': (generator, entityName) => {
      // Actions du plugin
    }
  },
  generators: {
    'custom-entity': path.resolve(__dirname, 'generators/custom-entity')
  }
};
```

## Bonnes pratiques

1. **Composition plutôt qu'héritage** : Utilisez la composition pour réutiliser du code
2. **Tests** : Écrivez des tests pour chaque nouvelle fonctionnalité
3. **Promesses** : Utilisez async/await pour la gestion des opérations asynchrones
4. **Modularité** : Créez des générateurs spécialisés pour des tâches spécifiques

## Exemples d'utilisation

### Extension d'un générateur existant

```typescript
import { EntityGenerator } from 'spring-fullstack-speed';

class CustomEntityGenerator extends EntityGenerator {
  constructor(args, opts) {
    super(args, opts);
    
    // Ajouter des options spécifiques
    this.option('customFeature', {
      type: Boolean,
      default: false,
      description: 'Add custom feature to entity'
    });
  }
  
  writing() {
    // Appeler la méthode parente
    super.writing();
    
    // Ajouter du comportement personnalisé
    if (this.options.customFeature) {
      this.renderTemplate(
        this.templatePath('custom-feature.java.ejs'),
        this.destinationPath(`src/main/java/${this.packagePath}/custom/${this.entityName}Feature.java`),
        this.context
      );
    }
  }
}
```

### Création d'un nouveau générateur

```typescript
import { BaseGenerator } from 'spring-fullstack-speed';

class NewFeatureGenerator extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { type: String, required: true });
  }
  
  async promptOptions() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of the feature:'
      }
    ]);
    
    this.context = {
      name: this.options.name,
      description: answers.description
    };
  }
  
  writing() {
    this.renderTemplate(
      this.templatePath('feature.java.ejs'),
      this.destinationPath(`src/main/java/${this.packagePath}/feature/${this.options.name}Feature.java`),
      this.context
    );
  }
}
```

### Génération complète avec options avancées

```typescript
// Exemple de génération avec le PaymentGenerator
const paymentGenerator = new PaymentGenerator();
paymentGenerator.provider = ['stripe', 'paypal'];
paymentGenerator.subscription = true;
paymentGenerator.webhook = true;
paymentGenerator.invoicing = true;
paymentGenerator.taxes = true;
paymentGenerator.refunds = true;
paymentGenerator.reporting = true;
paymentGenerator.packageName = 'com.example.payment';
paymentGenerator.lombok = true;

await paymentGenerator.initialize();
await paymentGenerator.promptOptions();
paymentGenerator.configuring();
paymentGenerator.writing();
paymentGenerator.install();
paymentGenerator.end();
```
