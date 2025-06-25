# Documentation du générateur de paiement

Ce document décrit en détail le générateur de paiement de Spring-Fullstack-Speed et comment l'utiliser pour ajouter rapidement un système de paiement complet à votre application.

## Vue d'ensemble

Le générateur de paiement (`sfs payment`) vous permet d'intégrer facilement des fonctionnalités de paiement avancées dans votre application Spring Boot. Il supporte plusieurs fournisseurs de paiement tels que Stripe et PayPal, ainsi que des fonctionnalités comme les abonnements, la facturation et les remboursements.

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
| `--package-name` | Nom du package pour le système de paiement | `[base].payment` | `--package-name=com.example.payment` |
| `--skip-install` | Ignorer l'installation des dépendances | `false` | `--skip-install=true` |
| `--lombok` | Utiliser Lombok pour réduire le code boilerplate | `true` | `--lombok=false` |

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

## Structure générée

Le générateur crée la structure de fichiers suivante :

```
src/main/java/com/example/payment/
├── config/
│   ├── PaymentConfig.java
│   └── StripeConfig.java (si Stripe est sélectionné)
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
│   └── ...
├── entities/
│   ├── Payment.java
│   ├── Transaction.java
│   ├── Customer.java
│   ├── Refund.java (si refunds=true)
│   └── ...
├── repositories/
│   ├── PaymentRepository.java
│   ├── TransactionRepository.java
│   ├── RefundRepository.java (si refunds=true)
│   └── ...
└── services/
    ├── PaymentService.java
    ├── StripePaymentService.java (si Stripe est sélectionné)
    ├── RefundService.java (si refunds=true)
    └── ...
```

Si l'option `--reporting=true` est sélectionnée, le générateur crée également :

```
src/main/java/com/example/payment/
├── reports/
│   ├── ReportController.java
│   ├── ReportService.java
│   ├── ReportServiceImpl.java
│   ├── ExcelReportGenerator.java
│   ├── PdfReportGenerator.java
│   ├── CustomerReport.java
│   ├── RevenueReport.java
│   └── TransactionReport.java
```

## Endpoints REST générés

Le générateur crée les endpoints REST suivants :

| Méthode | URL | Description | Option requise |
|---------|-----|-------------|---------------|
| POST | `/api/payments` | Créer un nouveau paiement | (toujours inclus) |
| GET | `/api/payments/{id}` | Obtenir les détails d'un paiement | (toujours inclus) |
| POST | `/api/webhooks/{provider}` | Traiter les événements webhooks | `--webhook=true` |
| POST | `/api/subscriptions` | Créer un abonnement | `--subscription=true` |
| GET | `/api/invoices` | Lister les factures | `--invoicing=true` |
| POST | `/api/refunds/payment/{paymentId}` | Rembourser intégralement un paiement | `--refunds=true` |
| POST | `/api/refunds/payment/{paymentId}/partial` | Effectuer un remboursement partiel | `--refunds=true` |
| GET | `/api/reports/revenue` | Générer un rapport de revenus | `--reporting=true` |
| GET | `/api/reports/customers` | Générer un rapport clients | `--reporting=true` |
| GET | `/api/reports/transactions` | Générer un rapport de transactions | `--reporting=true` |

## Configuration des fournisseurs de paiement

### Stripe

Le générateur ajoute les propriétés suivantes à votre fichier `application.properties` :

```properties
payment.stripe.api-key=${STRIPE_API_KEY}
payment.stripe.webhook-secret=${STRIPE_WEBHOOK_SECRET}
payment.stripe.public-key=${STRIPE_PUBLIC_KEY}
payment.stripe.success-url=${STRIPE_SUCCESS_URL:http://localhost:8080/payment/success}
payment.stripe.cancel-url=${STRIPE_CANCEL_URL:http://localhost:8080/payment/cancel}
```

### PayPal

Si PayPal est sélectionné, le générateur ajoute :

```properties
payment.paypal.client-id=${PAYPAL_CLIENT_ID}
payment.paypal.client-secret=${PAYPAL_CLIENT_SECRET}
payment.paypal.mode=${PAYPAL_MODE:sandbox}
```

## Modules de rapports financiers

Lorsque l'option `--reporting=true` est activée, le générateur crée un module complet de rapports financiers qui permet de :

1. **Générer des rapports de revenus** : Analyse des revenus sur une période donnée avec regroupement par jour, semaine, mois ou année
2. **Générer des rapports de transactions** : Liste détaillée des transactions avec possibilité de filtrer par statut
3. **Générer des rapports clients** : Analyse de l'acquisition et de la rétention des clients, ainsi que le revenu moyen par client
4. **Exporter les rapports** : Export des rapports au format PDF et Excel pour les partager facilement

Les rapports financiers sont accessibles via des APIs REST dédiées :

```
GET /api/reports/revenue?startDate=2023-01-01&endDate=2023-12-31&groupBy=month
GET /api/reports/transactions?startDate=2023-01-01&endDate=2023-12-31&status=COMPLETED
GET /api/reports/customers?startDate=2023-01-01&endDate=2023-12-31
GET /api/reports/{id}/export?format=pdf
```

## Module de remboursements

Lorsque l'option `--refunds=true` est activée, le générateur crée un module de gestion des remboursements qui permet de :

1. **Effectuer des remboursements complets** : Remboursement de la totalité d'un paiement
2. **Effectuer des remboursements partiels** : Remboursement d'une partie du montant avec justification
3. **Consulter l'historique des remboursements** : Liste de tous les remboursements effectués
4. **Annuler des remboursements** : Possibilité d'annuler un remboursement (si le fournisseur le permet)

Les remboursements sont accessibles via des APIs REST dédiées :

```
POST /api/refunds/payment/{paymentId}
POST /api/refunds/payment/{paymentId}/partial
GET /api/refunds
GET /api/refunds/{id}
POST /api/refunds/{id}/cancel
```

## Tests générés

Le générateur crée également des tests unitaires et d'intégration pour le système de paiement :

```
src/test/java/com/example/payment/
├── controllers/
│   ├── PaymentControllerTest.java
│   ├── RefundControllerTest.java (si refunds=true)
│   └── ...
├── services/
│   ├── PaymentServiceTest.java
│   ├── RefundServiceTest.java (si refunds=true)
│   └── ...
└── repositories/
    ├── PaymentRepositoryTest.java
    ├── RefundRepositoryTest.java (si refunds=true)
    └── ...
```

## Extension du système généré

Le code généré est conçu pour être facilement extensible. Par exemple, pour ajouter un nouveau fournisseur de paiement :

1. Créez une classe qui implémente l'interface `PaymentService`
2. Ajoutez la configuration nécessaire
3. Enregistrez le service dans le conteneur Spring

```java
@Service
public class NewPaymentProvider implements PaymentService {
    // Implémentation des méthodes
}
```

De même, vous pouvez étendre les fonctionnalités de rapports en créant de nouvelles classes de rapport et en implémentant les méthodes de génération correspondantes.

## Bonnes pratiques

1. Utilisez des variables d'environnement pour les clés API et autres secrets
2. Testez toujours avec des comptes sandbox/test avant de passer en production
3. Implémentez une journalisation appropriée pour les transactions de paiement
4. Configurez correctement les webhooks pour recevoir les événements en temps réel
5. Mettez en place des alertes pour les transactions échouées ou suspectes

## Ressources supplémentaires

Pour plus d'informations, consultez :

- [Guide du Système de Paiement](payment-system-guide.md) - Guide détaillé sur l'utilisation du système de paiement
- [Documentation API Stripe](https://stripe.com/docs/api)
- [Documentation API PayPal](https://developer.paypal.com/docs/api/overview/)

## Conclusion

Le générateur de paiement de Spring-Fullstack-Speed vous permet d'intégrer rapidement un système de paiement complet et robuste dans votre application. Avec ses multiples options, vous pouvez personnaliser le système selon vos besoins spécifiques, qu'il s'agisse d'une simple intégration de paiement ou d'un système complet avec abonnements, facturation, remboursements et rapports financiers.
