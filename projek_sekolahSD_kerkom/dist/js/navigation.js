// navigation.js - robust nav manager (handles active state + mobile auto-close)
(function () {
  function q(sel) { return document.querySelector(sel); }
  function qs(sel) { return Array.from(document.querySelectorAll(sel)); }

  const pageMap = {
    'admin.html': 'nav-home-link',
    'guru.html': 'nav-guru',
    'kelas1.html': 'nav-kelas1',
    'kelas2.html': 'nav-kelas2',
    'kelas3.html': 'nav-kelas3',
    'kelas4.html': 'nav-kelas4',
    'kelas5.html': 'nav-kelas5',
    'kelas6.html': 'nav-kelas6',
    'pengumuman.html': 'nav-pengumuman',
    'jadwal.html': 'nav-jadwal'
  };

  function setActive() {
    const current = window.location.pathname.split('/').pop() || 'admin.html';
    // Remove existing
    qs('.nav-link, .dropdown-item').forEach(el => el.classList.remove('active'));
    // Mark main link
    const id = pageMap[current];
    if (id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('active');
        // If inside dropdown, mark parent toggle too
        const parent = el.closest('.dropdown-menu');
        if (parent) {
          const toggle = parent.previousElementSibling;
          if (toggle) toggle.classList.add('active');
        }
        // Update breadcrumb text if present
        const breadcrumb = document.getElementById('breadcrumb-current');
        if (breadcrumb) {
          const titles = {
            'admin.html': 'Dashboard','guru.html':'Data Guru','kelas1.html':'Kelas 1','kelas2.html':'Kelas 2','kelas3.html':'Kelas 3','kelas4.html':'Kelas 4','kelas5.html':'Kelas 5','kelas6.html':'Kelas 6','pengumuman.html':'Pengumuman','jadwal.html':'Jadwal'
          };
          if (titles[current]) breadcrumb.textContent = titles[current];
        }
      }
    }
  }

  function setupMobileAutoClose() {
    const collapseEl = q('.navbar-collapse');
    if (!collapseEl) return;
    collapseEl.addEventListener('click', (evt) => {
      // close only when link clicked (not when clicking on dropdown toggles or inside form)
      const anchor = evt.target.closest('a');
      if (!anchor) return;
      if (!anchor.classList.contains('dropdown-toggle')) {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl);
        if (collapseEl.classList.contains('show')) bsCollapse.hide();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setActive();
    setupMobileAutoClose();
    // react to history changes (if you use pushState elsewhere)
    window.addEventListener('popstate', setActive);
  });
})();