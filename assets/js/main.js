/* =========================================================
   HUCK PEREIRA — interações
   Sem dependências. Tudo respeita prefers-reduced-motion.
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const scrim = $('#nav-scrim');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    scrim.hidden = !open;
    // força reflow para a transição do scrim rodar ao abrir
    if (open) void scrim.offsetWidth;
    scrim.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  scrim.addEventListener('click', () => setMenu(false));

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      burger.focus();
    }
  });

  // Ao voltar para desktop, garante o menu num estado limpo
  const desktop = window.matchMedia('(min-width: 900px)');
  desktop.addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Header ao rolar + botão flutuante ---------- */
  const header = $('#site-header');
  const waFloat = $('#wa-float');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-stuck', y > 24);
    waFloat.classList.toggle('is-visible', y > window.innerHeight * 0.6);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- FAQ (accordion acessível) ---------- */
  $$('.faq__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // modo acordeão: fecha os demais
      $$('.faq__item.is-open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          $('.faq__q', other).setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('[data-reveal]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealAll = () => reveals.forEach((el) => el.classList.add('is-in'));

  if (reduced || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    reveals.forEach((el) => io.observe(el));

    // Rede de segurança: se por algum motivo o observer não disparar,
    // o conteúdo aparece mesmo assim.
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!document.querySelector('[data-reveal].is-in')) revealAll();
      }, 1200);
    });
  }

  /* ---------- Link ativo na navegação ---------- */
  const sections = $$('main section[id]');
  const navLinks = new Map(
    $$('.nav__list a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a])
  );

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = navLinks.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Ano no rodapé ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
