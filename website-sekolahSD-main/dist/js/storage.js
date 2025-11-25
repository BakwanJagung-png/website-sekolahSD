// storage.js - DataStorage v2 with Schedule support
class DataStorage {
  constructor() {
    this.LS_PREFIX = 'sdn_v1_';
    this.init();
  }

  _key(name) { return this.LS_PREFIX + name; }

  _nowReadable() {
    const d = new Date();
    return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  init() {
    try {
      if (!localStorage.getItem(this._key('guruData'))) {
        const defaultGuru = [
          { id: 1, nip: '001', nama: 'Alifi Amalki', jabatan: 'Wali Kelas 1', mataPelajaran: 'Matematika, IPA', pendidikan: 'S1 PGSD', email: 'alifi.amalki@sdnusantara.sch.id', telepon: '081234567890', riwayat: 'SD Nusantara (2020 - Sekarang)', foto: 'assets/images/alip.jpg' },
          { id: 2, nip: '002', nama: 'Nandika Dwi A', jabatan: 'Wali Kelas 2', mataPelajaran: 'Informatika, Bahasa Inggris', pendidikan: 'S1 PGSD', email: 'nandika.dwi@sdnusantara.sch.id', telepon: '081298765432', riwayat: 'SD Nusantara (2025 - Sekarang)', foto: 'assets/images/alip.jpg' }
        ];
        localStorage.setItem(this._key('guruData'), JSON.stringify(defaultGuru));
      }

      if (!localStorage.getItem(this._key('siswaData'))) {
        const defaultSiswa = {
          kelas1: [
            { id: 1, nis: '001', nama: 'Andi', foto: 'assets/images/guruDiazz.jpg' },
            { id: 2, nis: '002', nama: 'Siti', foto: 'assets/images/alipSD.jpg' },
            { id: 3, nis: '003', nama: 'Alifi', foto: 'assets/images/gurudika.jpg' }
          ],
          kelas2: [], kelas3: [], kelas4: [], kelas5: [], kelas6: []
        };
        localStorage.setItem(this._key('siswaData'), JSON.stringify(defaultSiswa));
      }

      if (!localStorage.getItem(this._key('recentActivities'))) {
        const defAct = [
          { id: this._uid(), time: this._nowReadable(), type: 'system', actor: 'system', message: 'Sistem inisialisasi data.' }
        ];
        localStorage.setItem(this._key('recentActivities'), JSON.stringify(defAct));
      }

      if (!localStorage.getItem(this._key('announcements'))) {
        const defAnn = [
          // contoh default (boleh dikosongkan)
          { id: this._uid(), title: 'Penerimaan Raport', content: 'Tanggal: 28 Juni 2024', date: '28 Juni 2024', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem(this._key('announcements'), JSON.stringify(defAnn));
      }

      // SCHEDULE default (jika belum ada)
      if (!localStorage.getItem(this._key('schedule'))) {
        const defaultSchedule = [
          { id: this._uid(), time: '07:00-08:30', kelas1: 'Matematika', kelas2: 'Bahasa Indonesia', kelas3: 'IPA', kelas4: 'IPS', kelas5: 'Matematika', kelas6: 'Bahasa Inggris' },
          { id: this._uid(), time: '08:30-10:00', kelas1: 'Bahasa Indonesia', kelas2: 'Matematika', kelas3: 'Bahasa Indonesia', kelas4: 'Matematika', kelas5: 'IPA', kelas6: 'Matematika' }
        ];
        localStorage.setItem(this._key('schedule'), JSON.stringify(defaultSchedule));
      }

      if (!localStorage.getItem(this._key('dashboardStats'))) {
        const defaultStats = { totalSiswa: 0, totalGuru: 0, totalKelas: 6, pengumumanAktif: 0 };
        localStorage.setItem(this._key('dashboardStats'), JSON.stringify(defaultStats));
        this.updateDashboardStats(false);
      } else {
        this.updateDashboardStats(false);
      }
    } catch (e) {
      console.warn('init storage failed', e);
    }
  }

  _uid() { return 'id' + Math.floor(Math.random() * 1e9); }

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._key(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('storage.get parse error', e);
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('storage.set failed', e);
      return false;
    }
  }

  // GURU
  getGuru() { return this.get('guruData', []); }
  saveGuru(arr, options = { emitActivity: true, actor: 'Admin' }) {
    this.set('guruData', arr);
    if (options.emitActivity && Array.isArray(arr) && arr.length) {
      const latest = arr[arr.length - 1];
      this.addActivity({ type: 'guru', actor: options.actor, message: `Menambahkan/Update guru: ${latest.nama} (${latest.nip || '-'})` });
    }
    this.updateDashboardStats(true);
  }
  addGuru(guruObj, options = { emitActivity: true, actor: 'Admin' }) {
    const arr = this.getGuru();
    const newItem = Object.assign({ id: this._uid() }, guruObj);
    arr.push(newItem);
    this.set('guruData', arr);
    if (options.emitActivity) this.addActivity({ type: 'guru', actor: options.actor, message: `Menambahkan guru: ${newItem.nama} (${newItem.nip || '-'})` });
    this.updateDashboardStats(true);
    return newItem;
  }
  removeGuruById(id, options = { emitActivity: true, actor: 'Admin' }) {
    let arr = this.getGuru();
    const found = arr.find(g=>g.id==id);
    arr = arr.filter(g => g.id != id);
    this.set('guruData', arr);
    if (options.emitActivity && found) this.addActivity({ type: 'guru', actor: options.actor, message: `Menghapus guru: ${found.nama} (${found.nip || '-'})` });
    this.updateDashboardStats(true);
  }

  // SISWA
  getSiswa(kelas) {
    const all = this.get('siswaData', {});
    return all[kelas] || [];
  }
  saveSiswa(kelas, arr, options = { emitActivity: true, actor: 'Admin' }) {
    const all = this.get('siswaData', {});
    all[kelas] = arr;
    this.set('siswaData', all);
    if (options.emitActivity && Array.isArray(arr) && arr.length) {
      const latest = arr[arr.length - 1];
      this.addActivity({ type: 'siswa', actor: options.actor, message: `Menambahkan/Update siswa: ${latest.nama} (Kelas ${kelas.replace('kelas','')})` });
    }
    this.updateDashboardStats(true);
  }
  addSiswa(kelas, siswaObj, options = { emitActivity: true, actor: 'Admin' }) {
    const all = this.get('siswaData', {});
    if (!Array.isArray(all[kelas])) all[kelas] = [];
    const newItem = Object.assign({ id: this._uid() }, siswaObj);
    all[kelas].push(newItem);
    this.set('siswaData', all);
    if (options.emitActivity) this.addActivity({ type: 'siswa', actor: options.actor, message: `Menambahkan siswa: ${newItem.nama} (NIS ${newItem.nis || '-'}) ke ${kelas}` });
    this.updateDashboardStats(true);
    return newItem;
  }
  removeSiswa(kelas, id, options = { emitActivity: true, actor: 'Admin' }) {
    const all = this.get('siswaData', {});
    const bucket = all[kelas] || [];
    const found = bucket.find(s=>s.id==id);
    all[kelas] = bucket.filter(s => s.id != id);
    this.set('siswaData', all);
    if (options.emitActivity && found) this.addActivity({ type: 'siswa', actor: options.actor, message: `Menghapus siswa: ${found.nama} (NIS ${found.nis || '-'}) dari ${kelas}` });
    this.updateDashboardStats(true);
  }

  // Activities
  getActivities() { return this.get('recentActivities', []); }
  addActivity(activity) {
    try {
      const arr = this.getActivities() || [];
      const entry = {
        id: this._uid(),
        time: this._nowReadable(),
        type: activity.type || 'general',
        actor: activity.actor || 'Admin',
        message: activity.message || '',
        meta: activity.meta || null
      };
      arr.unshift(entry);
      if (arr.length > 100) arr.length = 100;
      this.set('recentActivities', arr);
      window.dispatchEvent(new CustomEvent('sdn:activities-changed', { detail: entry }));
      this.updateDashboardStats(true);
      return entry;
    } catch (e) {
      console.warn('addActivity failed', e);
      return null;
    }
  }

  // Announcements
  getAnnouncements() { return this.get('announcements', []); }
  addAnnouncement(annObj, options = { emitActivity: true, actor: 'Admin' }) {
    const arr = this.getAnnouncements() || [];
    const newAnn = Object.assign({ id: this._uid(), createdAt: new Date().toISOString() }, annObj);
    arr.unshift(newAnn);
    this.set('announcements', arr);
    if (options.emitActivity) this.addActivity({ type: 'announcement', actor: options.actor, message: `Menambahkan pengumuman: ${newAnn.title || '(tanpa judul)'}` });
    this.updateDashboardStats(true);
    return newAnn;
  }
  removeAnnouncement(id, options = { emitActivity: true, actor: 'Admin' }) {
    const arr = this.getAnnouncements() || [];
    const found = arr.find(a => a.id == id);
    const newArr = arr.filter(a => a.id != id);
    this.set('announcements', newArr);
    if (options.emitActivity && found) this.addActivity({ type: 'announcement', actor: options.actor, message: `Menghapus pengumuman: ${found.title || '(tanpa judul)'}` });
    this.updateDashboardStats(true);
  }

  // Schedule management
  getSchedule() {
    return this.get('schedule', []);
  }
  saveSchedule(scheduleArr, options = { emitActivity: true, actor: 'Admin' }) {
    this.set('schedule', scheduleArr);
    if (options.emitActivity) this.addActivity({ type: 'system', actor: options.actor, message: 'Memperbarui jadwal pelajaran.' });
    this.updateDashboardStats(true);
  }
  addScheduleEntry(entry, options = { emitActivity: true, actor: 'Admin' }) {
    const arr = this.getSchedule() || [];
    const newE = Object.assign({ id: this._uid() }, entry);
    arr.push(newE);
    this.set('schedule', arr);
    if (options.emitActivity) this.addActivity({ type: 'system', actor: options.actor, message: `Menambahkan jadwal: ${entry.time}` });
    this.updateDashboardStats(true);
    return newE;
  }
  removeScheduleEntry(id, options = { emitActivity: true, actor: 'Admin' }) {
    const arr = this.getSchedule() || [];
    const found = arr.find(s => s.id == id);
    const newArr = arr.filter(s => s.id != id);
    this.set('schedule', newArr);
    if (options.emitActivity && found) this.addActivity({ type: 'system', actor: options.actor, message: `Menghapus jadwal: ${found.time}` });
    this.updateDashboardStats(true);
  }

  // Dash stats
  getDashboardStats() { return this.get('dashboardStats', { totalSiswa:0, totalGuru:0, totalKelas:6, pengumumanAktif:0 }); }
  updateDashboardStats(emitEvent = true) {
    const guru = this.getGuru();
    const siswa = this.get('siswaData', {});
    const ann = this.getAnnouncements();

    let totalSiswa = 0;
    Object.values(siswa).forEach(k => { if (Array.isArray(k)) totalSiswa += k.length; });

    const stats = {
      totalSiswa,
      totalGuru: Array.isArray(guru) ? guru.length : 0,
      totalKelas: 6,
      pengumumanAktif: Array.isArray(ann) ? ann.length : 0
    };
    this.set('dashboardStats', stats);

    if (emitEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdn:dashboard-updated', { detail: stats }));
    }
    return stats;
  }
}

const dataStorage = new DataStorage();