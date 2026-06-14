// lk-app.jsx — root state, navigation, mounting
const LK_STORE = 'lemariku_state_v1';
function lkLoad() {
  try { const r = JSON.parse(localStorage.getItem(LK_STORE)); if (r && Array.isArray(r.items)) return r; } catch (e) { /* ignore */ }
  return null;
}
const LK_SAVED = lkLoad();

function App() {
  const [screen, setScreen] = useState('lemariku');
  const [items, setItems] = useState(LK_SAVED ? LK_SAVED.items : SEED_ITEMS);
  const [batches, setBatches] = useState(LK_SAVED ? LK_SAVED.batches : []);
  const [batchSeq, setBatchSeq] = useState(LK_SAVED ? LK_SAVED.batchSeq : 1);

  // persist wardrobe + batches (incl. uploaded photos) across reloads
  useEffect(() => {
    try { localStorage.setItem(LK_STORE, JSON.stringify({ items, batches, batchSeq })); } catch (e) { /* quota — keeps working in-session */ }
  }, [items, batches, batchSeq]);

  // kirim flow state
  const [selected, setSelected] = useState(new Set());
  const [vendor, setVendor] = useState('');
  const [due, setDue] = useState('');

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [receiptBatch, setReceiptBatch] = useState(null);
  const [shareBatch, setShareBatch] = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(msg, icon = 'Check') {
    clearTimeout(toastTimer.current);
    setToast({ msg, icon, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const itemsById = {};
  items.forEach((it) => { itemsById[it.id] = it; });
  const washingCount = items.filter((it) => it.status === STATUS.CUCI).length;

  /* ─── handlers ─── */
  function handleAdd({ name, category, color, photo }) {
    const item = { id: uid(), name, category, color, photo: photo || null, status: STATUS.LEMARI };
    setItems((prev) => [item, ...prev]);
    setAddOpen(false);
    showToast(`"${name}" ditambahkan ke lemari`, 'Plus');
  }

  function handleUploadPhoto(id, photo) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo } : it)));
    showToast('Foto pakaian disimpan', 'Camera');
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleProcess() {
    const ids = [...selected];
    if (!ids.length || !vendor.trim()) return;
    const label = `Batch #${batchSeq}`;
    const batch = {
      id: uid('b'),
      label,
      vendor: vendor.trim(),
      due: due || todayISO(),
      itemIds: ids,
      created: todayISO(),
      code: Math.random().toString(36).slice(2, 8),
    };
    setBatches((prev) => [batch, ...prev]);
    setBatchSeq((n) => n + 1);
    setItems((prev) => prev.map((it) => (selected.has(it.id) ? { ...it, status: STATUS.CUCI } : it)));
    setSelected(new Set());
    setVendor('');
    setDue('');
    setScreen('status');
    showToast(`${ids.length} pakaian dikirim ke ${batch.vendor}`, 'WashingMachine');
  }

  function handleComplete(batch) {
    setItems((prev) => prev.map((it) => (batch.itemIds.includes(it.id) ? { ...it, status: STATUS.LEMARI } : it)));
    setBatches((prev) => prev.filter((b) => b.id !== batch.id));
    showToast('Pakaian sudah diambil & kembali ke lemari', 'PackageCheck');
  }

  function handleDownload(batch) {
    setReceiptBatch(null);
    showToast('PDF tersimpan ke perangkat', 'FileCheck');
  }

  function handleCopy(link) {
    try {
      navigator.clipboard && navigator.clipboard.writeText(link);
    } catch (e) { /* ignore */ }
    showToast('Tautan disalin ke clipboard', 'Link');
  }

  /* ─── render active screen ─── */
  let body = null;
  if (screen === 'lemariku') {
    body = <Lemariku items={items} onAdd={handleAdd} onOpenAdd={() => setAddOpen(true)} onUploadPhoto={handleUploadPhoto} />;
  } else if (screen === 'kirim') {
    body = (
      <KirimLaundry
        items={items} selected={selected} onToggle={toggleSelect}
        vendor={vendor} setVendor={setVendor} due={due} setDue={setDue}
        onProcess={handleProcess}
      />
    );
  } else {
    body = (
      <StatusTracker
        batches={batches} itemsById={itemsById}
        onPDF={setReceiptBatch} onShare={setShareBatch} onComplete={handleComplete}
        goKirim={() => setScreen('kirim')}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div key={screen} className="h-full">
        {body}
      </div>

      <BottomNav active={screen} onChange={setScreen} washingCount={washingCount} />

      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} />
      <ReceiptModal batch={receiptBatch} itemsById={itemsById} onClose={() => setReceiptBatch(null)} onDownload={handleDownload} />
      <ShareModal batch={shareBatch} onClose={() => setShareBatch(null)} onCopy={handleCopy} onToast={showToast} />

      <Toast toast={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <IOSDevice>
    <App />
  </IOSDevice>
);
