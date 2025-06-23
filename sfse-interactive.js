#!/usr/bin/env node
/**
 * Script interactif pour remplacer la commande 'sfs e' qui présente des problèmes
 * Ce script utilise l'approche directe de génération d'entités qui fonctionne
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration par défaut
const config = {
  entityName: 'Example',
  packageName: 'com.example.fullstack',
  generateRepository: true,
  generateService: true,
  generateController: true,
  generateDto: true,
  auditable: true,
  fields: []
};

// Types disponibles pour les champs d'entité
const FIELD_TYPES = [
  { name: "String - Texte", value: "String" },
  { name: "Integer - Nombre entier", value: "Integer" },
  { name: "Long - Nombre entier long", value: "Long" },
  { name: "Float - Nombre décimal", value: "Float" },
  { name: "Double - Nombre décimal précis", value: "Double" },
  { name: "Boolean - Vrai/Faux", value: "Boolean" },
  { name: "Date - Date", value: "LocalDate" },
  { name: "DateTime - Date et heure", value: "LocalDateTime" },
  { name: "Time - Heure", value: "LocalTime" },
  { name: "Enum - Liste de valeurs fixes", value: "Enum" },
  { name: "BigDecimal - Nombre décimal pour calculs précis", value: "BigDecimal" },
  { name: "byte[] - Tableau d'octets (fichiers, images)", value: "byte[]" },
  { name: "UUID - Identifiant universel unique", value: "UUID" }
];

console.log('\n────────────────────────────────────────────');
console.log('🧩 GÉNÉRATEUR INTERACTIF D\'ENTITÉS SPRING FULLSTACK');
console.log('────────────────────────────────────────────');
console.log('Ce script va créer directement une entité Java avec tous les composants associés\n');

// Fonction pour poser une question et obtenir la réponse
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultValueDisplay = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${question}${defaultValueDisplay}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Fonction pour poser une question à choix (oui/non)
function askConfirmation(question, defaultValue = true) {
  return new Promise((resolve) => {
    const options = defaultValue ? '[O/n]' : '[o/N]';
    rl.question(`${question} ${options}: `, (answer) => {
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        resolve(true);
      } else if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'non' || answer.toLowerCase() === 'no') {
        resolve(false);
      } else {
        resolve(defaultValue);
      }
    });
  });
}

// Fonction pour demander de choisir un type parmi une liste
function askChoice(question, choices) {
  return new Promise((resolve) => {
    console.log(`\n${question}`);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.name}`);
    });

    rl.question('Votre choix (numéro): ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index].value);
      } else {
        console.log('Choix invalide, utilisation de la valeur par défaut (1)');
        resolve(choices[0].value);
      }
    });
  });
}

// Fonction pour valider le nom de l'entité
function validateEntityName(name) {
  if (!name) return false;
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

// Fonction pour valider le nom d'un champ
function validateFieldName(name) {
  if (!name) return false;
  if (["id", "class", "abstract", "interface", "enum"].includes(name.toLowerCase())) {
    return false;
  }
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

// Fonction pour demander les informations sur l'entité
async function askEntityInfo() {
  console.log('\n🏗️ PARAMÈTRES DE L\'ENTITÉ');
  console.log('────────────────────────────────────────────');

  let entityName;
  do {
    entityName = await askQuestion('Nom de l\'entité (PascalCase)', 'Example');
    if (!validateEntityName(entityName)) {
      console.log('❌ Nom d\'entité invalide. Il doit commencer par une majuscule et ne contenir que des lettres et des chiffres.');
    }
  } while (!validateEntityName(entityName));

  config.entityName = entityName;
  config.packageName = await askQuestion('Package', config.packageName);
  config.generateRepository = await askConfirmation('Générer un repository?');
  config.generateService = await askConfirmation('Générer un service?');
  config.generateController = await askConfirmation('Générer un controller REST?');
  config.generateDto = await askConfirmation('Générer des DTOs?');
  config.auditable = await askConfirmation('Ajouter des champs d\'audit (createdBy, createdDate, etc.)?');

  console.log('\n➤ DÉFINITION DES CHAMPS');
  console.log('────────────────────────────────────────────');
  console.log('💡 Un champ \'id\' de type Long sera automatiquement ajouté comme clé primaire');

  await askFields();

  console.log('\n➤ RÉSUMÉ DES CHAMPS');
  console.log('────────────────────────────────────────────');
  config.fields.forEach((field, index) => {
    console.log(`${index + 1}. ${field.name} : ${field.type} ${field.required ? '(requis)' : ''} ${field.unique ? '(unique)' : ''}`);
  });
}

// Fonction pour demander les informations sur les champs
async function askFields() {
  let addMore = true;

  while (addMore) {
    let fieldName;
    do {
      fieldName = await askQuestion('Nom du champ');
      if (!validateFieldName(fieldName)) {
        console.log('❌ Nom du champ invalide. Il doit commencer par une lettre et ne contenir que des lettres, chiffres et underscores.');
      }
    } while (!validateFieldName(fieldName));

    const fieldType = await askChoice('Type de données', FIELD_TYPES);
    const required = await askConfirmation('Ce champ est-il requis?');

    let minLength = null;
    let maxLength = null;
    let min = null;
    let max = null;
    let enumValues = null;
    let unique = false;

    if (fieldType === 'String') {
      const minLengthStr = await askQuestion('Longueur minimale');
      minLength = minLengthStr ? parseInt(minLengthStr) : null;

      const maxLengthStr = await askQuestion('Longueur maximale');
      maxLength = maxLengthStr ? parseInt(maxLengthStr) : null;
    } else if (['Integer', 'Long', 'Float', 'Double', 'BigDecimal'].includes(fieldType)) {
      const minStr = await askQuestion('Valeur minimale');
      min = minStr ? parseFloat(minStr) : null;

      const maxStr = await askQuestion('Valeur maximale');
      max = maxStr ? parseFloat(maxStr) : null;
    } else if (fieldType === 'Enum') {
      enumValues = await askQuestion('Valeurs d\'enum (séparées par des virgules)', 'VALEUR1,VALEUR2,VALEUR3');
      enumValues = enumValues.split(',').map(v => v.trim());
    }

    unique = await askConfirmation('Ce champ doit-il être unique?', false);

    config.fields.push({
      name: fieldName,
      type: fieldType,
      required,
      unique,
      minLength,
      maxLength,
      min,
      max,
      enumValues
    });

    console.log(`✅ Champ '${fieldName}' ajouté`);

    addMore = await askConfirmation('Ajouter un autre champ?');
  }
}

// Fonction pour créer les répertoires nécessaires
function createDirectories() {
  const basePath = "src/main/java";

  const entityPackage = `${config.packageName}.entity`;
  const entityDir = path.join(basePath, entityPackage.replace(/\./g, '/'));

  const repositoryPackage = `${config.packageName}.repository`;
  const repositoryDir = path.join(basePath, repositoryPackage.replace(/\./g, '/'));

  const servicePackage = `${config.packageName}.service`;
  const serviceDir = path.join(basePath, servicePackage.replace(/\./g, '/'));

  const controllerPackage = `${config.packageName}.controller`;
  const controllerDir = path.join(basePath, controllerPackage.replace(/\./g, '/'));

  const dtoPackage = `${config.packageName}.dto`;
  const dtoDir = path.join(basePath, dtoPackage.replace(/\./g, '/'));

  // Création des répertoires
  createDirIfNotExists(entityDir);
  if (config.generateRepository) createDirIfNotExists(repositoryDir);
  if (config.generateService) createDirIfNotExists(serviceDir);
  if (config.generateController) createDirIfNotExists(controllerDir);
  if (config.generateDto) createDirIfNotExists(dtoDir);

  return {
    entityPackage, entityDir,
    repositoryPackage, repositoryDir,
    servicePackage, serviceDir,
    controllerPackage, controllerDir,
    dtoPackage, dtoDir
  };
}

// Création d'un répertoire s'il n'existe pas
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Création du répertoire: ${dir}`);
  } else {
    console.log(`📁 Le répertoire existe déjà: ${dir}`);
  }
}

// Fonction pour générer le code de l'entité
function generateEntityCode(entityPackage) {
  const fieldDeclarations = config.fields.map(field => {
    let code = '';
    if (field.required) {
      code += '    @NotNull\n';
    }
    if (field.unique) {
      code += '    @Column(unique = true)\n';
    }
    if (field.type === 'String') {
      if (field.minLength || field.maxLength) {
        code += '    @Size(';
        const constraints = [];
        if (field.minLength) constraints.push(`min = ${field.minLength}`);
        if (field.maxLength) constraints.push(`max = ${field.maxLength}`);
        code += constraints.join(', ');
        code += ')\n';
      }
    }
    code += `    private ${field.type} ${field.name};\n`;
    return code;
  }).join('\n');

  const gettersAndSetters = config.fields.map(field => {
    const capitalizedName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    return `
    public ${field.type} get${capitalizedName}() {
        return ${field.name};
    }

    public void set${capitalizedName}(${field.type} ${field.name}) {
        this.${field.name} = ${field.name};
    }`;
  }).join('\n');

  const auditableFields = config.auditable ? `
    @CreatedBy
    @Column(name = "created_by", nullable = false, length = 50, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_date", updatable = false)
    private Instant createdDate = Instant.now();

    @LastModifiedBy
    @Column(name = "last_modified_by", length = 50)
    private String lastModifiedBy;

    @LastModifiedDate
    @Column(name = "last_modified_date")
    private Instant lastModifiedDate = Instant.now();
` : '';

  const auditableImports = config.auditable ? `
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import java.time.Instant;` : '';

  return `package ${entityPackage};

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;${auditableImports}

/**
 * Entity ${config.entityName}
 */
@Entity
@Table(name = "${config.entityName.toLowerCase()}")
public class ${config.entityName} implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

${fieldDeclarations}
${auditableFields}
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
${gettersAndSetters}

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ${config.entityName})) {
            return false;
        }
        return id != null && id.equals((((${config.entityName}) o).id));
    }

    @Override
    public int hashCode() {
        return 31;
    }

    @Override
    public String toString() {
        return "${config.entityName}{" +
            "id=" + getId() +
            "}";
    }
}
`;
}

// Fonction pour générer le code du repository
function generateRepositoryCode(repositoryPackage, entityPackage) {
  return `package ${repositoryPackage};

import ${entityPackage}.${config.entityName};
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data repository for the ${config.entityName} entity.
 */
@Repository
public interface ${config.entityName}Repository extends JpaRepository<${config.entityName}, Long> {
}
`;
}

// Fonction pour générer le code du service
function generateServiceCode(servicePackage, entityPackage) {
  return `package ${servicePackage};

import ${entityPackage}.${config.entityName};
import java.util.List;
import java.util.Optional;

/**
 * Service Interface for managing {@link ${config.entityName}}.
 */
public interface ${config.entityName}Service {
    /**
     * Save a ${config.entityName.toLowerCase()}.
     *
     * @param ${config.entityName.toLowerCase()} the entity to save.
     * @return the persisted entity.
     */
    ${config.entityName} save(${config.entityName} ${config.entityName.toLowerCase()});

    /**
     * Get all the ${config.entityName.toLowerCase()}s.
     *
     * @return the list of entities.
     */
    List<${config.entityName}> findAll();

    /**
     * Get the "${config.entityName.toLowerCase()}" by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<${config.entityName}> findOne(Long id);

    /**
     * Delete the "${config.entityName.toLowerCase()}" by id.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);
}
`;
}

// Fonction pour générer le code d'implémentation du service
function generateServiceImplCode(servicePackage, entityPackage, repositoryPackage) {
  return `package ${servicePackage};

import ${entityPackage}.${config.entityName};
import ${repositoryPackage}.${config.entityName}Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service Implementation for managing {@link ${config.entityName}}.
 */
@Service
@Transactional
public class ${config.entityName}ServiceImpl implements ${config.entityName}Service {

    private final Logger log = LoggerFactory.getLogger(${config.entityName}ServiceImpl.class);

    private final ${config.entityName}Repository ${config.entityName.toLowerCase()}Repository;

    public ${config.entityName}ServiceImpl(${config.entityName}Repository ${config.entityName.toLowerCase()}Repository) {
        this.${config.entityName.toLowerCase()}Repository = ${config.entityName.toLowerCase()}Repository;
    }

    @Override
    public ${config.entityName} save(${config.entityName} ${config.entityName.toLowerCase()}) {
        log.debug("Request to save ${config.entityName} : {}", ${config.entityName.toLowerCase()});
        return ${config.entityName.toLowerCase()}Repository.save(${config.entityName.toLowerCase()});
    }

    @Override
    @Transactional(readOnly = true)
    public List<${config.entityName}> findAll() {
        log.debug("Request to get all ${config.entityName}s");
        return ${config.entityName.toLowerCase()}Repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<${config.entityName}> findOne(Long id) {
        log.debug("Request to get ${config.entityName} : {}", id);
        return ${config.entityName.toLowerCase()}Repository.findById(id);
    }

    @Override
    public void delete(Long id) {
        log.debug("Request to delete ${config.entityName} : {}", id);
        ${config.entityName.toLowerCase()}Repository.deleteById(id);
    }
}
`;
}

// Fonction pour générer le code du controller
function generateControllerCode(controllerPackage, entityPackage, servicePackage, dtoPackage) {
  const entityNamePlural = `${config.entityName.toLowerCase()}s`;
  const entityNameLower = config.entityName.charAt(0).toLowerCase() + config.entityName.slice(1);

  const dtoImport = config.generateDto ?
    `import ${dtoPackage}.${config.entityName}DTO;\nimport org.modelmapper.ModelMapper;` : '';

  const responseType = config.generateDto ? `${config.entityName}DTO` : config.entityName;

  const mapperCode = config.generateDto ? `
    private final ModelMapper modelMapper = new ModelMapper();
    
    private ${config.entityName}DTO convertToDto(${config.entityName} ${entityNameLower}) {
        return modelMapper.map(${entityNameLower}, ${config.entityName}DTO.class);
    }
    
    private ${config.entityName} convertToEntity(${config.entityName}DTO ${entityNameLower}DTO) {
        return modelMapper.map(${entityNameLower}DTO, ${config.entityName}.class);
    }` : '';

  const requestBody = config.generateDto ? `${config.entityName}DTO ${entityNameLower}DTO` : `${config.entityName} ${entityNameLower}`;

  const saveMethod = config.generateDto ?
    `${config.entityName} entity = convertToEntity(${entityNameLower}DTO);
        ${config.entityName} result = ${entityNameLower}Service.save(entity);
        return ResponseEntity.ok(convertToDto(result));` :
    `${config.entityName} result = ${entityNameLower}Service.save(${entityNameLower});
        return ResponseEntity.ok(result);`;

  const getAllMethod = config.generateDto ?
    `List<${config.entityName}> entities = ${entityNameLower}Service.findAll();
        return entities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());` :
    `return ${entityNameLower}Service.findAll();`;

  const getOneMethod = config.generateDto ?
    `return ${entityNameLower}Service.findOne(id)
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));` :
    `return ${entityNameLower}Service.findOne(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));`;

  return `package ${controllerPackage};

import ${entityPackage}.${config.entityName};
import ${servicePackage}.${config.entityName}Service;
${dtoImport}
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.List;
${config.generateDto ? 'import java.util.stream.Collectors;' : ''}

/**
 * REST controller for managing {@link ${entityPackage}.${config.entityName}}.
 */
@RestController
@RequestMapping("/api")
public class ${config.entityName}Controller {

    private final Logger log = LoggerFactory.getLogger(${config.entityName}Controller.class);
    private final ${config.entityName}Service ${entityNameLower}Service;
${mapperCode}

    public ${config.entityName}Controller(${config.entityName}Service ${entityNameLower}Service) {
        this.${entityNameLower}Service = ${entityNameLower}Service;
    }

    /**
     * {@code POST  /${entityNamePlural}} : Create a new ${entityNameLower}.
     *
     * @param ${entityNameLower} the ${entityNameLower} to create.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the new ${entityNameLower}.
     */
    @PostMapping("/${entityNamePlural}")
    public ResponseEntity<${responseType}> create${config.entityName}(@Valid @RequestBody ${requestBody}) {
        log.debug("REST request to save ${config.entityName} : {}", ${entityNameLower}${config.generateDto ? 'DTO' : ''});
        ${saveMethod}
    }

    /**
     * {@code PUT  /${entityNamePlural}} : Updates an existing ${entityNameLower}.
     *
     * @param ${entityNameLower} the ${entityNameLower} to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated ${entityNameLower}.
     */
    @PutMapping("/${entityNamePlural}")
    public ResponseEntity<${responseType}> update${config.entityName}(@Valid @RequestBody ${requestBody}) {
        log.debug("REST request to update ${config.entityName} : {}", ${entityNameLower}${config.generateDto ? 'DTO' : ''});
        ${saveMethod}
    }

    /**
     * {@code GET  /${entityNamePlural}} : get all the ${entityNamePlural}.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of ${entityNamePlural} in body.
     */
    @GetMapping("/${entityNamePlural}")
    public List<${responseType}> getAll${config.entityName}s() {
        log.debug("REST request to get all ${config.entityName}s");
        ${getAllMethod}
    }

    /**
     * {@code GET  /${entityNamePlural}/:id} : get the "id" ${entityNameLower}.
     *
     * @param id the id of the ${entityNameLower} to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the ${entityNameLower}.
     */
    @GetMapping("/${entityNamePlural}/{id}")
    public ResponseEntity<${responseType}> get${config.entityName}(@PathVariable Long id) {
        log.debug("REST request to get ${config.entityName} : {}", id);
        ${getOneMethod}
    }

    /**
     * {@code DELETE  /${entityNamePlural}/:id} : delete the "id" ${entityNameLower}.
     *
     * @param id the id of the ${entityNameLower} to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/${entityNamePlural}/{id}")
    public ResponseEntity<Void> delete${config.entityName}(@PathVariable Long id) {
        log.debug("REST request to delete ${config.entityName} : {}", id);
        ${entityNameLower}Service.delete(id);
        return ResponseEntity.noContent().build();
    }
}`;
}

// Fonction pour générer le code du DTO
function generateDtoCode(dtoPackage, entityPackage) {
  const fieldDeclarations = config.fields.map(field => {
    let code = '';
    if (field.required) {
      code += '    @NotNull\n';
    }
    if (field.type === 'String' && (field.minLength || field.maxLength)) {
      code += '    @Size(';
      const constraints = [];
      if (field.minLength) constraints.push(`min = ${field.minLength}`);
      if (field.maxLength) constraints.push(`max = ${field.maxLength}`);
      code += constraints.join(', ');
      code += ')\n';
    }
    code += `    private ${field.type} ${field.name};\n`;
    return code;
  }).join('\n');

  const gettersAndSetters = config.fields.map(field => {
    const capitalizedName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    return `
    public ${field.type} get${capitalizedName}() {
        return ${field.name};
    }

    public void set${capitalizedName}(${field.type} ${field.name}) {
        this.${field.name} = ${field.name};
    }`;
  }).join('\n');

  return `package ${dtoPackage};

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * DTO for the {@link ${entityPackage}.${config.entityName}} entity.
 */
public class ${config.entityName}DTO implements Serializable {

    private Long id;

${fieldDeclarations}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
${gettersAndSetters}

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ${config.entityName}DTO)) {
            return false;
        }

        return id != null && id.equals(((${config.entityName}DTO) o).id);
    }

    @Override
    public int hashCode() {
        return 31;
    }

    @Override
    public String toString() {
        return "${config.entityName}DTO{" +
            "id=" + getId() +
            "}";
    }
}
`;
}

// Fonction pour générer les fichiers
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fichier généré: ${filePath}`);
}

// Fonction principale
async function main() {
  try {
    await askEntityInfo();

    const paths = createDirectories();

    // Générer l'entité
    const entityContent = generateEntityCode(paths.entityPackage);
    writeFile(path.join(paths.entityDir, `${config.entityName}.java`), entityContent);

    // Générer le repository
    if (config.generateRepository) {
      const repositoryContent = generateRepositoryCode(paths.repositoryPackage, paths.entityPackage);
      writeFile(path.join(paths.repositoryDir, `${config.entityName}Repository.java`), repositoryContent);
    }

    // Générer le service et son implémentation
    if (config.generateService) {
      const serviceContent = generateServiceCode(paths.servicePackage, paths.entityPackage);
      writeFile(path.join(paths.serviceDir, `${config.entityName}Service.java`), serviceContent);

      const serviceImplContent = generateServiceImplCode(paths.servicePackage, paths.entityPackage, paths.repositoryPackage);
      writeFile(path.join(paths.serviceDir, `${config.entityName}ServiceImpl.java`), serviceImplContent);
    }

    // Générer le controller
    if (config.generateController) {
      const controllerContent = generateControllerCode(
        paths.controllerPackage,
        paths.entityPackage,
        paths.servicePackage,
        paths.dtoPackage
      );
      writeFile(path.join(paths.controllerDir, `${config.entityName}Controller.java`), controllerContent);
    }

    // Générer le DTO
    if (config.generateDto) {
      const dtoContent = generateDtoCode(paths.dtoPackage, paths.entityPackage);
      writeFile(path.join(paths.dtoDir, `${config.entityName}DTO.java`), dtoContent);
    }

    console.log('\n✨ GÉNÉRATION TERMINÉE AVEC SUCCÈS ✨');
    console.log(`Entité ${config.entityName} générée dans le package ${paths.entityPackage}`);
  } catch (error) {
    console.error('❌ Une erreur est survenue:', error);
  } finally {
    rl.close();
  }
}

// Exécuter le script
main();
