// lk-app.jsx — auth gate, root state tersinkron ke Supabase, navigasi, mounting

/* ════════════════════════════════════════════════════════════
   APP (setelah login) — data dimuat & disimpan ke Supabase
════════════════════════════════════════════════════════════ */
function App({ session }) {
  const userEmail = (session && session.user && session.user.email) || "";

  const [screen, setScreen] = useState("lemariku");
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // kirim flow
  const [selected, setSelected] = useState(new Set());
  const [vendor, setVendor] = useState("");
  const [due, setDue] = useState("");

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [receiptBatch, setReceiptBatch] = useState(null);
  const [shareBatch, setShareBatch] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(msg, icon = "Check") {
    clearTimeout(toastTimer.current);
    setToast({ msg, icon, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  // muat data milik user dari Supabase saat login
  useEffect(() => {
    let alive = true;
    setLoading(true);
    LK_API.loadAll()
      .then(({ items, batches }) => {
        if (!alive) return;
        setItems(items);
        setBatches(batches);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
        showToast("Gagal memuat data", "TriangleAlert");
      });
    return () => { alive = false; };
  }, []);

  const itemsById = {};
  items.forEach((it) => { itemsById[it.id] = it; });
  const washingCount = items.filter((it) => it.status === STATUS.CUCI).length;
  const nextSeq = batches.reduce((m, b) => Math.max(m, b.seq || 0), 0) + 1;

  /* ─── handlers ─── */
  async function handleAdd({ name, category, color, photo }) {
    try {
      const row = await LK_API.createItem({ name, category, color, photo, status: STATUS.LEMARI });
      setItems((prev) => [row, ...prev]);
      setAddOpen(false);
      showToast(`"${name}" ditambahkan ke lemari`, "Plus");
    } catch (e) {
      showToast("Gagal menyimpan pakaian", "TriangleAlert");
    }
  }

  async function handleUploadPhoto(id, photo) {
    const snapshot = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo } : it))); // optimistik
    try {
      await LK_API.updateItem(id, { photo });
      showToast("Foto pakaian disimpan", "Camera");
    } catch (e) {
      setItems(snapshot); // balikkan jika gagal
      showToast("Gagal menyimpan foto", "TriangleAlert");
    }
  }

  async function handleUpdateItem(id, patch) {
    const snapshot = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))); // optimistik
    try {
      await LK_API.updateItem(id, patch);
      setDetailItem(null);
      showToast("Pakaian diperbarui", "Check");
    } catch (e) {
      setItems(snapshot); // balikkan jika gagal
      showToast("Gagal memperbarui pakaian", "TriangleAlert");
      throw e;
    }
  }

  async function handleReassignCategory(oldVal, newVal) {
    if (oldVal === newVal) return;
    const snapshot = items;
    setItems((prev) => prev.map((it) => (it.category === oldVal ? { ...it, category: newVal } : it))); // optimistik
    try {
      await LK_API.reassignItems("category", oldVal, newVal);
      showToast(`Kategori "${oldVal}" dihapus`, "Trash2");
    } catch (e) {
      setItems(snapshot);
      showToast("Gagal menghapus kategori", "TriangleAlert");
    }
  }

  async function handleReassignColor(oldVal, newVal) {
    if (oldVal === newVal) return;
    const snapshot = items;
    setItems((prev) => prev.map((it) => (it.color === oldVal ? { ...it, color: newVal } : it))); // optimistik
    try {
      await LK_API.reassignItems("color", oldVal, newVal);
      showToast("Warna dihapus", "Trash2");
    } catch (e) {
      setItems(snapshot);
      showToast("Gagal menghapus warna", "TriangleAlert");
    }
  }

  async function handleDelete(id) {
    const item = items.find((it) => it.id === id);
    try {
      await LK_API.deleteItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setDetailItem(null);
      showToast(`"${item ? item.name : 'Item'}" dihapus dari lemari`, 'Trash2');
    } catch (e) {
      showToast('Gagal menghapus pakaian', 'TriangleAlert');
      throw e;
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleProcess() {
    const ids = [...selected];
    if (!ids.length || !vendor.trim()) return;
    const seq = nextSeq;
    try {
      const batch = await LK_API.createBatch({
        label: `Batch #${seq}`,
        vendor: vendor.trim(),
        due: due || todayISO(),
        item_ids: ids,
        code: Math.random().toString(36).slice(2, 8),
        seq,
        created: todayISO(),
      });
      await LK_API.setItemsStatus(ids, STATUS.CUCI);
      setBatches((prev) => [batch, ...prev]);
      setItems((prev) => prev.map((it) => (selected.has(it.id) ? { ...it, status: STATUS.CUCI } : it)));
      setSelected(new Set());
      setVendor("");
      setDue("");
      setScreen("status");
      showToast(`${ids.length} pakaian dikirim ke ${batch.vendor}`, "WashingMachine");
    } catch (e) {
      showToast("Gagal memproses laundry", "TriangleAlert");
    }
  }

  async function handleComplete(batch) {
    try {
      await LK_API.setItemsStatus(batch.itemIds, STATUS.LEMARI);
      await LK_API.deleteBatch(batch.id);
      setItems((prev) => prev.map((it) => (batch.itemIds.includes(it.id) ? { ...it, status: STATUS.LEMARI } : it)));
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      showToast("Pakaian sudah diambil & kembali ke lemari", "PackageCheck");
    } catch (e) {
      showToast("Gagal menyelesaikan batch", "TriangleAlert");
    }
  }

  function handleDownload(batch) {
    // Struk sudah dirender ke #lk-print (portal). Buka dialog cetak browser —
    // dari sana user bisa pilih "Simpan sebagai PDF".
    window.print();
  }

  function handleCopy(link) {
    try {
      navigator.clipboard && navigator.clipboard.writeText(link);
    } catch (e) { /* ignore */ }
    showToast("Tautan disalin ke clipboard", "Link");
  }

  async function handleLogout() {
    setAccountOpen(false);
    try { await LK_API.signOut(); } catch (e) { /* Root menampilkan login lewat onAuthChange */ }
  }

  /* ─── render layar aktif ─── */
  let body = null;
  if (screen === "lemariku") {
    body = (
      <Lemariku
        items={items} loading={loading}
        onAdd={handleAdd} onOpenAdd={() => setAddOpen(true)} onUploadPhoto={handleUploadPhoto}
        userEmail={userEmail} onOpenAccount={() => setAccountOpen(true)}
        onOpenDetail={setDetailItem}
        onOpenAutoAdd={() => showToast('Fitur Otomatis segera hadir!', 'Sparkles')}
      />
    );
  } else if (screen === "kirim") {
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
        goKirim={() => setScreen("kirim")}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <div key={screen} className="h-full lk-screen-in">{body}</div>

      <BottomNav active={screen} onChange={setScreen} washingCount={washingCount} />

      <AddItemSheet open={addOpen} items={items} onClose={() => setAddOpen(false)} onSave={handleAdd} onReassignCategory={handleReassignCategory} onReassignColor={handleReassignColor} />
      <ReceiptModal batch={receiptBatch} itemsById={itemsById} onClose={() => setReceiptBatch(null)} onDownload={handleDownload} />
      <ShareModal batch={shareBatch} onClose={() => setShareBatch(null)} onCopy={handleCopy} onToast={showToast} />
      <AccountSheet open={accountOpen} email={userEmail} onClose={() => setAccountOpen(false)} onLogout={handleLogout} />
      <ItemDetailSheet item={detailItem} items={items} onClose={() => setDetailItem(null)} onDelete={handleDelete} onUploadPhoto={handleUploadPhoto} onUpdate={handleUpdateItem} />

      {/* Struk khusus cetak → portal ke #lk-print (di luar frame iOS) */}
      {receiptBatch && typeof document !== "undefined" && document.getElementById("lk-print") &&
        ReactDOM.createPortal(
          <PrintReceipt batch={receiptBatch} itemsById={itemsById} />,
          document.getElementById("lk-print")
        )}

      <Toast toast={toast} />
    </div>
  );
}

/* ─── Sheet akun (info user + keluar) ─── */
function AccountSheet({ open, email, onClose, onLogout }) {
  return (
    <Sheet open={open} onClose={onClose} maxH="52%">
      <div style={{ padding: "8px 22px 30px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: 26, color: "var(--ink)" }}>Akun</h2>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: "var(--card)", color: "var(--ink-60)" }}>
            <Icon name="X" size={18} stroke={2} />
          </button>
        </div>
        <div className="flex items-center gap-3" style={{ background: "var(--card)", borderRadius: 16, padding: 14, marginBottom: 18 }}>
          <span className="flex items-center justify-center rounded-full" style={{ width: 46, height: 46, background: "var(--sage)", color: "#fff", fontSize: 19, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{(email || "?").slice(0, 1)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--ink-40)" }}>Masuk sebagai</div>
            <div className="truncate" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.985]" style={{ padding: "14px", fontSize: 15, background: "white", color: "#b4453c", border: "1px solid var(--line)" }}>
          <Icon name="LogOut" size={18} stroke={2} /> Keluar
        </button>
      </div>
    </Sheet>
  );
}

/* ════════════════════════════════════════════════════════════
   AUTH GATE — menentukan layar: konfigurasi / loading / login / app
════════════════════════════════════════════════════════════ */
function LoadingScreen({ label }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="lk-spin" style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid var(--sage-tint)", borderTopColor: "var(--sage)" }}></div>
      <p style={{ fontSize: 13.5, color: "var(--ink-60)", marginTop: 16 }}>{label || "Memuat…"}</p>
    </div>
  );
}

function ConfigNeeded() {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--bg)", paddingTop: 72 }}>
      <div className="lk-scroll flex-1 overflow-y-auto" style={{ padding: "0 26px 40px" }}>
        <div className="flex items-center justify-center rounded-2xl" style={{ width: 58, height: 58, background: "var(--sage-tint)", color: "var(--sage)" }}>
          <Icon name="Database" size={28} stroke={1.6} />
        </div>
        <h1 className="font-serif" style={{ fontSize: 33, color: "var(--ink)", marginTop: 16, lineHeight: 1.05 }}>Hampir siap</h1>
        <p style={{ fontSize: 14, color: "var(--ink-60)", marginTop: 10, lineHeight: 1.55 }}>
          Login &amp; database belum terhubung. Buka file <strong>lk-config.js</strong> lalu isi
          {" "}<strong>SUPABASE_URL</strong> dan <strong>SUPABASE_ANON_KEY</strong> dari proyek Supabase-mu.
        </p>
        <div style={{ marginTop: 16, background: "var(--card)", borderRadius: 14, padding: "14px 16px", fontSize: 12.5, color: "var(--ink-60)", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Langkah singkat</div>
          1. Buat proyek gratis di supabase.com<br />
          2. Jalankan isi <strong>supabase-setup.sql</strong> di SQL Editor<br />
          3. Salin Project URL + anon key ke <strong>lk-config.js</strong><br />
          4. Matikan “Confirm email” di Authentication → Providers
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-40)", marginTop: 14 }}>Panduan lengkap ada di README.</p>
      </div>
    </div>
  );
}

function Root() {
  const [session, setSession] = useState(undefined); // undefined=cek, null=belum login
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (!window.sb) return;
    const url = new URL(window.location.href);
    const hash = window.location.hash || "";
    const isRecovery =
      url.searchParams.get("type") === "recovery" ||
      window.location.search.includes("type=recovery") ||
      hash.includes("type=recovery") ||
      hash.includes("access_token=");

    let sub;
    async function initAuth() {
      if (isRecovery) {
        setShowReset(true);
        const { data } = await LK_API.getSessionFromUrl();
        if (data && data.session) {
          setSession(data.session);
        }
      }
      LK_API.getSession().then((s) => setSession(s || null)).catch(() => setSession(null));
    }

    initAuth();
    sub = LK_API.onAuthChange((s) => setSession(s || null));
    return () => { if (sub && sub.unsubscribe) sub.unsubscribe(); };
  }, []);

  if (!window.sb) return <ConfigNeeded />;
  if (showReset) return <PasswordResetScreen onComplete={() => setShowReset(false)} />;
  if (session === undefined) return <LoadingScreen label="Menyiapkan…" />;
  if (!session) return <AuthScreen />;
  return <App session={session} key={session.user ? session.user.id : "app"} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <IOSDevice>
    <Root />
  </IOSDevice>
);
