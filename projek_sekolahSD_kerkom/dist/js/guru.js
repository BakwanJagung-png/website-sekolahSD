// guru.js - Fixed & robust version (Aktivitas konsisten + Pengumuman + Mobile fixes)
class GuruManager {
  constructor() {
    this.currentEditId = null;
    this.init();
  }

  init() {
    // Safe init: only attach listeners if elements exist
    this.renderGuru();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Guard: form might not exist on every page
    const form = document.getElementById("guruForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveGuru();
      }, { passive: false });
    }

    const search = document.getElementById("searchGuru");
    if (search) {
      search.addEventListener("input", (e) => {
        this.searchGuru(e.target.value);
      });
    }
  }

  // Helper: safe get guru array
  _getGuruArray() {
    const g = (typeof dataStorage !== "undefined" && typeof dataStorage.getGuru === "function")
      ? dataStorage.getGuru()
      : JSON.parse(localStorage.getItem("guruData") || "[]");
    return Array.isArray(g) ? g : [];
  }

  // Helper: safe save guru array
  _saveGuruArray(arr) {
    if (typeof dataStorage !== "undefined" && typeof dataStorage.saveGuru === "function") {
      dataStorage.saveGuru(arr);
    } else {
      localStorage.setItem("guruData", JSON.stringify(arr));
      // if dataStorage has updateDashboardStats, try call it
      if (typeof dataStorage !== "undefined" && typeof dataStorage.updateDashboardStats === "function") {
        dataStorage.updateDashboardStats(true);
      } else {
        // emit storage event fallback
        try { window.dispatchEvent(new Event('storage')); } catch(e){}
      }
    }
  }

  renderGuru() {
    const guruData = this._getGuruArray();
    const container = document.getElementById("guru-container");
    if (!container) return;

    if (!guruData.length) {
      container.innerHTML = `<div class="col-12"><div class="card p-4 text-center">Belum ada data guru.</div></div>`;
      return;
    }

    container.innerHTML = guruData
      .map((guru) => {
        // Ensure a stable id (string or number)
        const gid = (guru && guru.id) ? guru.id : ('id' + Date.now() + Math.floor(Math.random()*1000));
        const foto = guru.foto && guru.foto.length ? guru.foto : 'assets/images/default-avatar.png';
        const nama = guru.nama || '-';
        const nip = guru.nip || '-';
        const jab = guru.jabatan || '';
        return `
          <div class="col-md-4 col-12 mb-4">
            <div class="card siswa text-center animate-card">
              <img src="${foto}" class="card-img-top mx-auto mt-3"
                alt="Foto ${escapeHtml(nama)}"
                style="width:150px;height:150px;object-fit:cover;border-radius:10px;">
              <div class="card-body">
                <h5 class="card-title">${escapeHtml(nama)}</h5>
                <p class="card-text">NIP: ${escapeHtml(nip)}</p>
                <p class="card-text"><small class="text-muted">${escapeHtml(jab)}</small></p>
                <div class="btn-group">
                  <button class="btn btn-outline-primary btn-sm" data-guru-id="${gid}" data-action="detail">Detail</button>
                  <button class="btn btn-outline-warning btn-sm" data-guru-id="${gid}" data-action="edit">Edit</button>
                  <button class="btn btn-outline-danger btn-sm" data-guru-id="${gid}" data-action="delete">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // attach delegation for buttons
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.removeEventListener('click', this._delegatedClick); // safe remove if exist
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.guruId;
        if (action === 'detail') this.showDetail(id);
        else if (action === 'edit') this.editGuru(id);
        else if (action === 'delete') this.deleteGuru(id);
      });
    });
  }

  openAddModal() {
    this.currentEditId = null;
    const label = document.getElementById("guruModalLabel");
    if (label) label.textContent = "Tambah Guru Baru";
    const form = document.getElementById("guruForm");
    if (form) form.reset();
    const modalEl = document.getElementById("guruModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  editGuru(id) {
    // Accept string or number id
    const guruData = this._getGuruArray();
    const guru = guruData.find((g) => String(g.id) === String(id));
    if (!guru) {
      showAnimatedAlert ? showAnimatedAlert('Data guru tidak ditemukan', 'danger') : alert('Data guru tidak ditemukan');
      return;
    }

    this.currentEditId = guru.id;
    const label = document.getElementById("guruModalLabel");
    if (label) label.textContent = "Edit Data Guru";

    // fill fields safely
    setIfExists('guru-nip', guru.nip);
    setIfExists('guru-nama', guru.nama);
    setIfExists('guru-jabatan', guru.jabatan);
    setIfExists('guru-mapel', guru.mataPelajaran);
    setIfExists('guru-pendidikan', guru.pendidikan);
    setIfExists('guru-email', guru.email);
    setIfExists('guru-telepon', guru.telepon);
    setIfExists('guru-foto', guru.foto);
    setIfExists('guru-riwayat', guru.riwayat);

    const modalEl = document.getElementById("guruModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  saveGuru() {
    try {
      const formData = {
        nip: getVal('guru-nip'),
        nama: getVal('guru-nama'),
        jabatan: getVal('guru-jabatan'),
        mataPelajaran: getVal('guru-mapel'),
        pendidikan: getVal('guru-pendidikan'),
        email: getVal('guru-email'),
        telepon: getVal('guru-telepon'),
        foto: getVal('guru-foto'),
        riwayat: getVal('guru-riwayat'),
      };

      if (!formData.nama) {
        (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('Nama harus diisi', 'danger') : alert('Nama harus diisi');
        return;
      }

      let guruData = this._getGuruArray();

      // EDIT
      if (this.currentEditId) {
        const idx = guruData.findIndex(g => String(g.id) === String(this.currentEditId));
        if (idx !== -1) {
          guruData[idx] = { ...guruData[idx], ...formData };
          this._saveGuruArray(guruData);

          // prefer dataStorage.addActivity if exists
          const msg = `Mengedit guru: ${formData.nama} (NIP ${formData.nip || '-'})`;
          if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
            dataStorage.addActivity({ type: 'guru', actor: 'Admin Web', message: msg });
          } else {
            addAktivitas && addAktivitas('info', msg);
          }

          (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('✏️ Data guru berhasil diperbarui!', 'info') : null;
        } else {
          (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('Data guru tidak ditemukan', 'danger') : null;
        }
      }
      // TAMBAH
      else {
        // find numeric max safely (handle string ids)
        const numericMax = guruData.reduce((acc, g) => {
          const v = Number(g && g.id ? g.id : 0);
          return isFinite(v) ? Math.max(acc, v) : acc;
        }, 0);
        const candidateId = numericMax > 0 ? (numericMax + 1) : ('id' + Date.now());

        const newGuru = { id: candidateId, ...formData };
        // if dataStorage has addGuru, use it (it may create activity)
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.addGuru === 'function') {
          dataStorage.addGuru(newGuru, { actor: 'Admin Web', emitActivity: true });
        } else {
          guruData.push(newGuru);
          this._saveGuruArray(guruData);
          const msg = `Menambahkan guru baru: ${newGuru.nama} (NIP ${newGuru.nip || '-'})`;
          if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
            dataStorage.addActivity({ type: 'guru', actor: 'Admin Web', message: msg });
          } else {
            addAktivitas && addAktivitas('success', msg);
          }
        }
        (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('✅ Guru baru berhasil disimpan!', 'success') : null;
      }

      // re-render and close modal
      this.renderGuru();
      const modalEl = document.getElementById("guruModal");
      if (modalEl) {
        const inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }
      // notify dashboard update if storage supports it
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
        dataStorage.updateDashboardStats(true);
      }
    } catch (e) {
      console.error('saveGuru error', e);
      (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('Terjadi kesalahan saat menyimpan', 'danger') : null;
    } finally {
      // reset currentEditId
      this.currentEditId = null;
    }
  }

    deleteGuru(id) {
    const guruData = this._getGuruArray();
    const found = guruData.find(g => String(g.id) === String(id));
    if (!found) {
      (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('Data guru tidak ditemukan', 'danger') : alert('Data guru tidak ditemukan');
      return;
    }

    // fungsi yang melakukan penghapusan sebenarnya
    const doDelete = () => {
      // Prefer metode dataStorage jika tersedia
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.removeGuruById === 'function') {
        dataStorage.removeGuruById(found.id, { emitActivity: true, actor: 'Admin Web' });
      } else {
        // fallback: cari key yang ada di localStorage (utamakan prefix sdn_v1_)
        let key = null;
        if (localStorage.getItem('sdn_v1_guruData')) key = 'sdn_v1_guruData';
        else if (localStorage.getItem('guruData')) key = 'guruData';

        // jika ada key, ambil, filter, dan simpan kembali
        if (key) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const newList = list.filter(g => String(g.id) !== String(id));
            localStorage.setItem(key, JSON.stringify(newList));
          } catch (e) {
            console.error('Gagal menghapus dari localStorage', e);
          }
        } else {
          // jika tidak ada key di localStorage, gunakan array saat ini sebagai fallback
          const newList = guruData.filter(g => String(g.id) !== String(id));
          localStorage.setItem('guruData', JSON.stringify(newList));
        }

        // catat aktivitas
        const msg = `Menghapus guru: ${found.nama} (NIP ${found.nip || '-'})`;
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
          dataStorage.addActivity({ type: 'guru', actor: 'Admin Web', message: msg });
        } else {
          try { addAktivitas && addAktivitas('danger', msg); } catch(e){}
        }
      }

      // re-render dan notifikasi suksesss
      this.renderGuru();
      (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('🗑️ Data guru berhasil dihapus!', 'danger') : null;

      // update dashboard jika support
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
        dataStorage.updateDashboardStats(true);
      } else {
        try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
      }
    }; // end doDelete

    // Gunakan confirmAnimated jika tersedia, kalau tidak fallback ke window.confirm
    if (typeof confirmAnimated === 'function') {
      confirmAnimated("Apakah Anda yakin ingin menghapus data guru ini?", doDelete);
    } else {
      if (window.confirm("Apakah Anda yakin ingin menghapus data guru ini?")) {
        doDelete();
      }
    }
  }


  searchGuru(keyword) {
    const q = (keyword || '').trim().toLowerCase();
    const container = document.getElementById("guru-container");
    if (!container) return;

    const guruData = this._getGuruArray();
    const filtered = q ? guruData.filter(g =>
      (g.nama || '').toLowerCase().includes(q) ||
      String(g.nip || '').includes(q) ||
      (g.jabatan || '').toLowerCase().includes(q)
    ) : guruData;

    container.innerHTML = filtered
      .map((guru) => {
        const gid = (guru && guru.id) ? guru.id : ('id' + Date.now() + Math.floor(Math.random()*1000));
        const foto = guru.foto && guru.foto.length ? guru.foto : 'assets/images/default-avatar.png';
        return `
          <div class="col-md-4 col-12 mb-4">
            <div class="card siswa text-center animate-card">
              <img src="${foto}" class="card-img-top mx-auto mt-3"
                style="width:150px;height:150px;object-fit:cover;border-radius:10px;">
              <div class="card-body">
                <h5 class="card-title">${escapeHtml(guru.nama || '')}</h5>
                <p class="card-text">NIP: ${escapeHtml(guru.nip || '-')}</p>
                <p class="card-text"><small>${escapeHtml(guru.jabatan || '')}</small></p>
                <div class="btn-group">
                  <button class="btn btn-outline-primary btn-sm" data-guru-id="${gid}" data-action="detail">Detail</button>
                  <button class="btn btn-outline-warning btn-sm" data-guru-id="${gid}" data-action="edit">Edit</button>
                  <button class="btn btn-outline-danger btn-sm" data-guru-id="${gid}" data-action="delete">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  showDetail(id) {
    const guruData = this._getGuruArray();
    const guru = guruData.find((g) => String(g.id) === String(id));
    if (!guru) {
      (typeof showAnimatedAlert === 'function') ? showAnimatedAlert('Data guru tidak ditemukan', 'danger') : null;
      return;
    }

    // If detail modal exists, fill it
    const nameEl = document.getElementById("detail-guru-nama");
    const nipEl = document.getElementById("detail-guru-nip");
    const jabEl = document.getElementById("detail-guru-jabatan");
    const mapelEl = document.getElementById("detail-guru-mapel");
    const pendEl = document.getElementById("detail-guru-pendidikan");
    const emailEl = document.getElementById("detail-guru-email");
    const telEl = document.getElementById("detail-guru-telepon");
    const riwEl = document.getElementById("detail-guru-riwayat");
    const fotoEl = document.getElementById("detail-guru-foto");

    if (nameEl) nameEl.textContent = guru.nama || '-';
    if (nipEl) nipEl.textContent = guru.nip || '-';
    if (jabEl) jabEl.textContent = guru.jabatan || '-';
    if (mapelEl) mapelEl.textContent = guru.mataPelajaran || '-';
    if (pendEl) pendEl.textContent = guru.pendidikan || '-';
    if (emailEl) emailEl.textContent = guru.email || '-';
    if (telEl) telEl.textContent = guru.telepon || '-';
    if (riwEl) riwEl.innerHTML = (guru.riwayat || '').replace(/\n/g, '<br>');
    if (fotoEl) fotoEl.src = guru.foto || 'assets/images/default-avatar.png';

    const detailModal = document.getElementById("detailGuruModal");
    if (detailModal) new bootstrap.Modal(detailModal).show();
  }
}

// instantiate manager
const guruManager = new GuruManager();


/* =====================================
   Activity & Announcement helpers
   - Use dataStorage methods if available for consistency
   ===================================== */

// Prefer dataStorage.addActivity, fallback to local recentActivities key
function addAktivitas(type, message, meta) {
  const payload = {
    type: type || 'general',
    actor: 'Admin Web',
    message: message || '',
    meta: meta || null,
    time: new Date().toLocaleString()
  };

  if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
    dataStorage.addActivity(payload);
  } else {
    // fallback: recentActivities key (keep newest first)
    const key = 'recentActivities';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.unshift(payload);
    if (arr.length > 200) arr.length = 200;
    localStorage.setItem(key, JSON.stringify(arr));
    // emit simple event
    try { window.dispatchEvent(new CustomEvent('sdn:activities-changed', { detail: payload })); } catch(e){}
  }
}

// Prefer dataStorage.addAnnouncement, fallback to pengumumanData key
function addPengumuman(text) {
  const ann = { title: (text && text.title) ? text.title : (typeof text === 'string' ? text : (text.title || '')), content: (text && text.content) ? text.content : (typeof text === 'string' ? text : (text.content || '')), date: (text && text.date) ? text.date : new Date().toLocaleDateString() };

  if (typeof dataStorage !== 'undefined' && typeof dataStorage.addAnnouncement === 'function') {
    dataStorage.addAnnouncement({ title: ann.title, content: ann.content, date: ann.date }, { actor: 'Admin Web', emitActivity:true });
  } else {
    const key = 'pengumumanData';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.unshift({ id: 'ann' + Date.now(), title: ann.title, content: ann.content, date: ann.date, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(arr));
    // also push activity
    addAktivitas('announcement', `Pengumuman ditambahkan: ${ann.title || ann.content}`, { date: ann.date });
    // notify dashboard listeners
    try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
  }
}

/* =====================================
   Small helpers
   ===================================== */
function setIfExists(id, value) { const el = document.getElementById(id); if (el) el.value = value || ''; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// escape HTML to avoid injection in rendered strings
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe).replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;'
    })[s];
  });
}

/* =====================================
   Mobile style safety
   ===================================== */
const style = document.createElement("style");
style.textContent = `
  @media (max-width: 576px) {
    .card.siswa { width: 100% !important; }
    .card-img-top { width: 120px !important; height: 120px !important; }
  }
  .animate-card { animation: fadeInUp 0.35s ease; }
  @keyframes fadeInUp { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`;
document.head.appendChild(style);