// kelas.js - Universal class page manager (CRUD, aktivitas, kompatibel storage.js)
(function () {
  // Helper selectors
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Determine current kelas key: e.g. "kelas1.html" -> "kelas1"
  function currentKelasKey() {
    // prefer explicit data attribute on body if present
    const el = document.body;
    if (el && el.dataset && el.dataset.kelas) return el.dataset.kelas;
    const file = window.location.pathname.split('/').pop() || 'admin.html';
    const m = file.match(/kelas(\d)\.html/i);
    if (m) return 'kelas' + m[1];
    // fallback: default to kelas1
    return 'kelas1';
  }

  const kelasKey = currentKelasKey(); // e.g. 'kelas1'

  // Fallback small helpers for alerts/confirm if not present in global scope
  function _showAlert(msg, type = 'info') {
    if (typeof showAnimatedAlert === 'function') return showAnimatedAlert(msg, type);
    // minimal fallback
    const el = document.createElement('div');
    el.className = 'alert alert-' + (type === 'danger' ? 'danger' : (type === 'success' ? 'success' : 'info')) + ' fixed-top';
    el.style.top = '70px'; el.style.right = '20px'; el.style.zIndex = 9999; el.style.minWidth = '240px';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2500);
  }

  function _confirm(msg, cb) {
    if (typeof confirmAnimated === 'function') return confirmAnimated(msg, cb);
    if (confirm(msg)) cb();
  }

  // Render list of siswa for the kelasKey into #siswa-container
  function renderSiswaList() {
    const container = $('#siswa-container');
    if (!container) return;
    const siswaArr = dataStorage.getSiswa(kelasKey) || [];

    if (!siswaArr.length) {
      container.innerHTML = `<div class="col-12"><div class="card p-4 text-center">Belum ada siswa di ${kelasKey}.</div></div>`;
      return;
    }

    // Use bootstrap grid cards
    container.innerHTML = siswaArr.map(s => {
      // ensure id exists
      const sid = s.id || ('id' + Math.floor(Math.random()*1e9));
      // safe values
      const foto = (s.foto && s.foto.length) ? s.foto : 'assets/images/default-avatar.png';
      const nama = s.nama || '-';
      const nis = s.nis || '-';

      return `
        <div class="col-md-3 col-sm-6 col-12 mb-4">
          <div class="card siswa-card text-center">
            <img src="${foto}" alt="${nama}" class="card-img-top mx-auto mt-3" style="width:120px;height:120px;object-fit:cover;border-radius:10px;">
            <div class="card-body">
              <h6 class="card-title mb-1">${nama}</h6>
              <p class="mb-1 small text-muted">NIS: ${nis}</p>
              <div class="d-flex justify-content-center gap-2 mt-2">
                <button class="btn btn-sm btn-outline-primary" data-action="detail" data-id="${sid}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-warning" data-action="edit" data-id="${sid}"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${sid}"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render modal detail (if exists) or fallback to alert
  function showDetailById(id) {
    const siswaArr = dataStorage.getSiswa(kelasKey) || [];
    const s = siswaArr.find(x => String(x.id) === String(id));
    if (!s) return;
    // if #detailSiswaModal exists in DOM, populate it
    const modalEl = $('#detailSiswaModal');
    if (modalEl) {
      const nameEl = modalEl.querySelector('.detail-nama');
      const nisEl = modalEl.querySelector('.detail-nis');
      const fotoEl = modalEl.querySelector('.detail-foto');
      if (nameEl) nameEl.textContent = s.nama || '-';
      if (nisEl) nisEl.textContent = s.nis || '-';
      if (fotoEl) fotoEl.src = s.foto || 'assets/images/default-avatar.png';
      new bootstrap.Modal(modalEl).show();
      return;
    }
    // fallback: alert with info
    _showAlert(`${s.nama} — NIS: ${s.nis}`, 'info');
  }

  // Prefill modal form for edit
  let currentEditId = null;
  function openEditModal(id) {
    const siswaArr = dataStorage.getSiswa(kelasKey) || [];
    const s = siswaArr.find(x => String(x.id) === String(id));
    if (!s) return;
    currentEditId = s.id;

    const fNis = $('#siswa-nis');
    const fNama = $('#siswa-nama');
    const fFoto = $('#siswa-foto');

    if (fNis) fNis.value = s.nis || '';
    if (fNama) fNama.value = s.nama || '';
    if (fFoto) fFoto.value = s.foto || '';

    // show modal
    const modalEl = $('#siswaModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  // Clear and open modal for add
  function openAddModal() {
    currentEditId = null;
    const form = $('#siswaForm');
    if (form) form.reset();
    const modalEl = $('#siswaModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  // Save (add or update)
  function saveFromForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nis = ($('#siswa-nis') || {value:''}).value.trim();
    const nama = ($('#siswa-nama') || {value:''}).value.trim();
    const foto = ($('#siswa-foto') || {value:''}).value.trim();

    if (!nama) {
      _showAlert('Nama siswa wajib diisi', 'danger');
      return;
    }

    if (currentEditId) {
      // update existing
      const list = dataStorage.getSiswa(kelasKey) || [];
      const idx = list.findIndex(x => String(x.id) === String(currentEditId));
      if (idx === -1) {
        _showAlert('Data tidak ditemukan', 'danger');
        return;
      }
      list[idx] = { ...list[idx], nis, nama, foto };
      dataStorage.saveSiswa(kelasKey, list, { emitActivity: true, actor: 'Admin Web' });
      // create detalied activity via storage API if exists
      if (typeof dataStorage.addActivity === 'function') dataStorage.addActivity({ type: 'siswa', actor: 'Admin Web', message: `Mengubah data siswa: ${nama} (NIS ${nis})`, meta: kelasKey });
      _showAlert('Data siswa berhasil diperbarui', 'success');
    } else {
      // add new
      if (typeof dataStorage.addSiswa === 'function') {
        const added = dataStorage.addSiswa(kelasKey, { nis, nama, foto }, { actor: 'Admin Web', emitActivity: true });
        // addSiswa will emit activity and update stats
      } else {
        // fallback: manual push
        const all = dataStorage.get('siswaData', {});
        if (!Array.isArray(all[kelasKey])) all[kelasKey] = [];
        const newItem = { id: 'id' + Date.now(), nis, nama, foto };
        all[kelasKey].push(newItem);
        dataStorage.set('siswaData', all);
        if (typeof dataStorage.addActivity === 'function') dataStorage.addActivity({ type: 'siswa', actor: 'Admin Web', message: `Menambahkan siswa: ${nama} (NIS ${nis})`, meta: kelasKey });
      }
      _showAlert('Siswa baru berhasil ditambahkan', 'success');
    }

    // close modal & rerender
    const modalEl = $('#siswaModal');
    if (modalEl) {
      const inst = bootstrap.Modal.getInstance(modalEl);
      if (inst) inst.hide();
    }
    renderSiswaList();
  }

  // delete
  function deleteById(id) {
    const siswaArr = dataStorage.getSiswa(kelasKey) || [];
    const found = siswaArr.find(x => String(x.id) === String(id));
    if (!found) return _showAlert('Data tidak ditemukan', 'danger');

    _confirm(`Hapus siswa ${found.nama} (NIS ${found.nis}) ?`, () => {
      if (typeof dataStorage.removeSiswa === 'function') {
        dataStorage.removeSiswa(kelasKey, id, { emitActivity: true, actor: 'Admin Web' });
      } else {
        // fallback manual remove
        const all = dataStorage.get('siswaData', {});
        all[kelasKey] = (all[kelasKey] || []).filter(x => String(x.id) !== String(id));
        dataStorage.set('siswaData', all);
        if (typeof dataStorage.addActivity === 'function') dataStorage.addActivity({ type:'siswa', actor:'Admin Web', message:`Menghapus siswa: ${found.nama} (NIS ${found.nis})`, meta: kelasKey });
      }
      _showAlert('Siswa berhasil dihapus', 'success');
      renderSiswaList();
    });
  }

  // Event delegation for card buttons
  function attachCardHandlers() {
    const container = $('#siswa-container');
    if (!container) return;
    container.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'detail') showDetailById(id);
      else if (action === 'edit') openEditModal(id);
      else if (action === 'delete') deleteById(id);
    });
  }

  // Optional search input support (#searchSiswa)
  function attachSearch() {
    const s = $('#searchSiswa');
    if (!s) return;
    s.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const all = dataStorage.getSiswa(kelasKey) || [];
      const filtered = all.filter(x => (x.nama||'').toLowerCase().includes(q) || (x.nis||'').includes(q));
      const container = $('#siswa-container');
      if (!container) return;
      container.innerHTML = filtered.length ? filtered.map(s => {
        const sid = s.id;
        const foto = s.foto || 'assets/images/default-avatar.png';
        return `
        <div class="col-md-3 col-sm-6 col-12 mb-4">
          <div class="card siswa-card text-center">
            <img src="${foto}" style="width:120px;height:120px;object-fit:cover;border-radius:10px;margin:12px auto;">
            <div class="card-body">
              <h6 class="card-title">${s.nama}</h6>
              <p class="small text-muted">NIS: ${s.nis||'-'}</p>
              <div class="d-flex justify-content-center gap-2 mt-2">
                <button class="btn btn-sm btn-outline-primary" data-action="detail" data-id="${sid}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-warning" data-action="edit" data-id="${sid}"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${sid}"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('') : `<div class="col-12"><div class="card p-4">Tidak ada hasil untuk "${q}"</div></div>`;
    });
  }

  // Init: wire up form & buttons
  document.addEventListener('DOMContentLoaded', () => {
    // render initial
    renderSiswaList();

    // wire form submit
    const form = $('#siswaForm');
    if (form) form.addEventListener('submit', saveFromForm);

    // wire add button if present
    const addBtn = document.querySelector('[onclick*="kelasManager.openAddModal"], [data-open-siswa-modal]');
    if (addBtn) addBtn.addEventListener('click', openAddModal);

    // wire delegation
    attachCardHandlers();
    attachSearch();

    // listen to storage events (cross-tab)
    window.addEventListener('sdn:dashboard-updated', () => {
      renderSiswaList();
    });
    window.addEventListener('storage', (ev) => {
      if (ev.key && ev.key.startsWith('sdn_v1_')) renderSiswaList();
    });
  });

  // Expose some utilities (optional)
  window.kelasManager = {
    render: renderSiswaList,
    openAddModal,
    openEditModal,
    showDetail: showDetailById
  };

  // mobile css safety (non-invasive)
  const mobileStyle = document.createElement('style');
  mobileStyle.textContent = `
    @media (max-width:576px) {
      .siswa-card { width:100% !important; }
      .siswa-card img { width:100px !important; height:100px !important; }
    }
  `;
  document.head.appendChild(mobileStyle);
})();