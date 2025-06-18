# Guide des DTOs

Ce guide explique comment générer et utiliser des DTOs (Data Transfer Objects) avec Spring-Fullstack-Speed (SFS).

## Qu'est-ce qu'un DTO ?

Les DTOs (Data Transfer Objects) sont des objets utilisés pour transférer des données entre les couches de votre application. Ils permettent de :
- Contrôler les données exposées par votre API
- Séparer les modèles de données de la couche présentation
- Optimiser les transferts de données

## Types de DTOs supportés

SFS peut générer plusieurs types de DTOs pour chaque entité :

- **Create DTO** : Pour les opérations de création (POST)
- **Update DTO** : Pour les opérations de mise à jour (PUT/PATCH)
- **Response DTO** : Pour les réponses renvoyées par l'API
- **List DTO** : Pour les listes d'objets (souvent avec moins de champs)
- **Search DTO** : Pour les critères de recherche

## Générer des DTOs

Pour générer des DTOs pour une entité existante, utilisez la commande :

```bash
sfs dtos
```

Vous serez guidé par une série de questions :

1. **Nom de l'entité** : L'entité pour laquelle générer les DTOs
2. **Package** : Le package où placer les DTOs (par défaut `dto`)
3. **Types de DTOs** : Sélectionnez les types de DTOs à générer
4. **Validation** : Ajout de validations aux DTOs
5. **Mapper** : Génération d'un mapper entre l'entité et les DTOs

## Structure des DTOs générés

Le générateur crée des classes Java avec des noms clairs :

```
com.example.dto/
├── ProductCreateDto.java   # DTO pour la création
├── ProductUpdateDto.java   # DTO pour la mise à jour
├── ProductResponseDto.java # DTO pour les réponses
├── ProductListDto.java     # DTO pour les listes
└── ProductMapper.java      # Mapper (si demandé)
```

## Exemple de DTO généré

```java
package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductCreateDto {
    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String name;
    
    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;
    
    @NotNull(message = "Le prix est obligatoire")
    private BigDecimal price;
    
    private Integer quantity;
}
```

## Mappers

Les mappers générés utilisent [MapStruct](https://mapstruct.org/) pour faciliter la conversion entre entités et DTOs :

```java
package com.example.dto;

import com.example.domain.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductResponseDto toResponseDto(Product entity);
    
    @Mapping(target = "id", ignore = true)
    Product toEntity(ProductCreateDto dto);
    
    @Mapping(target = "id", ignore = true)
    void updateEntityFromDto(ProductUpdateDto dto, @MappingTarget Product entity);
    
    ProductListDto toListDto(Product entity);
}
```

## Intégration avec les controllers

Les DTOs s'intègrent naturellement dans vos controllers REST :

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    private final ProductMapper productMapper;
    
    @PostMapping
    public ResponseEntity<ProductResponseDto> create(@Valid @RequestBody ProductCreateDto dto) {
        Product product = productMapper.toEntity(dto);
        Product saved = productService.save(product);
        return ResponseEntity.ok(productMapper.toResponseDto(saved));
    }
}
```

## Validation des DTOs

Les DTOs générés incluent des annotations de validation Jakarta Bean Validation qui sont automatiquement validées lorsque vous utilisez l'annotation `@Valid` dans vos controllers.

## Prochaines étapes

- [Implémentez des opérations CRUD](./crud.md) qui utilisent vos DTOs
- [Créez un module fonctionnel](./modules.md) complet
