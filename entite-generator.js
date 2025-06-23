#!/usr/bin/env node

/**
 * Script de génération d'entités personnalisé
 * Ce script génère une entité Java avec repository, service et controller
 * sans dépendre du générateur original problématique
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const DEFAULT_PACKAGE = 'com.example.fullstack';

// Interface readline pour les questions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question et obtenir la réponse
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Templates simplifiés
const templates = {
  entity: `package {{entityPackage}};

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
{{#if auditable}}
import java.time.LocalDateTime;
{{/if}}
{{#if dateTimeImport}}
import java.time.LocalDateTime;
import java.time.LocalDate;
{{/if}}
{{#if bigDecimalImport}}
import java.math.BigDecimal;
{{/if}}

/**
 * Entité {{entityName}}
 */
@Entity
@Table(name = "{{tableName}}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class {{entityName}} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    {{#each fields}}
    {{#if this.required}}@NotNull{{/if}}
    {{#if this.unique}}@Column(unique = true){{/if}}
    {{#if this.minLength}}@Size(min = {{this.minLength}}{{#if this.maxLength}}, max = {{this.maxLength}}{{/if}}){{/if}}
    {{#if this.min}}@Min({{this.min}}){{/if}}
    {{#if this.max}}@Max({{this.max}}){{/if}}
    private {{this.type}} {{this.name}};
    {{/each}}

    {{#if auditable}}
    // Champs d'audit
    private String createdBy;
    private LocalDateTime createdDate;
    private String lastModifiedBy;
    private LocalDateTime lastModifiedDate;
    {{/if}}
}
`,

  repository: `package {{repositoryPackage}};

import {{entityPackageName}}.{{entityName}};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité {{entityName}}
 */
@Repository
public interface {{entityName}}Repository extends JpaRepository<{{entityName}}, Long> {
    // Ajoutez vos méthodes de requête personnalisées ici
}
`,

  service: `package {{servicePackage}};

import {{entityPackageName}}.{{entityName}};
import java.util.List;
import java.util.Optional;

/**
 * Service pour gérer les opérations business sur l'entité {{entityName}}
 */
public interface {{entityName}}Service {

    /**
     * Récupère tous les {{entityName}}
     * @return liste de {{entityName}}
     */
    List<{{entityName}}> findAll();
    
    /**
     * Récupère un {{entityName}} par son id
     * @param id identifiant du {{entityName}}
     * @return le {{entityName}} ou empty si non trouvé
     */
    Optional<{{entityName}}> findById(Long id);
    
    /**
     * Sauvegarde un {{entityName}}
     * @param {{entityNameLower}} l'entité à sauvegarder
     * @return l'entité sauvegardée
     */
    {{entityName}} save({{entityName}} {{entityNameLower}});
    
    /**
     * Supprime un {{entityName}} par son id
     * @param id identifiant du {{entityName}} à supprimer
     */
    void deleteById(Long id);
}
`,

  serviceImpl: `package {{servicePackage}};

import {{entityPackageName}}.{{entityName}};
import {{repositoryPackageName}}.{{entityName}}Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du service {{entityName}}
 */
@Service
@Transactional
@RequiredArgsConstructor
public class {{entityName}}ServiceImpl implements {{entityName}}Service {

    private final {{entityName}}Repository {{entityNameLower}}Repository;

    @Override
    @Transactional(readOnly = true)
    public List<{{entityName}}> findAll() {
        return {{entityNameLower}}Repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<{{entityName}}> findById(Long id) {
        return {{entityNameLower}}Repository.findById(id);
    }

    @Override
    public {{entityName}} save({{entityName}} {{entityNameLower}}) {
        return {{entityNameLower}}Repository.save({{entityNameLower}});
    }

    @Override
    public void deleteById(Long id) {
        {{entityNameLower}}Repository.deleteById(id);
    }
}
`,

  controller: `package {{controllerPackage}};

import {{entityPackageName}}.{{entityName}};
{{#if useDto}}
import {{dtoPackageName}}.{{entityName}}DTO;
{{/if}}
import {{servicePackageName}}.{{entityName}}Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
{{#if useDto}}
import java.util.stream.Collectors;
{{/if}}

/**
 * REST Controller pour l'entité {{entityName}}
 */
@RestController
@RequestMapping("/api/{{entityNamePluralLower}}")
@RequiredArgsConstructor
public class {{entityName}}Controller {

    private final {{entityName}}Service {{entityNameLower}}Service;
    
    /**
     * GET /api/{{entityNamePluralLower}} : Récupère tous les {{entityNamePluralLower}}
     * @return la liste des {{entityNamePluralLower}}
     */
    @GetMapping
    public {{#if useDto}}List<{{entityName}}DTO>{{else}}List<{{entityName}}>{{/if}} getAll{{entityNamePlural}}() {
        {{#if useDto}}
        return {{entityNameLower}}Service.findAll().stream()
                .map({{entityName}}DTO::fromEntity)
                .collect(Collectors.toList());
        {{else}}
        return {{entityNameLower}}Service.findAll();
        {{/if}}
    }
    
    /**
     * GET /api/{{entityNamePluralLower}}/{id} : Récupère un {{entityNameLower}} par son id
     * @param id identifiant du {{entityNameLower}}
     * @return le {{entityNameLower}} trouvé ou 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<{{#if useDto}}{{entityName}}DTO{{else}}{{entityName}}{{/if}}> get{{entityName}}ById(@PathVariable Long id) {
        return {{entityNameLower}}Service.findById(id)
                {{#if useDto}}
                .map({{entityName}}DTO::fromEntity)
                {{/if}}
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /api/{{entityNamePluralLower}} : Crée un nouveau {{entityNameLower}}
     * @param {{#if useDto}}dto{{else}}{{entityNameLower}}{{/if}} l'entité à créer
     * @return l'entité créée avec un status 201
     */
    @PostMapping
    public ResponseEntity<{{#if useDto}}{{entityName}}DTO{{else}}{{entityName}}{{/if}}> create{{entityName}}(
            @RequestBody {{#if useDto}}{{entityName}}DTO dto{{else}}{{entityName}} {{entityNameLower}}{{/if}}) {
        {{#if useDto}}
        {{entityName}} saved = {{entityNameLower}}Service.save(dto.toEntity());
        return ResponseEntity.created(URI.create("/api/{{entityNamePluralLower}}/" + saved.getId()))
                .body({{entityName}}DTO.fromEntity(saved));
        {{else}}
        {{entityName}} saved = {{entityNameLower}}Service.save({{entityNameLower}});
        return ResponseEntity.created(URI.create("/api/{{entityNamePluralLower}}/" + saved.getId()))
                .body(saved);
        {{/if}}
    }
    
    /**
     * PUT /api/{{entityNamePluralLower}} : Met à jour un {{entityNameLower}} existant
     * @param {{#if useDto}}dto{{else}}{{entityNameLower}}{{/if}} l'entité à mettre à jour
     * @return l'entité mise à jour
     */
    @PutMapping("/{id}")
    public ResponseEntity<{{#if useDto}}{{entityName}}DTO{{else}}{{entityName}}{{/if}}> update{{entityName}}(
            @PathVariable Long id,
            @RequestBody {{#if useDto}}{{entityName}}DTO dto{{else}}{{entityName}} {{entityNameLower}}{{/if}}) {
        
        if (!{{entityNameLower}}Service.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        {{#if useDto}}
        {{entityName}} entity = dto.toEntity();
        entity.setId(id);
        {{entityName}} updated = {{entityNameLower}}Service.save(entity);
        return ResponseEntity.ok({{entityName}}DTO.fromEntity(updated));
        {{else}}
        {{entityNameLower}}.setId(id);
        {{entityName}} updated = {{entityNameLower}}Service.save({{entityNameLower}});
        return ResponseEntity.ok(updated);
        {{/if}}
    }
    
    /**
     * DELETE /api/{{entityNamePluralLower}}/{id} : Supprime un {{entityNameLower}}
     * @param id identifiant du {{entityNameLower}} à supprimer
     * @return 204 si supprimé avec succès
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete{{entityName}}(@PathVariable Long id) {
        if (!{{entityNameLower}}Service.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        {{entityNameLower}}Service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`,

  dto: `package {{packageName}};

import {{entityPackageName}}.{{entityName}};
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
{{#if dateTimeImport}}
import java.time.LocalDateTime;
import java.time.LocalDate;
{{/if}}
{{#if bigDecimalImport}}
import java.math.BigDecimal;
{{/if}}

/**
 * DTO pour l'entité {{entityName}}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class {{entityName}}DTO {

    private Long id;
    
    {{#each fields}}
    private {{this.type}} {{this.name}};
    {{/each}}

    /**
     * Convertit une entité {{entityName}} en DTO
     * @param entity l'entité à convertir
     * @return le DTO correspondant
     */
    public static {{entityName}}DTO fromEntity({{entityName}} entity) {
        if (entity == null) {
            return null;
        }
        
        return {{entityName}}DTO.builder()
                .id(entity.getId())
                {{#each fields}}
                .{{this.name}}(entity.get{{capitalizeFirst this.name}}())
                {{/each}}
                .build();
    }
    
    /**
     * Convertit ce DTO en entité
     * @return l'entité correspondante
     */
    public {{entityName}} toEntity() {
        {{entityName}} entity = new {{entityName}}();
        entity.setId(this.id);
        {{#each fields}}
        entity.set{{capitalizeFirst this.name}}(this.{{this.name}});
        {{/each}}
        return entity;
    }
}
`
};

// Fonction pour convertir un texte en snake_case
function toSnakeCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

// Fonction pour convertir un texte en pluriel (simplifiée)
function pluralize(text) {
  if (text.endsWith('y')) {
    return text.slice(0, -1) + 'ies';
  } else if (text.endsWith('s') || text.endsWith('x') || text.endsWith('z') ||
             text.endsWith('ch') || text.endsWith('sh')) {
    return text + 'es';
  } else {
    return text + 's';
  }
}

// Fonction pour capitaliser la première lettre d'un texte
function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Fonction pour rendre la première lettre d'un texte en minuscule
function lowercaseFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// Fonction pour remplacer les placeholders dans les templates
function replaceTemplateVars(template, data) {
  let result = template;

  // Remplacer les variables simples {{var}}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
  }

  // Traiter les conditionnels {{#if var}}content{{/if}}
  result = result.replace(/{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g, function(match, condition, content) {
    const value = data[condition];
    return value ? content : '';
  });

  // Traiter les boucles {{#each var}}content{{/each}}
  result = result.replace(/{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g, function(match, arrayName, content) {
    const array = data[arrayName];
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      let itemContent = content;
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'string' || typeof value === 'number') {
          const regex = new RegExp(`this.${key}`, 'g');
          itemContent = itemContent.replace(regex, value);
        }
      }
      return itemContent;
    }).join('');
  });

  // Fonction supplémentaire pour capitalizer
  result = result.replace(/{{capitalizeFirst ([^}]+)}}/g, function(match, text) {
    const value = text.startsWith('this.') ?
      data.fields.find(f => 'this.' + f.name === text)?.name :
      data[text];
    return capitalizeFirst(value || '');
  });

  return result;
}

// Fonction pour créer le répertoire s'il n'existe pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`📁 Création du répertoire: ${directory}`);
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fichier généré: ${filePath}`);
}

// Fonction principale pour la génération des fichiers
async function generateEntity() {
  console.log('────────────────────────────────────────────');
  console.log('🧩 GÉNÉRATEUR ALTERNATIF D\'ENTITÉS SPRING FULLSTACK');
  console.log('────────────────────────────────────────────');
  console.log('Ce générateur va créer une entité Java avec tous les composants associés\n');

  try {
    // Collecter les réponses de l'utilisateur
    const entityName = await question('Nom de l\'entité (PascalCase): ');
    const packageName = await question(`Package [${DEFAULT_PACKAGE}]: `) || DEFAULT_PACKAGE;
    const generateRepository = (await question('Générer un repository? (O/n): ')).toLowerCase() !== 'n';
    const generateService = (await question('Générer un service? (O/n): ')).toLowerCase() !== 'n';
    const generateController = (await question('Générer un controller REST? (O/n): ')).toLowerCase() !== 'n';
    const generateDto = (await question('Générer des DTOs? (O/n): ')).toLowerCase() !== 'n';
    const auditable = (await question('Ajouter des champs d\'audit? (O/n): ')).toLowerCase() !== 'n';

    console.log('\n➤ DÉFINITION DES CHAMPS');
    console.log('────────────────────────────────────────────');
    console.log('💡 Un champ \'id\' de type Long sera automatiquement ajouté comme clé primaire');

    const fields = [];
    let addMoreFields = true;

    while (addMoreFields) {
      const name = await question('Nom du champ: ');
      const type = await question('Type de données (String, Integer, Long, Boolean, LocalDate, LocalDateTime...): ');
      const required = (await question('Ce champ est-il requis? (O/n): ')).toLowerCase() !== 'n';

      let minLength = null;
      let maxLength = null;
      let min = null;
      let max = null;

      if (type === 'String') {
        minLength = await question('Longueur minimale: ');
        maxLength = await question('Longueur maximale: ');
      } else if (['Integer', 'Long', 'Float', 'Double', 'BigDecimal'].includes(type)) {
        min = await question('Valeur minimale: ');
        max = await question('Valeur maximale: ');
      }

      const unique = (await question('Ce champ doit-il être unique? (o/N): ')).toLowerCase() === 'o';

      fields.push({
        name,
        type,
        required,
        unique,
        minLength: minLength ? parseInt(minLength) : null,
        maxLength: maxLength ? parseInt(maxLength) : null,
        min: min ? parseFloat(min) : null,
        max: max ? parseFloat(max) : null
      });

      console.log(`✅ Champ '${name}' ajouté`);
      addMoreFields = (await question('Ajouter un autre champ? (O/n): ')).toLowerCase() !== 'n';
    }

    // Afficher un résumé des champs
    console.log('\n➤ RÉSUMÉ DES CHAMPS');
    console.log('────────────────────────────────────────────');
    fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name} : ${field.type}${field.required ? ' (requis)' : ''}${field.unique ? ' (unique)' : ''}`);
    });

    // Préparer les packages et chemins
    const entityPackage = `${packageName}.entity`;
    const repositoryPackage = `${packageName}.repository`;
    const servicePackage = `${packageName}.service`;
    const controllerPackage = `${packageName}.controller`;
    const dtoPackage = `${packageName}.dto`;

    const entityDir = `src/main/java/${entityPackage.replace(/\./g, '/')}`;
    const repositoryDir = `src/main/java/${repositoryPackage.replace(/\./g, '/')}`;
    const serviceDir = `src/main/java/${servicePackage.replace(/\./g, '/')}`;
    const controllerDir = `src/main/java/${controllerPackage.replace(/\./g, '/')}`;
    const dtoDir = `src/main/java/${dtoPackage.replace(/\./g, '/')}`;

    // Vérifier si des champs de date/heure sont présents
    const dateTimeImport = fields.some(field =>
      ['LocalDate', 'LocalDateTime', 'LocalTime', 'ZonedDateTime', 'Instant', 'Date'].includes(field.type)
    );

    // Vérifier si des champs BigDecimal sont présents
    const bigDecimalImport = fields.some(field => field.type === 'BigDecimal');

    // Préparer les données pour les templates
    const templateData = {
      entityName,
      entityNameLower: lowercaseFirst(entityName),
      entityPackage,
      entityPackageName: entityPackage,
      repositoryPackage,
      repositoryPackageName: repositoryPackage,
      servicePackage,
      servicePackageName: servicePackage,
      controllerPackage,
      controllerPackageName: controllerPackage,
      dtoPackage,
      dtoPackageName: dtoPackage,
      packageName: dtoPackage,  // Pour compatibilité avec le template DTO
      tableName: toSnakeCase(entityName),
      fields,
      auditable,
      dateTimeImport,
      bigDecimalImport,
      entityNamePlural: pluralize(entityName),
      entityNamePluralLower: pluralize(lowercaseFirst(entityName)),
      useDto: generateDto
    };

    console.log('\n➤ GÉNÉRATION DES FICHIERS');
    console.log('────────────────────────────────────────────');

    // Générer l'entité
    const entityContent = replaceTemplateVars(templates.entity, templateData);
    writeFile(`${entityDir}/${entityName}.java`, entityContent);

    // Générer le repository
    if (generateRepository) {
      const repositoryContent = replaceTemplateVars(templates.repository, templateData);
      writeFile(`${repositoryDir}/${entityName}Repository.java`, repositoryContent);
    }

    // Générer le service
    if (generateService) {
      const serviceContent = replaceTemplateVars(templates.service, templateData);
      writeFile(`${serviceDir}/${entityName}Service.java`, serviceContent);

      const serviceImplContent = replaceTemplateVars(templates.serviceImpl, templateData);
      writeFile(`${serviceDir}/${entityName}ServiceImpl.java`, serviceImplContent);
    }

    // Générer le controller
    if (generateController) {
      const controllerContent = replaceTemplateVars(templates.controller, templateData);
      writeFile(`${controllerDir}/${entityName}Controller.java`, controllerContent);
    }

    // Générer le DTO
    if (generateDto) {
      const dtoContent = replaceTemplateVars(templates.dto, templateData);
      writeFile(`${dtoDir}/${entityName}DTO.java`, dtoContent);
    }

    console.log('\n✅ Génération de l\'entité terminée avec succès!');

  } catch (error) {
    console.error(`❌ Erreur lors de la génération: ${error.message}`);
    console.error(error.stack);
  } finally {
    // Fermer l'interface readline
    rl.close();
  }
}

// Démarrer la génération
generateEntity();
