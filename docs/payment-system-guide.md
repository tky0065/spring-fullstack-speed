# Guide du Système de Paiement

## Introduction

Le système de paiement de Spring-Fullstack-Speed fournit une solution complète pour intégrer différentes passerelles de paiement dans votre application. Cette documentation explique comment utiliser les fonctionnalités du système de paiement, y compris la gestion des remboursements et la génération de rapports financiers.

## Architecture

Le système de paiement est organisé en plusieurs composants :

- **Entités** : Modèles de données pour les paiements, méthodes de paiement, transactions, factures, etc.
- **Repositories** : Interfaces pour la persistence des données
- **Services** : Logique métier pour les paiements et les intégrations avec les fournisseurs
- **Contrôleurs** : API REST pour interagir avec le système
- **DTOs** : Objets de transfert de données pour les API
- **Configurations** : Paramètres des fournisseurs de paiement

## Fournisseurs de Paiement Supportés

Le système prend en charge les fournisseurs suivants :

- **Stripe** : Intégration complète avec l'API Stripe pour les paiements par carte et autres méthodes
- **PayPal** : Support des paiements via PayPal
- **Braintree** : (Optionnel) Pour des fonctionnalités de paiement avancées

## Fonctionnalités

### Paiements

Le système gère plusieurs types de paiements :

- Paiements uniques
- Paiements récurrents (abonnements)
- Paiements différés
- Paiements par lots

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

### Remboursements

Le système offre des fonctionnalités complètes pour les remboursements :

- Remboursements complets
- Remboursements partiels
- Justifications des remboursements
- Suivi des remboursements

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

```java
// Exemple de génération d'un rapport de revenus
RevenueReport report = reportService.generateRevenueReport(
    LocalDate.now().minusMonths(1),
    LocalDate.now(),
    "month"
);

// Export en PDF
String pdfPath = reportService.exportReportToPdf(report.getId());
```

## Configuration

### Stripe

Pour configurer Stripe, ajoutez les propriétés suivantes à votre fichier `application.properties` :

```properties
payment.stripe.api-key=sk_test_your_stripe_secret_key
payment.stripe.webhook-secret=whsec_your_webhook_signing_secret
payment.stripe.public-key=pk_test_your_stripe_public_key
payment.stripe.success-url=https://yourdomain.com/payment/success
payment.stripe.cancel-url=https://yourdomain.com/payment/cancel
```

### PayPal

Pour configurer PayPal, ajoutez :

```properties
payment.paypal.client-id=your_paypal_client_id
payment.paypal.client-secret=your_paypal_client_secret
payment.paypal.mode=sandbox # ou 'live' pour la production
```

## Sécurité

Le système de paiement implémente plusieurs mesures de sécurité :

- Validation des webhooks avec signatures
- Stockage sécurisé des données sensibles
- Contrôle d'accès basé sur les rôles
- Journalisation des événements de paiement

## Webhooks

Les webhooks sont utilisés pour recevoir des notifications en temps réel des fournisseurs de paiement :

- Notifications de paiement réussi
- Alertes de paiement échoué
- Événements d'abonnement
- Modifications de cartes ou méthodes de paiement

Pour configurer les webhooks, exposez un point de terminaison accessible publiquement :

```
https://votre-domaine.com/api/webhooks/stripe
```

Et enregistrez cette URL dans le tableau de bord de votre fournisseur de paiement.

## API REST

Le système expose plusieurs endpoints REST :

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/payments` | Créer un nouveau paiement |
| GET | `/api/payments/{id}` | Obtenir les détails d'un paiement |
| POST | `/api/payments/{id}/capture` | Capturer un paiement autorisé |
| GET | `/api/invoices` | Lister les factures |
| GET | `/api/subscriptions` | Lister les abonnements |
| POST | `/api/refunds/payment/{paymentId}` | Rembourser intégralement un paiement |
| POST | `/api/refunds/payment/{paymentId}/partial` | Effectuer un remboursement partiel |
| GET | `/api/reports/revenue` | Générer un rapport de revenus |

## Bonnes Pratiques

1. Utilisez toujours l'environnement de test/sandbox pour le développement
2. Implémentez la validation des données entrantes
3. Configurez les webhooks pour des mises à jour en temps réel
4. Stockez les clés API dans des variables d'environnement sécurisées
5. Effectuez des tests de bout en bout pour les flux de paiement
6. Conservez une piste d'audit pour toutes les transactions

## Dépannage

### Problèmes courants

1. **Les paiements échouent** : Vérifiez les clés API et les paramètres de test
2. **Webhooks non reçus** : Vérifiez que l'URL est accessible publiquement et correctement configurée
3. **Remboursements échoués** : Assurez-vous que le paiement est encore remboursable (période de remboursement)
4. **Rapports incorrects** : Vérifiez les filtres de date et les paramètres de regroupement

### Journalisation

Activez la journalisation détaillée pour le dépannage :

```properties
logging.level.com.example.payment=DEBUG
```

## Exemples d'utilisation

### Intégration frontend avec Stripe Elements

```javascript
// Exemple React avec Stripe Elements
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (!error) {
      // Envoyer paymentMethod.id au backend
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethodId: paymentMethod.id,
          amount: 1000, // en centimes
          currency: 'eur',
        }),
      });
      
      const result = await response.json();
      // Gérer la réponse
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Payer
      </button>
    </form>
  );
};
```

## Conclusion

Le système de paiement Spring-Fullstack-Speed fournit une solution robuste et flexible pour gérer les paiements dans votre application. En suivant cette documentation, vous pouvez intégrer rapidement diverses passerelles de paiement et offrir à vos utilisateurs une expérience de paiement fluide et sécurisée.
