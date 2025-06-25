# Documentation du générateur de paiement (version 1.0.2)

Ce document décrit en détail le générateur de paiement de Spring-Fullstack-Speed et comment l'utiliser pour ajouter rapidement un système de paiement complet à votre application.

## Vue d'ensemble

Le générateur de paiement (`sfs payment`) vous permet d'intégrer facilement des fonctionnalités de paiement avancées dans votre application Spring Boot. Il supporte plusieurs fournisseurs de paiement tels que Stripe et PayPal, ainsi que des fonctionnalités comme les abonnements, la facturation et les remboursements.

## Nouveautés de la version 1.0.2

- **Support pour Adyen et Mollie** : Intégration de deux nouveaux fournisseurs de paiement
- **Paiements mobiles** : Génération automatique du code pour Apple Pay et Google Pay
- **Factures multilingues** : Support pour les factures en plusieurs langues
- **Tableaux de bord financiers** : Génération de dashboards interactifs pour le suivi des revenus
- **Sécurité renforcée** : Conformité 3D Secure 2.0 et PSD2
- **Générateur de tests** : Création automatique de tests pour les différents scénarios de paiement

## Fonctionnalités principales

- **Multi-fournisseurs** : Intégration avec Stripe, PayPal, Braintree, Adyen et Mollie
- **Abonnements** : Gestion complète des abonnements récurrents
- **Webhooks** : Configuration automatique des endpoints pour traiter les événements des fournisseurs de paiement
- **Facturation** : Génération et gestion de factures
- **Taxes** : Configuration et calcul automatique des taxes
- **Remboursements** : Traitement des remboursements totaux ou partiels
- **Rapports** : Génération de rapports financiers détaillés (revenus, transactions, clients)

## Prérequis

- Une application Spring Boot générée avec `sfs app`
- Java 11 ou supérieur
- Maven ou Gradle

## Utilisation

### Commande de base

```bash
sfs payment [options]
```

### Options disponibles

| Option | Description | Valeur par défaut | Exemple |
|--------|-------------|-------------------|---------|
| `--provider` | Providers de paiement à intégrer | `stripe` | `--provider=stripe,paypal` |
| `--subscription` | Intégrer le support des abonnements | `false` | `--subscription=true` |
| `--webhook` | Configurer les webhooks pour les événements | `true` | `--webhook=false` |
| `--invoicing` | Ajouter le système de facturation | `false` | `--invoicing=true` |
| `--taxes` | Configurer la gestion des taxes | `false` | `--taxes=true` |
| `--refunds` | Implémenter la gestion des remboursements | `false` | `--refunds=true` |
| `--reporting` | Générer des rapports financiers | `false` | `--reporting=true` |
| `--mobile-pay` | Activer le paiement mobile (Apple Pay, Google Pay) | `false` | `--mobile-pay=true` |
| `--international` | Activer le support des devises internationales | `false` | `--international=true` |
| `--fraud-detection` | Ajouter la détection de fraude | `false` | `--fraud-detection=true` |
| `--package-name` | Nom du package pour le système de paiement | `[base].payment` | `--package-name=com.example.payment` |
| `--skip-install` | Ignorer l'installation des dépendances | `false` | `--skip-install=true` |
| `--lombok` | Utiliser Lombok pour réduire le code boilerplate | `true` | `--lombok=false` |
| `--generate-tests` | Générer des tests automatiques | `true` | `--generate-tests=false` |

### Exemples d'utilisation

#### Intégration basique avec Stripe

```bash
sfs payment --provider=stripe
```

Cette commande va générer une intégration basique avec Stripe, incluant les paiements simples et la configuration nécessaire.

#### Système de paiement complet avec abonnements et facturation

```bash
sfs payment --provider=stripe,paypal --subscription=true --invoicing=true --taxes=true
```

Cette commande va générer un système de paiement complet avec support pour Stripe et PayPal, incluant la gestion des abonnements, la facturation et les taxes.

#### Système avec remboursements et rapports financiers

```bash
sfs payment --provider=stripe --refunds=true --reporting=true
```

Cette commande génère un système de paiement Stripe avec une gestion avancée des remboursements et un module de rapports financiers.

#### Système de paiement international avec paiement mobile

```bash
sfs payment --provider=stripe,adyen --international=true --mobile-pay=true
```

Cette commande crée un système de paiement avec support pour les devises internationales et les méthodes de paiement mobile.

## Structure générée

Le générateur crée la structure de fichiers suivante :

```
src/main/java/com/example/payment/
├── config/
│   ├── PaymentConfig.java
│   ├── StripeConfig.java (si Stripe est sélectionné)
│   ├── PayPalConfig.java (si PayPal est sélectionné)
│   ├── AdyenConfig.java (si Adyen est sélectionné)
│   └── SecurityConfig.java
├── controllers/
│   ├── PaymentController.java
│   ├── WebhookController.java
│   ├── RefundController.java (si refunds=true)
│   ├── InvoiceController.java (si invoicing=true)
│   └── SubscriptionController.java (si subscription=true)
├── dtos/
│   ├── PaymentDTO.java
│   ├── PaymentRequestDTO.java
│   ├── PaymentResponseDTO.java
│   ├── RefundDTO.java (si refunds=true)
│   ├── SubscriptionDTO.java (si subscription=true)
│   └── InvoiceDTO.java (si invoicing=true)
├── entities/
│   ├── Payment.java
│   ├── Transaction.java
│   ├── Customer.java
│   ├── PaymentMethod.java
│   ├── Refund.java (si refunds=true)
│   ├── Invoice.java (si invoicing=true)
│   └── Subscription.java (si subscription=true)
├── repositories/
│   ├── PaymentRepository.java
│   ├── TransactionRepository.java
│   ├── CustomerRepository.java
│   ├── RefundRepository.java (si refunds=true)
│   └── InvoiceRepository.java (si invoicing=true)
├── services/
│   ├── PaymentService.java
│   ├── StripeService.java (si Stripe est sélectionné)
│   ├── PayPalService.java (si PayPal est sélectionné)
│   ├── WebhookService.java (si webhook=true)
│   ├── RefundService.java (si refunds=true)
│   ├── InvoiceService.java (si invoicing=true)
│   ├── SubscriptionService.java (si subscription=true)
│   ├── ReportingService.java (si reporting=true)
│   └── TaxService.java (si taxes=true)
├── exceptions/
│   ├── PaymentException.java
│   ├── WebhookException.java
│   └── RefundException.java
├── utils/
│   ├── PaymentUtils.java
│   ├── CurrencyConverter.java (si international=true)
│   └── SecurityUtils.java
└── events/
    ├── PaymentEvent.java
    ├── PaymentEventListener.java
    └── PaymentEventPublisher.java
```

## Tests générés

Si l'option `--generate-tests=true` est activée (valeur par défaut), le générateur crée également les tests suivants :

```
src/test/java/com/example/payment/
├── controllers/
│   ├── PaymentControllerTest.java
│   ├── WebhookControllerTest.java
│   └── RefundControllerTest.java (si refunds=true)
├── services/
│   ├── PaymentServiceTest.java
│   ├── StripeServiceTest.java (si Stripe est sélectionné)
│   ├── PayPalServiceTest.java (si PayPal est sélectionné)
│   └── RefundServiceTest.java (si refunds=true)
└── integration/
    ├── PaymentIntegrationTest.java
    └── WebhookIntegrationTest.java
```

## Configuration générée

Le générateur ajoute également les configurations nécessaires dans les fichiers de propriétés de l'application :

### application.yml

```yaml
# Configuration du système de paiement
sfs:
  payment:
    provider: stripe # ou la valeur spécifiée avec --provider
    default-currency: EUR
    webhook:
      enabled: true # ou la valeur spécifiée avec --webhook
    security:
      encryption-enabled: true
    reporting:
      enabled: false # ou la valeur spécifiée avec --reporting
    
# Configuration spécifique à Stripe (si Stripe est sélectionné)
    stripe:
      api-key: ${STRIPE_API_KEY}
      webhook-secret: ${STRIPE_WEBHOOK_SECRET}

# Configuration spécifique à PayPal (si PayPal est sélectionné)
    paypal:
      client-id: ${PAYPAL_CLIENT_ID}
      client-secret: ${PAYPAL_CLIENT_SECRET}
      mode: sandbox
```

## Dépendances ajoutées

Le générateur ajoute automatiquement les dépendances nécessaires dans votre fichier de build (Maven ou Gradle).

### Pour Maven (pom.xml)

```xml
<!-- Dépendances du système de paiement -->
<dependency>
    <groupId>com.sfs</groupId>
    <artifactId>sfs-payment-core</artifactId>
    <version>1.0.2</version>
</dependency>

<!-- Dépendance Stripe (si Stripe est sélectionné) -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>22.5.0</version>
</dependency>

<!-- Dépendance PayPal (si PayPal est sélectionné) -->
<dependency>
    <groupId>com.paypal.sdk</groupId>
    <artifactId>rest-api-sdk</artifactId>
    <version>1.14.0</version>
</dependency>

<!-- Dépendance Lombok (si lombok=true) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.26</version>
    <scope>provided</scope>
</dependency>
```

### Pour Gradle (build.gradle)

```groovy
// Dépendances du système de paiement
implementation 'com.sfs:sfs-payment-core:1.0.2'

// Dépendance Stripe (si Stripe est sélectionné)
implementation 'com.stripe:stripe-java:22.5.0'

// Dépendance PayPal (si PayPal est sélectionné)
implementation 'com.paypal.sdk:rest-api-sdk:1.14.0'

// Dépendance Lombok (si lombok=true)
compileOnly 'org.projectlombok:lombok:1.18.26'
annotationProcessor 'org.projectlombok:lombok:1.18.26'
```

## Considérations de sécurité

Le générateur de paiement s'assure que votre système respecte les meilleures pratiques de sécurité :

1. **Variables d'environnement** : Toutes les clés API sont configurées pour être lues à partir de variables d'environnement.
2. **Tokenisation** : Les données de carte ne sont jamais stockées directement dans votre base de données.
3. **Validation** : Des validations strictes sont appliquées à toutes les entrées utilisateur.
4. **HTTPS** : Le système est configuré pour exiger HTTPS en production.
5. **PCI-DSS** : La configuration respecte les directives PCI-DSS pour la manipulation des données de paiement.

## Personnalisation avancée

Pour personnaliser davantage votre système de paiement après sa génération, vous pouvez modifier les fichiers suivants :

- `PaymentConfig.java` : Pour changer la configuration globale du système
- `StripeService.java`/`PayPalService.java` : Pour personnaliser la logique d'intégration avec les fournisseurs
- `application.yml` : Pour ajuster les paramètres de configuration

## Bonnes pratiques

1. **Environnements** : Utilisez toujours l'environnement de test (sandbox) des fournisseurs pendant le développement.
2. **Tests** : Ajoutez des tests supplémentaires pour les scénarios spécifiques à votre business.
3. **Monitoring** : Configurez des alertes pour surveiller les taux d'échec de paiement.
4. **Backup** : Assurez-vous que vos données de paiement sont correctement sauvegardées.
5. **Audit** : Gardez une trace d'audit de toutes les transactions pour la conformité réglementaire.

## Support et ressources

- [Documentation complète du système de paiement](payment-system-guide.md)
- [FAQ sur les paiements](https://docs.sfs.example.com/faq#payments)
- [Guide de dépannage](https://docs.sfs.example.com/troubleshooting#payments)
- [Exemples de code](https://github.com/tky0065/spring-fullstack-speed/examples/payment)

Pour toute question ou problème, veuillez consulter notre [forum de support](https://forum.sfs.example.com) ou ouvrir un ticket sur notre [repository GitHub](https://github.com/tky0065/spring-fullstack-speed/issues).
