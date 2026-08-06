// lk-api.jsx — lapisan akses data (Supabase): autentikasi + CRUD lemari & batch.
// Semua query otomatis dibatasi ke data milik user yang login (lihat RLS di
// supabase-setup.sql), jadi tiap orang hanya melihat lemarinya sendiri.

const sb = window.sb; // di-set oleh lk-config.js sebelum script ini jalan

/* ── pemetaan baris DB → bentuk yang dipakai UI ── */
function _mapItem(r) {
  return {
    id: r.id, name: r.name, category: r.category,
    color: r.color, photo: r.photo, status: r.status,
  };
}
function _mapBatch(r) {
  return {
    id: r.id, label: r.label, vendor: r.vendor, due: r.due,
    itemIds: r.item_ids || [], code: r.code, seq: r.seq, created: r.created,
  };
}

const LK_API = {
  /* ───────── Autentikasi ───────── */
  async getSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  onAuthChange(cb) {
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session));
    return data.subscription;
  },
  async signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error };
  },
  async signUp(email, password) {
    const { data, error } = await sb.auth.signUp({ email, password });
    return { data, error };
  },
  async signOut() {
    await sb.auth.signOut();
  },
  async resetPasswordEmail(email) {
    const origin = window.location.origin.replace(/\/$/, "");
    const redirectTo = /localhost(:\d+)?$/.test(origin)
      ? "https://lemari-ku.vercel.app/reset-password"
      : origin + "/reset-password";
    const { data, error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    return { data, error };
  },
  async getSessionFromUrl() {
    const { data, error } = await sb.auth.getSessionFromUrl();
    return { data, error };
  },
  async updatePassword(password) {
    const { data, error } = await sb.auth.updateUser({ password });
    return { data, error };
  },

  /* ───────── Data ───────── */
  async loadAll() {
    const [itemsRes, batchesRes] = await Promise.all([
      sb.from("items").select("*").order("created_at", { ascending: false }),
      sb.from("batches").select("*").order("created_at", { ascending: false }),
    ]);
    if (itemsRes.error) throw itemsRes.error;
    if (batchesRes.error) throw batchesRes.error;
    return {
      items: (itemsRes.data || []).map(_mapItem),
      batches: (batchesRes.data || []).map(_mapBatch),
    };
  },
  async createItem(item) {
    const { data, error } = await sb
      .from("items")
      .insert({
        name: item.name, category: item.category, color: item.color,
        photo: item.photo || null, status: item.status || "Di Lemari",
      })
      .select()
      .single();
    if (error) throw error;
    return _mapItem(data);
  },
  async updateItem(id, patch) {
    const { error } = await sb.from("items").update(patch).eq("id", id);
    if (error) throw error;
  },
  async createBatch(b) {
    const { data, error } = await sb
      .from("batches")
      .insert({
        label: b.label, vendor: b.vendor, due: b.due,
        item_ids: b.item_ids, code: b.code, seq: b.seq, created: b.created,
      })
      .select()
      .single();
    if (error) throw error;
    return _mapBatch(data);
  },
  async setItemsStatus(ids, status) {
    if (!ids || !ids.length) return;
    const { error } = await sb.from("items").update({ status }).in("id", ids);
    if (error) throw error;
  },
  async deleteItem(id) {
    const { error } = await sb.from("items").delete().eq("id", id);
    if (error) throw error;
  },
  // Pindahkan semua pakaian dari satu nilai kategori/warna ke nilai lain
  // (dipakai saat menghapus kategori/warna custom). RLS membatasi ke milik user.
  async reassignItems(field, oldVal, newVal) {
    if (field !== "category" && field !== "color") throw new Error("field tidak valid");
    const patch = {};
    patch[field] = newVal;
    const { error } = await sb.from("items").update(patch).eq(field, oldVal);
    if (error) throw error;
  },
  async deleteBatch(id) {
    const { error } = await sb.from("batches").delete().eq("id", id);
    if (error) throw error;
  },
};

window.LK_API = LK_API;
