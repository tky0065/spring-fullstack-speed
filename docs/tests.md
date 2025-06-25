# Documentation des Tests Spring-Fullstack-Speed

Ce document explique l'organisation des tests dans le projet Spring-Fullstack-Speed (SFS), comment les exécuter et comment en créer de nouveaux.

## Structure des tests

Les tests sont organisés selon la structure suivante :

```
generators/
├── __tests__/
│   ├── app.test.ts           # Tests du générateur app
│   ├── cli-ui.test.ts        # Tests de l'interface CLI
│   ├── command-aliases.test.ts # Tests des alias de commandes
│   ├── commands.test.ts      # Tests des commandes disponibles
│   ├── complete-generation.test.ts # Tests de génération complète
│   ├── end-to-end.test.ts    # Tests end-to-end
│   ├── frontend-templates.test.ts # Tests des templates frontend
│   ├── generate.test.ts      # Tests du générateur generate
│   ├── generator-minimal.test.ts # Tests minimaux
│   └── integration.test.ts   # Tests d'intégration
│
utils/
└── __tests__/               # Tests des utilitaires
```

## Types de tests

### Tests unitaires
Testent des fonctions individuelles et des composants spécifiques.

### Tests d'intégration
Testent l'interaction entre différents composants du système.

### Tests end-to-end
Testent le système complet du début à la fin.

### Tests de génération
Testent spécifiquement la génération de fichiers et de code.

## Configuration des tests

SFS utilise Jest comme framework de test principal:

```javascript
// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
```

Des configurations spéciales sont disponibles pour différents types de tests:
- `jest-generators.config.js` : Pour les tests de générateurs
- `jest-commands.config.js` : Pour les tests de commandes CLI
- `jest-simple.config.js` : Pour les tests simples

## Exécution des tests

### Exécuter tous les tests
```bash
npm test
```

### Exécuter une suite de tests spécifique
```bash
npm test -- -t "nom de la suite de tests"
```

### Exécuter avec une couverture de code
```bash
npm run test:coverage
```

### Exécuter les tests d'intégration
```bash
npm run test:integration
```

### Exécuter les tests en mode watch
```bash
npm run test:watch
```

## Écrire de nouveaux tests

### Tests de générateur

```typescript
import { describe, expect, test } from '@jest/globals';
import path from 'path';
import helpers from 'yeoman-test';

const generatorPath = path.join(__dirname, '../mon-generateur');

describe('Générateur Mon-Generateur', () => {
  test('devrait générer les fichiers de base', async () => {
    // Arrangement
    const options = {
      name: 'TestEntity',
      fields: 'name:String,price:Double'
    };
    
    // Action
    const result = await helpers
      .create(generatorPath)
      .withOptions(options)
      .run();
    
    // Assertion
    expect(result.filePath).toBeDefined();
    expect(result.exists('src/main/java/com/example/TestEntity.java')).toBeTruthy();
    expect(result.fileContent('src/main/java/com/example/TestEntity.java')).toContain('class TestEntity');
  });
});
```

### Tests d'utilitaires

```typescript
import { describe, expect, test } from '@jest/globals';
import { capitalizeFirst, camelToKebabCase } from '../string-utils';

describe('String Utils', () => {
  test('capitalizeFirst devrait mettre en majuscule la première lettre', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('world')).toBe('World');
    expect(capitalizeFirst('')).toBe('');
  });
  
  test('camelToKebabCase devrait convertir camelCase en kebab-case', () => {
    expect(camelToKebabCase('helloWorld')).toBe('hello-world');
    expect(camelToKebabCase('UserProfile')).toBe('user-profile');
    expect(camelToKebabCase('')).toBe('');
  });
});
```

### Tests end-to-end

```typescript
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';

const mkdtemp = promisify(fs.mkdtemp);
const rmdir = promisify(fs.rm);
const exists = promisify(fs.exists);

describe('End-to-end tests', () => {
  let tempDir;
  
  beforeAll(async () => {
    // Créer un répertoire temporaire pour les tests
    tempDir = await mkdtemp('sfs-e2e-test-');
    process.chdir(tempDir);
  });
  
  afterAll(async () => {
    // Nettoyer après les tests
    if (tempDir) {
      await rmdir(tempDir, { recursive: true });
    }
  });
  
  test('devrait générer un projet complet et le compiler', async () => {
    // Exécuter la commande sfs
    execSync('sfs app --name=TestApp --packageName=com.example.test --database=h2 --skipInstall');
    
    // Vérifier que les fichiers essentiels existent
    expect(await exists('pom.xml')).toBe(true);
    expect(await exists('src/main/java/com/example/test/TestAppApplication.java')).toBe(true);
    
    // Tester la compilation (optionnel, peut prendre du temps)
    execSync('./mvnw clean package -DskipTests');
    expect(await exists('target/TestApp.jar')).toBe(true);
  }, 300000); // timeout de 5 minutes
});
```

## Mocks et stubs

### Mock d'un utilitaire

```typescript
import { jest } from '@jest/globals';

// Mock d'un module externe
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('contenu mock')
}));

// Mock d'un module local
jest.mock('../utils/file-utils', () => ({
  createDir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn().mockReturnValue('contenu mock')
}));
```

### Spy sur des méthodes

```typescript
import { jest } from '@jest/globals';
import Generator from '../mon-generateur';

describe('Mon générateur', () => {
  test('devrait appeler les méthodes attendues', () => {
    // Arrangement
    const generator = new Generator();
    const renderTemplateSpy = jest.spyOn(generator, 'renderTemplate');
    const copyFilesSpy = jest.spyOn(generator, 'copyFiles');
    
    // Action
    generator.writing();
    
    // Assertion
    expect(renderTemplateSpy).toHaveBeenCalledTimes(1);
    expect(copyFilesSpy).toHaveBeenCalledTimes(2);
  });
});
```

## Tests de génération de fichiers

### Test basique de génération

```typescript
import { describe, expect, test } from '@jest/globals';
import path from 'path';
import helpers from 'yeoman-test';
import fs from 'fs';

describe('Génération de fichiers', () => {
  test('devrait générer les bons fichiers', async () => {
    const result = await helpers
      .create(path.join(__dirname, '../entity'))
      .withOptions({
        name: 'Product',
        fields: 'name:String,price:Double'
      })
      .run();
    
    // Vérifier que les fichiers existent
    expect(result.exists('src/main/java/com/example/domain/Product.java')).toBeTruthy();
    expect(result.exists('src/main/java/com/example/repository/ProductRepository.java')).toBeTruthy();
    
    // Vérifier le contenu des fichiers
    const entityContent = result.read('src/main/java/com/example/domain/Product.java');
    expect(entityContent).toContain('class Product');
    expect(entityContent).toContain('private String name');
    expect(entityContent).toContain('private Double price');
  });
});
```

### Test de génération avancée

```typescript
import { describe, expect, test } from '@jest/globals';
import path from 'path';
import helpers from 'yeoman-test';
import assert from 'yeoman-assert';

describe('Tests de génération avancés', () => {
  test('devrait gérer les options conditionnelles', async () => {
    // Créer un contexte de test
    await helpers
      .create(path.join(__dirname, '../app'))
      .withOptions({
        name: 'TestApp',
        database: 'postgresql',
        features: ['websocket', 'elasticsearch']
      })
      .run();
    
    // Assertions de base
    assert.file([
      'pom.xml',
      'src/main/java/com/example/TestAppApplication.java',
      'src/main/resources/application.yml'
    ]);
    
    // Vérifier les dépendances conditionnelles dans pom.xml
    assert.fileContent('pom.xml', '<artifactId>spring-boot-starter-websocket</artifactId>');
    assert.fileContent('pom.xml', '<artifactId>spring-boot-starter-data-elasticsearch</artifactId>');
    
    // Vérifier la configuration conditionnelle
    assert.fileContent('src/main/resources/application.yml', 'spring.datasource.url: jdbc:postgresql://');
    assert.fileContent('src/main/java/com/example/config/WebSocketConfig.java', '@EnableWebSocketMessageBroker');
    assert.fileContent('src/main/java/com/example/config/ElasticsearchConfig.java', '@EnableElasticsearchRepositories');
  });
});
```

## Tests d'intégration

```typescript
import { describe, expect, test } from '@jest/globals';
import path from 'path';
import helpers from 'yeoman-test';
import assert from 'yeoman-assert';

describe('Tests d\'intégration', () => {
  test('devrait générer un projet complet avec entités et API REST', async () => {
    // 1. Générer l'application de base
    const appDir = await helpers
      .create(path.join(__dirname, '../app'))
      .withOptions({
        name: 'TestApp',
        packageName: 'com.example.test',
        database: 'h2',
        skipInstall: true
      })
      .run()
      .then(result => result.cwd);
    
    // 2. Générer une entité dans le même dossier
    await helpers
      .create(path.join(__dirname, '../entity'))
      .withOptions({
        name: 'Product',
        packageName: 'com.example.test.domain',
        fields: 'name:String,price:Double',
        skipInstall: true
      })
      .inDir(appDir)
      .run();
    
    // 3. Générer le CRUD pour cette entité
    await helpers
      .create(path.join(__dirname, '../crud'))
      .withOptions({
        entity: 'Product',
        packageName: 'com.example.test',
        skipInstall: true
      })
      .inDir(appDir)
      .run();
    
    // Vérifier que tout est généré correctement
    assert.file([
      // Fichiers d'application
      path.join(appDir, 'src/main/java/com/example/test/TestAppApplication.java'),
      // Fichiers d'entité
      path.join(appDir, 'src/main/java/com/example/test/domain/Product.java'),
      path.join(appDir, 'src/main/java/com/example/test/repository/ProductRepository.java'),
      // Fichiers CRUD
      path.join(appDir, 'src/main/java/com/example/test/service/ProductService.java'),
      path.join(appDir, 'src/main/java/com/example/test/controller/ProductController.java')
    ]);
    
    // Vérifier que le controller est bien configuré
    const controllerContent = fs.readFileSync(
      path.join(appDir, 'src/main/java/com/example/test/controller/ProductController.java'),
      'utf8'
    );
    
    expect(controllerContent).toContain('@RestController');
    expect(controllerContent).toContain('@RequestMapping("/api/products")');
    expect(controllerContent).toContain('findAll()');
    expect(controllerContent).toContain('findById(');
    expect(controllerContent).toContain('create(');
    expect(controllerContent).toContain('update(');
    expect(controllerContent).toContain('delete(');
  });
});
```

## Tests de performance

```typescript
import { describe, expect, test } from '@jest/globals';
import { performance } from 'perf_hooks';
import path from 'path';
import helpers from 'yeoman-test';

describe('Tests de performance', () => {
  test('devrait générer un projet rapidement', async () => {
    const start = performance.now();
    
    await helpers
      .create(path.join(__dirname, '../app'))
      .withOptions({
        name: 'PerfTest',
        skipInstall: true
      })
      .run();
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Génération effectuée en ${duration}ms`);
    
    // La génération devrait prendre moins de 10 secondes
    expect(duration).toBeLessThan(10000);
  });
});
```

## Couverture de code

Pour générer des rapports de couverture de code:

```bash
npm run test:coverage
```

Le rapport sera généré dans le dossier `coverage/` et inclura:
- Un résumé de la couverture globale
- Des détails par fichier
- Une visualisation HTML

Viser une couverture d'au moins:
- 80% pour les lignes
- 70% pour les branches
- 90% pour les fonctions

## Tests automatisés CI/CD

Les tests sont automatiquement exécutés lors des push et pull requests via les workflows CI:

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
        
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Bonnes pratiques pour les tests

1. **Tests atomiques** : Chaque test doit vérifier une seule fonctionnalité
2. **Indépendance** : Les tests ne doivent pas dépendre les uns des autres
3. **Automatisation** : Tous les tests doivent pouvoir être exécutés sans intervention manuelle
4. **Rapidité** : Les tests doivent s'exécuter rapidement (utiliser des mocks au besoin)
5. **Isolation** : Utiliser des répertoires temporaires pour les tests de génération
6. **Assertions claires** : Les assertions doivent être précises et descriptives
7. **Nettoyage** : Nettoyer les ressources après les tests (fichiers, connexions)
8. **Fixtures** : Utiliser des données de test cohérentes et réutilisables
9. **Conditionnement** : Structurer les tests avec `describe` et `test/it`
10. **Documentation** : Documenter l'objectif de chaque test

## Résolution des problèmes de tests

### Tests qui échouent de manière aléatoire
- Vérifiez les conditions de course potentielles
- Vérifiez les dépendances entre les tests
- Utilisez des timeouts plus longs pour les opérations asynchrones

### Tests lents
- Utilisez des mocks pour les opérations lentes
- Réduisez la quantité de code généré dans les tests
- Utilisez l'option `skipInstall: true`

### Tests qui échouent sur CI mais passent en local
- Vérifiez les dépendances de chemin absolu
- Vérifiez les problèmes spécifiques à la plateforme
- Assurez-vous que toutes les dépendances sont correctement listées
