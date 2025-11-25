// guru.js - Enhanced version with file upload and activity preservation
class GuruManager {
  constructor() {
    this.currentEditId = null;
    this.currentFotoData = null; // Untuk menyimpan data base64 sementara
    this.init();
  }

  init() {
    this.renderGuru();
    this.setupEventListeners();
    this.setupFotoHandlers();
  }

  setupEventListeners() {
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

  // Setup handlers untuk opsi foto
  setupFotoHandlers() {
    const urlOption = document.getElementById('fotoUrlOption');
    const uploadOption = document.getElementById('fotoUploadOption');
    const urlContainer = document.getElementById('urlFotoContainer');
    const uploadContainer = document.getElementById('uploadFotoContainer');
    const fileInput = document.getElementById('guru-foto-upload');
    const preview = document.getElementById('fotoPreview');

    if (urlOption && uploadOption) {
      urlOption.addEventListener('change', () => {
        urlContainer.style.display = 'block';
        uploadContainer.style.display = 'none';
        this.currentFotoData = null;
      });

      uploadOption.addEventListener('change', () => {
        urlContainer.style.display = 'none';
        uploadContainer.style.display = 'block';
      });
    }

    if (fileInput && preview) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validasi tipe file
          if (!file.type.match('image.*')) {
            this.showAlert('Hanya file gambar yang diizinkan', 'danger');
            fileInput.value = '';
            return;
          }

          // Validasi ukuran file (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            this.showAlert('Ukuran file maksimal 2MB', 'danger');
            fileInput.value = '';
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentFotoData = event.target.result; // Simpan base64
            preview.src = this.currentFotoData;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          this.currentFotoData = null;
          preview.style.display = 'none';
        }
      });
    }
  }

  // Helper untuk menampilkan alert
  showAlert(message, type = 'info') {
    if (typeof showAnimatedAlert === 'function') {
      showAnimatedAlert(message, type);
    } else {
      alert(message);
    }
  }

  _getGuruArray() {
    const g = (typeof dataStorage !== "undefined" && typeof dataStorage.getGuru === "function")
      ? dataStorage.getGuru()
      : JSON.parse(localStorage.getItem("guruData") || "[]");
    return Array.isArray(g) ? g : [];
  }

  _saveGuruArray(arr) {
    if (typeof dataStorage !== "undefined" && typeof dataStorage.saveGuru === "function") {
      dataStorage.saveGuru(arr);
    } else {
      localStorage.setItem("guruData", JSON.stringify(arr));
      if (typeof dataStorage !== "undefined" && typeof dataStorage.updateDashboardStats === "function") {
        dataStorage.updateDashboardStats(true);
      } else {
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
        const gid = (guru && guru.id) ? guru.id : ('id' + Date.now() + Math.floor(Math.random()*1000));
        // Gunakan default avatar jika foto tidak ada
        const foto = guru.foto && guru.foto.length ? guru.foto : 'assets/images/default-avatar.png';
        const nama = guru.nama || '-';
        const nip = guru.nip || '-';
        const jab = guru.jabatan || '';
        
        return `
          <div class="col-md-4 col-12 mb-4">
            <div class="card siswa text-center animate-card">
              <img src="${foto}" class="card-img-top mx-auto mt-3"
                alt="Foto ${escapeHtml(nama)}"
                style="width:150px;height:150px;object-fit:cover;border-radius:10px;"
                onerror="this.src='assets/images/default-avatar.png'">
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

    // Attach event listeners
    container.querySelectorAll('[data-action]').forEach(btn => {
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
    this.currentFotoData = null;
    
    const label = document.getElementById("guruModalLabel");
    if (label) label.textContent = "Tambah Guru Baru";
    
    const form = document.getElementById("guruForm");
    if (form) form.reset();
    
    // Reset foto options
    const urlOption = document.getElementById('fotoUrlOption');
    const preview = document.getElementById('fotoPreview');
    if (urlOption) urlOption.checked = true;
    if (preview) {
      preview.style.display = 'none';
      preview.src = '#';
    }
    
    // Tampilkan container URL, sembunyikan upload
    const urlContainer = document.getElementById('urlFotoContainer');
    const uploadContainer = document.getElementById('uploadFotoContainer');
    if (urlContainer) urlContainer.style.display = 'block';
    if (uploadContainer) uploadContainer.style.display = 'none';
    
    const modalEl = document.getElementById("guruModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  editGuru(id) {
    const guruData = this._getGuruArray();
    const guru = guruData.find((g) => String(g.id) === String(id));
    if (!guru) {
      this.showAlert('Data guru tidak ditemukan', 'danger');
      return;
    }

    this.currentEditId = guru.id;
    this.currentFotoData = null; // Reset data foto upload

    const label = document.getElementById("guruModalLabel");
    if (label) label.textContent = "Edit Data Guru";

    // Isi form fields
    setIfExists('guru-nip', guru.nip);
    setIfExists('guru-nama', guru.nama);
    setIfExists('guru-jabatan', guru.jabatan);
    setIfExists('guru-mapel', guru.mataPelajaran);
    setIfExists('guru-pendidikan', guru.pendidikan);
    setIfExists('guru-email', guru.email);
    setIfExists('guru-telepon', guru.telepon);
    setIfExists('guru-riwayat', guru.riwayat);

    // Handle foto - tentukan apakah URL atau base64
    const isBase64 = guru.foto && guru.foto.startsWith('data:image');
    const urlOption = document.getElementById('fotoUrlOption');
    const uploadOption = document.getElementById('fotoUploadOption');
    const urlContainer = document.getElementById('urlFotoContainer');
    const uploadContainer = document.getElementById('uploadFotoContainer');
    const preview = document.getElementById('fotoPreview');

    if (isBase64) {
      // Jika foto adalah base64, gunakan opsi upload
      if (uploadOption) uploadOption.checked = true;
      if (urlContainer) urlContainer.style.display = 'none';
      if (uploadContainer) uploadContainer.style.display = 'block';
      if (preview) {
        preview.src = guru.foto;
        preview.style.display = 'block';
      }
      this.currentFotoData = guru.foto;
    } else {
      // Jika foto adalah URL, gunakan opsi URL
      if (urlOption) urlOption.checked = true;
      if (urlContainer) urlContainer.style.display = 'block';
      if (uploadContainer) uploadContainer.style.display = 'none';
      setIfExists('guru-foto-url', guru.foto);
    }

    const modalEl = document.getElementById("guruModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  saveGuru() {
    try {
      // Ambil data foto berdasarkan opsi yang dipilih
      let fotoData = '';
      const urlOption = document.getElementById('fotoUrlOption');
      
      if (urlOption && urlOption.checked) {
        // Gunakan URL
        fotoData = getVal('guru-foto-url');
      } else {
        // Gunakan uploaded file (base64)
        fotoData = this.currentFotoData || getVal('guru-foto-url');
      }

      const formData = {
        nip: getVal('guru-nip'),
        nama: getVal('guru-nama'),
        jabatan: getVal('guru-jabatan'),
        mataPelajaran: getVal('guru-mapel'),
        pendidikan: getVal('guru-pendidikan'),
        email: getVal('guru-email'),
        telepon: getVal('guru-telepon'),
        foto: fotoData,
        riwayat: getVal('guru-riwayat'),
      };

      if (!formData.nama) {
        this.showAlert('Nama harus diisi', 'danger');
        return;
      }

      let guruData = this._getGuruArray();

      // EDIT existing guru
      if (this.currentEditId) {
        const idx = guruData.findIndex(g => String(g.id) === String(this.currentEditId));
        if (idx !== -1) {
          const oldGuru = guruData[idx];
          guruData[idx] = { ...oldGuru, ...formData };
          this._saveGuruArray(guruData);

          // Catat aktivitas dengan error handling
          const msg = `Mengedit guru: ${formData.nama} (NIP ${formData.nip || '-'})`;
          this.recordActivity('guru', 'info', msg);

          this.showAlert('✏️ Data guru berhasil diperbarui!', 'info');
        } else {
          this.showAlert('Data guru tidak ditemukan', 'danger');
        }
      }
      // TAMBAH guru baru
      else {
        const numericMax = guruData.reduce((acc, g) => {
          const v = Number(g && g.id ? g.id : 0);
          return isFinite(v) ? Math.max(acc, v) : acc;
        }, 0);
        const candidateId = numericMax > 0 ? (numericMax + 1) : ('id' + Date.now());

        const newGuru = { id: candidateId, ...formData };
        
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.addGuru === 'function') {
          dataStorage.addGuru(newGuru, { actor: 'Admin Web', emitActivity: true });
        } else {
          guruData.push(newGuru);
          this._saveGuruArray(guruData);
          
          const msg = `Menambahkan guru baru: ${newGuru.nama} (NIP ${newGuru.nip || '-'})`;
          this.recordActivity('guru', 'success', msg);
        }
        this.showAlert('✅ Guru baru berhasil disimpan!', 'success');
      }

      // Reset dan refresh
      this.currentFotoData = null;
      this.renderGuru();
      const modalEl = document.getElementById("guruModal");
      if (modalEl) {
        const inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }
      
      // Update dashboard
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
        dataStorage.updateDashboardStats(true);
      }
    } catch (e) {
      console.error('saveGuru error', e);
      this.showAlert('Terjadi kesalahan saat menyimpan', 'danger');
    } finally {
      this.currentEditId = null;
    }
  }

  // Method untuk mencatat aktivitas dengan error handling
  recordActivity(type, activityType, message) {
    try {
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
        dataStorage.addActivity({ type: type, actor: 'Admin Web', message: message });
      } else if (typeof addAktivitas === 'function') {
        addAktivitas(activityType, message);
      } else {
        // Fallback: simpan ke localStorage langsung
        const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        activities.unshift({
          id: 'act' + Date.now(),
          time: new Date().toLocaleString(),
          type: type,
          actor: 'Admin Web',
          message: message
        });
        if (activities.length > 100) activities.length = 100;
        localStorage.setItem('recentActivities', JSON.stringify(activities));
        
        // Trigger event untuk update dashboard
        try { window.dispatchEvent(new CustomEvent('sdn:activities-changed')); } catch(e){}
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  deleteGuru(id) {
    const guruData = this._getGuruArray();
    const found = guruData.find(g => String(g.id) === String(id));
    if (!found) {
      this.showAlert('Data guru tidak ditemukan', 'danger');
      return;
    }

    const doDelete = () => {
      try {
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.removeGuruById === 'function') {
          dataStorage.removeGuruById(found.id, { emitActivity: true, actor: 'Admin Web' });
        } else {
          let key = null;
          if (localStorage.getItem('sdn_v1_guruData')) key = 'sdn_v1_guruData';
          else if (localStorage.getItem('guruData')) key = 'guruData';

          if (key) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const newList = list.filter(g => String(g.id) !== String(id));
            localStorage.setItem(key, JSON.stringify(newList));
          } else {
            const newList = guruData.filter(g => String(g.id) !== String(id));
            localStorage.setItem('guruData', JSON.stringify(newList));
          }

          // Catat aktivitas dengan error handling
          const msg = `Menghapus guru: ${found.nama} (NIP ${found.nip || '-'})`;
          this.recordActivity('guru', 'danger', msg);
        }

        this.renderGuru();
        this.showAlert('🗑️ Data guru berhasil dihapus!', 'danger');

        // Update dashboard
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
          dataStorage.updateDashboardStats(true);
        } else {
          try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
        }
      } catch (error) {
        console.error('Error deleting guru:', error);
        this.showAlert('Terjadi kesalahan saat menghapus data', 'danger');
      }
    };

    if (typeof confirmAnimated === 'function') {
      confirmAnimated("Apakah Anda yakin ingin menghapus data guru ini?", doDelete);
    } else {
      if (window.confirm("Apakah Anda yakin ingin menghapus data guru ini?")) {
        doDelete();
      }
    }
  }

  // ... (method lainnya tetap sama: searchGuru, showDetail)
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
                style="width:150px;height:150px;object-fit:cover;border-radius:10px;"
                onerror="this.src='assets/images/default-avatar.png'">
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

    // Re-attach event listeners untuk hasil pencarian
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.guruId;
        if (action === 'detail') this.showDetail(id);
        else if (action === 'edit') this.editGuru(id);
        else if (action === 'delete') this.deleteGuru(id);
      });
    });
  }

  showDetail(id) {
    const guruData = this._getGuruArray();
    const guru = guruData.find((g) => String(g.id) === String(id));
    if (!guru) {
      this.showAlert('Data guru tidak ditemukan', 'danger');
      return;
    }

    // Isi modal detail
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
    
    // Handle foto dengan fallback ke default avatar
    if (fotoEl) {
      fotoEl.src = guru.foto || 'assets/images/default-avatar.png';
      fotoEl.onerror = function() {
        this.src = 'assets/images/default-avatar.png';
      };
    }

    const detailModal = document.getElementById("detailGuruModal");
    if (detailModal) new bootstrap.Modal(detailModal).show();
  }
}

// instantiate manager
const guruManager = new GuruManager();

/* =====================================
   Activity & Announcement helpers dengan error handling
   ===================================== */

function addAktivitas(type, message, meta) {
  try {
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
      const key = 'recentActivities';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift(payload);
      if (arr.length > 200) arr.length = 200;
      localStorage.setItem(key, JSON.stringify(arr));
      try { window.dispatchEvent(new CustomEvent('sdn:activities-changed', { detail: payload })); } catch(e){}
    }
  } catch (error) {
    console.error('Error adding activity:', error);
  }
}

function addPengumuman(text) {
  try {
    const ann = { 
      title: (text && text.title) ? text.title : (typeof text === 'string' ? text : (text.title || '')), 
      content: (text && text.content) ? text.content : (typeof text === 'string' ? text : (text.content || '')), 
      date: (text && text.date) ? text.date : new Date().toLocaleDateString() 
    };

    if (typeof dataStorage !== 'undefined' && typeof dataStorage.addAnnouncement === 'function') {
      dataStorage.addAnnouncement({ title: ann.title, content: ann.content, date: ann.date }, { actor: 'Admin Web', emitActivity:true });
    } else {
      const key = 'pengumumanData';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift({ id: 'ann' + Date.now(), title: ann.title, content: ann.content, date: ann.date, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
      addAktivitas('announcement', `Pengumuman ditambahkan: ${ann.title || ann.content}`, { date: ann.date });
      try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
    }
  } catch (error) {
    console.error('Error adding announcement:', error);
  }
}

/* =====================================
   Small helpers
   ===================================== */
function setIfExists(id, value) { 
  const el = document.getElementById(id); 
  if (el) el.value = value || ''; 
}

function getVal(id) { 
  const el = document.getElementById(id); 
  return el ? el.value.trim() : ''; 
}

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
    .modal-dialog { margin: 10px; }
  }
  .animate-card { animation: fadeInUp 0.35s ease; }
  @keyframes fadeInUp { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  
  /* Style untuk foto preview */
  #fotoPreview { border: 2px solid #dee2e6; }
  #fotoPreview:not([src="#"]) { display: block !important; }
`;
document.head.appendChild(style);