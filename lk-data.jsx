// lk-data.jsx — palette, seed data, icon system, and shared UI atoms
const { useState, useEffect, useRef } = React;

/* ────────────────────────────────────────────────────────────
   Lucide icon renderer (vanilla UMD → React)
──────────────────────────────────────────────────────────── */
function getIconNode(name) {
  const L = window.lucide || {};
  const raw = (L.icons && L.icons[name]) || L[name] || null;
  // lucide UMD shape: ["svg", {attrs}, [ [tag, attrs], ... ]]
  if (Array.isArray(raw) && Array.isArray(raw[2])) return raw[2];
  return Array.isArray(raw) ? raw : null;
}
function camelAttr(k) {
  if (k.indexOf('-') === -1) return k;
  return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function Icon({ name, size = 22, stroke = 1.75, className = '', style = {} }) {
  const node = getIconNode(name);
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
    >
      {Array.isArray(node) && node.map((entry, i) => {
        const tag = entry[0];
        const raw = entry[1] || {};
        const attrs = { key: i };
        for (const k in raw) attrs[camelAttr(k)] = raw[k];
        return React.createElement(tag, attrs);
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   Garment colour tokens — soft, low-chroma Japandi tones
──────────────────────────────────────────────────────────── */
const FABRIC = {
  sage:   { fill: '#9DAE96', label: 'Sage' },
  cream:  { fill: '#E7DAC2', label: 'Cream' },
  oat:    { fill: '#D6C7AE', label: 'Oat' },
  clay:   { fill: '#C9A48C', label: 'Clay' },
  slate:  { fill: '#9FAAB0', label: 'Slate' },
  ink:    { fill: '#4A4744', label: 'Charcoal' },
  olive:  { fill: '#8C8B62', label: 'Olive' },
  mauve:  { fill: '#B89C9C', label: 'Mauve' },
  rust:   { fill: '#B07B5E', label: 'Rust' },
  fog:    { fill: '#BFC4BD', label: 'Fog' },
};

const CATEGORIES = ['Semua', 'Kaos', 'Kemeja', 'Celana', 'Jaket'];
// icon used as a faint watermark on the fabric tile, per category
const CAT_ICON = { Kaos: 'Shirt', Kemeja: 'Shirt', Celana: 'Shirt', Jaket: 'Shirt' };

const STATUS = { LEMARI: 'Di Lemari', CUCI: 'Sedang Cuci' };

let _id = 100;
const uid = (p = 'i') => `${p}${++_id}`;

const SEED_ITEMS = [
  { id: 'i1',  name: 'Kemeja Linen Sage',     category: 'Kemeja', color: 'sage',  status: STATUS.LEMARI },
  { id: 'i2',  name: 'Celana Chino Cream',    category: 'Celana', color: 'cream', status: STATUS.LEMARI },
  { id: 'i3',  name: 'Kaos Katun Oat',        category: 'Kaos',   color: 'oat',   status: STATUS.LEMARI },
  { id: 'i4',  name: 'Kemeja Oxford Slate',   category: 'Kemeja', color: 'slate', status: STATUS.LEMARI },
  { id: 'i5',  name: 'Jaket Corduroy Clay',   category: 'Jaket',  color: 'clay',  status: STATUS.LEMARI },
  { id: 'i6',  name: 'Kaos Polos Charcoal',   category: 'Kaos',   color: 'ink',   status: STATUS.LEMARI },
  { id: 'i7',  name: 'Celana Linen Olive',    category: 'Celana', color: 'olive', status: STATUS.LEMARI },
  { id: 'i8',  name: 'Kaos Henley Mauve',     category: 'Kaos',   color: 'mauve', status: STATUS.LEMARI },
  { id: 'i9',  name: 'Jaket Coach Fog',       category: 'Jaket',  color: 'fog',   status: STATUS.LEMARI },
  { id: 'i10', name: 'Kemeja Flanel Rust',    category: 'Kemeja', color: 'rust',  status: STATUS.LEMARI },
];

const COLOR_OPTIONS = Object.keys(FABRIC);

/* ────────────────────────────────────────────────────────────
   ClothingThumb — colour-blocked fabric tile (visual recall)
──────────────────────────────────────────────────────────── */
function ClothingThumb({ color, category, photo, size = 'lg' }) {
  const fab = FABRIC[color] || FABRIC.oat;
  const iconName = CAT_ICON[category] || 'Shirt';
  const iconSize = size === 'sm' ? 22 : 40;
  if (photo) {
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ background: fab.fill }}>
        <img src={photo} alt="" className="h-full w-full" style={{ objectFit: 'cover', display: 'block' }} draggable={false} />
      </div>
    );
  }
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: fab.fill,
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 9px)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
        <Icon name={iconName} size={iconSize} stroke={1.4} />
      </div>
      {/* soft top sheen */}
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)' }}></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   StatusTag
──────────────────────────────────────────────────────────── */
function StatusTag({ status, className = '' }) {
  const washing = status === STATUS.CUCI;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${className}`}
      style={{
        fontSize: 11.5,
        padding: '4px 9px',
        background: washing ? 'rgba(109,130,113,0.14)' : 'rgba(44,42,41,0.06)',
        color: washing ? '#566b5a' : 'var(--ink-60)',
        letterSpacing: '0.01em',
      }}
    >
      <span
        className="rounded-full"
        style={{ width: 6, height: 6, background: washing ? 'var(--sage)' : 'var(--ink-40)' }}
      ></span>
      {status}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Toast
──────────────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      key={toast.key}
      className="absolute left-1/2 z-[80] flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl"
      style={{
        bottom: 108,
        transform: 'translateX(-50%)',
        background: 'var(--ink)',
        color: '#FAF6F0',
        animation: 'lk-toast-in 0.34s cubic-bezier(0.22,0.61,0.36,1) both',
        maxWidth: 320,
        boxShadow: '0 12px 30px rgba(44,42,41,0.30)',
      }}
    >
      <span style={{ color: '#A9C0AC' }}><Icon name={toast.icon || 'Check'} size={18} stroke={2} /></span>
      <span style={{ fontSize: 14, lineHeight: 1.3 }}>{toast.msg}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Bottom navigation
──────────────────────────────────────────────────────────── */
const NAV = [
  { id: 'lemariku', label: 'Lemariku', icon: 'Shirt' },
  { id: 'kirim',   label: 'Kirim',   icon: 'Send' },
  { id: 'status',  label: 'Status',  icon: 'ClipboardCheck' },
];

function BottomNav({ active, onChange, washingCount }) {
  return (
    <div className="absolute inset-x-0 z-[70]" style={{ bottom: 0 }}>
      <div
        className="mx-auto flex items-stretch justify-around"
        style={{
          background: 'rgba(250,246,240,0.86)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          borderTop: '1px solid var(--line)',
          paddingTop: 8,
          paddingBottom: 30,
        }}
      >
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onChange(n.id)}
              className="relative flex flex-1 flex-col items-center gap-1 transition-colors"
              style={{ color: on ? 'var(--sage)' : 'var(--ink-40)' }}
            >
              <span className="relative">
                <Icon name={n.icon} size={23} stroke={on ? 2 : 1.6} />
                {n.id === 'status' && washingCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full"
                    style={{
                      top: -5, right: -8, minWidth: 16, height: 16, padding: '0 4px',
                      background: 'var(--sage)', color: '#fff', fontSize: 10, fontWeight: 700,
                    }}
                  >{washingCount}</span>
                )}
              </span>
              <span style={{ fontSize: 11, fontWeight: on ? 600 : 500, letterSpacing: '0.01em' }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* helpers */
/* downscale an uploaded image to a storable JPEG data URL */
function fileToScaledDataURL(file, max = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL('image/jpeg', quality)); } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

Object.assign(window, {
  Icon, FABRIC, CATEGORIES, CAT_ICON, STATUS, SEED_ITEMS, COLOR_OPTIONS, uid,
  ClothingThumb, StatusTag, Toast, BottomNav, NAV, fmtDate, fmtShort, todayISO, fileToScaledDataURL,
});
