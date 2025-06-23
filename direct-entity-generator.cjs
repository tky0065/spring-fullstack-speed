// Script qui génère directement une entité et ses composants associés
// sans passer par le générateur Yeoman problématique
// Format CommonJS pour une meilleure compatibilité

const fs = require('fs');
const path = require('path');

console.log('\n────────────────────────────────────────────');
console.log('🧩 GÉNÉRATEUR DIRECT D\'ENTITÉS SPRING FULLSTACK');
console.log('────────────────────────────────────────────');
console.log('Ce script va créer directement une entité Java avec tous les composants associés\n');

// Configuration par défaut - normalement obtenue via l'interface utilisateur
const config = {
  entityName: 'Example',
  packageName: 'com.example.fullstack',
  generateRepository: true,
  generateService: true,
  generateController: true,
  generateDto: true,
  auditable: true,
  fields: [
    {
      name: 'name',
      type: 'String',
      required: true,
      minLength: 3,
      maxLength: 50,
      unique: false
    }
  ]
};

// Création des répertoires
const basePath = "src/main/java";
const packagePath = config.packageName.replace(/\./g, '/');

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

// Création des répertoires s'ils n'existent pas
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Création du répertoire: ${dir}`);
  } else {
    console.log(`📁 Le répertoire existe déjà: ${dir}`);
  }
}

// Création des répertoires principaux
createDirIfNotExists(entityDir);
if (config.generateRepository) createDirIfNotExists(repositoryDir);
if (config.generateService) createDirIfNotExists(serviceDir);
if (config.generateController) createDirIfNotExists(controllerDir);
if (config.generateDto) createDirIfNotExists(dtoDir);

// Templates pour les fichiers Java
function generateEntityCode() {
  const fieldDeclarations = config.fields.map(field => {
    let code = '';
    if (field.required) {
      code += '    @NotNull\n';
    }
    if (field.unique) {
      code += '    @Column(unique = true)\n';
    }
    if (field.type === 'String') {
      if (field.minLength) {
        code += `    @Size(min = ${field.minLength}`;
        if (field.maxLength) {
          code += `, max = ${field.maxLength}`;
        }
        code += ')\n';
      } else if (field.maxLength) {
        code += `    @Size(max = ${field.maxLength})\n`;
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

function generateRepositoryCode() {
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

function generateServiceCode() {
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

function generateServiceImplCode() {
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

function generateControllerCode() {
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

function generateDtoCode() {
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

// Générer les fichiers Java
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fichier généré: ${filePath}`);
}

// Générer l'entité
writeFile(path.join(entityDir, `${config.entityName}.java`), generateEntityCode());

// Générer le repository si demandé
if (config.generateRepository) {
  writeFile(path.join(repositoryDir, `${config.entityName}Repository.java`), generateRepositoryCode());
}

// Générer le service si demandé
if (config.generateService) {
  writeFile(path.join(serviceDir, `${config.entityName}Service.java`), generateServiceCode());
  writeFile(path.join(serviceDir, `${config.entityName}ServiceImpl.java`), generateServiceImplCode());
}

// Générer le controller si demandé
if (config.generateController) {
  writeFile(path.join(controllerDir, `${config.entityName}Controller.java`), generateControllerCode());
}

// Générer le DTO si demandé
if (config.generateDto) {
  writeFile(path.join(dtoDir, `${config.entityName}DTO.java`), generateDtoCode());
}

console.log('\n✨ GÉNÉRATION TERMINÉE AVEC SUCCÈS ✨');
console.log(`Entité ${config.entityName} générée dans le package ${entityPackage}`);
