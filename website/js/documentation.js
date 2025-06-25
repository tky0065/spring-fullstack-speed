// Documentation page scripts
document.addEventListener('DOMContentLoaded', function() {
    // Highlight current section in sidebar based on scroll position
    const sections = document.querySelectorAll('.doc-section');
    const menuItems = document.querySelectorAll('.docs-menu a');

    function setActiveMenuItem() {
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 100)) {
                currentSection = section.getAttribute('id');
            }
        });

        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + currentSection) {
                item.classList.add('active');
            }
        });
    }

    // Set active menu item on page load
    setActiveMenuItem();

    // Update active menu item on scroll
    window.addEventListener('scroll', setActiveMenuItem);

    // Toggle FAQ items
    const faqItems = document.querySelectorAll('.faq-item h3');

    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const parent = this.parentElement;
            const answer = parent.querySelector('.answer');

            if (parent.classList.contains('active')) {
                parent.classList.remove('active');
                answer.style.maxHeight = '0px';
            } else {
                // Close all other FAQ items
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('active');
                    const itemAnswer = item.querySelector('.answer');
                    if (itemAnswer) {
                        itemAnswer.style.maxHeight = '0px';
                    }
                });

                parent.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Initialize FAQ items closed
    document.querySelectorAll('.answer').forEach(answer => {
        answer.style.maxHeight = '0px';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease';
    });

    // Smooth scroll for sidebar navigation
    menuItems.forEach(link => {
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

                // Update URL hash without scrolling
                history.pushState(null, null, targetId);

                // Set active class
                menuItems.forEach(item => item.classList.remove('active'));
                this.classList.add('active');

                // Close mobile menu if open
                if (window.innerWidth < 768) {
                    document.getElementById('navLinks').style.right = "-200px";
                }
            }
        });
    });

    // Handle hash change and initial hash
    function handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Set active class
                    menuItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('href') === hash) {
                            item.classList.add('active');
                        }
                    });
                }, 100);
            }
        }
    }

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
});

