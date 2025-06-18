# Guide des entités

Ce guide explique comment créer et gérer des entités avec Spring-Fullstack-Speed (SFS).

## Qu'est-ce qu'une entité ?

Dans le contexte de Spring Boot et JPA, une entité représente une table dans votre base de données. Chaque instance d'une entité correspond à un enregistrement dans cette table.

## Générer une nouvelle entité

Pour générer une nouvelle entité, utilisez la commande :

```bash
sfs entity
```

Vous serez guidé par une série de questions interactives pour configurer votre entité :

1. **Nom de l'entité** : Doit commencer par une majuscule (ex: `User`, `Product`)
2. **Package** : Package Java où l'entité sera générée (ex: `com.example.domain`)
3. **Génération du repository** : Spring Data repository pour l'entité
4. **Génération du service** : Couche service pour la logique métier
5. **Génération du controller** : Controller REST pour exposer les opérations

## Structure d'une entité générée

Une entité générée comprendra les éléments suivants :

1. **Classe d'entité** : La classe Java avec les annotations JPA
2. **Repository** : Interface Spring Data pour l'accès aux données
3. **Service** : Classe contenant la logique métier (si demandée)
4. **Controller REST** : Points d'entrée API (si demandé)

## Exemple d'entité générée

```java
package com.example.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
```

## Personnalisation des entités

Après génération, vous pouvez modifier l'entité pour :

- Ajouter des champs supplémentaires
- Configurer des relations (OneToMany, ManyToOne, etc.)
- Ajouter des validations
- Personnaliser les méthodes JPA lifecycle

## Fonctionnalités avancées

- **Validation** : Les entités générées incluent des annotations de validation Bean Validation
- **Auditing** : Options pour ajouter des champs d'audit (createdBy, createdDate, etc.)
- **Soft Delete** : Support pour la suppression logique

## Prochaines étapes

- [Générez des DTOs](./dtos.md) pour votre entité
- [Implémentez des opérations CRUD](./crud.md)
- [Créez un module fonctionnel](./modules.md) qui utilise votre entité
