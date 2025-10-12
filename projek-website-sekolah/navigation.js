    // navigation.js - Script untuk manage navigation
    class NavigationManager {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop();
        this.init();
    }
    
    init() {
        this.setActiveNav();
        this.updateBreadcrumb();
        this.setupMobileMenu();
    }
    
    setActiveNav() {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        });
        
        // Map pages to nav IDs
        const pageMap = {
        'admin.html': 'nav-home',
        'guru.html': 'nav-guru',
        'kelas1.html': 'nav-kelas1',
        'kelas2.html': 'nav-kelas2',
        'kelas3.html': 'nav-kelas3',
        'kelas4.html': 'nav-kelas4',
        'kelas5.html': 'nav-kelas5',
        'kelas6.html': 'nav-kelas6'
        };
        
        // Add active class to current page nav
        if (pageMap[this.currentPage]) {
        const activeNav = document.getElementById(pageMap[this.currentPage]);
        if (activeNav) {
            activeNav.classList.add('active');
            
            // If it's in a dropdown, also activate parent
            const dropdownParent = activeNav.closest('.dropdown-menu');
            if (dropdownParent) {
            const dropdownToggle = dropdownParent.previousElementSibling;
            if (dropdownToggle) {
                dropdownToggle.classList.add('active');
            }
            }
        }
        }
    }
    
    updateBreadcrumb() {
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (!breadcrumbCurrent) return;
        
        const pageTitles = {
        'admin.html': 'Dashboard',
        'guru.html': 'Data Guru',
        'kelas1.html': 'Kelas 1',
        'kelas2.html': 'Kelas 2',
        'kelas3.html': 'Kelas 3',
        'kelas4.html': 'Kelas 4',
        'kelas5.html': 'Kelas 5',
        'kelas6.html': 'Kelas 6'
        };
        
        if (pageTitles[this.currentPage]) {
        breadcrumbCurrent.textContent = pageTitles[this.currentPage];
        }
    }
    
    setupMobileMenu() {
        // Auto-close mobile menu when clicking on a link
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navbarToggler = document.querySelector('.navbar-toggler');
            const navbarCollapse = document.querySelector('.navbar-collapse');
            
            if (navbarCollapse.classList.contains('show')) {
            navbarToggler.click();
            }
        });
        });
    }
    }

    // Initialize navigation when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
    });