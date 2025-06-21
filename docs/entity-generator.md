# Documentation complète du générateur d'entités

Ce guide explique comment utiliser le générateur d'entités de Spring-Fullstack-Speed pour créer et gérer des entités JPA dans votre application Spring Boot.

## Table des matières

- [Introduction](#introduction)
- [Utilisation basique](#utilisation-basique)
- [Définition des champs](#définition-des-champs)
  - [Types de données supportés](#types-de-données-supportés)
  - [Validations disponibles](#validations-disponibles)
- [Relations entre entités](#relations-entre-entités)
  - [One-to-One](#one-to-one)
  - [One-to-Many](#one-to-many)
  - [Many-to-Many](#many-to-many)
- [Options avancées](#options-avancées)
- [Exemples pratiques](#exemples-pratiques)
- [Bonnes pratiques](#bonnes-pratiques)

## Introduction

Le générateur d'entités vous permet de créer rapidement des classes d'entités JPA pour votre application Spring Boot. Ces entités représentent les tables de votre base de données et constituent la couche de persistance de votre application.

## Utilisation basique

Vous pouvez générer une entité en utilisant la commande suivante :

```bash
sfs --entity --name=Product
```

Ou en mode interactif :

```bash
sfs entity
```

Le générateur vous guidera à travers une série de questions pour définir votre entité :
- Nom de l'entité
- Package de l'entité
- Champs de l'entité avec leurs types et validations
- Relations avec d'autres entités

## Définition des champs

Chaque entité peut avoir plusieurs champs qui représentent les colonnes de la table dans la base de données.

Format de définition des champs :
```
nomDuChamp:typeDeChamp[:validation1][:validation2]...
```

Exemple en ligne de commande :
```bash
sfs --entity --name=Product --fields=name:String:required,price:Double:required:min:0,description:String
```

### Types de données supportés

| Type Java | Description | Equivalent SQL |
|-----------|-------------|--------------|
| String | Chaîne de caractères | VARCHAR |
| Integer | Entier | INT |
| Long | Entier 64-bits | BIGINT |
| Float | Nombre à virgule flottante | FLOAT |
| Double | Nombre à virgule flottante double précision | DOUBLE |
| BigDecimal | Nombre décimal précis | DECIMAL |
| Boolean | Valeur booléenne | BOOLEAN |
| LocalDate | Date (sans heure) | DATE |
| LocalDateTime | Date et heure | TIMESTAMP |
| ZonedDateTime | Date et heure avec fuseau horaire | TIMESTAMP WITH TIMEZONE |
| Instant | Point dans le temps (UTC) | TIMESTAMP |
| UUID | Identifiant unique universel | VARCHAR/UUID |
| byte[] | Tableau d'octets pour données binaires | BLOB |

### Validations disponibles

| Validation | Description | Exemple |
|------------|-------------|---------|
| required | Champ obligatoire | name:String:required |
| min:X | Valeur minimale (pour les nombres) | price:Double:min:0 |
| max:X | Valeur maximale (pour les nombres) | age:Integer:max:120 |
| minlength:X | Longueur minimale (pour les chaînes) | name:String:minlength:3 |
| maxlength:X | Longueur maximale (pour les chaînes) | description:String:maxlength:500 |
| pattern:X | Expression régulière (pour les chaînes) | code:String:pattern:[A-Z]{5} |
| unique | Valeur unique dans la base de données | email:String:unique |
| email | Format email valide | email:String:email |
| positive | Valeur positive uniquement | quantity:Integer:positive |
| negative | Valeur négative uniquement | temperature:Float:negative |
| future | Date dans le futur | expiryDate:LocalDate:future |
| past | Date dans le passé | birthDate:LocalDate:past |

## Relations entre entités

Le générateur prend en charge toutes les relations JPA standard entre les entités.

### One-to-One

```bash
sfs --entity --name=User --fields=username:String:required --relationships=oneToOne:Profile
```

Cette commande crée une relation unidirectionnelle One-to-One entre User et Profile.

Pour une relation bidirectionnelle :

```bash
sfs --entity --name=User --fields=username:String:required --relationships=oneToOne:Profile:bidirectional
```

### One-to-Many

```bash
sfs --entity --name=Author --fields=name:String:required --relationships=oneToMany:Book
```

Cette commande crée une relation One-to-Many entre Author et Book.

### Many-to-Many

```bash
sfs --entity --name=Student --fields=name:String:required --relationships=manyToMany:Course
```

Cette commande crée une relation Many-to-Many entre Student et Course.

## Options avancées

Le générateur d'entités offre plusieurs options avancées :

| Option | Description | Exemple |
|--------|-------------|---------|
| --table-name | Nom personnalisé pour la table | --table-name=tbl_products |
| --id-type | Type de la clé primaire | --id-type=UUID |
| --audited | Activer les champs d'audit (createdAt, updatedAt) | --audited=true |
| --lombok | Utiliser les annotations Lombok | --lombok=true |
| --dto | Générer automatiquement un DTO | --dto=true |
| --repository | Générer automatiquement un repository | --repository=true |

## Exemples pratiques

### Exemple 1: Entité simple

```bash
sfs --entity --name=Product --fields=name:String:required:minlength:3,price:Double:required:min:0,description:String:maxlength:1000,active:Boolean
```

Cette commande génère une entité Product avec quatre champs et leurs validations.

### Exemple 2: Entité avec relations

```bash
sfs --entity --name=Order --fields=orderNumber:String:required:unique,orderDate:LocalDateTime:required --relationships=oneToMany:OrderItem,manyToOne:Customer
```

Cette commande génère une entité Order avec des relations vers OrderItem et Customer.

### Exemple 3: Entité complète avec options avancées

```bash
sfs --entity --name=Employee --fields=firstName:String:required,lastName:String:required,email:String:email:unique,salary:BigDecimal,hireDate:LocalDate:required --relationships=manyToOne:Department,oneToOne:Address:bidirectional --table-name=tbl_employees --audited=true --lombok=true --dto=true --repository=true
```

## Bonnes pratiques

1. **Nommage** : Utilisez des noms en PascalCase pour les entités (ex: `Product`) et en camelCase pour les champs (ex: `productName`).

2. **Relations** : Définissez clairement les propriétaires des relations bidirectionnelles pour éviter les problèmes de performance.

3. **Validations** : Ajoutez des validations appropriées pour chaque champ pour garantir l'intégrité des données.

4. **Optimisation** : Évitez les relations Many-to-Many complexes si possible, et utilisez des relations unidirectionnelles quand c'est suffisant.

5. **Indexation** : Pensez à indexer les champs fréquemment utilisés dans les requêtes (généralement les champs avec validation `unique`).

6. **Lazy Loading** : Configurez le chargement paresseux (lazy loading) pour les relations qui ne sont pas toujours nécessaires.
