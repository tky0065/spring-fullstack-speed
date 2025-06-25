# Guide de débogage Spring-Fullstack-Speed

Ce guide vous aide à diagnostiquer et résoudre les problèmes courants que vous pourriez rencontrer lors de l'utilisation ou du développement de Spring-Fullstack-Speed.

## Problèmes courants lors de l'utilisation

### 1. Erreurs de génération de projet

#### Symptôme: La génération échoue avec une erreur

**Solutions possibles:**
1. **Vérifiez les prérequis**
   ```bash
   node -v  # Doit être v14+
   npm -v   # Doit être compatible
   ```

2. **Nettoyez le cache npm**
   ```bash
   npm cache clean --force
   ```

3. **Réinstallez SFS**
   ```bash
   npm uninstall -g spring-fullstack-speed
   npm install -g spring-fullstack-speed
   ```

#### Symptôme: Fichiers manquants dans le projet généré

**Solutions possibles:**
1. **Exécutez avec l'option verbose**
   ```bash
   sfs app --verbose
   ```

2. **Vérifiez les permissions des dossiers**
   ```bash
   # Sur Linux/Mac
   ls -la
   chmod -R 755 ./nom-du-projet
   ```

### 2. Problèmes d'exécution du projet généré

#### Symptôme: L'application Spring Boot ne démarre pas

**Solutions possibles:**
1. **Vérifiez les logs d'erreur**
   ```bash
   cat ./target/spring.log
   ```

2. **Vérifiez la configuration de la base de données**
   - Assurez-vous que les informations dans `application.yml` sont correctes
   - Vérifiez que la base de données est accessible

3. **Démarrez en mode debug**
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
   ```

#### Symptôme: Le frontend ne se lance pas

**Solutions possibles:**
1. **Vérifiez les dépendances**
   ```bash
   cd frontend
   npm install
   ```

2. **Vérifiez les logs**
   ```bash
   npm run start -- --verbose
   ```

### 3. Problèmes de dépendances

#### Symptôme: Conflits de versions de dépendances

**Solutions possibles:**
1. **Utilisez l'outil doctor**
   ```bash
   sfs doctor
   ```

2. **Mettez à jour les dépendances**
   ```bash
   ./mvnw versions:display-dependency-updates
   ```

## Problèmes lors du développement du générateur

### 1. Erreurs dans les templates

#### Symptôme: Erreur "Error: Could not find matching close tag for..."

**Solution:**
Vérifiez la syntaxe de vos templates EJS, en particulier les balises ouvrantes et fermantes.

#### Symptôme: Variables non définies dans les templates

**Solution:**
1. Ajoutez des logs de débogage pour voir le contexte passé au template:
   ```typescript
   this.log.debug('Context:', this.context);
   ```

2. Utilisez des valeurs par défaut dans vos templates:
   ```ejs
   <%= typeof variableName !== 'undefined' ? variableName : 'default' %>
   ```

### 2. Problèmes avec les tests

#### Symptôme: Tests échouant avec "Error: ENOENT: no such file or directory"

**Solution:**
1. Vérifiez les chemins relatifs dans vos tests
2. Utilisez `path.join` et `__dirname` pour construire des chemins fiables
3. Créez les répertoires nécessaires avant les tests:
   ```typescript
   before(() => {
     fs.mkdirSync(tempDir, { recursive: true });
   });
   ```

#### Symptôme: Timeouts lors des tests

**Solution:**
1. Augmentez le timeout Jest:
   ```typescript
   jest.setTimeout(30000);
   ```

2. Utilisez l'option `skipInstall`:
   ```typescript
   const result = await helpers
     .create(generatorPath)
     .withOptions({ skipInstall: true })
     .run();
   ```

### 3. Problèmes d'exécution du générateur

#### Symptôme: "Cannot find module" lorsqu'on exécute le générateur

**Solution:**
1. Vérifiez que tous les modules sont installés:
   ```bash
   npm install
   ```

2. Vérifiez les imports dans vos fichiers:
   ```typescript
   // Utilisez des chemins relatifs depuis le fichier actuel
   import { something } from '../relative/path.js';
   ```

3. Assurez-vous que votre `package.json` est correctement configuré (type: "module" si vous utilisez ESM)

#### Symptôme: Le générateur semble ignorer certaines options

**Solution:**
1. Vérifiez comment les options sont traitées:
   ```typescript
   this.log.debug('Options:', this.options);
   ```

2. Assurez-vous que les options sont correctement déclarées:
   ```typescript
   constructor(args, options) {
     super(args, options);
     this.option('myOption', {
       type: Boolean,
       default: false
     });
   }
   ```

## Techniques de débogage avancées

### 1. Débogage avec Node Inspector

1. **Lancez le générateur en mode debug**
   ```bash
   node --inspect-brk cli.js
   ```

2. **Ouvrez Chrome** et naviguez vers `chrome://inspect`

3. **Cliquez sur "Open dedicated DevTools for Node"** pour déboguer

### 2. Logging amélioré

1. **Utilisez des niveaux de log**
   ```typescript
   this.log.error('Erreur critique');
   this.log.warn('Avertissement');
   this.log.info('Information');
   this.log.debug('Détail de débogage');
   ```

2. **Activez le mode verbose**
   ```bash
   sfs app --verbose
   ```

3. **Créez un fichier de log**
   ```typescript
   const fs = require('fs');
   const logStream = fs.createWriteStream('debug.log', {flags: 'a'});
   
   logStream.write(JSON.stringify(context, null, 2) + '\n');
   ```

### 3. Débogage des templates EJS

1. **Temporairement, ajoutez des variables de débogage dans le template**
   ```ejs
   <!-- DEBUG INFO -->
   <pre>
   Package: <%= packageName %>
   Entity: <%= entityName %>
   Fields: <%= JSON.stringify(fields) %>
   </pre>
   ```

2. **Testez des fragments de template**
   ```typescript
   // Dans votre code de générateur
   const ejs = require('ejs');
   const debugOutput = ejs.render('<%= JSON.stringify(fields) %>', { fields: this.fields });
   this.log.debug('Template Debug:', debugOutput);
   ```

## Outils de diagnostic

### 1. SFS Doctor

L'outil `doctor` intégré peut diagnostiquer de nombreux problèmes:

```bash
sfs doctor
```

Il vérifie:
- L'installation de SFS
- Les versions des dépendances
- Les problèmes courants de configuration
- La structure du projet

### 2. Validation des fichiers générés

```bash
sfs validate
```

Cette commande vérifie:
- La structure du projet généré
- La syntaxe Java
- Les problèmes potentiels de configuration

### 3. Logs détaillés

```bash
# Sur Linux/Mac
DEBUG=yeoman:* sfs app

# Sur Windows
set DEBUG=yeoman:*
sfs app
```

## Problèmes spécifiques et solutions

### Erreurs JWT

**Problème:** `JwtTokenProvider cannot be resolved to a type`

**Solution:**
1. Vérifiez que la dépendance JWT est dans le pom.xml:
   ```xml
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt</artifactId>
       <version>0.9.1</version>
   </dependency>
   ```
2. Régénérez les classes de sécurité JWT:
   ```bash
   sfs add --auth jwt
   ```

### Problèmes Docker

**Problème:** L'image Docker ne se construit pas

**Solution:**
1. Vérifiez que les fichiers Docker sont correctement générés:
   ```bash
   cat Dockerfile
   cat docker-compose.yml
   ```
2. Essayez de construire avec des options de débogage:
   ```bash
   docker build --no-cache --progress=plain .
   ```

### Conflits Git

**Problème:** Conflits lors de la génération dans un projet existant

**Solution:**
1. Utilisez l'option `--force`:
   ```bash
   sfs entity Product --force
   ```
2. Sauvegardez vos modifications avant de générer:
   ```bash
   git stash
   sfs entity Product
   git stash pop
   ```

## Comment obtenir plus d'aide

Si vous rencontrez un problème qui n'est pas traité dans ce guide:

1. **Consultez les issues GitHub** existantes
2. **Posez une question** dans les discussions GitHub
3. **Soumettez une nouvelle issue** avec:
   - Version de SFS
   - Version de Node.js et npm
   - Description détaillée du problème
   - Étapes pour reproduire
   - Logs d'erreur

## Récupération d'une génération échouée

Si une génération échoue en cours de route et laisse le projet dans un état incohérent:

1. **Utilisez l'outil cleanup**:
   ```bash
   sfs cleanup
   ```

2. **Restaurez manuellement**:
   ```bash
   # Si vous utilisez Git
   git reset --hard
   
   # Sinon, utilisez une sauvegarde
   ```

3. **Réessayez la génération** avec des options différentes:
   ```bash
   sfs app --skip-git --skip-install
   ```
