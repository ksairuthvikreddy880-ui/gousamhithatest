// Hamburger menu toggle function
function toggleHamburgerMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const hamburgerDropdown = document.getElementById('hamburger-dropdown');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    if (hamburgerDropdown) {
        const isActive = hamburgerDropdown.classList.contains('active');
        
        if (isActive) {
            hamburgerDropdown.classList.remove('active');
            if (hamburgerBtn) {
                hamburgerBtn.classList.remove('active');
            }
        } else {
            hamburgerDropdown.classList.add('active');
            if (hamburgerBtn) {
                hamburgerBtn.classList.add('active');
            }
        }
    }
}

// Close hamburger menu when clicking outside
document.addEventListener('click', function(event) {
    const hamburgerDropdown = document.getElementById('hamburger-dropdown');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    if (hamburgerDropdown && hamburgerBtn) {
        if (!hamburgerBtn.contains(event.target) && !hamburgerDropdown.contains(event.target)) {
            hamburgerDropdown.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        }
    }
});

// Make function globally available
window.toggleHamburgerMenu = toggleHamburgerMenu;

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const menuClose = document.querySelector('.mobile-menu-close');
    const menuLinks = document.querySelectorAll('.mobile-menu-links a');
    
    function openMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', openMenu);
        menuToggle.addEventListener('touchstart', openMenu, {passive: true});
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', closeMenu);
        menuClose.addEventListener('touchstart', closeMenu, {passive: true});
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMenu);
        mobileMenuOverlay.addEventListener('touchstart', closeMenu, {passive: true});
    }
    
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
});
