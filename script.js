/* ==========================================================================
   Ollo Reader - Interactive Showcase, FAQ Accordion & PT/EN Localization
   ========================================================================== */

const screenshots = [
  {
    id: 'dark-lib',
    src: 'assets/print2.png',
    titlePt: 'Ollo Reader — Biblioteca no Tema Escuro',
    titleEn: 'Ollo Reader — Dark Mode Library',
    captionPt: 'Organize seus livros com carrossel de "Continuar Lendo", progresso em tempo real, busca instantânea e pastas sincronizadas.',
    captionEn: 'Organize your books with the "Continue Reading" carousel, real-time progress, instant search, and synced folders.'
  },
  {
    id: 'reader-cols',
    src: 'assets/print5.png',
    titlePt: 'Ollo Reader — Leitura Imersiva em 2 Colunas',
    titleEn: 'Ollo Reader — Immersive 2-Column Reading',
    captionPt: 'Experiência de livro físico no Windows: layout fluido em duas colunas, sem distrações e com barra de progresso discreta.',
    captionEn: 'Physical book experience on Windows: fluid two-column layout, distraction-free with a subtle progress bar.'
  },
  {
    id: 'typography',
    src: 'assets/print4.png',
    titlePt: 'Ollo Reader — Painel de Aparência e Tipografia',
    titleEn: 'Ollo Reader — Appearance & Typography Panel',
    captionPt: 'Ajuste fontes, tamanho, altura de linha, espaçamento entre palavras/letras, margens e temas em tempo real.',
    captionEn: 'Fine-tune fonts, size, line height, word/letter spacing, margins, and themes in real time.'
  },
  {
    id: 'light-lib',
    src: 'assets/print3.png',
    titlePt: 'Ollo Reader — Biblioteca no Tema Claro',
    titleEn: 'Ollo Reader — Light Mode Library',
    captionPt: 'Prefere ler durante o dia? Alterne para o Tema Claro ou Sépia com contraste cristalino para suas capas e coleções.',
    captionEn: 'Prefer daytime reading? Switch to Light or Sepia Theme with crystal-clear contrast for your covers and collections.'
  },
  {
    id: 'settings',
    src: 'assets/print1.png',
    titlePt: 'Ollo Reader — Configurações, Temas e Escala de Interface (+35%)',
    titleEn: 'Ollo Reader — Settings, Themes & UI Scaling (+35%)',
    captionPt: '4 temas globais (Claro, Sépia, Escuro, Preto OLED), escala da interface até +35%, idioma PT/EN e operação 100% Offline.',
    captionEn: '4 global themes (Light, Sepia, Dark, OLED Black), UI scaling up to +35%, PT/EN language, and 100% Offline operation.'
  }
];

let currentLang = 'pt';
let currentTabIndex = 0;

function selectShowcaseTab(index) {
  currentTabIndex = index;
  const item = screenshots[index];
  const imgEl = document.getElementById('showcase-main-img');
  const captionEl = document.getElementById('showcase-caption');
  const frameTitleEl = document.getElementById('frame-window-title');
  const buttons = document.querySelectorAll('.tab-btn');

  buttons.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });

  const activeBtn = buttons[index];
  if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  if (imgEl) {
    imgEl.style.opacity = '0.25';
    setTimeout(() => {
      imgEl.src = item.src;
      imgEl.alt = currentLang === 'pt' ? item.titlePt : item.titleEn;
      imgEl.style.opacity = '1';
    }, 120);
  }

  if (captionEl) {
    captionEl.textContent = currentLang === 'pt' ? item.captionPt : item.captionEn;
  }

  if (frameTitleEl) {
    frameTitleEl.textContent = currentLang === 'pt' ? item.titlePt : item.titleEn;
  }
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggleBtn || !mobileMenu) return;

  function closeMenu() {
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Fecha o menu ao clicar em qualquer link interno
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Fecha o menu ao clicar fora dele
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // Fecha o menu com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Fecha o menu se a janela for redimensionada para desktop (> 768px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

function setupStoreLinks() {
  const isWindows = /Windows/i.test(navigator.userAgent);
  const storeLinks = document.querySelectorAll('a[href*="ms-windows-store:"], a.ms-store-link');

  storeLinks.forEach((link) => {
    // Se o usuário não estiver no Windows (ex: celular Android/iOS ou macOS), usa a URL web oficial da Store
    if (!isWindows) {
      link.href = 'https://apps.microsoft.com/detail/9NGHDBJBDD7G';
      link.target = '_blank';
      link.rel = 'noopener';
    } else {
      // No Windows, chama diretamente o app nativo da Microsoft Store sem abrir abas em branco
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  });
}

// ---------- Speed Reader demo (RSVP palavra por palavra) ----------
const SR_TEXT = {
  pt: 'Bem-vindo ao Speed Reader do Ollo Reader. Cada palavra aparece no mesmo lugar, então seus olhos não precisam mais correr pela página. A letra em vermelho é o ponto focal: olhe só para ela. Vírgulas, fins de frase e palavras longas ganham uma pausa extra, para o texto continuar natural. Arraste a barra e experimente ler mais rápido.',
  en: 'Welcome to the Ollo Reader Speed Reader. Every word appears in the same place, so your eyes no longer have to race across the page. The red letter is the focal point: just look at it. Commas, sentence ends and long words get an extra pause, so the text still feels natural. Drag the slider and try reading faster.',
};

const speedDemo = { words: [], index: 0, timer: null, playing: false, wpm: 300 };

function srFocalIndex(len) {
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

function srRender() {
  const el = document.getElementById('sr-word');
  const bar = document.getElementById('sr-progress');
  if (!el) return;
  const word = speedDemo.words[speedDemo.index] || '';
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '');
  const lead = word.search(/[\p{L}\p{N}]/u);
  const f = Math.max(0, lead) + srFocalIndex(letters.length);
  el.children[0].textContent = word.slice(0, f);
  el.children[1].textContent = word.charAt(f);
  el.children[2].textContent = word.slice(f + 1);
  if (bar) bar.style.width = ((speedDemo.index + 1) / speedDemo.words.length) * 100 + '%';
}

function srDelay(word) {
  let ms = 60000 / speedDemo.wpm;
  if (/[.!?]$/.test(word)) ms *= 2.2;
  else if (/[,;:]$/.test(word)) ms *= 1.5;
  if (word.length > 9) ms *= 1.3;
  return ms;
}

function srTick() {
  srRender();
  const word = speedDemo.words[speedDemo.index];
  speedDemo.timer = setTimeout(() => {
    speedDemo.index = (speedDemo.index + 1) % speedDemo.words.length;
    // pausa maior ao recomeçar o texto
    if (speedDemo.index === 0) {
      speedDemo.timer = setTimeout(srTick, 1200);
    } else {
      srTick();
    }
  }, srDelay(word));
}

function srSetPlaying(on) {
  const demo = document.querySelector('.sr-demo');
  speedDemo.playing = on;
  clearTimeout(speedDemo.timer);
  if (demo) demo.classList.toggle('is-playing', on);
  if (on) srTick();
}

function srLoadText() {
  speedDemo.words = SR_TEXT[currentLang === 'en' ? 'en' : 'pt'].split(/\s+/);
  speedDemo.index = 0;
  const value = document.getElementById('sr-wpm-value');
  if (value) value.textContent = speedDemo.wpm.toLocaleString(currentLang === 'en' ? 'en-US' : 'pt-BR');
  srRender();
  if (speedDemo.playing) srSetPlaying(true);
}

function setupSpeedReaderDemo() {
  const demo = document.querySelector('.sr-demo');
  if (!demo) return;
  const playBtn = document.getElementById('sr-play');
  const slider = document.getElementById('sr-wpm');
  const value = document.getElementById('sr-wpm-value');

  srLoadText();

  playBtn.addEventListener('click', () => srSetPlaying(!speedDemo.playing));
  slider.addEventListener('input', () => {
    speedDemo.wpm = Number(slider.value);
    value.textContent = speedDemo.wpm.toLocaleString(currentLang === 'en' ? 'en-US' : 'pt-BR');
  });

  // Toca sozinho quando aparece na tela (exceto se o usuário pediu menos movimento)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    let userPaused = false;
    playBtn.addEventListener('click', () => { userPaused = !speedDemo.playing; });
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !userPaused) srSetPlaying(true);
        else if (!entry.isIntersecting && speedDemo.playing) srSetPlaying(false);
      });
    }, { threshold: 0.5 }).observe(demo);
  }
}

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach((other) => {
        other.classList.remove('open');
        const otherAns = other.querySelector('.faq-answer');
        if (otherAns) otherAns.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

function toggleLanguage() {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.textContent = currentLang === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT';
  }

  document.querySelectorAll('[data-pt][data-en]').forEach((el) => {
    const text = currentLang === 'pt' ? el.getAttribute('data-pt') : el.getAttribute('data-en');
    if (text) {
      el.innerHTML = text;
    }
  });

  selectShowcaseTab(currentTabIndex);
  srLoadText();

  // Recalculate open FAQ height if any
  const openFaq = document.querySelector('.faq-item.open .faq-answer');
  if (openFaq) {
    openFaq.style.maxHeight = openFaq.scrollHeight + 'px';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupStoreLinks();
  setupFaqAccordion();
  setupSpeedReaderDemo();
  selectShowcaseTab(0);

  // Open first FAQ item by default
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) {
    firstFaq.classList.add('open');
    const ans = firstFaq.querySelector('.faq-answer');
    if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
  }
});

