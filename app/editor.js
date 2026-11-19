// Neon Shore Cover Studio — editor wiring.
// Owns the app state, the controls, photo loading, panel dragging, undo/redo,
// PNG export and the ?shot= scenes the screenshots are taken from. The cover
// itself is painted by cover.js; this file never draws a pixel of art itself.

import {
  EXPORT_SIZES, GRADE_DEFS, LAYOUT_DEFS, layoutGeometry,
  coverSource, drawCover, renderCover,
} from './cover.js';

const SAMPLE_PHOTOS = [
  { id: 'convertible', label: 'Boulevard', src: 'samples/convertible.jpg' },
  { id: 'rooftop', label: 'Rooftop', src: 'samples/rooftop.jpg' },
  { id: 'neon', label: 'Neon night', src: 'samples/neon.jpg' },
];

const state = {
  photos: [], // {id, label, img}
  layout: 'hero-three',
  grade: 'sunset',
  title: 'NEON SHORE',
  subtitle: 'welcome to vice city',
  badge: 'VICE CITY',
  titleStyle: 'sunset',
  size: '1080x1080',
  effects: { grain: true, vignette: true, stars: true },
  fillAll: true,
  selectedPhoto: 0,
  selectedPanel: 0,
  panels: [], // one {photo, zoom, ox, oy} per panel of the layout
};

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photoInput');
const photoStrip = document.getElementById('photoStrip');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');

// ---- history (undo / redo) ---------------------------------------------

const history = [];
let historyIndex = -1;

function snapshotState() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, badge: state.badge, titleStyle: state.titleStyle,
    size: state.size, effects: state.effects, fillAll: state.fillAll,
    selectedPhoto: state.selectedPhoto, selectedPanel: state.selectedPanel,
    panels: state.panels,
  });
}

function pushHistory() {
  history.splice(historyIndex + 1);
  history.push(snapshotState());
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  refreshUndoButtons();
}

function restoreHistory(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  drawPreview();
}

function undoChange() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreHistory(history[historyIndex]);
}

function redoChange() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restoreHistory(history[historyIndex]);
}

function refreshUndoButtons() {
  document.getElementById('undoBtn').disabled = historyIndex <= 0;
  document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// ---- panels --------------------------------------------------------------

function normalizePanels() {
  const geo = layoutGeometry(state.layout, 100, 100);
  const next = geo.panels.map((_, i) => {
    const old = state.panels[i];
    if (old) return { photo: old.photo, zoom: old.zoom, ox: old.ox, oy: old.oy };
    return { photo: state.selectedPhoto, zoom: 1, ox: 0, oy: 0 };
  });
  state.panels = next;
  if (state.selectedPanel >= next.length) state.selectedPanel = 0;
}

function selectedPhotoImage() {
  const p = state.photos[state.selectedPhoto];
  return p ? p.img : null;
}

function applyPhotoToPanels(photoIndex) {
  if (state.fillAll) {
    state.panels.forEach((p) => { p.photo = photoIndex; });
    spreadCrops();
  } else {
    state.panels[state.selectedPanel].photo = photoIndex;
  }
}

// When one photo fills every panel, frame a different part of it in each
// panel — a wide pan left, a close crop right, a low angle — so the cover
// reads as several shots of the same scene, not one image tiled.
const CROP_SPREAD = [
  { ox: -0.7, oy: -0.35 }, { ox: 0.7, oy: -0.35 },
  { ox: -0.7, oy: 0.35 }, { ox: 0.7, oy: 0.35 },
  { ox: 0, oy: -0.6 }, { ox: 0, oy: 0.6 },
  { ox: -0.35, oy: 0 }, { ox: 0.35, oy: 0 },
];

function spreadCrops() {
  state.panels.forEach((p, i) => {
    const s = CROP_SPREAD[i % CROP_SPREAD.length];
    p.ox = s.ox;
    p.oy = s.oy;
  });
}

// ---- photos --------------------------------------------------------------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhoto(id, label, src) {
  const img = await loadImage(src);
  state.photos.push({ id, label, img });
  return state.photos.length - 1;
}

async function loadSamplePhoto(sampleId) {
  const def = SAMPLE_PHOTOS.find((s) => s.id === sampleId);
  if (!def) return -1;
  const existing = state.photos.findIndex((p) => p.id === def.id);
  if (existing >= 0) return existing;
  return addPhoto(def.id, def.label, def.src);
}

function addPhotoFiles(files) {
  const readers = [...files].map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
  }));
  return Promise.all(readers).then(async (loaded) => {
    for (const { name, dataUrl } of loaded) {
      const img = await loadImage(dataUrl);
      state.photos.push({ id: `upload-${state.photos.length}`, label: name, img });
    }
    state.selectedPhoto = state.photos.length - 1;
    applyPhotoToPanels(state.selectedPhoto);
    renderPhotoStrip();
    drawPreview();
  });
}

function renderPhotoStrip() {
  photoStrip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.label;
    thumb.title = photo.label;
    if (i === state.selectedPhoto) thumb.classList.add('selected');
    thumb.addEventListener('click', () => {
      pushHistory();
      state.selectedPhoto = i;
      applyPhotoToPanels(i);
      renderPhotoStrip();
      drawPreview();
    });
    photoStrip.appendChild(thumb);
  });
}

// ---- drawing -------------------------------------------------------------

function drawPreview() {
  const size = EXPORT_SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(ctx, size.w, size.h, state);
  document.getElementById('previewSize').textContent = `${size.w} × ${size.h} · ${size.label}`;
  document.getElementById('shotCaption').textContent =
    `${LAYOUT_DEFS.find((l) => l.id === state.layout).name} · ` +
    `${GRADE_DEFS.find((g) => g.id === state.grade).name} · click a panel, drag to move its photo`;
}

// ---- controls ------------------------------------------------------------

function buildControlRows() {
  const layoutRow = document.getElementById('layoutRow');
  LAYOUT_DEFS.forEach((def) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layoutBtn';
    btn.dataset.layout = def.id;
    btn.textContent = def.name;
    btn.addEventListener('click', () => {
      pushHistory();
      applyLayout(def.id);
    });
    layoutRow.appendChild(btn);
  });
  const gradeRow = document.getElementById('gradeRow');
  GRADE_DEFS.forEach((def) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gradeBtn';
    btn.dataset.grade = def.id;
    btn.textContent = def.name;
    btn.addEventListener('click', () => {
      pushHistory();
      state.grade = def.id;
      syncControls();
      drawPreview();
    });
    gradeRow.appendChild(btn);
  });
  const sizeRow = document.getElementById('sizeRow');
  sizeRow.querySelectorAll('.sizeBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      pushHistory();
      state.size = btn.dataset.size;
      syncControls();
      drawPreview();
    });
  });
  document.querySelectorAll('.titleStyleBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      pushHistory();
      state.titleStyle = btn.dataset.style;
      syncControls();
      drawPreview();
    });
  });
}

function applyLayout(layoutId) {
  state.layout = layoutId;
  normalizePanels();
  if (state.fillAll) spreadCrops();
  syncControls();
  drawPreview();
}

function syncControls() {
  document.querySelectorAll('.layoutBtn').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.gradeBtn').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.sizeBtn').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('.titleStyleBtn').forEach((b) =>
    b.classList.toggle('active', b.dataset.style === state.titleStyle));
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('fillAll').checked = state.fillAll;
  document.getElementById('grainToggle').checked = state.effects.grain;
  document.getElementById('vignetteToggle').checked = state.effects.vignette;
  document.getElementById('starsToggle').checked = state.effects.stars;
  const crop = state.panels[state.selectedPanel] || { zoom: 1 };
  zoomSlider.value = Math.round(crop.zoom * 100);
  zoomValue.textContent = `${Math.round(crop.zoom * 100)}%`;
  refreshUndoButtons();
}

function wireControls() {
  photoInput.addEventListener('change', () => {
    if (photoInput.files.length) addPhotoFiles(photoInput.files);
    photoInput.value = '';
  });
  document.querySelectorAll('.sampleBtn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = await loadSamplePhoto(btn.dataset.sample);
      if (idx < 0) return;
      pushHistory();
      state.selectedPhoto = idx;
      applyPhotoToPanels(idx);
      renderPhotoStrip();
      drawPreview();
    });
  });
  document.getElementById('fillAll').addEventListener('change', (e) => {
    pushHistory();
    state.fillAll = e.target.checked;
    if (state.fillAll) applyPhotoToPanels(state.selectedPhoto);
    drawPreview();
  });
  zoomSlider.addEventListener('input', () => {
    const crop = state.panels[state.selectedPanel];
    if (!crop) return;
    crop.zoom = Number(zoomSlider.value) / 100;
    zoomValue.textContent = `${zoomSlider.value}%`;
    drawPreview();
  });
  zoomSlider.addEventListener('change', pushHistory);
  document.getElementById('resetPanelBtn').addEventListener('click', () => {
    pushHistory();
    state.panels[state.selectedPanel] = { photo: state.selectedPhoto, zoom: 1, ox: 0, oy: 0 };
    syncControls();
    drawPreview();
  });
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    drawPreview();
  });
  document.getElementById('titleInput').addEventListener('change', pushHistory);
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    drawPreview();
  });
  document.getElementById('subtitleInput').addEventListener('change', pushHistory);
  document.getElementById('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value.toUpperCase();
    drawPreview();
  });
  document.getElementById('badgeInput').addEventListener('change', pushHistory);
  document.getElementById('grainToggle').addEventListener('change', (e) => {
    pushHistory();
    state.effects.grain = e.target.checked;
    drawPreview();
  });
  document.getElementById('vignetteToggle').addEventListener('change', (e) => {
    pushHistory();
    state.effects.vignette = e.target.checked;
    drawPreview();
  });
  document.getElementById('starsToggle').addEventListener('change', (e) => {
    pushHistory();
    state.effects.stars = e.target.checked;
    drawPreview();
  });
  document.getElementById('undoBtn').addEventListener('click', undoChange);
  document.getElementById('redoBtn').addEventListener('click', redoChange);
  document.getElementById('exportBtn').addEventListener('click', () => exportCoverPng(state.size));
  document.getElementById('exportAllBtn').addEventListener('click', exportAllSizes);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undoChange(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redoChange(); }
  });
}

// ---- panel picking and dragging ------------------------------------------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function panelAt(x, y) {
  const geo = layoutGeometry(state.layout, canvas.width, canvas.height);
  const g = geo.gutter;
  for (let i = 0; i < geo.panels.length; i++) {
    const p = geo.panels[i];
    const rect = {
      x: Math.round(p.x * canvas.width + (p.x > 0 ? g / 2 : 0)),
      y: Math.round(p.y * canvas.height + (p.y > 0 ? g / 2 : 0)),
      w: Math.round(p.w * canvas.width - (p.x > 0 ? g / 2 : 0) - (p.x + p.w < 1 ? g / 2 : 0)),
      h: Math.round(p.h * canvas.height - (p.y > 0 ? g / 2 : 0) - (p.y + p.h < 1 ? g / 2 : 0)),
    };
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
      return { index: i, rect };
    }
  }
  return null;
}

function wireCanvasPointer() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const pt = canvasPoint(e);
    const hit = panelAt(pt.x, pt.y);
    if (!hit) return;
    state.selectedPanel = hit.index;
    const crop = state.panels[hit.index];
    const img = state.photos[crop.photo] && state.photos[crop.photo].img;
    canvas.setPointerCapture(e.pointerId);
    drag = { panel: hit, start: pt, moved: false, img };
    syncControls();
    drawPreview();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || !drag.img) return;
    const pt = canvasPoint(e);
    const dx = pt.x - drag.start.x;
    const dy = pt.y - drag.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    const crop = state.panels[drag.panel.index];
    const rect = drag.panel.rect;
    const src = coverSource(drag.img, rect.w, rect.h, crop.zoom, crop.ox, crop.oy);
    let nsx = src.sx + dx * (src.sw / rect.w);
    let nsy = src.sy + dy * (src.sh / rect.h);
    nsx = Math.max(0, Math.min(drag.img.width - src.sw, nsx));
    nsy = Math.max(0, Math.min(drag.img.height - src.sh, nsy));
    const maxOx = (drag.img.width - src.sw) / 2;
    const maxOy = (drag.img.height - src.sh) / 2;
    crop.ox = maxOx > 0 ? (nsx - (drag.img.width - src.sw) / 2) / maxOx : 0;
    crop.oy = maxOy > 0 ? (nsy - (drag.img.height - src.sh) / 2) / maxOy : 0;
    drag.start = pt;
    drawPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag && drag.moved) pushHistory();
    drag = null;
  });
}

// ---- export ---------------------------------------------------------------

function downloadCanvas(coverCanvas, filename) {
  return new Promise((resolve) => {
    coverCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

function slugTitle() {
  return (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

export async function exportCoverPng(sizeId) {
  await document.fonts.ready;
  const coverCanvas = renderCover(state, sizeId);
  const size = EXPORT_SIZES[sizeId];
  return downloadCanvas(coverCanvas, `${slugTitle()}-${size.w}x${size.h}.png`);
}

export async function exportAllSizes() {
  for (const sizeId of Object.keys(EXPORT_SIZES)) {
    await exportCoverPng(sizeId);
    await new Promise((r) => setTimeout(r, 250));
  }
}

// ---- ?shot= scenes ---------------------------------------------------------

function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || '',
    photo: q.get('photo') || '',
    caption: q.get('caption') || '',
    subtitle: q.get('subtitle') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    size: q.get('size') || '',
    badge: q.get('badge') || '',
  };
}

async function applyShotParams(params) {
  if (params.caption) state.title = params.caption;
  if (params.subtitle) state.subtitle = params.subtitle;
  if (params.badge) state.badge = params.badge.toUpperCase();
  if (params.layout && LAYOUT_DEFS.some((l) => l.id === params.layout)) state.layout = params.layout;
  if (params.grade && GRADE_DEFS.some((g) => g.id === params.grade)) state.grade = params.grade;
  if (params.size && EXPORT_SIZES[params.size]) state.size = params.size;
  if (params.photo) {
    const idx = await loadSamplePhoto(params.photo);
    if (idx >= 0) {
      state.selectedPhoto = idx;
      state.fillAll = true;
      normalizePanels();
      applyPhotoToPanels(idx);
    }
  }
  normalizePanels();
  syncControls();
  renderPhotoStrip();
}

// ---- boot -----------------------------------------------------------------

async function boot() {
  buildControlRows();
  wireControls();
  wireCanvasPointer();
  normalizePanels();
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]).catch(() => {});
  const params = readShotParams();
  if (params.shot === 'cover') document.body.classList.add('shot-cover');
  await applyShotParams(params);
  if (!params.photo) {
    const idx = await loadSamplePhoto('convertible');
    if (idx >= 0) {
      state.selectedPhoto = idx;
      applyPhotoToPanels(idx);
      renderPhotoStrip();
    }
  }
  normalizePanels();
  syncControls();
  drawPreview();
  pushHistory();
  window.__coverStudio = { state, exportCoverPng, exportAllSizes, drawPreview };
}

boot();
