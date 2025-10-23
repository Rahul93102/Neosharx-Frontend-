// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initStickyNavbar();
    initAnimatedCounters();
    initEventCarousels();
    initEventSectionCarousels();
    initContactForm();
    initScrollAnimations();
    initMobileMenu();
});

// Sticky Navbar
function initStickyNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Animated Counters
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.7,
        rootMargin: '0px 0px -100px 0px'
    };

    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000; // 2 seconds
    const stepTime = duration / 100;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Format number with appropriate suffix
        let displayValue = Math.floor(current);
        if (target >= 1000) {
            displayValue = Math.floor(current / 1000) + 'k+';
        } else {
            displayValue = Math.floor(current) + '+';
        }
        
        element.textContent = displayValue;
    }, stepTime);
}

// Event Carousels
function initEventCarousels() {
    const carousels = document.querySelectorAll('.event-carousel');
    
    carousels.forEach((carousel, index) => {
        const cards = carousel.querySelectorAll('.event-card');
        const dots = carousel.parentElement.querySelectorAll('.dot');
        let currentSlide = 0;

        // Hide all cards except first
        cards.forEach((card, cardIndex) => {
            if (cardIndex !== 0) {
                card.style.display = 'none';
            }
        });

        // Add click handlers to dots
        dots.forEach((dot, dotIndex) => {
            dot.addEventListener('click', () => {
                showSlide(dotIndex);
            });
        });

        function showSlide(slideIndex) {
            // Hide current slide
            cards[currentSlide].style.display = 'none';
            dots[currentSlide].classList.remove('active');

            // Show new slide
            currentSlide = slideIndex;
            cards[currentSlide].style.display = 'block';
            dots[currentSlide].classList.add('active');
        }

        // Auto-advance slides every 5 seconds
        setInterval(() => {
            const nextSlide = (currentSlide + 1) % cards.length;
            showSlide(nextSlide);
        }, 5000);
    });
}

// Event Section Carousel Navigation
function initEventSectionCarousels() {
    const eventSections = document.querySelectorAll('.scroll-container');
    
    eventSections.forEach((scrollContainer) => {
        const leftButton = scrollContainer.parentElement.querySelector('button:has(.material-symbols-outlined:contains("chevron_left"))');
        const rightButton = scrollContainer.parentElement.querySelector('button:has(.material-symbols-outlined:contains("chevron_right"))');
        
        if (leftButton && rightButton) {
            leftButton.addEventListener('click', () => {
                scrollContainer.scrollBy({
                    left: -300,
                    behavior: 'smooth'
                });
            });
            
            rightButton.addEventListener('click', () => {
                scrollContainer.scrollBy({
                    left: 300,
                    behavior: 'smooth'
                });
            });
        }
    });
    
    // Alternative approach using more specific selectors
    const chevronButtons = document.querySelectorAll('button .material-symbols-outlined');
    chevronButtons.forEach(icon => {
        const button = icon.parentElement;
        const isLeftChevron = icon.textContent.trim() === 'chevron_left';
        const isRightChevron = icon.textContent.trim() === 'chevron_right';
        
        if (isLeftChevron || isRightChevron) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const eventSection = button.closest('.bg-stone-50, .bg-stone-100');
                const scrollContainer = eventSection?.querySelector('.scroll-container');
                
                if (scrollContainer) {
                    const scrollAmount = 300;
                    scrollContainer.scrollBy({
                        left: isLeftChevron ? -scrollAmount : scrollAmount,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Basic validation
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Simulate form submission
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            showNotification('Message sent successfully!', 'success');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
    });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Scroll Animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.stat-item, .partner-logo, .event-card, .rectangular-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(element);
    });
}

// Mobile Menu
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinkItems = navLinks.querySelectorAll('a');
        navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Newsletter subscription
document.querySelector('.newsletter button').addEventListener('click', function() {
    const emailInput = document.querySelector('.newsletter input');
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate API call
    showNotification('Welcome to NeoSharX! Thank you for subscribing!', 'success');
    emailInput.value = '';
});

// Add loading animation for images
function initImageLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

// Initialize image loading
initImageLoading();

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add hover effects for trapezoid cards
document.querySelectorAll('.rectangular-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add click handlers for CTA buttons
document.querySelectorAll('.cta-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Simulate joining community
        showNotification('Welcome to the NeoSharX Community!', 'success');
    });
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(function() {
    // Any scroll-based animations or calculations can go here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close mobile menu if open
        const navLinks = document.querySelector('.nav-links');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
    }
});

// Add focus management for accessibility
document.querySelectorAll('a, button, input, textarea').forEach(element => {
    element.addEventListener('focus', function() {
        this.style.outline = '2px solid #2563eb';
        this.style.outlineOffset = '2px';
    });
    
    element.addEventListener('blur', function() {
        this.style.outline = 'none';
    });
});

// Play button functionality for hero section
document.addEventListener('DOMContentLoaded', function() {
    // Add play button functionality
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            showNotification('Welcome to NeoSharX! Episode starting...', 'success');
            // Add your video/episode logic here
        });
    }
});

console.log('NeoSharX homepage loaded successfully! 🚀');