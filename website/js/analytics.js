// Configuration Google Analytics
document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour charger Google Analytics
  function loadGoogleAnalytics() {
    // Création des balises script pour Google Analytics
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Remplacer G-XXXXXXXXXX par votre ID GA réel
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX'); // Remplacer G-XXXXXXXXXX par votre ID GA réel
  }

  // Fonction pour demander le consentement de l'utilisateur
  function setupConsentBanner() {
    // Vérification si le consentement a déjà été donné
    if (localStorage.getItem('analytics-consent') === 'accepted') {
      loadGoogleAnalytics();
      return;
    }

    // Création de la bannière de consentement
    var banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <div class="consent-content">
        <p>Nous utilisons des cookies analytiques pour améliorer notre site. Acceptez-vous l'utilisation de ces cookies?</p>
        <div class="consent-buttons">
          <button class="btn-accept">Accepter</button>
          <button class="btn-decline">Refuser</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Gestion des événements pour les boutons
    document.querySelector('.btn-accept').addEventListener('click', function() {
      localStorage.setItem('analytics-consent', 'accepted');
      loadGoogleAnalytics();
      banner.style.display = 'none';
    });

    document.querySelector('.btn-decline').addEventListener('click', function() {
      localStorage.setItem('analytics-consent', 'declined');
      banner.style.display = 'none';
    });
  }

  // Configuration du suivi des événements
  function setupEventTracking() {
    // Ne configurer le tracking que si l'utilisateur a accepté
    if (localStorage.getItem('analytics-consent') !== 'accepted') {
      return;
    }

    // Tracking des clics sur les liens de navigation
    document.querySelectorAll('nav a').forEach(function(link) {
      link.addEventListener('click', function() {
        gtag('event', 'navigation_click', {
          'event_category': 'Navigation',
          'event_label': this.textContent,
          'value': 1
        });
      });
    });

    // Tracking des clics sur les boutons d'appel à l'action
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(function(button) {
      button.addEventListener('click', function() {
        gtag('event', 'cta_click', {
          'event_category': 'Engagement',
          'event_label': this.textContent,
          'value': 1
        });
      });
    });

    // Tracking des copies de commandes
    document.querySelectorAll('.copy-btn').forEach(function(button) {
      button.addEventListener('click', function() {
        const commandElement = this.closest('.code-block').querySelector('code');
        if (commandElement) {
          gtag('event', 'copy_command', {
            'event_category': 'Interaction',
            'event_label': commandElement.textContent.trim(),
            'value': 1
          });
        }
      });
    });

    // Tracking du temps passé sur la page
    let startTime = Date.now();
    window.addEventListener('beforeunload', function() {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      gtag('event', 'time_on_page', {
        'event_category': 'Engagement',
        'event_label': window.location.pathname,
        'value': timeSpent
      });
    });
  }

  // Initialisation
  setupConsentBanner();
  setupEventTracking();
});

