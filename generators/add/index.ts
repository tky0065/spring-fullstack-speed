/**
 * Générateur pour la commande 'sfs add'
 * Permet d'ajouter des composants à un projet Spring-Fullstack existant
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

export default class AddGenerator extends BaseGenerator {
  declare answers: any;
  declare projectConfig: any;

  constructor(args: string | string[], options: any) {
    super(args, options);
    
    // Définir les arguments comme propriétés sur this.options
    this.argument("componentType", {
      type: String,
      required: false,
      description: "Type de composant à ajouter (controller, service, repository, etc.)",
    });
    
    this.argument("componentName", {
      type: String,
      required: false,
      description: "Nom du composant à ajouter",
    });
  }

  initializing() {
    this.log(chalk.blue("SFS Add - Ajout de composants à un projet existant"));

    // Vérifier si nous sommes dans un projet Spring-Fullstack
    try {
      if (fs.existsSync('.sfs-config.json')) {
        this.projectConfig = JSON.parse(fs.readFileSync('.sfs-config.json', 'utf8'));
        this.log(chalk.green("Projet Spring-Fullstack détecté!"));
      } else {
        // Tentative de détection en cherchant des fichiers caractéristiques
        const hasPomXml = fs.existsSync('pom.xml');
        const hasGradle = fs.existsSync('build.gradle') || fs.existsSync('build.gradle.kts');
        const hasApplication = fs.existsSync('src/main/java');

        if (!(hasPomXml || hasGradle) || !hasApplication) {
          this.log(chalk.red("⚠️ Ce répertoire ne semble pas contenir un projet Spring-Fullstack."));
          this.log(chalk.yellow("Exécutez cette commande dans un projet généré par Spring-Fullstack-Speed."));
          process.exit(1);
        }

        // Créer une configuration minimale basée sur la détection
        this.projectConfig = {
          buildTool: hasPomXml ? "Maven" : "Gradle",
          packageName: this._detectPackageName(),
          createdWithSfs: false
        };

        this.log(chalk.yellow("Projet Spring Boot détecté, mais pas de fichier de configuration SFS."));
        this.log(chalk.yellow("Une configuration minimale sera utilisée."));
      }
    } catch (error) {
      this.log(chalk.red("⚠️ Erreur lors de la lecture de la configuration: " + error));
      process.exit(1);
    }
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    // Si les arguments ne sont pas fournis, demander interactivement
    if (!opts.componentType || !opts.componentName) {
      const questions: any[] = [];

      if (!opts.componentType) {
        questions.push({
          type: "list",
          name: "componentType",
          message: "Quel type de composant souhaitez-vous ajouter?",
          choices: [
            { name: "Controller - Contrôleur REST", value: "controller" },
            { name: "Service - Couche métier", value: "service" },
            { name: "Repository - Accès aux données", value: "repository" },
            { name: "Entity - Entité JPA", value: "entity" },
            { name: "DTO - Objet de transfert de données", value: "dto" },
            { name: "Configuration - Configuration Spring", value: "config" },
            { name: "Exception - Classe d'exception personnalisée", value: "exception" }
          ]
        });
      }

      if (!opts.componentName) {
        questions.push({
          type: "input",
          name: "componentName",
          message: "Quel est le nom du composant?",
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return "Le nom du composant ne peut pas être vide";
            }
            return true;
          }
        });
      }

      this.answers = await this.prompt(questions);
    } else {
      this.answers = {
        componentType: opts.componentType,
        componentName: opts.componentName
      };
    }

    // Questions spécifiques au type de composant
    const specificQuestions: any[] = [];

    switch (this.answers.componentType) {
      case 'controller':
        specificQuestions.push({
          type: 'confirm',
          name: 'isRestController',
          message: 'Voulez-vous créer un RestController?',
          default: true
        });
        specificQuestions.push({
          type: 'input',
          name: 'basePath',
          message: 'Chemin de base pour ce contrôleur (exemple: /api/users):',
          default: `/api/${this.answers.componentName.toLowerCase()}`
        });
        break;

      case 'entity':
        specificQuestions.push({
          type: 'input',
          name: 'tableName',
          message: 'Nom de la table en base de données:',
          default: this._toSnakeCase(this.answers.componentName)
        });
        specificQuestions.push({
          type: 'confirm',
          name: 'generateRepository',
          message: 'Voulez-vous également générer un repository pour cette entité?',
          default: true
        });
        break;

      case 'repository':
        specificQuestions.push({
          type: 'input',
          name: 'entityName',
          message: "Nom de l'entité associée à ce repository:",
          default: this.answers.componentName.replace(/Repository$/, '')
        });
        break;

      case 'service':
        specificQuestions.push({
          type: 'confirm',
          name: 'createInterface',
          message: 'Voulez-vous créer une interface pour ce service?',
          default: true
        });
        break;
    }

    if (specificQuestions.length > 0) {
      const specificAnswers = await this.prompt(specificQuestions);
      this.answers = { ...this.answers, ...specificAnswers };
    }

    // Demander le package
    const packageQuestion: any = {
      type: 'input',
      name: 'packageName',
      message: 'Dans quel package voulez-vous créer ce composant?',
      default: this._getDefaultPackageName(this.answers.componentType)
    };

    const packageAnswer = await this.prompt(packageQuestion);
    this.answers = { ...this.answers, ...packageAnswer };
  }

  configuring() {
    // Formater le nom du composant selon les conventions Java
    if (this.answers.componentType === 'controller' && !this.answers.componentName.endsWith('Controller')) {
      this.answers.componentName = `${this.answers.componentName}Controller`;
    } else if (this.answers.componentType === 'service' && !this.answers.componentName.endsWith('Service')) {
      this.answers.componentName = `${this.answers.componentName}Service`;
    } else if (this.answers.componentType === 'repository' && !this.answers.componentName.endsWith('Repository')) {
      this.answers.componentName = `${this.answers.componentName}Repository`;
    } else if (this.answers.componentType === 'config' && !this.answers.componentName.endsWith('Config')) {
      this.answers.componentName = `${this.answers.componentName}Config`;
    } else if (this.answers.componentType === 'exception' && !this.answers.componentName.endsWith('Exception')) {
      this.answers.componentName = `${this.answers.componentName}Exception`;
    }
  }

  writing() {
    const { componentType, componentName, packageName } = this.answers;

    // Convertir le package en chemin de fichier
    const packagePath = packageName.replace(/\./g, '/');
    const javaDir = 'src/main/java';
    const filePath = path.join(javaDir, packagePath, `${componentName}.java`);

    this.log(chalk.blue(`Génération du composant ${componentName} dans ${filePath}...`));

    // Générer le fichier selon le type
    switch (componentType) {
      case 'controller':
        this._generateController(filePath);
        break;

      case 'service':
        this._generateService(filePath);
        if (this.answers.createInterface) {
          const interfacePath = path.join(javaDir, packagePath, `${componentName.replace(/ServiceImpl$|Service$/, '')}Service.java`);
          this._generateServiceInterface(interfacePath);
        }
        break;

      case 'repository':
        this._generateRepository(filePath);
        break;

      case 'entity':
        this._generateEntity(filePath);
        if (this.answers.generateRepository) {
          const repoPath = path.join(javaDir, packageName.replace(/\.entity|\.model|\.domain/, '.repository').replace(/\./g, '/'), `${componentName}Repository.java`);
          this._generateRepositoryForEntity(repoPath);
        }
        break;

      case 'dto':
        this._generateDTO(filePath);
        break;

      case 'config':
        this._generateConfig(filePath);
        break;

      case 'exception':
        this._generateException(filePath);
        break;
    }
  }

  end() {
    this.log(chalk.green.bold(`\n✅ Le composant ${this.answers.componentName} a été créé avec succès!`));
  }

  // Méthodes privées utilitaires

  /**
   * Détecte automatiquement le package principal du projet
   * @returns Le nom du package détecté ou un package par défaut
   */
  _detectPackageName() {
    try {
      // Recherche dans les fichiers Java pour trouver le package
      const javaFiles = this._findJavaFiles('src/main/java');
      if (javaFiles.length > 0) {
        const content = fs.readFileSync(javaFiles[0], 'utf8');
        const packageMatch = content.match(/package\\s+([\\w.]+);/);
        if (packageMatch && packageMatch[1]) {
          return packageMatch[1].split('.').slice(0, 2).join('.');
        }
      }
    } catch (error) {
      this.log(chalk.yellow("Impossible de détecter automatiquement le package. Utilisation du package par défaut."));
    }
    return 'com.example.app';
  }

  /**
   * Trouve les fichiers Java dans un répertoire
   * @param dir Le répertoire à explorer
   * @returns Liste des chemins de fichiers Java
   */
  _findJavaFiles(dir) {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this._findJavaFiles(filePath));
      } else if (file.endsWith('.java')) {
        results.push(filePath);
      }
    }

    return results;
  }

  /**
   * Détermine le package par défaut selon le type de composant
   * @param componentType Le type de composant
   * @returns Le nom de package suggéré
   */
  _getDefaultPackageName(componentType) {
    const basePackage = this.projectConfig.packageName || this._detectPackageName();

    switch (componentType) {
      case 'controller': return `${basePackage}.controller`;
      case 'service': return `${basePackage}.service`;
      case 'repository': return `${basePackage}.repository`;
      case 'entity': return `${basePackage}.entity`;
      case 'dto': return `${basePackage}.dto`;
      case 'config': return `${basePackage}.config`;
      case 'exception': return `${basePackage}.exception`;
      default: return basePackage;
    }
  }

  /**
   * Convertit une chaîne en snake_case
   * @param str La chaîne à convertir
   * @returns La chaîne en snake_case
   */
  _toSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  /**
   * Génère un contrôleur REST
   * @param filePath Chemin du fichier à créer
   */
  _generateController(filePath) {
    const { componentName, packageName, isRestController, basePath } = this.answers;

    const content = `package ${packageName};

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import lombok.RequiredArgsConstructor;

/**
 * ${componentName}
 * Contrôleur pour gérer les opérations liées à ${componentName.replace('Controller', '')}
 */
${isRestController ? '@RestController' : '@Controller'}
${basePath ? `@RequestMapping("${basePath}")` : ''}
@RequiredArgsConstructor
public class ${componentName} {

    // TODO: Injecter les services nécessaires
    // private final SomeService someService;
    
    /**
     * Récupère toutes les ressources
     * @return Liste des ressources
     */
    @GetMapping
    public ResponseEntity<List<Object>> getAll() {
        // TODO: Implémenter la logique de récupération
        return ResponseEntity.ok(List.of());
    }
    
    /**
     * Récupère une ressource par son ID
     * @param id ID de la ressource
     * @return La ressource trouvée
     */
    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable Long id) {
        // TODO: Implémenter la logique de récupération par ID
        return ResponseEntity.ok(new Object());
    }
    
    /**
     * Crée une nouvelle ressource
     * @param resource La ressource à créer
     * @return La ressource créée
     */
    @PostMapping
    public ResponseEntity<Object> create(@RequestBody Object resource) {
        // TODO: Implémenter la logique de création
        return ResponseEntity.ok(resource);
    }
    
    /**
     * Met à jour une ressource existante
     * @param id ID de la ressource
     * @param resource La ressource mise à jour
     * @return La ressource mise à jour
     */
    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable Long id, @RequestBody Object resource) {
        // TODO: Implémenter la logique de mise à jour
        return ResponseEntity.ok(resource);
    }
    
    /**
     * Supprime une ressource
     * @param id ID de la ressource à supprimer
     * @return Réponse de confirmation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // TODO: Implémenter la logique de suppression
        return ResponseEntity.noContent().build();
    }
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère une interface de service
   * @param filePath Chemin du fichier à créer
   */
  _generateServiceInterface(filePath) {
    const { componentName, packageName } = this.answers;
    const interfaceName = componentName.replace(/ServiceImpl$|Service$/, '') + 'Service';

    const content = `package ${packageName};

import java.util.List;
import java.util.Optional;

/**
 * ${interfaceName}
 * Interface pour les opérations liées à ${interfaceName.replace('Service', '')}
 */
public interface ${interfaceName} {
    
    /**
     * Récupère toutes les instances
     * @return Liste des instances
     */
    List<Object> findAll();
    
    /**
     * Récupère une instance par son ID
     * @param id ID de l'instance
     * @return L'instance trouvée, ou empty si non trouvée
     */
    Optional<Object> findById(Long id);
    
    /**
     * Crée une nouvelle instance
     * @param entity L'instance à créer
     * @return L'instance créée
     */
    Object save(Object entity);
    
    /**
     * Met à jour une instance existante
     * @param id ID de l'instance
     * @param entity Les nouvelles données
     * @return L'instance mise à jour
     */
    Object update(Long id, Object entity);
    
    /**
     * Supprime une instance
     * @param id ID de l'instance à supprimer
     */
    void delete(Long id);
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère une implémentation de service
   * @param filePath Chemin du fichier à créer
   */
  _generateService(filePath) {
    const { componentName, packageName, createInterface } = this.answers;
    const serviceInterface = componentName.replace(/ServiceImpl$|Service$/, '') + 'Service';

    let implementsClause = '';
    if (createInterface) {
      implementsClause = `implements ${serviceInterface}`;
    }

    const content = `package ${packageName};

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Optional;

/**
 * ${componentName}
 * Service pour gérer les opérations liées à ${componentName.replace(/ServiceImpl$|Service$/, '')}
 */
@Service
@RequiredArgsConstructor
public class ${componentName} ${implementsClause} {

    // TODO: Injecter les repositories nécessaires
    // private final SomeRepository repository;
    
    ${createInterface ? '@Override\n    ' : ''}public List<Object> findAll() {
        // TODO: Implémenter la logique pour récupérer toutes les données
        return List.of();
    }
    
    ${createInterface ? '@Override\n    ' : ''}public Optional<Object> findById(Long id) {
        // TODO: Implémenter la logique pour récupérer une entité par ID
        return Optional.empty();
    }
    
    ${createInterface ? '@Override\n    ' : ''}public Object save(Object entity) {
        // TODO: Implémenter la logique pour sauvegarder une entité
        return entity;
    }
    
    ${createInterface ? '@Override\n    ' : ''}public Object update(Long id, Object entity) {
        // TODO: Implémenter la logique pour mettre à jour une entité
        return entity;
    }
    
    ${createInterface ? '@Override\n    ' : ''}public void delete(Long id) {
        // TODO: Implémenter la logique pour supprimer une entité
    }
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère un repository
   * @param filePath Chemin du fichier à créer
   */
  _generateRepository(filePath) {
    const { componentName, packageName, entityName } = this.answers;

    const content = `package ${packageName};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ${componentName}
 * Repository pour accéder aux données de l'entité ${entityName}
 */
@Repository
public interface ${componentName} extends JpaRepository<${entityName}, Long> {
    
    // TODO: Ajouter des méthodes de requête personnalisées
    
    // Exemple: 
    // List<${entityName}> findByFieldName(String fieldName);
    // Optional<${entityName}> findByUniqueField(String uniqueField);
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère un repository pour une entité donnée
   * @param filePath Chemin du fichier à créer
   */
  _generateRepositoryForEntity(filePath) {
    const { componentName, packageName } = this.answers;
    const repositoryName = `${componentName}Repository`;

    const repoPackage = packageName.replace(/\.entity|\.model|\.domain/, '.repository');
    const entityPackage = packageName;

    const content = `package ${repoPackage};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${entityPackage}.${componentName};

/**
 * ${repositoryName}
 * Repository pour accéder aux données de l'entité ${componentName}
 */
@Repository
public interface ${repositoryName} extends JpaRepository<${componentName}, Long> {
    
    // TODO: Ajouter des méthodes de requête personnalisées
    
    // Exemple: 
    // List<${componentName}> findByFieldName(String fieldName);
    // Optional<${componentName}> findByUniqueField(String uniqueField);
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère une entité JPA
   * @param filePath Chemin du fichier à créer
   */
  _generateEntity(filePath) {
    const { componentName, packageName, tableName } = this.answers;

    const content = `package ${packageName};

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * ${componentName}
 * Entité JPA représentant la table ${tableName}
 */
@Entity
@Table(name = "${tableName}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ${componentName} implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère un DTO (Data Transfer Object)
   * @param filePath Chemin du fichier à créer
   */
  _generateDTO(filePath) {
    const { componentName, packageName } = this.answers;

    const content = `package ${packageName};

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * ${componentName}
 * DTO pour le transfert de données
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ${componentName} implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long id;
    private String name;
    private String description;
    
    // TODO: Ajouter des champs supplémentaires selon les besoins
    
    // TODO: Si nécessaire, ajouter des méthodes de conversion depuis/vers les entités
    // public static ${componentName} fromEntity(EntityClass entity) { ... }
    // public EntityClass toEntity() { ... }
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère une classe de configuration Spring
   * @param filePath Chemin du fichier à créer
   */
  _generateConfig(filePath) {
    const { componentName, packageName } = this.answers;

    const content = `package ${packageName};

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ${componentName}
 * Configuration Spring pour ${componentName.replace('Config', '')}
 */
@Configuration
public class ${componentName} {
    
    /**
     * Exemple de bean configuré
     * @return Un bean configuré
     */
    @Bean
    public ExampleBean exampleBean() {
        return new ExampleBean();
    }
    
    // TODO: Ajouter d'autres beans et configurations selon les besoins
}

// Classe d'exemple - à remplacer par vos propres classes
class ExampleBean {
    // Implémentation de la classe
}`;

    this.fs.write(filePath, content);
  }

  /**
   * Génère une classe d'exception personnalisée
   * @param filePath Chemin du fichier à créer
   */
  _generateException(filePath) {
    const { componentName, packageName } = this.answers;

    const content = `package ${packageName};

/**
 * ${componentName}
 * Exception personnalisée pour ${componentName.replace('Exception', '')}
 */
public class ${componentName} extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    public ${componentName}() {
        super();
    }
    
    public ${componentName}(String message) {
        super(message);
    }
    
    public ${componentName}(String message, Throwable cause) {
        super(message, cause);
    }
    
    public ${componentName}(Throwable cause) {
        super(cause);
    }
}`;

    this.fs.write(filePath, content);
  }
}
