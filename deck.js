(() => {
  const deck = document.getElementById('deck');
  const slides = [...deck.querySelectorAll('.slide')];
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress-bar');
  const editButton = document.getElementById('edit-toggle');
  const status = document.getElementById('edit-status');
  const storageKey = 'eve-atlas-wren-learning-copy-v1';
  const editableNodes = [...deck.querySelectorAll('.slide h1, .slide h2, .slide h3, .slide p, .slide li, .slide .cover-label, .slide .topline span, .slide .bottomline span')];
  let current = 0;
  let editing = false;
  let originals = [];

  function saveCopy() {
    const copy = editableNodes.map(node => node.innerHTML);
    try {
      localStorage.setItem(storageKey, JSON.stringify(copy));
      status.textContent = 'Edits saved in this browser only.';
    } catch (_) {
      status.textContent = 'Edits apply until this page closes; browser storage is unavailable.';
    }
  }

  function restoreCopy() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(saved) && saved.length === editableNodes.length) {
        editableNodes.forEach((node, index) => { node.innerHTML = saved[index]; });
      }
    } catch (_) {
      status.textContent = 'Saved edits could not be loaded.';
    }
  }

  function setEditing(value) {
    editing = value;
    deck.classList.toggle('editing', editing);
    editButton.setAttribute('aria-pressed', String(editing));
    editButton.textContent = editing ? 'Done editing' : 'Edit copy';
    editableNodes.forEach(node => {
      node.contentEditable = String(editing);
      node.spellcheck = editing;
      node.setAttribute('role', editing ? 'textbox' : '');
      if (editing) node.title = 'Click and edit this copy';
      else node.removeAttribute('title');
    });
    status.textContent = editing ? 'Edit text directly. Changes save in this browser only.' : 'Copy edits save in this browser only.';
    if (!editing) saveCopy();
  }

  function showSlide(index) {
    current = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.classList.toggle('prev', i < current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    history.replaceState(null, '', `#${current + 1}`);
  }

  editableNodes.forEach((node, index) => {
    node.dataset.editable = String(index);
    originals.push(node.innerHTML);
    node.addEventListener('input', saveCopy);
  });
  restoreCopy();
  showSlide(Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0)));

  document.getElementById('prev').addEventListener('click', () => showSlide(current - 1));
  document.getElementById('next').addEventListener('click', () => showSlide(current + 1));
  document.getElementById('fullscreen').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });
  editButton.addEventListener('click', () => setEditing(!editing));
  document.getElementById('reset-copy').addEventListener('click', () => {
    editableNodes.forEach((node, index) => { node.innerHTML = originals[index]; });
    try { localStorage.removeItem(storageKey); } catch (_) { /* no-op */ }
    status.textContent = 'Original copy restored.';
  });
  document.addEventListener('keydown', event => {
    if (event.target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      if (event.key === 'Escape') { event.target.blur(); setEditing(false); }
      return;
    }
    if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); showSlide(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(current - 1); }
    if (event.key.toLowerCase() === 'f') document.getElementById('fullscreen').click();
    if (event.key.toLowerCase() === 'e') setEditing(!editing);
  });
  let touchStartX = 0;
  deck.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  deck.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (event.target.closest('.cards, .metric-grid, .team-grid')) return;
    if (Math.abs(delta) > 55 && !editing) showSlide(current + (delta < 0 ? 1 : -1));
  }, { passive: true });
})();
