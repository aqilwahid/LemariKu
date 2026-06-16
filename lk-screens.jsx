// lk-screens.jsx — screen shell, three screens, and modals

/* ────────────────────────────────────────────────────────────
   Shared shell + primitives
──────────────────────────────────────────────────────────── */
function ScreenShell({ title, subtitle, right, children, logo }) {
  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg)' }}>
      <div style={{ paddingTop: 60, paddingLeft: 22, paddingRight: 22, paddingBottom: 8 }}>
        <div className="flex items-end justify-between">
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center animate-fade-up" style={{ gap: 10 }}>
              {logo ? (
                <img src={logo} alt="" draggable={false} style={{ height: 100, objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                title && <h1 className="font-serif" style={{ fontSize: 38, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h1>
              )}
            </div>
            {subtitle && <p style={{ fontSize: 13.5, color: 'var(--ink-60)', marginTop: 7 }}>{subtitle}</p>}
          </div>
          {right}
        </div>
      </div>
      {children}
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick, icon, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.985] ${className}`}
      style={{
        background: disabled ? 'rgba(44,42,41,0.10)' : 'var(--sage)',
        color: disabled ? 'var(--ink-40)' : '#FAF6F0',
        padding: '15px 18px',
        fontSize: 15.5,
        boxShadow: disabled ? 'none' : '0 8px 20px rgba(109,130,113,0.32)',
      }}
    >
      {icon && <Icon name={icon} size={19} stroke={2} />}
      {children}
    </button>
  );
}

function Sheet({ open, onClose, children, maxH = '88%' }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[90] flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(36,34,32,0.42)', animation: 'lk-backdrop 0.25s ease both' }}
        onClick={onClose}
      ></div>
      <div
        className="relative lk-scroll overflow-y-auto"
        style={{
          background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
          maxHeight: maxH, animation: 'lk-sheet-in 0.36s cubic-bezier(0.22,0.61,0.36,1) both',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 38, height: 4.5, borderRadius: 99, background: 'rgba(44,42,41,0.16)' }}></div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-60)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ marginTop: 8 }}>{children}</div>
      {hint && <span style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 6, display: 'block' }}>{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl bg-white outline-none transition-shadow';
const inputStyle = {
  border: '1px solid var(--line)', padding: '13px 14px', fontSize: 15, color: 'var(--ink)',
};

/* Tap-to-upload photo tile — shows the real garment photo or the colour tile */
function PhotoTile({ photo, color, category, onPick, size = 'lg' }) {
  const inputRef = useRef(null);
  async function handle(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { const url = await fileToScaledDataURL(f); onPick(url); } catch (err) { /* ignore */ }
    e.target.value = '';
  }
  const badge = size === 'sm' ? 22 : 28;
  return (
    <div className="relative h-full w-full">
      <ClothingThumb photo={photo} color={color} category={category} size={size} />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        className="absolute inset-0 transition-colors"
        style={{ background: photo ? 'transparent' : 'transparent' }}
        aria-label={photo ? 'Ganti foto' : 'Unggah foto'}
      ></button>
      {photo ? (
        <span
          className="pointer-events-none absolute flex items-center justify-center rounded-full"
          style={{ right: 7, bottom: 7, width: badge, height: badge, background: 'rgba(44,42,41,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
        >
          <Icon name="Camera" size={size === 'sm' ? 12 : 15} stroke={2} />
        </span>
      ) : (
        size === 'sm' ? (
          <span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ right: 6, bottom: 6, width: badge, height: badge, background: 'rgba(255,255,255,0.6)', color: 'var(--ink-60)' }}>
            <Icon name="Camera" size={12} stroke={2} />
          </span>
        ) : (
          <span className="pointer-events-none absolute flex items-center gap-1.5 rounded-full" style={{ right: 8, bottom: 8, padding: '5px 10px', background: 'rgba(255,255,255,0.72)', color: 'var(--ink)', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
            <Icon name="Camera" size={13} stroke={2} /> Foto
          </span>
        )
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 1 — LEMARIKU (wardrobe catalog)
════════════════════════════════════════════════════════════ */
function Lemariku({ items, loading, onAdd, onOpenAdd, onUploadPhoto, userEmail, onOpenAccount, onOpenDetail, onOpenAutoAdd }) {
  const [cat, setCat] = useState('Semua');
  const [fabOpen, setFabOpen] = useState(false);
  const list = items.filter((it) => cat === 'Semua' || it.category === cat);

  const dynamicCategories = React.useMemo(() => {
    const base = ['Semua', 'Kaos', 'Kemeja', 'Celana', 'Jaket'];
    const itemCats = items.map(it => it.category).filter(Boolean);
    const unique = Array.from(new Set(itemCats));
    const extra = unique.filter(c => !['Kaos', 'Kemeja', 'Celana', 'Jaket'].includes(c));
    return [...base, ...extra];
  }, [items]);

  return (
    <ScreenShell
      title="Lemariku"
      logo="logo.png"
      subtitle={loading ? 'Memuat lemari…' : `${items.length} pakaian terkatalog`}
      right={
        <button
          onClick={onOpenAccount}
          className="flex items-center justify-center rounded-full transition-transform active:scale-90"
          style={{ width: 42, height: 42, background: 'var(--sage)', color: '#fff', fontSize: 17, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(109,130,113,0.35)' }}
          aria-label="Akun"
        >
          {(userEmail || '?').slice(0, 1)}
        </button>
      }
    >
      {/* category tabs */}
      <div className="lk-scroll flex gap-2 overflow-x-auto" style={{ padding: '6px 22px 10px' }}>
        {dynamicCategories.map((c) => {
          const on = cat === c;
          const n = c === 'Semua' ? items.length : items.filter((i) => i.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex shrink-0 items-center gap-1.5 rounded-full transition-all active:scale-95"
              style={{
                padding: '8px 14px', fontSize: 13.5, fontWeight: on ? 600 : 500,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? '#FAF6F0' : 'var(--ink-60)',
                border: on ? '1px solid var(--ink)' : '1px solid var(--line)',
              }}
            >
              {c}
              <span style={{ fontSize: 11, opacity: 0.6 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="lk-scroll flex-1 overflow-y-auto" style={{ padding: '4px 18px 120px' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: '70px 0' }}>
            <div className="lk-spin" style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid var(--sage-tint)', borderTopColor: 'var(--sage)' }}></div>
          </div>
        ) : list.length === 0 ? (
          items.length === 0
            ? <WardrobeOnboarding onStart={onOpenAdd} />
            : <EmptyState icon="Shirt" title="Belum ada di kategori ini" body="Coba kategori lain, atau tambah pakaian baru lewat tombol +." />
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {list.map((it, idx) => (
              <div
                key={it.id}
                className="overflow-hidden rounded-2xl transition-transform active:scale-[0.97] animate-fade-up"
                style={{ background: 'var(--card)', border: '1px solid rgba(44,42,41,0.05)', cursor: 'pointer', animationDelay: `${Math.min(idx * 0.035, 0.32)}s` }}
                onClick={() => onOpenDetail && onOpenDetail(it)}
              >
                <div style={{ aspectRatio: '1 / 1' }} onClick={(e) => e.stopPropagation()}>
                  <PhotoTile photo={it.photo} color={it.color} category={it.category} onPick={(url) => onUploadPhoto(it.id, url)} />
                </div>
                <div style={{ padding: '11px 12px 13px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>{it.category}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 3, lineHeight: 1.25 }}>{it.name}</div>
                  <div style={{ marginTop: 9 }}><StatusTag status={it.status} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB backdrop */}
      {fabOpen && (
        <div
          className="absolute inset-0 z-[55]"
          style={{ background: 'rgba(36,34,32,0.25)', animation: 'lk-backdrop 0.2s ease both' }}
          onClick={() => setFabOpen(false)}
        ></div>
      )}

      {/* FAB menu options */}
      {fabOpen && (
        <div className="absolute z-[60]" style={{ right: 20, bottom: 172 }}>
          {/* Otomatis option */}
          <button
            onClick={() => { setFabOpen(false); onOpenAutoAdd && onOpenAutoAdd(); }}
            className="flex items-center gap-3 transition-all active:scale-95"
            style={{
              marginBottom: 12,
              animation: 'lk-fab-item-in 0.28s cubic-bezier(0.22,0.61,0.36,1) 0.04s both',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF6F0', textShadow: '0 1px 4px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>Otomatis</span>
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: 46, height: 46, background: 'var(--ink)', color: '#FAF6F0', boxShadow: '0 6px 18px rgba(44,42,41,0.35)' }}
            >
              <Icon name="Sparkles" size={22} stroke={2} />
            </span>
          </button>

          {/* Manual option */}
          <button
            onClick={() => { setFabOpen(false); onOpenAdd(); }}
            className="flex items-center gap-3 transition-all active:scale-95"
            style={{
              animation: 'lk-fab-item-in 0.28s cubic-bezier(0.22,0.61,0.36,1) 0s both',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF6F0', textShadow: '0 1px 4px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>Manual</span>
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: 46, height: 46, background: 'var(--sage)', color: '#FAF6F0', boxShadow: '0 6px 18px rgba(109,130,113,0.35)' }}
            >
              <Icon name="PenLine" size={21} stroke={2} />
            </span>
          </button>
        </div>
      )}

      {/* FAB main button */}
      <button
        onClick={() => setFabOpen((prev) => !prev)}
        className="absolute z-[60] flex items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          right: 20, bottom: 104, width: 58, height: 58,
          background: 'var(--sage)', color: '#FAF6F0',
          boxShadow: '0 10px 26px rgba(109,130,113,0.45)',
          transition: 'transform 0.3s cubic-bezier(0.22,0.61,0.36,1)',
          transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        aria-label="Tambah Pakaian"
      >
        <Icon name="Plus" size={28} stroke={2.2} />
      </button>
    </ScreenShell>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '64px 30px' }}>
      <div className="flex items-center justify-center rounded-full" style={{ width: 72, height: 72, background: 'var(--card)', color: 'var(--ink-40)' }}>
        <Icon name={icon} size={30} stroke={1.5} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginTop: 18 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-60)', marginTop: 6, maxWidth: 230, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

/* Onboarding lemari kosong (kali pertama) — sambutan + alur 3 langkah */
function WardrobeOnboarding({ onStart }) {
  const steps = [
    { icon: 'Shirt', title: 'Katalog pakaianmu', body: 'Foto & catat tiap pakaian biar lemari rapi.' },
    { icon: 'Send', title: 'Kirim ke laundry', body: 'Pilih pakaian, catat jasa & estimasi selesai.' },
    { icon: 'ClipboardCheck', title: 'Pantau statusnya', body: 'Lacak yang sedang dicuci sampai kembali.' },
  ];
  return (
    <div className="animate-fade-up" style={{ padding: '12px 6px 0' }}>
      <div className="flex flex-col items-center text-center" style={{ marginBottom: 22 }}>
        <div className="flex items-center justify-center rounded-2xl" style={{ width: 66, height: 66, background: 'var(--sage-tint)', color: 'var(--sage)' }}>
          <Icon name="Sparkles" size={30} stroke={1.6} />
        </div>
        <h3 className="font-serif" style={{ fontSize: 23, color: 'var(--ink)', marginTop: 16, lineHeight: 1.15 }}>Selamat datang di LemariKu</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-60)', marginTop: 7, maxWidth: 260, lineHeight: 1.55 }}>
          Lemari digitalmu masih kosong. Yuk mulai dengan 3 langkah mudah:
        </p>
      </div>

      <div className="flex flex-col gap-2.5" style={{ marginBottom: 22 }}>
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="flex items-center gap-3.5 animate-fade-up"
            style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 15px', animationDelay: `${0.05 + i * 0.07}s` }}
          >
            <span className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 42, height: 42, background: 'var(--bg)', color: 'var(--sage)' }}>
              <Icon name={s.icon} size={20} stroke={1.8} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-40)' }}>{i + 1}</span>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-60)', marginTop: 2, lineHeight: 1.4 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>

      <PrimaryButton icon="Plus" onClick={onStart}>Tambah Pakaian Pertama</PrimaryButton>
      <p style={{ fontSize: 12, color: 'var(--ink-40)', textAlign: 'center', marginTop: 10 }}>
        Atau ketuk tombol <strong style={{ color: 'var(--ink-60)' }}>+</strong> di pojok kanan bawah kapan saja.
      </p>
    </div>
  );
}

/* ─── Add item modal ─── */
function AddItemSheet({ open, items = [], onClose, onSave }) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Kaos');
  const [color, setColor] = useState('sage');
  const [photo, setPhoto] = useState(null);

  // Custom category states
  const [isCustom, setIsCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const baseCats = ['Kaos', 'Kemeja', 'Celana', 'Jaket'];
  const allCats = React.useMemo(() => {
    const itemCats = items.map(it => it.category).filter(Boolean);
    const unique = Array.from(new Set(itemCats));
    const extra = unique.filter(c => !baseCats.includes(c));
    return [...baseCats, ...extra];
  }, [items]);

  useEffect(() => {
    if (open) {
      setName('');
      setCat('Kaos');
      setColor('sage');
      setPhoto(null);
      setIsCustom(false);
      setCustomVal('');
    }
  }, [open]);

  const resolvedCat = isCustom ? customVal.trim() : cat;
  const valid = name.trim().length > 0 && resolvedCat.length > 0;

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '8px 22px 26px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: 27, color: 'var(--ink)' }}>Tambah Pakaian</h2>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'var(--card)', color: 'var(--ink-60)' }}>
            <Icon name="X" size={18} stroke={2} />
          </button>
        </div>

        {/* live preview — tap tile to add a photo */}
        <div className="flex items-center gap-3.5" style={{ background: 'var(--card)', borderRadius: 18, padding: 12, marginBottom: 20 }}>
          <div className="overflow-hidden rounded-xl" style={{ width: 64, height: 64, flexShrink: 0 }}>
            <PhotoTile photo={photo} color={color} category={resolvedCat} onPick={setPhoto} size="sm" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>{resolvedCat || 'Kategori Baru'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{name.trim() || 'Nama pakaian…'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-40)', marginTop: 3 }}>{photo ? 'Ketuk foto untuk mengganti' : 'Ketuk untuk tambah foto'}</div>
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Field label="Nama Pakaian">
            <input
              className={inputCls} style={inputStyle}
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="cth. Kemeja Linen Sage" autoFocus
            />
          </Field>

          <Field label="Kategori">
            <div className="flex flex-wrap gap-2">
              {allCats.map((c) => {
                const on = !isCustom && cat === c;
                return (
                  <button
                    key={c} type="button" onClick={() => { setCat(c); setIsCustom(false); }}
                    className="rounded-full transition-all active:scale-95"
                    style={{
                      padding: '9px 16px', fontSize: 13.5, fontWeight: on ? 600 : 500,
                      background: on ? 'var(--sage)' : 'white', color: on ? '#fff' : 'var(--ink-60)',
                      border: on ? '1px solid var(--sage)' : '1px solid var(--line)',
                    }}
                  >{c}</button>
                );
              })}
              <button
                type="button" onClick={() => setIsCustom(true)}
                className="rounded-full transition-all active:scale-95"
                style={{
                  padding: '9px 16px', fontSize: 13.5, fontWeight: isCustom ? 600 : 500,
                  background: isCustom ? 'var(--sage)' : 'white', color: isCustom ? '#fff' : 'var(--ink-60)',
                  border: isCustom ? '1px solid var(--sage)' : '1px solid var(--line)',
                }}
              >
                + Kategori Baru
              </button>
            </div>

            {isCustom && (
              <div style={{ marginTop: 12 }}>
                <input
                  className={inputCls} style={inputStyle}
                  value={customVal} onChange={(e) => setCustomVal(e.target.value)}
                  placeholder="Tulis kategori baru... (cth. Outer, Jeans, Sepatu)"
                  autoFocus
                />
              </div>
            )}
          </Field>

          <Field label="Warna Kain">
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => {
                const on = color === c;
                return (
                  <button
                    key={c} onClick={() => setColor(c)}
                    className="relative rounded-full transition-transform active:scale-90"
                    style={{
                      width: 34, height: 34, background: FABRIC[c].fill,
                      boxShadow: on ? '0 0 0 2px var(--bg), 0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                    }}
                    aria-label={FABRIC[c].label}
                  >
                    {on && <span className="absolute inset-0 flex items-center justify-center" style={{ color: '#fff' }}><Icon name="Check" size={16} stroke={2.5} /></span>}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div style={{ marginTop: 26 }}>
          <PrimaryButton icon="Plus" disabled={!valid} onClick={() => valid && onSave({ name: name.trim(), category: resolvedCat, color, photo })}>
            Simpan Pakaian
          </PrimaryButton>
        </div>
      </div>
    </Sheet>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 2 — KIRIM LAUNDRY (selection flow)
════════════════════════════════════════════════════════════ */
function KirimLaundry({ items, selected, onToggle, vendor, setVendor, due, setDue, onProcess }) {
  const available = items.filter((it) => it.status === STATUS.LEMARI);
  const count = selected.size;
  const canProcess = count > 0 && vendor.trim().length > 0;

  return (
    <ScreenShell title="Kirim Laundry" subtitle="Pilih pakaian & catat jasa laundry">
      <div className="lk-scroll flex-1 overflow-y-auto" style={{ padding: '8px 22px 190px' }}>
        {/* vendor + date inputs */}
        <div className="flex flex-col gap-4" style={{ marginBottom: 22 }}>
          <Field label="Nama Jasa Laundry">
            <div className="relative">
              <span className="absolute" style={{ left: 13, top: 13, color: 'var(--ink-40)' }}><Icon name="Store" size={18} /></span>
              <input
                className={inputCls} style={{ ...inputStyle, paddingLeft: 40 }}
                value={vendor} onChange={(e) => setVendor(e.target.value)}
                placeholder="cth. Berkah Laundry"
              />
            </div>
          </Field>
          <Field label="Estimasi Selesai">
            <div className="relative">
              <span className="absolute" style={{ left: 13, top: 13, color: 'var(--ink-40)' }}><Icon name="Calendar" size={18} /></span>
              <input
                type="date" min={todayISO()}
                className={inputCls} style={{ ...inputStyle, paddingLeft: 40 }}
                value={due} onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-60)' }}>Pilih dari lemari</h3>
          <span style={{ fontSize: 12.5, color: 'var(--ink-40)' }}>{available.length} tersedia</span>
        </div>

        {available.length === 0 ? (
          <EmptyState icon="WashingMachine" title="Lemari sedang kosong" body="Semua pakaianmu sedang dicuci, atau belum ada yang dikatalog." />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {available.map((it) => {
              const on = selected.has(it.id);
              return (
                <button
                  key={it.id} onClick={() => onToggle(it.id)}
                  className="relative overflow-hidden rounded-2xl text-left transition-all active:scale-95"
                  style={{
                    border: on ? '2px solid var(--sage)' : '2px solid transparent',
                    boxShadow: on ? '0 6px 16px rgba(109,130,113,0.25)' : 'none',
                  }}
                >
                  <div style={{ aspectRatio: '1 / 1' }}>
                    <ClothingThumb color={it.color} category={it.category} photo={it.photo} size="sm" />
                  </div>
                  {/* select overlay */}
                  <div
                    className="absolute flex items-center justify-center rounded-full transition-all"
                    style={{
                      top: 6, right: 6, width: 24, height: 24,
                      background: on ? 'var(--sage)' : 'rgba(250,246,240,0.85)',
                      color: on ? '#fff' : 'var(--ink-40)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Icon name={on ? 'Check' : 'Plus'} size={15} stroke={2.4} />
                  </div>
                  <div style={{ padding: '7px 8px 9px', background: 'var(--card)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }} className="truncate">{it.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* sticky counter + process — muncul hanya saat ada pakaian dipilih */}
      <div
        className="absolute inset-x-0 z-[60]"
        style={{
          bottom: 92, padding: '0 18px',
          transform: count > 0 ? 'translateY(0)' : 'translateY(160%)',
          opacity: count > 0 ? 1 : 0,
          pointerEvents: count > 0 ? 'auto' : 'none',
          transition: 'transform 0.36s cubic-bezier(0.22,0.61,0.36,1), opacity 0.26s ease',
        }}
      >
        <div
          className="rounded-2xl"
          style={{ background: 'rgba(250,246,240,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--line)', boxShadow: '0 -2px 24px rgba(44,42,41,0.08)', padding: 12 }}
        >
          <div className="flex items-center justify-between" style={{ padding: '2px 6px 10px' }}>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center rounded-full font-bold" style={{ width: 30, height: 30, background: 'var(--sage)', color: '#fff', fontSize: 14 }}>{count}</span>
              <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>pakaian dipilih untuk dicuci</span>
            </div>
          </div>
          <PrimaryButton icon="Send" disabled={!canProcess} onClick={onProcess}>
            Proses &amp; Buat Daftar
          </PrimaryButton>
          {!canProcess && (
            <p style={{ fontSize: 11.5, color: 'var(--ink-40)', textAlign: 'center', marginTop: 9 }}>
              Isi nama jasa laundry dulu
            </p>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 3 — STATUS TRACKER
════════════════════════════════════════════════════════════ */
function StatusTracker({ batches, itemsById, onPDF, onShare, onComplete, goKirim }) {
  const [openId, setOpenId] = useState(batches.length ? batches[0].id : null);

  return (
    <ScreenShell title="Status" subtitle={`${batches.length} batch laundry berlangsung`}>
      <div className="lk-scroll flex-1 overflow-y-auto" style={{ padding: '8px 18px 120px' }}>
        {batches.length === 0 ? (
          <EmptyState icon="ClipboardCheck" title="Belum ada laundry aktif" body="Kirim pakaian ke laundry untuk membuat daftar pelacakan." />
        ) : (
          <div className="flex flex-col gap-3.5">
            {batches.map((b) => {
              const open = openId === b.id;
              const its = b.itemIds.map((id) => itemsById[id]).filter(Boolean);
              return (
                <div key={b.id} className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid rgba(44,42,41,0.05)' }}>
                  {/* header */}
                  <button onClick={() => setOpenId(open ? null : b.id)} className="flex w-full items-center gap-3 text-left" style={{ padding: '15px 16px' }}>
                    <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: 'var(--sage-tint)', color: 'var(--sage)' }}>
                      <Icon name="WashingMachine" size={22} stroke={1.7} />
                    </div>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{b.label}</span>
                        <StatusTag status={STATUS.CUCI} />
                      </div>
                      <div className="flex items-center gap-1.5" style={{ marginTop: 3, fontSize: 12.5, color: 'var(--ink-60)' }}>
                        <Icon name="Store" size={13} />
                        <span className="truncate">{b.vendor}</span>
                        <span style={{ color: 'var(--ink-40)' }}>·</span>
                        <span>{its.length} item</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--ink-40)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
                      <Icon name="ChevronDown" size={20} />
                    </span>
                  </button>

                  {/* due date strip */}
                  <div className="flex items-center gap-2" style={{ margin: '0 16px', padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-60)' }}>
                    <Icon name="CalendarClock" size={14} />
                    <span>Estimasi selesai <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{fmtDate(b.due)}</strong></span>
                  </div>

                  {/* expandable visual list */}
                  {open && (
                    <div style={{ padding: '6px 16px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-40)', margin: '6px 0 10px' }}>Isi batch — cek saat pengambilan</div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {its.map((it) => (
                          <div key={it.id} className="overflow-hidden rounded-xl" style={{ background: 'var(--bg)' }}>
                            <div style={{ aspectRatio: '1 / 1' }}><ClothingThumb color={it.color} category={it.category} photo={it.photo} size="sm" /></div>
                            <div style={{ padding: '5px 5px 7px', fontSize: 9.5, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }} className="truncate">{it.name.split(' ').slice(-1)[0]}</div>
                          </div>
                        ))}
                      </div>

                      {/* actions */}
                      <div className="flex gap-2.5" style={{ marginTop: 16 }}>
                        <button onClick={() => onPDF(b)} className="flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95" style={{ padding: '13px', fontSize: 13.5, background: 'var(--ink)', color: '#FAF6F0' }}>
                          <Icon name="FileText" size={17} stroke={2} /> Cetak PDF
                        </button>
                        <button onClick={() => onShare(b)} className="flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95" style={{ padding: '13px', fontSize: 13.5, background: 'white', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                          <Icon name="Share2" size={17} stroke={2} /> Bagikan
                        </button>
                      </div>
                      <button onClick={() => onComplete(b)} className="flex w-full items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95" style={{ marginTop: 10, padding: '12px', fontSize: 13, background: 'transparent', color: 'var(--sage)' }}>
                        <Icon name="PackageCheck" size={17} stroke={2} /> Tandai Selesai &amp; Ambil
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

/* ─── PDF / receipt modal (preview di layar) ─── */
function ReceiptModal({ batch, itemsById, onClose, onDownload }) {
  if (!batch) return null;
  const its = batch.itemIds.map((id) => itemsById[id]).filter(Boolean);
  return (
    <Sheet open={!!batch} onClose={onClose}>
      <div style={{ padding: '8px 22px 26px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2 className="font-serif" style={{ fontSize: 26, color: 'var(--ink)' }}>Catatan Laundry</h2>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'var(--card)', color: 'var(--ink-60)' }}>
            <Icon name="X" size={18} stroke={2} />
          </button>
        </div>

        {/* paper note — masthead tegas + tabel jelas */}
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid var(--ink)', boxShadow: '0 10px 28px rgba(44,42,41,0.12)', overflow: 'hidden' }}>
          {/* masthead */}
          <div className="flex items-center justify-between" style={{ background: 'var(--ink)', color: '#FAF6F0', padding: '15px 20px' }}>
            <span className="font-serif" style={{ fontSize: 21, fontWeight: 700 }}>LemariKu</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1.5px solid rgba(250,246,240,0.5)', borderRadius: 6, padding: '4px 8px' }}>Tanda Terima</span>
          </div>

          {/* meta */}
          <div style={{ padding: '4px 20px' }}>
            <ReceiptMeta label="Jasa Laundry" value={batch.vendor} strong />
            <ReceiptMeta label="Estimasi Selesai" value={fmtShort(batch.due)} />
            <ReceiptMeta label="Total Pakaian" value={`${its.length} item`} last />
          </div>

          {/* daftar */}
          <div style={{ padding: '4px 20px 14px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)', padding: '10px 0 8px', borderTop: '1.5px solid var(--ink)' }}>Isi cucian · centang saat ambil</div>
            {its.map((it, i) => (
              <div key={it.id} className="flex items-center gap-3" style={{ padding: '9px 0', borderBottom: i < its.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-40)', width: 18, flexShrink: 0 }}>{i + 1}</span>
                <div className="overflow-hidden rounded-lg" style={{ width: 34, height: 34, flexShrink: 0 }}><ClothingThumb color={it.color} category={it.category} photo={it.photo} size="sm" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }} className="truncate">{it.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-40)' }}>{it.category}</div>
                </div>
                <span className="rounded" style={{ width: 18, height: 18, border: '1.5px solid var(--ink-40)', flexShrink: 0 }}></span>
              </div>
            ))}
          </div>
          <div style={{ padding: '11px 20px', background: 'var(--bg)', borderTop: '1px dashed rgba(44,42,41,0.2)', fontSize: 11, color: 'var(--ink-40)', textAlign: 'center' }}>
            Dibuat {fmtShort(batch.created)} · Cocokkan daftar ini saat pengambilan
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <PrimaryButton icon="Printer" onClick={() => onDownload(batch)}>Cetak / Simpan PDF</PrimaryButton>
          <p style={{ fontSize: 11.5, color: 'var(--ink-40)', textAlign: 'center', marginTop: 9 }}>
            Akan membuka dialog cetak — pilih “Simpan sebagai PDF”.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function ReceiptMeta({ label, value, strong, last }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <span style={{ fontSize: 11.5, color: 'var(--ink-40)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: strong ? 15.5 : 13.5, fontWeight: strong ? 700 : 600, color: 'var(--ink)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* ─── PrintReceipt — markup khusus cetak (A4, hitam-putih tegas) ───
   Dirender lewat portal ke #lk-print di luar frame iOS, lalu dipanggil
   window.print(). Lihat aturan @media print di index.html. */
function PrintReceipt({ batch, itemsById }) {
  if (!batch) return null;
  const its = batch.itemIds.map((id) => itemsById[id]).filter(Boolean);
  const cell = { border: '1px solid #2C2A29', padding: '8px 10px', fontSize: 12, textAlign: 'left', verticalAlign: 'middle' };
  const head = { ...cell, background: '#2C2A29', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: '#2C2A29', maxWidth: 720, margin: '0 auto' }}>
      {/* masthead */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '3px solid #2C2A29' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>LemariKu</div>
          <div style={{ fontSize: 12, color: '#6b6764', marginTop: 4 }}>Tanda Terima Laundry</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5 }}>
          <div><strong>No.</strong> {batch.label || '—'}</div>
          <div style={{ color: '#6b6764' }}>Kode {batch.code}</div>
        </div>
      </div>

      {/* meta */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0 18px' }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: '25%', color: '#6b6764' }}>Jasa Laundry</td>
            <td style={{ ...cell, width: '25%', fontWeight: 700 }}>{batch.vendor}</td>
            <td style={{ ...cell, width: '25%', color: '#6b6764' }}>Estimasi Selesai</td>
            <td style={{ ...cell, width: '25%', fontWeight: 700 }}>{fmtDate(batch.due)}</td>
          </tr>
          <tr>
            <td style={{ ...cell, color: '#6b6764' }}>Tanggal Dibuat</td>
            <td style={cell}>{fmtDate(batch.created)}</td>
            <td style={{ ...cell, color: '#6b6764' }}>Total Pakaian</td>
            <td style={{ ...cell, fontWeight: 700 }}>{its.length} item</td>
          </tr>
        </tbody>
      </table>

      {/* daftar pakaian */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...head, width: 36, textAlign: 'center' }}>No</th>
            <th style={head}>Pakaian</th>
            <th style={{ ...head, width: 120 }}>Kategori</th>
            <th style={{ ...head, width: 110 }}>Warna</th>
            <th style={{ ...head, width: 80, textAlign: 'center' }}>Diterima</th>
          </tr>
        </thead>
        <tbody>
          {its.map((it, i) => {
            const fab = FABRIC[it.color] || FABRIC.oat;
            return (
              <tr key={it.id}>
                <td style={{ ...cell, textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ ...cell, fontWeight: 600 }}>{it.name}</td>
                <td style={cell}>{it.category}</td>
                <td style={cell}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: fab.fill, border: '1px solid rgba(0,0,0,0.25)', display: 'inline-block', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></span>
                    {fab.label}
                  </span>
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <span style={{ width: 15, height: 15, border: '1.5px solid #2C2A29', borderRadius: 3, display: 'inline-block' }}></span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* tanda tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 40 }}>
        {['Penyetor', 'Penerima Laundry'].map((r) => (
          <div key={r} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #2C2A29', height: 48 }}></div>
            <div style={{ fontSize: 11.5, color: '#6b6764', marginTop: 6 }}>{r}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10.5, color: '#9a9693', marginTop: 28 }}>
        Cocokkan daftar ini saat pengambilan cucian · Dibuat dengan LemariKu
      </div>
    </div>
  );
}

/* ─── Share modal ─── */
function ShareModal({ batch, onClose, onCopy, onToast }) {
  if (!batch) return null;
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.indexOf('http') === 0)
    ? window.location.origin
    : 'https://lemari-ku.vercel.app';
  const link = `${origin}/l/${batch.code}`;
  const display = link.replace(/^https?:\/\//, '');
  const message = `Daftar laundry ${batch.itemIds.length} pakaian di ${batch.vendor}. Lihat & cocokkan di sini:\n${link}`;

  function shareVia(name) {
    if (name === 'Salin') { onCopy(link); return; }
    if (name === 'WhatsApp') {
      window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
      return;
    }
    if (name === 'Email') {
      window.location.href = 'mailto:?subject=' + encodeURIComponent(`Daftar laundry — ${batch.vendor}`) + '&body=' + encodeURIComponent(message);
      return;
    }
    // Lainnya → share sheet bawaan perangkat jika ada
    if (navigator.share) {
      navigator.share({ title: 'Daftar Laundry — LemariKu', text: message, url: link }).catch(() => {});
    } else {
      onCopy(link);
    }
  }

  const targets = [
    { name: 'WhatsApp', icon: 'MessageCircle', tint: '#5A8A6A' },
    { name: 'Salin', icon: 'Copy', tint: '#2C2A29' },
    { name: 'Email', icon: 'Mail', tint: '#8C6F5A' },
    { name: 'Lainnya', icon: 'Share2', tint: '#6D8271' },
  ];
  return (
    <Sheet open={!!batch} onClose={onClose} maxH="66%">
      <div style={{ padding: '8px 22px 30px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: 26, color: 'var(--ink)' }}>Bagikan Tautan</h2>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'var(--card)', color: 'var(--ink-60)' }}>
            <Icon name="X" size={18} stroke={2} />
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--ink-60)', marginBottom: 16, lineHeight: 1.5 }}>
          Tautan berisi daftar visual {batch.itemIds.length} pakaian di <strong style={{ color: 'var(--ink)' }}>{batch.vendor}</strong> — bisa dibuka tanpa aplikasi.
        </p>
        <div className="flex items-center gap-2" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, padding: '12px 14px' }}>
          <Icon name="Link" size={17} className="shrink-0" style={{ color: 'var(--ink-40)' }} />
          <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
          <button onClick={() => onCopy(link)} className="rounded-lg font-semibold transition-all active:scale-95" style={{ padding: '8px 12px', fontSize: 12.5, background: 'var(--sage)', color: '#fff' }}>Salin</button>
        </div>

        <div className="grid grid-cols-4 gap-3" style={{ marginTop: 22 }}>
          {targets.map((t) => (
            <button
              key={t.name}
              onClick={() => shareVia(t.name)}
              className="flex flex-col items-center gap-2 transition-transform active:scale-90"
            >
              <span className="flex items-center justify-center rounded-2xl" style={{ width: 54, height: 54, background: 'var(--card)', color: t.tint }}>
                <Icon name={t.icon} size={23} stroke={1.8} />
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-60)' }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ─── Item detail / delete bottom sheet ─── */
function ItemDetailSheet({ item, onClose, onDelete, onUploadPhoto }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) { setConfirmDelete(false); setDeleting(false); }
  }, [item]);

  if (!item) return null;

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(item.id); } catch (e) { setDeleting(false); }
  }

  const isWashing = item.status === STATUS.CUCI;

  return (
    <Sheet open={!!item} onClose={onClose} maxH="78%">
      <div style={{ padding: '8px 22px 30px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: 26, color: 'var(--ink)' }}>Detail Pakaian</h2>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'var(--card)', color: 'var(--ink-60)' }}>
            <Icon name="X" size={18} stroke={2} />
          </button>
        </div>

        {/* Item preview card */}
        <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid rgba(44,42,41,0.05)', marginBottom: 20 }}>
          <div style={{ aspectRatio: '16 / 10' }}>
            <PhotoTile photo={item.photo} color={item.color} category={item.category} onPick={(url) => onUploadPhoto(item.id, url)} />
          </div>
          <div style={{ padding: '14px 16px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>{item.category}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{item.name}</div>
            <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
              <StatusTag status={item.status} />
              <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--ink-40)' }}>
                <span className="rounded-full" style={{ width: 16, height: 16, background: (FABRIC[item.color] || FABRIC.oat).fill, border: '1px solid rgba(0,0,0,0.08)', display: 'inline-block', flexShrink: 0 }}></span>
                {(FABRIC[item.color] || FABRIC.oat).label}
              </div>
            </div>
          </div>
        </div>

        {/* Delete button */}
        {isWashing ? (
          <div className="flex items-center gap-2.5 rounded-2xl" style={{ padding: '14px 16px', background: 'rgba(109,130,113,0.08)', color: 'var(--ink-60)', fontSize: 13.5 }}>
            <Icon name="Info" size={18} stroke={2} />
            <span>Pakaian sedang dicuci — tidak bisa dihapus sampai selesai.</span>
          </div>
        ) : (
          <div>
            {confirmDelete ? (
              <div className="animate-fade-up" style={{ background: 'rgba(180,69,60,0.06)', borderRadius: 18, padding: '16px 18px', border: '1px solid rgba(180,69,60,0.15)' }}>
                <p style={{ fontSize: 14.5, color: '#8a3530', fontWeight: 600, marginBottom: 4 }}>Hapus "{item.name}"?</p>
                <p style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5, marginBottom: 14 }}>Pakaian ini akan dihapus permanen dari lemarimu dan tidak bisa dikembalikan.</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95"
                    style={{ padding: '13px', fontSize: 14, background: '#b4453c', color: '#fff', opacity: deleting ? 0.6 : 1 }}
                  >
                    <Icon name="Trash2" size={17} stroke={2} />
                    {deleting ? 'Menghapus…' : 'Ya, Hapus'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95"
                    style={{ padding: '13px', fontSize: 14, background: 'white', color: 'var(--ink)', border: '1px solid var(--line)' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.985]"
                style={{ padding: '14px', fontSize: 15, background: 'white', color: '#b4453c', border: '1px solid rgba(180,69,60,0.2)' }}
              >
                <Icon name="Trash2" size={18} stroke={2} />
                Hapus Pakaian
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

Object.assign(window, {
  ScreenShell, PrimaryButton, Sheet, Field, EmptyState, PhotoTile,
  Lemariku, AddItemSheet, KirimLaundry, StatusTracker, ReceiptModal, ShareModal,
  ItemDetailSheet, PrintReceipt,
});
