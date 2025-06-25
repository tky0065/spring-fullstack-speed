// Script pour la page de support
document.addEventListener('DOMContentLoaded', function() {
    // Gestion de la FAQ en accordéon
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');

        header.addEventListener('click', function() {
            // Fermer tous les autres éléments
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.accordion-content').style.maxHeight = '0';
                }
            });

            // Basculer l'état actuel
            const isActive = item.classList.contains('active');

            if (isActive) {
                item.classList.remove('active');
                content.style.maxHeight = '0';
            } else {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    // Gestion du formulaire de support
    const supportForm = document.getElementById('supportForm');
    const formSuccess = document.getElementById('formSuccess');

    if (supportForm) {
        supportForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Collecter les données du formulaire
            const formData = new FormData(supportForm);
            const formDataObj = {};

            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });

            // Dans une implémentation réelle, vous enverriez ces données à un serveur
            console.log('Données du formulaire:', formDataObj);

            // Simuler l'envoi (dans une implémentation réelle, vous utiliseriez fetch ou axios)
            setTimeout(() => {
                // Cacher le formulaire et afficher le message de succès
                supportForm.style.display = 'none';
                formSuccess.style.display = 'block';

                // Dans une implémentation réelle, vous redirigeriez vers une page de confirmation
                // ou vous afficheriez un message de succès/erreur selon la réponse du serveur

                // Optionnel : enregistrer l'événement dans Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'form_submission', {
                        'event_category': 'Support',
                        'event_label': formDataObj.subject || 'Contact Form',
                        'value': 1
                    });
                }

                // Réinitialiser le formulaire (utile si vous le réaffichez plus tard)
                supportForm.reset();
            }, 1000);
        });
    }

    // Animation des cartes de support
    const supportCards = document.querySelectorAll('.support-card');

    supportCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Gestion des liens internes avec défilement fluide
    const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

    internalLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });

                // Mettre à jour l'URL sans rechargement
                history.pushState(null, null, targetId);
            }
        });
    });

    // Si l'URL contient déjà un ancrage au chargement de la page
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);

        if (targetElement) {
            setTimeout(() => {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });

                // Si c'est un élément d'accordéon, l'ouvrir automatiquement
                const accordionItem = targetElement.closest('.accordion-item');
                if (accordionItem) {
                    accordionItem.classList.add('active');
                    const content = accordionItem.querySelector('.accordion-content');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            }, 100);
        }
    }
});

