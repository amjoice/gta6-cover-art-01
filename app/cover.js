// Neon Shore Cover Studio — cover engine.
// drawCover paints one GTA-poster-style cover on any 2D canvas: a multi-panel
// photo grid with white gutters, a Vice City sunset or neon colour grade, bold
// Anton caption lettering with a neon Pacifico subtitle, a badge ribbon, heat
// stars, film grain and a vignette. Pure canvas, no network, no library.

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

export const GRADE_DEFS = [
  { id: 'sunset', name: 'Vice Sunset', sat: 1.35, con: 1.08, bri: 1.03,
    wash: ['rgba(255,122,26,0.22)', 'rgba(255,46,136,0.16)', 'rgba(123,92,255,0.16)'] },
  { id: 'neon', name: 'Neon Night', sat: 1.3, con: 1.14, bri: 0.97,
    wash: ['rgba(25,227,214,0.20)', 'rgba(255,46,136,0.22)', 'rgba(20,10,60,0.18)'] },
  { id: 'gold', name: 'Palm Gold', sat: 1.25, con: 1.05, bri: 1.06,
    wash: ['rgba(255,190,60,0.24)', 'rgba(255,140,40,0.14)', 'rgba(120,60,0,0.10)'] },
  { id: 'tealheat', name: 'Teal Heat', sat: 1.4, con: 1.12, bri: 1.0,
    wash: ['rgba(0,180,180,0.18)', 'rgba(255,120,40,0.20)', 'rgba(255,60,90,0.10)'] },
  { id: 'noir', name: 'Mono Noir', sat: 0.06, con: 1.28, bri: 1.02,
    wash: ['rgba(255,46,136,0.10)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.16)'] },
];

export const LAYOUT_DEFS = [
  { id: 'hero-three', name: 'Hero + 3' },
  { id: 'four-grid', name: 'Four Grid' },
  { id: 'nine-grid', name: 'Nine Grid' },
  { id: 'full-bleed', name: 'Full Bleed' },
  { id: 'tilted', name: 'Tilted Snaps' },
  { id: 'story-strip', name: 'Story Strip' },
];

// Geometry of one layout: panel rects (fractions of W/H), the title zone and
// the subtitle zone. Rotated panels carry a rot in radians.
export function layoutGeometry(layoutId, W, H) {
  const g = Math.max(6, Math.round(W * 0.006)); // white gutter
  switch (layoutId) {
    case 'hero-three': {
      const split = 0.615;
      return {
        panels: [
          { x: 0, y: 0, w: split, h: 1 },
          { x: split, y: 0, w: 1 - split, h: 1 / 3 },
          { x: split, y: 1 / 3, w: 1 - split, h: 1 / 3 },
          { x: split, y: 2 / 3, w: 1 - split, h: 1 / 3 },
        ],
        title: { x: 0.03, y: 0.80, w: 0.94, h: 0.16, align: 'left' },
        subtitle: { x: 0.03, y: 0.955, w: 0.94, h: 0.045, align: 'left' },
        badge: { x: 0.86, y: 0.03, w: 0.12, h: 0.05 },
        gutter: g,
      };
    }
    case 'four-grid':
      return {
        panels: [
          { x: 0, y: 0, w: 0.5, h: 0.5 },
          { x: 0.5, y: 0, w: 0.5, h: 0.5 },
          { x: 0, y: 0.5, w: 0.5, h: 0.5 },
          { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
        title: { x: 0.03, y: 0.82, w: 0.94, h: 0.14, align: 'left' },
        subtitle: { x: 0.03, y: 0.955, w: 0.94, h: 0.04, align: 'left' },
        badge: { x: 0.86, y: 0.03, w: 0.12, h: 0.05 },
        gutter: g,
      };
    case 'nine-grid': {
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue; // centre cell is the title block
          cells.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3 });
        }
      }
      return {
        panels: cells,
        title: { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3, align: 'centre', block: true },
        subtitle: { x: 1 / 3, y: 0.60, w: 1 / 3, h: 0.06, align: 'centre' },
        badge: { x: 0.86, y: 0.03, w: 0.12, h: 0.05 },
        gutter: g,
      };
    }
    case 'full-bleed':
      return {
        panels: [{ x: 0, y: 0, w: 1, h: 1 }],
        title: { x: 0.04, y: 0.76, w: 0.92, h: 0.18, align: 'left' },
        subtitle: { x: 0.04, y: 0.935, w: 0.92, h: 0.05, align: 'left' },
        badge: { x: 0.84, y: 0.04, w: 0.13, h: 0.05 },
        gutter: 0,
      };
    case 'tilted':
      return {
        panels: [
          { x: 0.06, y: 0.30, w: 0.42, h: 0.52, rot: -0.07 },
          { x: 0.50, y: 0.22, w: 0.44, h: 0.56, rot: 0.05 },
          { x: 0.28, y: 0.52, w: 0.44, h: 0.42, rot: -0.02 },
        ],
        title: { x: 0.04, y: 0.04, w: 0.92, h: 0.15, align: 'left' },
        subtitle: { x: 0.04, y: 0.185, w: 0.92, h: 0.05, align: 'left' },
        badge: { x: 0.84, y: 0.90, w: 0.13, h: 0.05 },
        gutter: Math.round(W * 0.012),
        backdrop: 'skyline',
      };
    case 'story-strip':
    default:
      return {
        panels: [
          { x: 0, y: 0, w: 1, h: 0.52 },
          { x: 0, y: 0.52, w: 0.5, h: 0.48 },
          { x: 0.5, y: 0.52, w: 0.5, h: 0.48 },
        ],
        title: { x: 0.04, y: 0.545, w: 0.92, h: 0.13, align: 'left' },
        subtitle: { x: 0.04, y: 0.68, w: 0.92, h: 0.045, align: 'left' },
        badge: { x: 0.84, y: 0.03, w: 0.13, h: 0.05 },
        gutter: g,
      };
  }
}

// Cover-fit source rect for an image inside a panel rect, with zoom and pan.
export function coverSource(img, rw, rh, zoom, ox, oy) {
  const imgRatio = img.width / img.height;
  const rectRatio = rw / rh;
  let sw, sh;
  if (imgRatio > rectRatio) { sh = img.height; sw = sh * rectRatio; }
  else { sw = img.width; sh = sw / rectRatio; }
  sw /= Math.max(1, zoom); sh /= Math.max(1, zoom);
  const maxOx = (img.width - sw) / 2;
  const maxOy = (img.height - sh) / 2;
  const sx = (img.width - sw) / 2 + (ox || 0) * maxOx;
  const sy = (img.height - sh) / 2 + (oy || 0) * maxOy;
  return { sx, sy, sw, sh };
}

function gradeFor(id) {
  return GRADE_DEFS.find((d) => d.id === id) || GRADE_DEFS[0];
}

// Draw one photo into a panel rect, graded, with a thin inner border.
export function drawPhotoPanel(ctx, img, rect, crop, gradeId) {
  const grade = gradeFor(gradeId);
  const src = coverSource(img, rect.w, rect.h, crop.zoom, crop.ox, crop.oy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = `saturate(${grade.sat}) contrast(${grade.con}) brightness(${grade.bri})`;
  ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, rect.x, rect.y, rect.w, rect.h);
  ctx.filter = 'none';
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grade.wash.forEach((c, i) => wash.addColorStop(i / (grade.wash.length - 1), c));
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.92);
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function sunsetFill(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ffb03a');
  grad.addColorStop(0.45, '#ff5e62');
  grad.addColorStop(0.75, '#ff2e88');
  grad.addColorStop(1, '#7b5cff');
  return grad;
}

// Halftone dot field clipped to a rect: dots grow toward the bottom.
export function drawHalftone(ctx, rect, dotMax) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const step = Math.max(6, dotMax * 1.9);
  const colors = ['rgba(255,46,136,0.55)', 'rgba(25,227,214,0.5)', 'rgba(255,176,58,0.5)'];
  let row = 0;
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step, row++) {
    const t = (y - rect.y) / rect.h;
    for (let x = rect.x + step / 2 + (row % 2 ? step / 2 : 0); x < rect.x + rect.w; x += step) {
      const r = Math.max(0.6, dotMax * (0.25 + t * 0.9));
      ctx.fillStyle = colors[(row + Math.round(x / step)) % 3];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

// Heat meter: five stars, four lit, one outline — the poster's "heat" rating.
export function drawHeatStars(ctx, cx, cy, size, lit) {
  const gap = size * 1.25;
  const total = gap * 4;
  for (let i = 0; i < 5; i++) {
    const x = cx - total / 2 + i * gap;
    if (i < lit) {
      drawStar(ctx, x, cy, size / 2, '#ffd23e');
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.stroke();
    } else {
      drawStar(ctx, x, cy, size / 2, 'rgba(255,255,255,0.18)');
    }
  }
}

// Rotated badge ribbon with the badge word.
export function drawBadgeRibbon(ctx, rect, text) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(-0.06);
  const w = rect.w * 1.15, h = rect.h;
  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, '#ff2e88');
  grad.addColorStop(1, '#7b5cff');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = h * 0.4;
  ctx.shadowOffsetY = h * 0.12;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.strokeRect(-w / 2 + h * 0.12, -h / 2 + h * 0.16, w - h * 0.24, h - h * 0.32);
  const size = fitFont(ctx, text, w * 0.8, h * 0.62, 'Anton, "Arial Narrow", sans-serif');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, h * 0.03);
  ctx.restore();
}

// The title: Anton, gradient or white, with a dark scrim behind it so it
// reads over any photo. In a title block (nine-grid) the scrim is halftone.
export function drawTitleBlock(ctx, zone, state) {
  const { title, titleStyle } = state;
  if (!title) return;
  const pad = zone.h * 0.12;
  if (zone.block) {
    ctx.fillStyle = '#12081f';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    drawHalftone(ctx, { x: zone.x, y: zone.y + zone.h * 0.55, w: zone.w, h: zone.h * 0.45 }, Math.max(3, zone.w * 0.012));
    ctx.strokeStyle = '#f4efe8';
    ctx.lineWidth = Math.max(2, zone.w * 0.008);
    ctx.strokeRect(zone.x + pad * 0.4, zone.y + pad * 0.4, zone.w - pad * 0.8, zone.h - pad * 0.8);
  } else {
    const scrim = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
    scrim.addColorStop(0, 'rgba(10,4,20,0)');
    scrim.addColorStop(0.35, 'rgba(10,4,20,0.55)');
    scrim.addColorStop(1, 'rgba(10,4,20,0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(zone.x - pad, zone.y, zone.w + pad * 2, zone.h);
    if (titleStyle === 'halftone') {
      drawHalftone(ctx, { x: zone.x, y: zone.y + zone.h * 0.45, w: zone.w, h: zone.h * 0.55 }, Math.max(3, zone.w * 0.01));
    }
  }
  const upper = title.toUpperCase();
  const maxW = zone.w - pad * 2;
  // A title block (nine-grid centre cell) sets its title on two lines, one
  // word a line where it fits, so the lettering stays big instead of
  // shrinking to one small line.
  let lines = [upper];
  if (zone.block) {
    const words = upper.split(' ');
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
  }
  const lineH = zone.h * (zone.block ? 0.30 : 0.62);
  const size = Math.min(...lines.map((line) =>
    fitFont(ctx, line, maxW, lineH, 'Anton, "Arial Narrow", sans-serif')));
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = zone.align === 'centre' ? 'center' : 'left';
  const tx = zone.align === 'centre' ? zone.x + zone.w / 2 : zone.x + pad;
  const firstY = zone.y + zone.h * (zone.block ? 0.30 : 0.48) - (lines.length - 1) * lineH * 0.5;
  lines.forEach((line, li) => {
    const ty = firstY + li * lineH;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    if (titleStyle === 'white') {
      ctx.fillStyle = '#ffffff';
    } else {
      // The sunset gradient runs across the whole line: from its left edge,
      // which for centred text is half its width left of the centre point.
      const tw = Math.min(maxW, ctx.measureText(line).width);
      const gx = zone.align === 'centre' ? tx - tw / 2 : tx;
      ctx.fillStyle = sunsetFill(ctx, gx, ty - size / 2, tw, size);
    }
    ctx.fillText(line, tx, ty);
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText(line, tx, ty);
  });
  ctx.restore();
  if (zone.block && state.effects.stars) {
    drawHeatStars(ctx, zone.x + zone.w / 2, zone.y + zone.h * 0.82, zone.w * 0.055, 4);
  }
}

// Neon script subtitle with a glow, slightly tilted.
export function drawNeonSubtitle(ctx, zone, text) {
  if (!text) return;
  const size = fitFont(ctx, text, zone.w, zone.h * 0.9, 'Pacifico, cursive');
  ctx.save();
  ctx.translate(zone.x + (zone.align === 'centre' ? zone.w / 2 : 0), zone.y + zone.h / 2);
  ctx.rotate(-0.02);
  ctx.textAlign = zone.align === 'centre' ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = size * 0.55;
  ctx.fillStyle = '#ffe9f4';
  ctx.fillText(text, 0, 0);
  ctx.shadowColor = '#19e3d6';
  ctx.shadowBlur = size * 0.25;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// Sunset skyline backdrop for the tilted layout: gradient sky, sun disc,
// distant towers and palm silhouettes, all drawn, nothing borrowed.
export function drawSkylineBackdrop(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b0f4d');
  sky.addColorStop(0.45, '#ff5e62');
  sky.addColorStop(0.75, '#ff9a3d');
  sky.addColorStop(1, '#ffd23e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sunX = W * 0.72, sunY = H * 0.42, sunR = W * 0.11;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, 'rgba(255,240,180,0.9)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Distant towers.
  ctx.fillStyle = 'rgba(30,8,50,0.85)';
  let x = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < W) {
    const bw = W * (0.04 + rnd() * 0.05);
    const bh = H * (0.10 + rnd() * 0.22);
    ctx.fillRect(x, H * 0.98 - bh, bw, bh);
    x += bw + W * 0.012;
  }
  // Palm silhouettes.
  ctx.strokeStyle = 'rgba(20,5,35,0.95)';
  ctx.fillStyle = 'rgba(20,5,35,0.95)';
  const palms = [[0.08, 0.92, 0.16], [0.92, 0.94, 0.13]];
  for (const [px, py, ph] of palms) {
    const bx = px * W, by = py * H, th = ph * H;
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + th * 0.08, by - th * 0.6, bx + th * 0.02, by - th);
    ctx.stroke();
    for (let f = 0; f < 6; f++) {
      const a = -Math.PI * (0.15 + f * 0.14);
      ctx.beginPath();
      ctx.moveTo(bx + th * 0.02, by - th);
      ctx.quadraticCurveTo(
        bx + th * 0.02 + Math.cos(a) * th * 0.32, by - th + Math.sin(a) * th * 0.22,
        bx + th * 0.02 + Math.cos(a) * th * 0.55, by - th + Math.sin(a) * th * 0.42,
      );
      ctx.stroke();
    }
  }
  // Sea shimmer at the bottom.
  const sea = ctx.createLinearGradient(0, H * 0.9, 0, H);
  sea.addColorStop(0, 'rgba(255,120,80,0)');
  sea.addColorStop(1, 'rgba(255,80,120,0.35)');
  ctx.fillStyle = sea;
  ctx.fillRect(0, H * 0.9, W, H * 0.1);
}

let grainPattern = null;
function grainTile() {
  if (grainPattern) return grainPattern;
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
  }
  c.putImageData(img, 0, 0);
  grainPattern = t;
  return t;
}

export function applyGrain(ctx, W, H) {
  const tile = grainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function applyVignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Paint the whole cover. state.photos holds loaded Image elements;
// state.panels holds one {photo, zoom, ox, oy} per panel of the layout.
export function drawCover(ctx, W, H, state) {
  const geo = layoutGeometry(state.layout, W, H);
  ctx.clearRect(0, 0, W, H);
  if (geo.backdrop === 'skyline') {
    drawSkylineBackdrop(ctx, W, H);
  } else {
    ctx.fillStyle = '#f4efe8';
    ctx.fillRect(0, 0, W, H);
  }
  const g = geo.gutter;
  geo.panels.forEach((p, i) => {
    const rect = {
      x: Math.round(p.x * W + (p.x > 0 ? g / 2 : 0)),
      y: Math.round(p.y * H + (p.y > 0 ? g / 2 : 0)),
      w: Math.round(p.w * W - (p.x > 0 ? g / 2 : 0) - (p.x + p.w < 1 ? g / 2 : 0)),
      h: Math.round(p.h * H - (p.y > 0 ? g / 2 : 0) - (p.y + p.h < 1 ? g / 2 : 0)),
    };
    const crop = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[crop.photo] && state.photos[crop.photo].img;
    ctx.save();
    if (p.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(p.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      rect.x = 0; rect.y = 0;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = W * 0.008;
      ctx.fillStyle = '#fff';
      const bw = Math.round(W * 0.012);
      ctx.fillRect(-bw, -bw, rect.w + bw * 2, rect.h + bw * 2);
      ctx.shadowColor = 'transparent';
    }
    if (img) drawPhotoPanel(ctx, img, rect, crop, state.grade);
    else {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `${Math.max(12, rect.w * 0.03)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    ctx.restore();
  });
  const zx = (f) => ({ x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H, align: f.align, block: f.block });
  drawTitleBlock(ctx, zx(geo.title), state);
  drawNeonSubtitle(ctx, zx(geo.subtitle), state.subtitle);
  drawBadgeRibbon(ctx, zx(geo.badge), state.badge || 'VICE CITY');
  if (state.effects.grain) applyGrain(ctx, W, H);
  if (state.effects.vignette) applyVignette(ctx, W, H);
}

// Render a cover at export size and return the canvas.
export function renderCover(state, sizeId) {
  const size = EXPORT_SIZES[sizeId] || EXPORT_SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  return canvas;
}
