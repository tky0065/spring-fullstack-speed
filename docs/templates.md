# Documentation des Templates Spring-Fullstack-Speed

Ce document explique la structure et l'utilisation des templates dans Spring-Fullstack-Speed (SFS), ainsi que les bonnes pratiques pour les modifier ou en créer de nouveaux.

## Structure des templates

Les templates sont organisés par générateur, suivant cette structure :

```
generators/
├── app/
│   └── templates/
│       ├── backend/
│       │   ├── src/
│       │   └── pom.xml.ejs
│       └── frontend/
│           ├── react/
│           ├── angular/
│           └── vue/
├── entity/
│   └── templates/
│       └── Entity.java.ejs
├── crud/
│   └── templates/
│       ├── Controller.java.ejs
│       ├── Service.java.ejs
│       └── Repository.java.ejs
...
```

## Système de templating EJS

SFS utilise EJS (Embedded JavaScript) comme moteur de template. Voici les concepts de base :

### Syntaxe EJS

- `<%= variable %>` : Affiche la valeur de la variable (échappée)
- `<%- variable %>` : Affiche la valeur de la variable (non échappée)
- `<% code %>` : Exécute du code JavaScript
- `<%_ code _%>` : Exécute du code JavaScript avec suppression des espaces

### Exemple de template EJS

```ejs
package <%= packageName %>;

import javax.persistence.*;
import lombok.Data;

/**
 * Generated <%= entityName %> entity
 */
@Entity
@Table(name = "<%= tableName %>")
@Data
public class <%= entityName %> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    <% fields.forEach(function(field) { %>
    <%_ if (field.required) { _%>
    @NotNull
    <%_ } _%>
    @Column(name = "<%= field.columnName %>")
    private <%= field.type %> <%= field.name %>;
    
    <% }); %>
}
```

## Variables de contexte communes

### Variables globales (disponibles dans tous les templates)

- `appName` : Nom de l'application
- `packageName` : Nom du package Java
- `packagePath` : Chemin des packages (`com/example/app`)
- `baseName` : Nom de base pour les composants
- `databaseType` : Type de base de données (`mysql`, `postgresql`, etc.)
- `frontendFramework` : Framework frontend (`react`, `angular`, `vue`, etc.)
- `authType` : Type d'authentification (`jwt`, `oauth2`, etc.)
- `features` : Fonctionnalités activées (`["websocket", "elasticsearch", ...]`)

### Variables spécifiques à Entity

- `entityName` : Nom de l'entité
- `entityVarName` : Nom de variable de l'entité (camelCase)
- `tableName` : Nom de la table en base de données
- `fields` : Liste des champs de l'entité
- `relationships` : Liste des relations de l'entité
- `dto` : Si les DTOs sont générés pour cette entité
- `service` : Si un service est généré pour cette entité
- `pagination` : Type de pagination (`"pagination"`, `"infinite-scroll"`, `"none"`)

### Variables spécifiques à CRUD

- `entityName` : Nom de l'entité
- `entityVarName` : Nom de variable de l'entité
- `controllerPath` : Chemin de l'API REST
- `hasDTO` : Si l'entité a un DTO
- `dtoName` : Nom du DTO
- `serviceType` : Type de service (`"serviceImpl"` ou `"serviceClass"`)

## Conditionnement de code

Les templates utilisent du conditionnement pour adapter le code généré selon les options :

```ejs
<% if (databaseType === 'postgresql') { %>
@Column(columnDefinition = "text")
<% } else if (databaseType === 'mysql') { %>
@Column(columnDefinition = "longtext")
<% } else { %>
@Column
<% } %>
```

## Système d'indentation et de formatage

- Utilisez `_%>` et `<%_` pour contrôler les espaces
- Gardez une indentation cohérente dans les templates
- Les générateurs appliquent un formatage automatique après la génération

## Extension des templates

### Surcharge de templates existants

Pour surcharger un template existant, créez un fichier avec le même nom dans un répertoire spécifique :

```
~/.sfs/templates/entity/Entity.java.ejs
```

### Création de nouveaux templates

1. Créez votre template EJS
2. Enregistrez-le dans l'arborescence appropriée
3. Référencez-le dans le code du générateur :

```typescript
this.renderTemplate(
  this.templatePath('customTemplate.ejs'),
  this.destinationPath('chemin/de/destination/fichier.ext'),
  this.context
);
```

## Templates par module

### App Generator

Les templates principaux pour générer l'application :
- `pom.xml.ejs` : Configuration Maven
- `Application.java.ejs` : Classe principale Spring Boot
- `application.yml.ejs` : Configuration Spring Boot

### Entity Generator

- `Entity.java.ejs` : Classe d'entité JPA
- `Repository.java.ejs` : Interface repository Spring Data

### CRUD Generator

- `Service.java.ejs` : Classe de service
- `ServiceImpl.java.ejs` : Implémentation du service
- `Controller.java.ejs` : Contrôleur REST
- `ResourceIT.java.ejs` : Tests d'intégration

### DTO Generator

- `EntityDTO.java.ejs` : DTO pour l'entité
- `EntityMapper.java.ejs` : Classe de mapping entre entité et DTO

### Frontend Templates

Ces templates sont spécifiques au framework choisi :

#### React
- `entityComponent.tsx.ejs` 
- `entityService.ts.ejs`
- `entitySlice.ts.ejs` (pour Redux)

#### Angular
- `entity.component.ts.ejs`
- `entity.service.ts.ejs`
- `entity.model.ts.ejs`

#### Vue
- `EntityComponent.vue.ejs`
- `entityService.js.ejs`
- `entityStore.js.ejs`

### Docker et Kubernetes

- `Dockerfile.ejs` : Configuration Docker
- `docker-compose.yml.ejs` : Composition Docker
- `deployment.yaml.ejs` : Déploiement Kubernetes
- `service.yaml.ejs` : Service Kubernetes

## Bonnes pratiques

1. **Minimalisme** : Les templates doivent être aussi simples que possible
2. **Commentaires** : Ajoutez des commentaires pour expliquer le code généré
3. **Cohérence** : Maintenez un style cohérent à travers les templates
4. **Tests** : Testez vos templates avec différentes configurations
5. **Conditionnement** : Utilisez le conditionnement plutôt que de dupliquer les templates
6. **Modularité** : Divisez les grands templates en parties réutilisables

## Helpers et fonctions utilitaires

Des fonctions d'aide sont disponibles dans les templates :

```ejs
<%- include('_common/header.ejs', { packageName: packageName }) %>
<%= capitalize(entityName) %>
<%= camelCase(entityName) %>
<%= kebabCase(entityName) %>
<%= pluralize(entityName) %>
```

## Conseils de débogage

Pour déboguer des problèmes de template :
1. Examinez le contexte passé au template
2. Utilisez des `console.log` temporaires dans les templates
3. Vérifiez les fichiers générés pour des problèmes évidents
4. Utilisez le mode verbose du générateur pour plus d'informations

## Migration et mise à jour des templates

Lors de la mise à jour des templates :
1. Créez une branche séparée
2. Testez avec plusieurs configurations
3. Vérifiez les régressions potentielles
4. Documentez les changements importants

## Ressources additionnelles

- [Documentation EJS officielle](https://ejs.co/#docs)
- [Yeoman Template Context](https://yeoman.io/authoring/file-system.html)
- [Spring Boot Best Practices](https://spring.io/guides/gs/spring-boot/)
