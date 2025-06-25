// Navigation mobile
function showMenu() {
    document.getElementById("navLinks").style.right = "0";
}

function hideMenu() {
    document.getElementById("navLinks").style.right = "-200px";
}

// Fonction pour copier le texte dans le presse-papier
function copyToClipboard(text) {
    // Créer un élément textarea temporaire
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);

    // Sélectionner et copier le texte
    textarea.select();
    document.execCommand('copy');

    // Supprimer l'élément textarea
    document.body.removeChild(textarea);

    // Afficher une notification
    showNotification("Code copié !");
}

// Fonction pour afficher une notification temporaire
function showNotification(message) {
    // Créer l'élément de notification s'il n'existe pas déjà
    let notification = document.getElementById('copy-notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'copy-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'var(--primary-color)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(notification);
    }

    // Mettre à jour le message et afficher la notification
    notification.textContent = message;
    notification.style.opacity = '1';

    // Cacher la notification après 2 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
}

// Défilement fluide pour les liens d'ancrage
document.addEventListener('DOMContentLoaded', () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Ajouter une petite animation aux cartes des fonctionnalités
    const featureCards = document.querySelectorAll('.feature-card');

    if (featureCards.length > 0) {
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px)';
                this.style.boxShadow = 'var(--shadow-hover)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow)';
            });
        });
    }

    // Initialiser le slider des témoignages
    initTestimonialsSlider();
});

// Fonction pour initialiser le slider des témoignages
function initTestimonialsSlider() {
    const slider = document.querySelector('.testimonials-slider');

    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Le multiplicateur détermine la vitesse de défilement
        slider.scrollLeft = scrollLeft - walk;
    });

    // Auto-scroll pour mobile
    let scrollInterval;
    const testimonials = document.querySelectorAll('.testimonial');
    let currentIndex = 0;

    function startAutoScroll() {
        if (window.innerWidth < 768 && testimonials.length > 1) {
            scrollInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % testimonials.length;
                testimonials[currentIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'start'
                });
            }, 5000); // Changer toutes les 5 secondes
        }
    }

    function stopAutoScroll() {
        clearInterval(scrollInterval);
    }

    // Démarrer l'auto-scroll sur mobile
    startAutoScroll();

    // Arrêter l'auto-scroll lorsque l'utilisateur interagit avec le slider
    slider.addEventListener('touchstart', stopAutoScroll);
    slider.addEventListener('mousedown', stopAutoScroll);

    // Redémarrer l'auto-scroll après un certain temps d'inactivité
    slider.addEventListener('touchend', () => {
        setTimeout(startAutoScroll, 10000); // Redémarrer après 10 secondes d'inactivité
    });

    slider.addEventListener('mouseup', () => {
        setTimeout(startAutoScroll, 10000);
    });
}

// Fonction pour vérifier si un élément est visible à l'écran
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Animation au défilement
document.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        if (isElementInViewport(section) && !section.classList.contains('animated')) {
            section.classList.add('animated');
            section.style.animation = 'fadeIn 1s ease forwards';
        }
    });
});
