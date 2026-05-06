const fmt = {
  bytes(n) {
    if (n == null) return '-';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  },
  ms(n) {
    if (n == null) return '-';
    if (n < 1) return '<1 ms';
    if (n < 1000) return `${n.toFixed(0)} ms`;
    return `${(n / 1000).toFixed(2)} s`;
  },
  speed(bytes, ms) {
    if (!bytes || !ms || ms < 1) return '-';
    const bps = bytes / (ms / 1000);
    if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${(bps / 1024 / 1024).toFixed(2)} MB/s`;
  },
};

let manifest = {};
async function loadManifest() {
  try {
    const res = await fetch('images/manifest.json', { cache: 'no-store' });
    manifest = await res.json();
  } catch {
    manifest = {};
  }
}

function bustUrl(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadImage(url) {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    img.onload = () => resolve({ img, ms: performance.now() - start, ok: true });
    img.onerror = () => resolve({ img, ms: performance.now() - start, ok: false });
    img.src = url;
  });
}

async function loadFigure(figure, { bust = false } = {}) {
  const src = figure.dataset.src;
  if (!src) return;
  const slot = figure.querySelector('.img-slot');
  const meta = figure.querySelector('[data-meta]');
  meta.textContent = '로드 중…';

  const url = bust ? bustUrl(src) : src;
  const result = await loadImage(url);

  slot.innerHTML = '';
  if (result.ok) {
    const node = document.createElement('img');
    node.src = url;
    node.alt = figure.dataset.label || '';
    node.loading = 'eager';
    slot.appendChild(node);
  }

  const file = src.split('/').pop();
  const bytes = manifest[file]?.bytes;
  const sizeText = bytes ? fmt.bytes(bytes) : '-';
  meta.innerHTML = `<strong>${sizeText}</strong> · ${fmt.ms(result.ms)}`;
}

function setupZoom() {
  document.querySelectorAll('.img-slot').forEach((slot) => {
    slot.addEventListener('mousemove', (e) => {
      const rect = slot.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      slot.style.setProperty('--mx', `${x}%`);
      slot.style.setProperty('--my', `${y}%`);
    });
  });
}

function renderTable() {
  const tbody = document.querySelector('#results-table tbody');
  tbody.innerHTML = '';
  const entries = Object.entries(manifest)
    .filter(([name]) => name !== 'manifest.json')
    .sort((a, b) => a[1].bytes - b[1].bytes);
  for (const [name, m] of entries) {
    const ext = name.split('.').pop();
    const width = name.split('w.')[0];
    const tr = document.createElement('tr');
    tr.dataset.name = name;
    tr.innerHTML = `
      <td><code>${name}</code></td>
      <td class="format-${ext}">${ext.toUpperCase()}</td>
      <td>${width}px</td>
      <td>${fmt.bytes(m.bytes)}</td>
      <td data-cell="ms">측정 중…</td>
      <td data-cell="speed">-</td>
    `;
    tbody.appendChild(tr);
  }
}

async function measureAll({ bust = false } = {}) {
  const rows = document.querySelectorAll('#results-table tbody tr');
  const tasks = [];
  rows.forEach((row) => {
    const name = row.dataset.name;
    const url = bust ? bustUrl(`images/${name}`) : `images/${name}`;
    row.querySelector('[data-cell="ms"]').textContent = '로드 중…';
    row.querySelector('[data-cell="speed"]').textContent = '-';
    tasks.push(
      loadImage(url).then((r) => {
        const bytes = manifest[name]?.bytes;
        row.querySelector('[data-cell="ms"]').textContent = fmt.ms(r.ms);
        row.querySelector('[data-cell="speed"]').textContent = fmt.speed(
          bytes,
          r.ms,
        );
      }),
    );
  });
  await Promise.all(tasks);
}

async function refresh({ bust = false } = {}) {
  const figs = document.querySelectorAll('figure[data-src]');
  await Promise.all([...figs].map((f) => loadFigure(f, { bust })));
  await measureAll({ bust });
}

function updateEnv() {
  document.getElementById('dpr').textContent = window.devicePixelRatio;
  document.getElementById('vw').textContent = window.innerWidth;
}

document.addEventListener('DOMContentLoaded', async () => {
  updateEnv();
  window.addEventListener('resize', updateEnv);
  await loadManifest();
  renderTable();
  setupZoom();
  await refresh({ bust: false });

  document.getElementById('reload').addEventListener('click', () => {
    refresh({ bust: true });
  });
});
