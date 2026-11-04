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

  // Recalculate open FAQ height if any
  const openFaq = document.querySelector('.faq-item.open .faq-answer');
  if (openFaq) {
    openFaq.style.maxHeight = openFaq.scrollHeight + 'px';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupFaqAccordion();
  selectShowcaseTab(0);

  // Open first FAQ item by default
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) {
    firstFaq.classList.add('open');
    const ans = firstFaq.querySelector('.faq-answer');
    if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
  }
});

