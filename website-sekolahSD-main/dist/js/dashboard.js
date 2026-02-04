// dashboard.js - Renderer: dashboard stats, activities, announcements, schedule
(function () {
  function id(i) { return document.getElementById(i); }
  function qs(sel) { return Array.from(document.querySelectorAll(sel)); }

  // RENDER STATS
  function renderDashboard() {
    const stats = dataStorage.getDashboardStats();
    if (!stats) return;
    if (id('total-siswa')) id('total-siswa').textContent = stats.totalSiswa ?? 0;
    if (id('total-guru')) id('total-guru').textContent = stats.totalGuru ?? 0;
    if (id('total-kelas')) id('total-kelas').textContent = stats.totalKelas ?? 0;
    if (id('total-pengumuman')) id('total-pengumuman').textContent = stats.pengumumanAktif ?? 0;
  }

  // RENDER ACTIVITIES
  function renderActivities() {
    const acts = dataStorage.getActivities();
    const el = id('activity-list') || document.querySelector('.list-group');
    if (!el) return;
    el.innerHTML = '';
    if (!acts || acts.length === 0) {
      el.innerHTML = `<li class="list-group-item"><small class="text-muted">-</small><br>Tidak ada aktivitas terbaru.</li>`;
      return;
    }
    acts.forEach(a => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      const time = a.time || '';
      const actor = a.actor || '';
      const type = a.type || 'general';
      const badgeClass = {
        guru: 'badge bg-primary',
        siswa: 'badge bg-success',
        announcement: 'badge bg-warning text-dark',
        system: 'badge bg-secondary'
      }[type] || 'badge bg-info';

      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <small class="text-muted">${time}</small><br>
            <strong>${actor}</strong> — ${a.message}
            ${a.meta ? `<div class="small text-muted">${a.meta}</div>` : ''}
          </div>
          <div>
            <span class="${badgeClass}">${type}</span>
          </div>
        </div>
      `;
      el.appendChild(li);
    });
  }

  // RENDER ANNOUNCEMENTS (and inject "Tambah Pengumuman" button)
  function renderAnnouncements() {
    // find an announcements container if exists; prefer id announcement-list
    let el = id('announcement-list');
    if (!el) {
      // try to find card with Pengumuman Penting title
      const heads = Array.from(document.querySelectorAll('.card-header'));
      const card = heads.find(h => /pengumuman penting/i.test(h.textContent || ''));
      if (card) el = card.nextElementSibling; // card-body
    }
    if (!el) return;

    // inject header controls (Tambah Pengumuman) only once
    if (!el.querySelector('.ann-controls')) {
      const ctrl = document.createElement('div');
      ctrl.className = 'ann-controls mb-2';
      ctrl.innerHTML = `<button class="btn btn-sm btn-primary me-2" id="btnAddAnn">Tambah Pengumuman</button>`;
      el.prepend(ctrl);
      const btn = id('btnAddAnn');
      if (btn) btn.addEventListener('click', openAddAnnouncementModal);
    }

    const anns = dataStorage.getAnnouncements() || [];
    // remove old list (keep controls)
    const existingControls = el.querySelector('.ann-controls');
    el.innerHTML = '';
    if (existingControls) el.appendChild(existingControls);

    if (!anns.length) {
      const no = document.createElement('div');
      no.className = 'alert alert-info';
      no.textContent = 'Belum ada pengumuman penting.';
      el.appendChild(no);
      return;
    }

    anns.forEach(a => {
      const d = document.createElement('div');
      d.className = `alert alert-info d-flex justify-content-between align-items-start`;
      d.innerHTML = `
        <div>
          <strong>${escapeHtml(a.title || '(tanpa judul)')}</strong><br>
          <div class="small">${escapeHtml(a.content || '')}</div>
          <div class="small text-muted mt-1">Tanggal: ${escapeHtml(a.date || new Date(a.createdAt||'').toLocaleDateString())}</div>
        </div>
        <div class="text-end">
          <button class="btn btn-sm btn-outline-danger btn-del-ann" data-id="${a.id}">Hapus</button>
        </div>
      `;
      el.appendChild(d);
    });

    // add listener to delete buttons
    el.querySelectorAll('.btn-del-ann').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const idann = btn.dataset.id;
        if (!idann) return;
        if (confirm('Hapus pengumuman ini?')) {
          if (typeof dataStorage !== 'undefined' && typeof dataStorage.removeAnnouncement === 'function') {
            dataStorage.removeAnnouncement(idann, { actor: 'Admin Web' });
          } else {
            // fallback
            const arr = JSON.parse(localStorage.getItem('pengumumanData') || '[]');
            const newArr = arr.filter(x => x.id != idann);
            localStorage.setItem('pengumumanData', JSON.stringify(newArr));
            try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
          }
          renderAnnouncements();
          renderDashboard();
        }
      });
    });
  }

  // RENDER SCHEDULE (Jadwal Hari Ini) into first table in page under 'Jadwal Hari Ini'
  function renderSchedule() {
    const schedule = dataStorage.getSchedule ? dataStorage.getSchedule() : JSON.parse(localStorage.getItem('sdn_v1_schedule') || '[]');
    // find the schedule table in page: prefer an element that contains icon fa-calendar-day header
    let table = null;
    // Common: the table under heading "Jadwal Hari Ini" exists; search for table with 1+ header cells "Waktu"
    const tables = Array.from(document.querySelectorAll('table'));
    table = tables.find(t => {
      const th = t.querySelector('th');
      return th && /waktu/i.test(th.textContent || '');
    });
    // fallback: first table
    if (!table && tables.length) table = tables[0];
    if (!table) return;

    const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
    tbody.innerHTML = '';

    if (!schedule || !schedule.length) {
      tbody.innerHTML = `<tr><td colspan="7">Belum ada jadwal.</td></tr>`;
      return;
    }

    schedule.forEach(row => {
      const tr = document.createElement('tr');
      // create cells: waktu + kelas1..kelas6
      const waktu = row.time || '';
      let cells = `<td>${escapeHtml(waktu)}</td>`;
      for (let i=1;i<=6;i++){
        const key = 'kelas' + i;
        cells += `<td>${escapeHtml(row[key] || '')}</td>`;
      }
      tr.innerHTML = cells;
      tbody.appendChild(tr);
    });

    // inject edit schedule button near table if not present
    const parent = table.closest('.card') || table.parentElement;
    if (parent && !parent.querySelector('#btnEditSchedule')) {
      const btn = document.createElement('button');
      btn.id = 'btnEditSchedule';
      btn.className = 'btn btn-sm btn-outline-secondary mt-2';
      btn.textContent = 'Edit Jadwal';
      parent.appendChild(btn);
      btn.addEventListener('click', openEditScheduleModal);
    }
  }

  // --- Announcement Modal (dynamically created) ---
  function openAddAnnouncementModal() {
    if (id('modalAddAnn')) { // already exists
      const m = new bootstrap.Modal(id('modalAddAnn'));
      m.show();
      return;
    }
    const modalHtml = `
      <div class="modal fade" id="modalAddAnn" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title">Tambah Pengumuman Penting</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formAddAnn">
                <div class="mb-3">
                  <label class="form-label">Judul</label>
                  <input class="form-control" id="ann-title" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Isi</label>
                  <textarea class="form-control" id="ann-content" rows="4" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Tanggal (opsional)</label>
                  <input class="form-control" id="ann-date" placeholder="contoh: 28 Juni 2024" />
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button id="saveAnn" class="btn btn-primary">Simpan</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(id('modalAddAnn'));
    modal.show();

    id('saveAnn').addEventListener('click', () => {
      const title = id('ann-title').value.trim();
      const content = id('ann-content').value.trim();
      const date = id('ann-date').value.trim() || (new Date()).toLocaleDateString();
      if (!title && !content) { alert('Judul atau isi harus diisi'); return; }
      if (typeof dataStorage !== 'undefined' && typeof dataStorage.addAnnouncement === 'function') {
        dataStorage.addAnnouncement({ title, content, date }, { actor: 'Admin Web' });
      } else {
        // fallback key
        const arr = JSON.parse(localStorage.getItem('pengumumanData') || '[]');
        arr.unshift({ id: 'ann' + Date.now(), title, content, date, createdAt: new Date().toISOString() });
        localStorage.setItem('pengumumanData', JSON.stringify(arr));
        try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
      }
      modal.hide();
      renderAnnouncements();
      renderDashboard();
    });
  }

  // --- Schedule Edit Modal (simple editor) ---
  function openEditScheduleModal() {
    if (id('modalEditSchedule')) {
      new bootstrap.Modal(id('modalEditSchedule')).show();
      return;
    }
    // build modal with JSON editor for simplicity
    const schedule = dataStorage.getSchedule ? dataStorage.getSchedule() : JSON.parse(localStorage.getItem('sdn_v1_schedule') || '[]');
    const modalHtml = `
      <div class="modal fade" id="modalEditSchedule" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title">Edit Jadwal Hari Ini (JSON sederhana)</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="small text-muted">Edit format JSON berikut. Contoh tiap baris: {"time":"07:00-08:30","kelas1":"Matematika","kelas2":"Bahasa Indonesia",...}</p>
              <textarea id="scheduleJson" class="form-control" style="min-height:300px;">${escapeHtml(JSON.stringify(schedule, null, 2))}</textarea>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button id="saveSchedule" class="btn btn-primary">Simpan Jadwal</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(id('modalEditSchedule'));
    modal.show();

    id('saveSchedule').addEventListener('click', () => {
      let raw = id('scheduleJson').value.trim();
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) { alert('Format harus array JSON'); return; }
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.saveSchedule === 'function') {
          dataStorage.saveSchedule(parsed, { actor: 'Admin Web' });
        } else {
          localStorage.setItem('sdn_v1_schedule', JSON.stringify(parsed));
          try { window.dispatchEvent(new CustomEvent('sdn:dashboard-updated')); } catch(e){}
        }
        modal.hide();
        renderSchedule();
        renderDashboard();
      } catch (err) {
        alert('JSON tidak valid: ' + err.message);
      }
    });
  }

  // utils
  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;'
      })[s];
    });
  }

  function renderAll() {
    renderDashboard();
    renderActivities();
    renderAnnouncements();
    renderSchedule();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();

    // listen to storage events
    window.addEventListener('sdn:dashboard-updated', renderAll);
    window.addEventListener('sdn:activities-changed', (e) => {
      renderActivities();
      // small in-page notification (non-blocking)
      try {
        const detail = e.detail || {};
        const toast = document.createElement('div');
        toast.className = 'custom-alert bg-dark text-white';
        toast.style.position = 'fixed'; toast.style.top = '16px'; toast.style.right = '16px'; toast.style.zIndex = 2500;
        toast.style.padding = '10px 14px'; toast.style.borderRadius = '8px';
        toast.textContent = detail.message || 'Perubahan data';
        document.body.appendChild(toast);
        setTimeout(()=> { toast.remove(); }, 2500);
      } catch(e){}
    });

    // cross-tab localStorage sync
    window.addEventListener('storage', (ev) => {
      if (ev.key && ev.key.startsWith('sdn_v1_')) renderAll();
    });
  });
})();

