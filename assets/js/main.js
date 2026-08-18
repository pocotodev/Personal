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
    // A ação fixa de WhatsApp se esconde por esta classe: com o menu
    // aberto, um botão flutuante disputaria com a navegação.
    document.body.classList.toggle('nav-open', open);
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

  // Foco preso enquanto a gaveta está aberta. O burger entra no ciclo de
  // propósito: ele continua visível sobre o painel e é por ele que se fecha
  // o menu. A gaveta fechada some da tabulação pelo visibility:hidden do
  // CSS — as duas coisas juntas evitam foco em conteúdo invisível.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || burger.getAttribute('aria-expanded') !== 'true') return;
    const ciclo = [burger, ...$$('a[href], button', nav)];
    const primeiro = ciclo[0];
    const ultimo = ciclo[ciclo.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  // Ao voltar para desktop, garante o menu num estado limpo
  const desktop = window.matchMedia('(min-width: 900px)');
  desktop.addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Cabeçalho ao rolar + ação fixa de WhatsApp ---------- */
  const header = $('#site-header');
  const waFixed = $('#wa-float');
  const heroCta = $('#hero-cta');
  let ticking = false;

  // A ação fixa entra quando o CTA do hero não está inteiro na tela.
  // O gatilho anterior era "rolou 60% da altura da janela": em telas baixas
  // ela aparecia com o botão do hero ainda à vista, e em telas altas
  // demorava a aparecer depois que ele já tinha saído.
  // "Inteiro na tela" e não "encostou na tela": no limiar de um pixel a
  // pílula piscava ao entrar e sair durante a rolagem.
  const atualizarWa = () => {
    if (!heroCta) {
      waFixed.classList.add('is-visible');
      return;
    }
    const r = heroCta.getBoundingClientRect();
    const inteiroNaTela = r.top >= 0 && r.bottom <= window.innerHeight;
    waFixed.classList.toggle('is-visible', !inteiroNaTela);
  };

  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 24);
    atualizarWa();
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  // O espaço reservado no fim da página só existe junto com a pílula, e a
  // pílula só existe com JS. Sem script, nada de faixa morta no rodapé.
  document.body.classList.add('has-wafixed');
  onScroll();

  // Reavalia depois que as fontes assentam e depois do load. A primeira
  // medida acontece com a fonte de fallback: quando a Bebas/Inter entra, o
  // texto muda de altura e o CTA pode passar a nascer abaixo da dobra — sem
  // isto a ação fixa só apareceria no primeiro gesto de rolagem, justamente
  // em quem mais precisa dela (telas baixas).
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);
  window.addEventListener('load', onScroll);

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
