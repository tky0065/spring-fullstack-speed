# Guide complet sur les DTOs avec Spring-Fullstack-Speed

Ce guide explique comment générer et utiliser les DTOs (Data Transfer Objects) dans les applications créées avec Spring-Fullstack-Speed.

## Table des matières

- [Introduction aux DTOs](#introduction-aux-dtos)
- [Pourquoi utiliser des DTOs](#pourquoi-utiliser-des-dtos)
- [Génération de DTOs](#génération-de-dtos)
- [Types de mappers](#types-de-mappers)
- [Personnalisation des DTOs](#personnalisation-des-dtos)
- [DTOs spécialisés](#dtos-spécialisés)
- [Validation des DTOs](#validation-des-dtos)
- [Utilisation dans les contrôleurs](#utilisation-dans-les-contrôleurs)
- [Bonnes pratiques](#bonnes-pratiques)
- [Exemples complets](#exemples-complets)

## Introduction aux DTOs

Un DTO (Data Transfer Object) est un patron de conception utilisé pour transférer des données entre différentes couches d'une application, particulièrement entre le serveur et le client dans les API REST. Les DTOs permettent de:

- Séparer les modèles de persistance (entités) des modèles d'API
- Contrôler précisément quelles données sont exposées
- Adapter la structure des données aux besoins spécifiques des clients
- Éviter des problèmes comme la sérialisation circulaire ou l'exposition de données sensibles

Dans Spring-Fullstack-Speed, les DTOs sont générés automatiquement à partir des entités existantes, avec des options de personnalisation.

## Pourquoi utiliser des DTOs

### Avantages des DTOs

1. **Sécurité** : Ne pas exposer directement les entités permet de contrôler quelles données sont accessibles.
2. **Performance** : Transférer uniquement les données nécessaires réduit la charge réseau.
3. **Découplage** : Les changements dans le modèle de persistance n'affectent pas directement l'API.
4. **Transformation** : Les DTOs peuvent présenter les données dans un format plus adapté aux besoins du client.
5. **Validation** : Les règles de validation peuvent être spécifiques à chaque cas d'utilisation.

### Inconvénients des DTOs

1. **Code supplémentaire** : Nécessite de maintenir des classes supplémentaires et des mappeurs.
2. **Complexité** : Ajoute une couche d'indirection dans votre application.

Spring-Fullstack-Speed résout ces inconvénients en générant automatiquement le code nécessaire.

## Génération de DTOs

Pour générer des DTOs pour une entité existante, utilisez la commande suivante :

```bash
sfs --dtos --entity=Product
```

En mode interactif :

```bash
sfs dtos
```

### Options disponibles

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--entity` | Nom de l'entité pour générer les DTOs | - | `--entity=Product` |
| `--mapper-type` | Type de mapper | mapstruct | `--mapper-type=manual` |
| `--include-validation` | Inclure les validations | true | `--include-validation=true` |
| `--dto-suffix` | Suffixe pour les DTOs | DTO | `--dto-suffix=Response` |
| `--create-update` | Générer DTOs spécifiques pour création/mise à jour | false | `--create-update=true` |

Exemple complet :
```bash
sfs --dtos --entity=Product --mapper-type=mapstruct --include-validation=true --create-update=true
```

## Types de mappers

Spring-Fullstack-Speed prend en charge deux types de mappers pour la conversion entre entités et DTOs :

### MapStruct

MapStruct est un générateur de code qui simplifie considérablement l'implémentation des mappeurs. Il génère du code Java à la compilation, ce qui le rend très performant.

Exemple de générateur avec MapStruct :
```bash
sfs --dtos --entity=Product --mapper-type=mapstruct
```

Le code généré ressemblera à :

```java
@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductDTO toDTO(Product product);
    
    Product toEntity(ProductDTO productDTO);
    
    List<ProductDTO> toDTOList(List<Product> products);
}
```

### Manuel

Si vous préférez une approche plus explicite ou si vous avez des besoins de mapping complexes, vous pouvez choisir de générer un mappeur manuel :

```bash
sfs --dtos --entity=Product --mapper-type=manual
```

Le code généré ressemblera à :

```java
@Component
public class ProductMapper {
    
    public ProductDTO toDTO(Product product) {
        if (product == null) {
            return null;
        }
        
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setPrice(product.getPrice());
        dto.setDescription(product.getDescription());
        // Autres mappings...
        
        return dto;
    }
    
    public Product toEntity(ProductDTO dto) {
        // Code de mapping...
    }
    
    public List<ProductDTO> toDTOList(List<Product> products) {
        // Code de mapping...
    }
}
```

## Personnalisation des DTOs

Après la génération, vous pouvez personnaliser les DTOs selon vos besoins :

### Ajouter des champs calculés

```java
@Getter
@Setter
public class ProductDTO {
    private Long id;
    private String name;
    private Double price;
    private String description;
    
    // Champ calculé
    public Double getPriceWithTax() {
        return price * 1.2; // Prix avec 20% de taxe
    }
}
```

### Ajouter des annotations spécifiques

```java
@Getter
@Setter
public class ProductDTO {
    private Long id;
    
    @JsonProperty("product_name")
    private String name;
    
    @JsonFormat(pattern = "###,##0.00 €")
    private Double price;
    
    @JsonProperty("product_description")
    private String description;
}
```

## DTOs spécialisés

Spring-Fullstack-Speed peut générer des DTOs spécialisés pour différents cas d'utilisation :

### DTOs de création et mise à jour

```bash
sfs --dtos --entity=Product --create-update=true
```

Cette commande génère :
- `ProductDTO` : DTO standard
- `CreateProductDTO` : DTO pour la création (sans ID)
- `UpdateProductDTO` : DTO pour la mise à jour

Exemple de code généré :

```java
@Getter
@Setter
public class CreateProductDTO {
    @NotBlank
    private String name;
    
    @NotNull @Min(0)
    private Double price;
    
    private String description;
}

@Getter
@Setter
public class UpdateProductDTO {
    @NotBlank
    private String name;
    
    @NotNull @Min(0)
    private Double price;
    
    private String description;
}
```

### DTOs avec projections

Vous pouvez également créer des DTOs qui ne contiennent qu'un sous-ensemble des champs :

```java
@Getter
@Setter
public class ProductSummaryDTO {
    private Long id;
    private String name;
    private Double price;
    // Description omise intentionnellement
}
```

## Validation des DTOs

Les DTOs générés incluent automatiquement les annotations de validation basées sur les contraintes définies dans l'entité source :

```java
@Getter
@Setter
public class ProductDTO {
    private Long id;
    
    @NotBlank
    @Size(min = 3, max = 100)
    private String name;
    
    @NotNull
    @Min(0)
    private Double price;
    
    @Size(max = 500)
    private String description;
}
```

## Utilisation dans les contrôleurs

Voici comment utiliser les DTOs dans les contrôleurs REST générés :

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    private final ProductService productService;
    private final ProductMapper productMapper;
    
    public ProductController(ProductService productService, ProductMapper productMapper) {
        this.productService = productService;
        this.productMapper = productMapper;
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
        Product product = productService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return ResponseEntity.ok(productMapper.toDTO(product));
    }
    
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody CreateProductDTO createProductDTO) {
        Product product = productMapper.toEntity(createProductDTO);
        Product savedProduct = productService.save(product);
        return ResponseEntity.created(URI.create("/api/products/" + savedProduct.getId()))
                .body(productMapper.toDTO(savedProduct));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, 
                                                   @Valid @RequestBody UpdateProductDTO updateProductDTO) {
        // Code de mise à jour...
    }
    
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<Product> products = productService.findAll();
        return ResponseEntity.ok(productMapper.toDTOList(products));
    }
}
```

## Bonnes pratiques

1. **Nommez clairement vos DTOs** : Utilisez des noms qui reflètent leur usage (`ProductResponseDTO`, `CreateProductRequest`, etc.).

2. **Ne mélangez pas les responsabilités** : Gardez vos DTOs simples et concentrés sur un seul objectif.

3. **Validez au niveau du DTO** : Les validations doivent être appliquées sur les DTOs, pas sur les entités directement dans le controller.

4. **Créez des DTOs spécialisés** : Pour les grandes entités, créez des DTOs spécifiques à chaque cas d'utilisation pour améliorer les performances.

5. **Utilisez des projections** : Pour les requêtes en lecture seule qui ne nécessitent qu'un sous-ensemble de données.

6. **Documentez vos DTOs** : Ajoutez des annotations Swagger/OpenAPI pour documenter clairement votre API.

## Exemples complets

### Exemple 1 : Génération standard avec MapStruct

```bash
sfs --dtos --entity=Customer --mapper-type=mapstruct
```

### Exemple 2 : DTOs spécialisés pour création et mise à jour

```bash
sfs --dtos --entity=Order --create-update=true --include-validation=true
```

### Exemple 3 : DTO avec suffixe personnalisé

```bash
sfs --dtos --entity=User --dto-suffix=Response --mapper-type=manual
```

### Exemple 4 : DTO pour entité avec relations

```bash
sfs --entity --name=Department --fields=name:String:required --relationships=oneToMany:Employee
sfs --dtos --entity=Department
```

Le DTO généré gérera correctement la relation avec les employés.
