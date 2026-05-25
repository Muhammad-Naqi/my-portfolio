/**
 * Muhammad Naqi — Portfolio Interactions
 * GPU-accelerated 3D effects, parallax, particles, scroll reveals
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = () => window.innerWidth <= 768;
  const TILT_MAX = 15;

  /* ─── Init Lucide icons ─── */
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    init();
  });

  function init() {
    initNav();
    initTyping();
    initHeroParallax();
    initHeroName3D();
    initParticles();
    initTiltCards();
    initStatCardsTilt();
    initScrollReveal();
    initTimeline();
    initContactForm();
    initResumeBtn();
  }

  /* ─── Navigation ─── */
  function initNav() {
    const nav = document.getElementById('nav');
    const navLinks = document.getElementById('navLinks');
    const toggle = document.getElementById('navToggle');
    const links = document.querySelectorAll('.nav__link[data-section]');
    const sections = ['hero', 'about', 'skills', 'experience', 'projects', 'contact'];

    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
      updateActiveNav();
    }, { passive: true });

    function updateActiveNav() {
      const scrollPos = window.scrollY + nav.offsetHeight + 80;
      let current = 'hero';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) current = id;
      }
      links.forEach((link) => {
        link.classList.toggle('nav__link--active', link.dataset.section === current);
      });
    }
    updateActiveNav();

    links.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    toggle?.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      const icon = toggle.querySelector('[data-lucide]');
      if (icon) icon.setAttribute('data-lucide', open ? 'x' : 'menu');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  /* ─── Typing effect ─── */
  function initTyping() {
    const el = document.getElementById('typingText');
    if (!el || prefersReducedMotion) return;

    const roles = ['Backend Developer', 'API Architect', 'Systems Builder', 'NestJS Expert'];
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = roles[roleIndex];
      if (!deleting) {
        el.textContent = current.slice(0, ++charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 2200);
          return;
        }
      } else {
        el.textContent = current.slice(0, --charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(tick, deleting ? 45 : 85);
    }
    setTimeout(tick, 1200);
  }

  /* ─── Hero parallax layers ─── */
  function initHeroParallax() {
    const hero = document.getElementById('hero');
    const layers = document.querySelectorAll('#heroParallax [data-depth], .hero__content[data-depth]');
    if (!hero || prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x;
      targetY = y;
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });

    function animate() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth) || 0.05;
        const moveX = currentX * depth * 400;
        const moveY = currentY * depth * 400;
        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ─── Hero name 3D depth (parallax shadows) ─── */
  function initHeroName3D() {
    const hero = document.getElementById('hero');
    const nameText = document.getElementById('heroNameText');
    if (!hero || !nameText || prefersReducedMotion) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const dx = Math.round(x * 8);
      const dy = Math.round(y * 8);

      nameText.style.transform = `translate3d(${x * 6}px, ${y * 4}px, 0) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      nameText.style.textShadow = `
        ${1 + dx}px ${1 + dy}px 0 rgba(0, 255, 159, 0.45),
        ${2 + dx}px ${2 + dy}px 0 rgba(0, 255, 159, 0.3),
        ${3 + dx * 1.2}px ${3 + dy * 1.2}px 0 rgba(88, 166, 255, 0.25),
        ${5 + dx * 1.5}px ${5 + dy * 1.5}px 0 rgba(88, 166, 255, 0.12)
      `;
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      nameText.style.transform = '';
      nameText.style.textShadow = '';
    });
  }

  /* ─── Floating particles (canvas) ─── */
  function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    const hero = document.getElementById('hero');
    if (!canvas || !hero || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let w = 0;
    let h = 0;
    let animId;

    const PARTICLE_COUNT = isMobile() ? 35 : 70;

    function resize() {
      const rect = hero.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    }

    function createParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.15,
      }));
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = (e.clientY - rect.top) / rect.height;
    }, { passive: true });

    function draw() {
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const attractX = (mouseX - 0.5) * 0.15;
      const attractY = (mouseY - 0.5) * 0.15;

      for (const p of particles) {
        p.vx += attractX * 0.02;
        p.vy += attractY * 0.02;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 159, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else draw();
    });
  }

  /* ─── 3D tilt cards + glare ─── */
  function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card[data-tilt]');
    if (prefersReducedMotion) return;

    cards.forEach((card) => {
      const inner = card.querySelector('.tilt-card__inner');
      const glare = card.querySelector('.tilt-card__glare');
      if (!inner) return;

      let rafId = null;

      function reset() {
        card.classList.remove('is-tilting');
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (glare) {
          glare.style.setProperty('--glare-x', '50%');
          glare.style.setProperty('--glare-y', '50%');
        }
      }

      function onMove(e) {
        if (isTouchDevice && isMobile()) return;

        card.classList.add('is-tilting');
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width - 0.5;
        const py = y / rect.height - 0.5;

        const rotateY = px * TILT_MAX;
        const rotateX = -py * TILT_MAX;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          if (glare) {
            glare.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
            glare.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
          }
        });
      }

      card.addEventListener('mousemove', onMove, { passive: true });
      card.addEventListener('mouseleave', reset);
    });
  }

  /* ─── Stat cards subtle tilt ─── */
  function initStatCardsTilt() {
    const stats = document.querySelectorAll('.stat-card[data-tilt]');
    if (prefersReducedMotion || (isTouchDevice && isMobile())) return;

    stats.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
      }, { passive: true });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── Scroll reveal (3D flip) ─── */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-3d');
    if (!reveals.length) return;

    if (prefersReducedMotion) {
      reveals.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));

    document.querySelectorAll('.exp-card').forEach((card) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            card.classList.add('is-visible');
            obs.unobserve(card);
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(card);
    });
  }

  /* ─── Timeline line draw on scroll ─── */
  function initTimeline() {
    const timeline = document.querySelector('.timeline');
    const line = document.getElementById('timelineLine');
    if (!timeline || !line) return;

    function updateLine() {
      const rect = timeline.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.6;
      const timelineTop = rect.top;
      const timelineHeight = rect.height;

      let progress = 0;
      if (timelineTop < viewportMid) {
        progress = Math.min(1, (viewportMid - timelineTop) / timelineHeight);
      }
      line.style.height = `${progress * 100}%`;
    }

    window.addEventListener('scroll', updateLine, { passive: true });
    updateLine();
  }

  /* ─── Contact form → mailto ─── */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = encodeURIComponent(document.getElementById('name').value.trim());
      const email = encodeURIComponent(document.getElementById('email').value.trim());
      const message = encodeURIComponent(document.getElementById('message').value.trim());
      const subject = encodeURIComponent(`Portfolio contact from ${decodeURIComponent(name)}`);
      const body = encodeURIComponent(
        `Name: ${decodeURIComponent(name)}\nEmail: ${decodeURIComponent(email)}\n\n${decodeURIComponent(message)}`
      );
      window.location.href = `mailto:muhamnaqi@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* ─── Resume download placeholder ─── */
  function initResumeBtn() {
    const btn = document.getElementById('resumeBtn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Add your resume PDF as resume.pdf in the project root, then link this button to it.');
    });
  }
})();
