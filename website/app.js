/* Browser-only presentation: no tracking, persistence, or automatic audio. */
(() => {
  'use strict';
  let language = 'en';
  const translatedNodes = [...document.querySelectorAll('[data-zh]')];
  const english = new Map(translatedNodes.map(node => [node, node.innerHTML]));
  const ariaNodes = [...document.querySelectorAll('[data-aria-zh]')];
  const englishAria = new Map(ariaNodes.map(node => [node, node.getAttribute('aria-label')]));
  const imageAlternatives = new Map([
    ['assets/companion.png', '毛茸茸的蓝色伙伴，长着粉色内耳的大耳朵'],
    ['assets/companion-demo.gif', '蓝色伙伴的编排动画预览'],
    ['assets/workbench.png', 'SelectSpeak 实际工作台的简体中文界面，显示选区监听、Kokoro 状态及声音偏好']
  ]);
  const images = [...document.querySelectorAll('img:not([aria-hidden="true"])')];
  const englishAlt = new Map(images.map(node => [node, node.alt]));
  const languageButtons = [...document.querySelectorAll('[data-lang]')];
  const petButton = document.querySelector('.companion-button');
  const petStatus = document.querySelector('.pet-status');
  let petTimer;
  function setLanguage(next) {
    if (!['en', 'zh'].includes(next)) return;
    language = next;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    translatedNodes.forEach(node => {
      if (next === 'zh') node.textContent = node.dataset.zh;
      else node.innerHTML = english.get(node); // Restore this page's own line breaks.
    });
    ariaNodes.forEach(node => { node.setAttribute('aria-label', next === 'zh' ? node.dataset.ariaZh : englishAria.get(node)); });
    images.forEach(node => { node.alt = next === 'zh' ? (imageAlternatives.get(node.getAttribute('src')) || englishAlt.get(node)) : englishAlt.get(node); });
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === next)));
    document.title = next === 'zh' ? 'SelectSpeak — 读一点，听一点。' : 'SelectSpeak — A little company. A little English.';
    petStatus.textContent = '';
  }
  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  petButton.addEventListener('click', () => {
    clearTimeout(petTimer);
    petButton.classList.remove('is-petted');
    void petButton.offsetWidth;
    petButton.classList.add('is-petted');
    petStatus.textContent = language === 'zh' ? '摸摸头。网页互动预览，不会播放语音。' : 'A little head pat. Interactive web preview; no speech is played.';
    petTimer = setTimeout(() => petButton.classList.remove('is-petted'), 850);
  });
})();
