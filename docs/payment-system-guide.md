# Guide du Système de Paiement (version 1.0.2)

## Introduction

Le système de paiement de Spring-Fullstack-Speed fournit une solution complète pour intégrer différentes passerelles de paiement dans votre application. Cette documentation explique comment utiliser les fonctionnalités du système de paiement, y compris la gestion des remboursements et la génération de rapports financiers.

## Nouveautés de la version 1.0.2

La version 1.0.2 apporte plusieurs améliorations importantes au système de paiement :

- **Sécurité renforcée** : Support complet pour l'authentification 3D Secure 2.0 et conformité PSD2
- **Support international** : Prise en charge de plus de 135 devises et méthodes de paiement locales
- **Paiement mobile** : Intégration native d'Apple Pay et Google Pay
- **API améliorée** : Interface plus intuitive et documentation enrichie
- **Performance optimisée** : Traitement de paiement plus rapide et robuste
- **Webhooks avancés** : Gestion d'événements plus flexibles et configuration simplifiée

## Architecture

Le système de paiement est organisé en plusieurs composants :

- **Entités** : Modèles de données pour les paiements, méthodes de paiement, transactions, factures, etc.
- **Repositories** : Interfaces pour la persistance des données
- **Services** : Logique métier pour les paiements et les intégrations avec les fournisseurs
- **Contrôleurs** : API REST pour interagir avec le système
- **DTOs** : Objets de transfert de données pour les API
- **Configurations** : Paramètres des fournisseurs de paiement

## Fournisseurs de Paiement Supportés

Le système prend en charge les fournisseurs suivants :

- **Stripe** : Intégration complète avec l'API Stripe pour les paiements par carte et autres méthodes
- **PayPal** : Support des paiements via PayPal et PayPal Express Checkout
- **Braintree** : Support pour des fonctionnalités de paiement avancées
- **Adyen** (nouveau en 1.0.2) : Intégration pour les paiements internationaux
- **Mollie** (nouveau en 1.0.2) : Solution de paiement européenne populaire

## Fonctionnalités

### Paiements

Le système gère plusieurs types de paiements :

- Paiements uniques
- Paiements récurrents (abonnements)
- Paiements différés
- Paiements par lots
- Paiements mobiles (Apple Pay, Google Pay) - *nouveau en 1.0.2*
- Paiements par QR code - *nouveau en 1.0.2*

```java
// Exemple de création d'un paiement
PaymentRequestDTO request = new PaymentRequestDTO();
request.setAmount(new BigDecimal("99.99"));
request.setCurrency("EUR");
request.setDescription("Abonnement Premium");
request.setPaymentMethodId("pm_card_visa");

PaymentResponseDTO response = paymentService.processPayment(request);
```

### Factures

Le système permet de générer et gérer des factures liées aux paiements :

- Création de factures
- Envoi automatique par email
- Suivi des factures (payées, en attente, annulées)
- Historique des factures
- Factures multilingues - *nouveau en 1.0.2*
- Modèles de factures personnalisables - *nouveau en 1.0.2*

```java
// Exemple de génération d'une facture
InvoiceDTO invoice = invoiceService.generateInvoice(payment.getId());
invoiceService.sendInvoiceByEmail(invoice.getId(), customer.getEmail());
```

### Abonnements

Gestion complète des abonnements pour les paiements récurrents :

- Création et gestion des plans d'abonnement
- Cycle de facturation (mensuel, annuel, personnalisé)
- Notifications de renouvellement
- Gestion des upgrades/downgrades
- Annulations et pauses d'abonnements
- Essais gratuits avec conversion automatique - *nouveau en 1.0.2*
- Tarification dynamique - *nouveau en 1.0.2*

```java
// Exemple de création d'un abonnement
SubscriptionRequestDTO request = new SubscriptionRequestDTO();
request.setPlanId("plan_premium_monthly");
request.setCustomerId("cust_12345");
request.setPaymentMethodId("pm_card_visa");
request.setTrialDays(14); // Période d'essai de 14 jours

SubscriptionResponseDTO subscription = subscriptionService.createSubscription(request);
```

### Remboursements

Le système offre des fonctionnalités complètes pour les remboursements :

- Remboursements complets
- Remboursements partiels
- Justifications des remboursements
- Suivi des remboursements
- Remboursements programmés - *nouveau en 1.0.2*
- Politiques de remboursement configurables - *nouveau en 1.0.2*

```java
// Exemple de remboursement complet
RefundDTO refund = refundService.refundPayment(paymentId);

// Exemple de remboursement partiel
RefundDTO partialRefund = refundService.partialRefund(
    paymentId, 
    new BigDecimal("30.00"), 
    "Remboursement partiel suite à un problème de livraison"
);
```

### Rapports Financiers

Le système peut générer plusieurs types de rapports financiers :

- Rapports de revenus (journaliers, mensuels, annuels)
- Rapports de transactions
- Rapports clients
- Exports en PDF et Excel
- Tableaux de bord interactifs - *nouveau en 1.0.2*
- Prévisions de revenus - *nouveau en 1.0.2*
- Analyse par segment client - *nouveau en 1.0.2*

```java
// Exemple de génération d'un rapport de revenus
RevenueReportDTO report = reportingService.generateRevenueReport(
    LocalDate.now().minusDays(30),
    LocalDate.now(),
    ReportInterval.DAILY
);

// Exporter en PDF
reportingService.exportReportToPdf(report, "revenue_report.pdf");
```

## Configuration

### Configuration de base

Pour activer le système de paiement, vous devez ajouter la dépendance suivante à votre projet :

```xml
<!-- Pour Maven -->
<dependency>
    <groupId>com.sfs</groupId>
    <artifactId>sfs-payment</artifactId>
    <version>1.0.2</version>
</dependency>
```

```groovy
// Pour Gradle
implementation 'com.sfs:sfs-payment:1.0.2'
```

### Configuration de Stripe

```yaml
# application.yml
sfs:
  payment:
    provider: stripe
    stripe:
      api-key: ${STRIPE_API_KEY}
      webhook-secret: ${STRIPE_WEBHOOK_SECRET}
      currency: EUR
      statement-descriptor: Votre Descripteur
```

### Configuration de PayPal

```yaml
# application.yml
sfs:
  payment:
    provider: paypal
    paypal:
      client-id: ${PAYPAL_CLIENT_ID}
      client-secret: ${PAYPAL_CLIENT_SECRET}
      mode: sandbox # ou 'live' pour production
      currency: EUR
```

## Sécurité

Le module de paiement 1.0.2 inclut plusieurs mesures de sécurité avancées :

- **Tokenisation complète** : Les données de paiement ne sont jamais stockées directement dans votre base de données
- **Conformité PCI-DSS** : Support pour maintenir la conformité PCI-DSS de votre application
- **Protection contre la fraude** : Détection de fraudes intégrée avec règles configurables
- **Journalisation sécurisée** : Masquage automatique des informations sensibles dans les logs
- **Alertes de sécurité** : Notifications en cas d'activités suspectes

## Utilisation avancée

### Intégration avec les webhooks

Le système inclut des handlers automatiques pour les événements des fournisseurs de paiement :

```java
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final WebhookService webhookService;
    
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        
        webhookService.processStripeWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
```

### Gestion des taxes

Configuration des règles de taxation pour différentes juridictions :

```java
taxConfigService.addTaxRule(TaxRuleDTO.builder()
    .country("FR")
    .rate(new BigDecimal("20.00")) // TVA française
    .name("TVA")
    .build());

taxConfigService.addTaxRule(TaxRuleDTO.builder()
    .country("US")
    .state("CA")
    .rate(new BigDecimal("8.25")) // Taxe de Californie
    .name("Sales Tax")
    .build());
```

## Bonnes pratiques

- Utilisez toujours les environnements de test (sandbox) lors du développement
- Ne stockez jamais les clés API dans le code source
- Implémentez une gestion d'erreur robuste pour les appels API
- Mettez en place un système de notification pour les paiements échoués
- Utilisez des timeouts appropriés pour les appels API externes
- Testez exhaustivement les scénarios de remboursement et d'annulation

## Résolution des problèmes courants

| Problème | Cause possible | Solution |
|----------|----------------|----------|
| Paiement refusé | Carte invalide ou insuffisante | Vérifiez les informations de la carte et le solde disponible |
| Webhook non reçu | Configuration incorrecte | Vérifiez l'URL et la signature du webhook |
| Erreur d'API | Clés incorrectes | Vérifiez vos clés API et leur environnement (test/prod) |
| Problème de devise | Devise non supportée | Assurez-vous que la devise est supportée par le fournisseur |
| Échec de facturation | Configuration email incorrecte | Vérifiez les paramètres SMTP et les modèles email |

## Ressources additionnelles

- [Documentation API Stripe](https://stripe.com/docs/api)
- [Documentation API PayPal](https://developer.paypal.com/docs/api/overview/)
- [Guide complet des webhooks](https://docs.example.com/webhooks)
- [Tutoriel vidéo d'intégration](https://www.youtube.com/watch?v=example)
- [Centre de support Spring-Fullstack-Speed](https://support.sfs.example.com)
