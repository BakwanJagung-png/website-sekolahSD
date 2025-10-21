// efek header ketika kita nge scroll😜😜
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
});








// naigasi bawahhh

const toggle = document.getElementById('theme-toggle');
const body = document.body;

toggle.addEventListener('click', (e) => {
  const isDark = body.classList.contains('dark');
  const rect = e.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // warna yang akan dibawa lingkaran
  const newColor = isDark ? '#f9f9f9' : '#181616ff';

  // buat elemen lingkaran
  const circle = document.createElement('span');
  circle.classList.add('theme-circle');
  circle.style.setProperty('--x', `${x}px`);
  circle.style.setProperty('--y', `${y}px`);
  circle.style.setProperty('--color', newColor);
  document.body.appendChild(circle);

  // ganti tema setelah lingkaran cukup besar
  setTimeout(() => {
    body.classList.toggle('dark');
  }, 500); // ganti warna tengah animasi (bukan di awal)

  // hapus lingkaran setelah animasi selesai
  circle.addEventListener('animationend', () => {
    circle.remove();
  });

  // ubah ikon ☀️ / 🌙
  const icon = toggle.querySelector('i');
  icon.textContent = isDark ? '🌙' : '☀️' ;
  
});







const nav = document.getElementById('bottom-nav');
const icons = document.querySelectorAll('.bottom-nav a');

icons.forEach((icon, index) => {
  icon.addEventListener('mouseenter', () => {
    // reset semua ikon dulu
    icons.forEach(i => i.classList.remove('active', 'left', 'right'));

    // icon utama aktif
    icon.classList.add('active');

    // kiri & kanan ikut minggir
    if (icons[index - 1]) icons[index - 1].classList.add('left');
    if (icons[index + 1]) icons[index + 1].classList.add('right');
  });

  icon.addEventListener('mouseleave', () => {
    // saat keluar dari icon, hapus efek setelah sedikit delay biar smooth
    setTimeout(() => {
      icons.forEach(i => i.classList.remove('active', 'left', 'right'));
    }, 100);
  });
});




//jjjj
const swiper = new Swiper('.wrapper', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,
  spaceBetween : 30,

  autoplay: {
    disableoninteraction: false,
    pauseonmouseenter: true,
  },

  

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  breakpoints : {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    }
  }

  
});