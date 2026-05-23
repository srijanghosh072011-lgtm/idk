(function () {
  'use strict';

  // ===== Mobile nav toggle =====
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth < 1024) menu.classList.remove('is-open');
      });
    });
  }

  // ===== Reveal on scroll =====
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ===== Stat counter =====
  const stats = document.querySelectorAll('.stat .n[data-count]');
  if ('IntersectionObserver' in window && stats.length) {
    const sIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          const v = Math.floor(p * target);
          el.textContent = v.toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString() + suffix;
        }
        requestAnimationFrame(tick);
        sIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { sIO.observe(el); });
  }

  // ===== Form submission (demo handler) =====
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      setTimeout(function () {
        btn.textContent = '✓ Request received — we\'ll call you within 60 minutes';
        btn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
        form.reset();
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = orig;
          btn.style.background = '';
        }, 4500);
      }, 900);
    });
  }
})();
