// siswa.js - Sistem Data Siswa dengan Database Terpisah per Kelas
class SiswaManager {
    constructor() {
        this.currentEditId = null;
        this.currentFotoData = null;
        this.currentKelasFilter = 'all'; // 'all' atau '1', '2', ..., '6'
        this.init();
    }

    init() {
        this.renderSiswa();
        this.setupEventListeners();
        this.setupFotoHandlers();
        this.setupKelasFilter();
    }

    setupEventListeners() {
        const form = document.getElementById("siswaForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.saveSiswa();
            }, { passive: false });
        }

        const search = document.getElementById("searchSiswa");
        if (search) {
            search.addEventListener("input", (e) => {
                this.searchSiswa(e.target.value);
            });
        }
    }

    setupFotoHandlers() {
        const urlOption = document.getElementById('fotoUrlOption');
        const uploadOption = document.getElementById('fotoUploadOption');
        const urlContainer = document.getElementById('urlFotoContainer');
        const uploadContainer = document.getElementById('uploadFotoContainer');
        const fileInput = document.getElementById('siswa-foto-upload');
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
                    if (!file.type.match('image.*')) {
                        this.showAlert('Hanya file gambar yang diizinkan', 'danger');
                        fileInput.value = '';
                        return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                        this.showAlert('Ukuran file maksimal 2MB', 'danger');
                        fileInput.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.currentFotoData = event.target.result;
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

    setupKelasFilter() {
        const filterBtn = document.getElementById('kelasFilterBtn');
        const dropdownItems = document.querySelectorAll('[data-kelas]');
        
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const kelas = item.getAttribute('data-kelas');
                this.filterByKelas(kelas);
                
                // Update tombol filter
                if (kelas === 'all') {
                    filterBtn.innerHTML = '<i class="fas fa-filter"></i> Semua Kelas';
                } else {
                    filterBtn.innerHTML = `<i class="fas fa-filter"></i> Kelas ${kelas}`;
                }
            });
        });
    }

    // Helper untuk menampilkan alert
    showAlert(message, type = 'info') {
        if (typeof showAnimatedAlert === 'function') {
            showAnimatedAlert(message, type);
        } else {
            alert(message);
        }
    }

    // Get data siswa berdasarkan kelas
    _getSiswaByKelas(kelas) {
        // Mengambil data dari localStorage dengan key berdasarkan kelas
        const key = kelas === 'all' ? 'siswaData' : `siswaData_kelas${kelas}`;
        const data = localStorage.getItem(key);
        
        if (data) {
            return JSON.parse(data);
        }
        
        // Jika tidak ada data untuk kelas tertentu, return array kosong
        return [];
    }

    // Get semua data siswa (untuk pencarian di semua kelas)
    _getAllSiswa() {
        const allSiswa = [];
        for (let kelas = 1; kelas <= 6; kelas++) {
            const key = `siswaData_kelas${kelas}`;
            const data = localStorage.getItem(key);
            if (data) {
                const siswaKelas = JSON.parse(data);
                allSiswa.push(...siswaKelas);
            }
        }
        return allSiswa;
    }

    // Save data siswa berdasarkan kelas
    _saveSiswaByKelas(kelas, data) {
        const key = `siswaData_kelas${kelas}`;
        localStorage.setItem(key, JSON.stringify(data));
        
        // Juga simpan di storage utama untuk pencarian
        this._updateMainStorage();
        
        // Update dashboard stats
        if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
            dataStorage.updateDashboardStats(true);
        }
    }

    // Update storage utama dengan semua data siswa
    _updateMainStorage() {
        const allSiswa = this._getAllSiswa();
        localStorage.setItem('siswaData', JSON.stringify(allSiswa));
    }

    // Toggle field jurusan berdasarkan kelas
    toggleJurusanField() {
        const kelas = document.getElementById('siswa-kelas').value;
        const jurusanContainer = document.getElementById('jurusanContainer');
        const jurusanSelect = document.getElementById('siswa-jurusan');
        
        if (kelas >= 4 && kelas <= 6) {
            jurusanContainer.style.display = 'block';
            jurusanSelect.required = true;
        } else {
            jurusanContainer.style.display = 'none';
            jurusanSelect.required = false;
            jurusanSelect.value = '';
        }
    }

    renderSiswa() {
        let siswaData;
        
        if (this.currentKelasFilter === 'all') {
            siswaData = this._getAllSiswa();
        } else {
            siswaData = this._getSiswaByKelas(this.currentKelasFilter);
        }
        
        const container = document.getElementById("siswa-container");
        if (!container) return;

        if (!siswaData.length) {
            const kelasText = this.currentKelasFilter === 'all' ? '' : ` Kelas ${this.currentKelasFilter}`;
            container.innerHTML = `
                <div class="col-12">
                    <div class="card p-5 text-center">
                        <i class="fas fa-user-graduate fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">Belum ada data siswa${kelasText}</h4>
                        <p class="text-muted">Silakan tambahkan data siswa baru</p>
                        <button class="btn btn-primary mt-3" onclick="siswaManager.openAddModal()">
                            <i class="fas fa-plus"></i> Tambah Siswa
                        </button>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = siswaData
            .map((siswa) => {
                const sid = siswa.id || ('id' + Date.now() + Math.floor(Math.random()*1000));
                const foto = siswa.foto && siswa.foto.length ? siswa.foto : 'assets/images/default-student.png';
                const nama = siswa.nama || '-';
                const nis = siswa.nis || '-';
                const kelas = siswa.kelas || '-';
                const jurusan = siswa.jurusan || '';
                
                // Tambahkan badge jurusan untuk kelas 4-6
                const jurusanBadge = (kelas >= 4 && kelas <= 6 && jurusan) 
                    ? `<span class="badge badge-jurusan bg-info">${jurusan}</span>` 
                    : '';
                
                return `
                <div class="col-md-4 col-12 mb-4">
                    <div class="card siswa text-center animate-card">
                        <div class="position-relative">
                            <img src="${foto}" class="card-img-top mx-auto mt-3"
                                alt="Foto ${escapeHtml(nama)}"
                                style="width:150px;height:150px;object-fit:cover;border-radius:10px;"
                                onerror="this.src='assets/images/default-student.png'">
                            <span class="position-absolute top-0 end-0 m-2 kelas-badge">Kelas ${kelas}</span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(nama)}</h5>
                            <p class="card-text">NIS: ${escapeHtml(nis)} ${jurusanBadge}</p>
                            <p class="card-text"><small class="text-muted">${siswa.jk || ''}</small></p>
                            <div class="btn-group">
                                <button class="btn btn-outline-primary btn-sm" data-siswa-id="${sid}" data-action="detail">Detail</button>
                                <button class="btn btn-outline-warning btn-sm" data-siswa-id="${sid}" data-action="edit">Edit</button>
                                <button class="btn btn-outline-danger btn-sm" data-siswa-id="${sid}" data-action="delete">Hapus</button>
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
                const id = btn.dataset.siswaId;
                if (action === 'detail') this.showDetail(id);
                else if (action === 'edit') this.editSiswa(id);
                else if (action === 'delete') this.deleteSiswa(id);
            });
        });
    }

    // Filter siswa berdasarkan kelas
    filterByKelas(kelas) {
        this.currentKelasFilter = kelas;
        this.renderSiswa();
    }

    openAddModal() {
        this.currentEditId = null;
        this.currentFotoData = null;
        
        const label = document.getElementById("siswaModalLabel");
        if (label) label.textContent = "Tambah Siswa Baru";
        
        const form = document.getElementById("siswaForm");
        if (form) form.reset();
        
        // Reset foto options
        const urlOption = document.getElementById('fotoUrlOption');
        const preview = document.getElementById('fotoPreview');
        if (urlOption) urlOption.checked = true;
        if (preview) {
            preview.style.display = 'none';
            preview.src = '#';
        }
        
        // Reset kelas dan jurusan
        const jurusanContainer = document.getElementById('jurusanContainer');
        if (jurusanContainer) jurusanContainer.style.display = 'none';
        
        const urlContainer = document.getElementById('urlFotoContainer');
        const uploadContainer = document.getElementById('uploadFotoContainer');
        if (urlContainer) urlContainer.style.display = 'block';
        if (uploadContainer) uploadContainer.style.display = 'none';
        
        const modalEl = document.getElementById("siswaModal");
        if (modalEl) new bootstrap.Modal(modalEl).show();
    }

    editSiswa(id) {
        // Cari siswa di semua kelas
        let foundSiswa = null;
        let foundKelas = null;
        
        for (let kelas = 1; kelas <= 6; kelas++) {
            const siswaKelas = this._getSiswaByKelas(kelas);
            const siswa = siswaKelas.find(s => String(s.id) === String(id));
            if (siswa) {
                foundSiswa = siswa;
                foundKelas = kelas;
                break;
            }
        }
        
        if (!foundSiswa) {
            this.showAlert('Data siswa tidak ditemukan', 'danger');
            return;
        }

        this.currentEditId = foundSiswa.id;
        this.currentFotoData = null;

        const label = document.getElementById("siswaModalLabel");
        if (label) label.textContent = "Edit Data Siswa";

        // Isi form fields
        setIfExists('siswa-nis', foundSiswa.nis);
        setIfExists('siswa-nama', foundSiswa.nama);
        setIfExists('siswa-kelas', foundSiswa.kelas);
        setIfExists('siswa-jk', foundSiswa.jk);
        setIfExists('siswa-tempat-lahir', foundSiswa.tempatLahir);
        setIfExists('siswa-tgl-lahir', foundSiswa.tglLahir);
        setIfExists('siswa-agama', foundSiswa.agama);
        setIfExists('siswa-alamat', foundSiswa.alamat);
        setIfExists('siswa-ayah', foundSiswa.ayah);
        setIfExists('siswa-ibu', foundSiswa.ibu);
        setIfExists('siswa-telepon', foundSiswa.telepon);
        setIfExists('siswa-email', foundSiswa.email);
        setIfExists('siswa-catatan', foundSiswa.catatan);
        setIfExists('siswa-jurusan', foundSiswa.jurusan || '');

        // Toggle jurusan field berdasarkan kelas
        this.toggleJurusanField();

        // Handle foto
        const isBase64 = foundSiswa.foto && foundSiswa.foto.startsWith('data:image');
        const urlOption = document.getElementById('fotoUrlOption');
        const uploadOption = document.getElementById('fotoUploadOption');
        const urlContainer = document.getElementById('urlFotoContainer');
        const uploadContainer = document.getElementById('uploadFotoContainer');
        const preview = document.getElementById('fotoPreview');

        if (isBase64) {
            if (uploadOption) uploadOption.checked = true;
            if (urlContainer) urlContainer.style.display = 'none';
            if (uploadContainer) uploadContainer.style.display = 'block';
            if (preview) {
                preview.src = foundSiswa.foto;
                preview.style.display = 'block';
            }
            this.currentFotoData = foundSiswa.foto;
        } else {
            if (urlOption) urlOption.checked = true;
            if (urlContainer) urlContainer.style.display = 'block';
            if (uploadContainer) uploadContainer.style.display = 'none';
            setIfExists('siswa-foto-url', foundSiswa.foto);
        }

        const modalEl = document.getElementById("siswaModal");
        if (modalEl) new bootstrap.Modal(modalEl).show();
    }

    saveSiswa() {
        try {
            // Ambil data foto
            let fotoData = '';
            const urlOption = document.getElementById('fotoUrlOption');
            
            if (urlOption && urlOption.checked) {
                fotoData = getVal('siswa-foto-url');
            } else {
                fotoData = this.currentFotoData || getVal('siswa-foto-url');
            }

            const kelas = getVal('siswa-kelas');
            const formData = {
                nis: getVal('siswa-nis'),
                nama: getVal('siswa-nama'),
                kelas: kelas,
                jk: getVal('siswa-jk'),
                tempatLahir: getVal('siswa-tempat-lahir'),
                tglLahir: getVal('siswa-tgl-lahir'),
                agama: getVal('siswa-agama'),
                alamat: getVal('siswa-alamat'),
                ayah: getVal('siswa-ayah'),
                ibu: getVal('siswa-ibu'),
                telepon: getVal('siswa-telepon'),
                email: getVal('siswa-email'),
                foto: fotoData,
                catatan: getVal('siswa-catatan'),
                jurusan: (kelas >= 4 && kelas <= 6) ? getVal('siswa-jurusan') : '',
                createdAt: new Date().toISOString()
            };

            // Validasi
            if (!formData.nama || !formData.nis || !formData.kelas || !formData.jk) {
                this.showAlert('Nama, NIS, Kelas, dan Jenis Kelamin harus diisi', 'danger');
                return;
            }

            // EDIT existing siswa
            if (this.currentEditId) {
                // Cari dan hapus data lama dari semua kelas
                let oldKelas = null;
                for (let k = 1; k <= 6; k++) {
                    const siswaKelas = this._getSiswaByKelas(k);
                    const idx = siswaKelas.findIndex(s => String(s.id) === String(this.currentEditId));
                    if (idx !== -1) {
                        oldKelas = k;
                        break;
                    }
                }

                if (!oldKelas) {
                    this.showAlert('Data siswa tidak ditemukan', 'danger');
                    return;
                }

                // Jika kelas berubah, pindahkan data ke kelas baru
                if (String(oldKelas) !== String(kelas)) {
                    // Hapus dari kelas lama
                    const siswaLama = this._getSiswaByKelas(oldKelas);
                    const newSiswaLama = siswaLama.filter(s => String(s.id) !== String(this.currentEditId));
                    this._saveSiswaByKelas(oldKelas, newSiswaLama);
                    
                    // Tambah ke kelas baru
                    const siswaBaru = this._getSiswaByKelas(kelas);
                    formData.id = this.currentEditId;
                    siswaBaru.push(formData);
                    this._saveSiswaByKelas(kelas, siswaBaru);
                } else {
                    // Update di kelas yang sama
                    const siswaKelas = this._getSiswaByKelas(kelas);
                    const idx = siswaKelas.findIndex(s => String(s.id) === String(this.currentEditId));
                    if (idx !== -1) {
                        const oldSiswa = siswaKelas[idx];
                        siswaKelas[idx] = { ...oldSiswa, ...formData };
                        this._saveSiswaByKelas(kelas, siswaKelas);
                    }
                }

                this.recordActivity('siswa', 'info', `Mengedit siswa: ${formData.nama} (NIS ${formData.nis}) Kelas ${kelas}`);
                this.showAlert('✏️ Data siswa berhasil diperbarui!', 'info');
            }
            // TAMBAH siswa baru
            else {
                const siswaKelas = this._getSiswaByKelas(kelas);
                const maxId = siswaKelas.reduce((acc, s) => {
                    const v = Number(s && s.id ? s.id : 0);
                    return isFinite(v) ? Math.max(acc, v) : acc;
                }, 0);
                const newId = maxId > 0 ? (maxId + 1) : ('id' + Date.now());

                formData.id = newId;
                siswaKelas.push(formData);
                this._saveSiswaByKelas(kelas, siswaKelas);

                this.recordActivity('siswa', 'success', `Menambahkan siswa baru: ${formData.nama} (NIS ${formData.nis}) Kelas ${kelas}`);
                this.showAlert('✅ Siswa baru berhasil disimpan!', 'success');
            }

            // Reset dan refresh
            this.currentFotoData = null;
            this.renderSiswa();
            const modalEl = document.getElementById("siswaModal");
            if (modalEl) {
                const inst = bootstrap.Modal.getInstance(modalEl);
                if (inst) inst.hide();
            }
            
            // Update dashboard
            if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
                dataStorage.updateDashboardStats(true);
            }
        } catch (e) {
            console.error('saveSiswa error', e);
            this.showAlert('Terjadi kesalahan saat menyimpan', 'danger');
        } finally {
            this.currentEditId = null;
        }
    }

    deleteSiswa(id) {
        // Cari siswa di semua kelas
        let foundSiswa = null;
        let foundKelas = null;
        
        for (let kelas = 1; kelas <= 6; kelas++) {
            const siswaKelas = this._getSiswaByKelas(kelas);
            const siswa = siswaKelas.find(s => String(s.id) === String(id));
            if (siswa) {
                foundSiswa = siswa;
                foundKelas = kelas;
                break;
            }
        }
        
        if (!foundSiswa) {
            this.showAlert('Data siswa tidak ditemukan', 'danger');
            return;
        }

        const doDelete = () => {
            try {
                const siswaKelas = this._getSiswaByKelas(foundKelas);
                const newList = siswaKelas.filter(s => String(s.id) !== String(id));
                this._saveSiswaByKelas(foundKelas, newList);

                this.recordActivity('siswa', 'danger', `Menghapus siswa: ${foundSiswa.nama} (NIS ${foundSiswa.nis}) Kelas ${foundKelas}`);
                this.showAlert('🗑️ Data siswa berhasil dihapus!', 'danger');
                this.renderSiswa();
                
                if (typeof dataStorage !== 'undefined' && typeof dataStorage.updateDashboardStats === 'function') {
                    dataStorage.updateDashboardStats(true);
                }
            } catch (error) {
                console.error('Error deleting siswa:', error);
                this.showAlert('Terjadi kesalahan saat menghapus data', 'danger');
            }
        };

        if (typeof confirmAnimated === 'function') {
            confirmAnimated("Apakah Anda yakin ingin menghapus data siswa ini?", doDelete);
        } else {
            if (window.confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) {
                doDelete();
            }
        }
    }

    searchSiswa(keyword) {
        const q = (keyword || '').trim().toLowerCase();
        const container = document.getElementById("siswa-container");
        if (!container) return;

        let siswaData;
        if (this.currentKelasFilter === 'all') {
            siswaData = this._getAllSiswa();
        } else {
            siswaData = this._getSiswaByKelas(this.currentKelasFilter);
        }

        const filtered = q ? siswaData.filter(s =>
            (s.nama || '').toLowerCase().includes(q) ||
            String(s.nis || '').includes(q) ||
            (s.ayah || '').toLowerCase().includes(q) ||
            (s.ibu || '').toLowerCase().includes(q)
        ) : siswaData;

        container.innerHTML = filtered
            .map((siswa) => {
                const sid = siswa.id || ('id' + Date.now() + Math.floor(Math.random()*1000));
                const foto = siswa.foto && siswa.foto.length ? siswa.foto : 'assets/images/default-student.png';
                const jurusanBadge = (siswa.kelas >= 4 && siswa.kelas <= 6 && siswa.jurusan) 
                    ? `<span class="badge badge-jurusan bg-info">${siswa.jurusan}</span>` 
                    : '';
                
                return `
                <div class="col-md-4 col-12 mb-4">
                    <div class="card siswa text-center animate-card">
                        <div class="position-relative">
                            <img src="${foto}" class="card-img-top mx-auto mt-3"
                                style="width:150px;height:150px;object-fit:cover;border-radius:10px;"
                                onerror="this.src='assets/images/default-student.png'">
                            <span class="position-absolute top-0 end-0 m-2 kelas-badge">Kelas ${siswa.kelas || '-'}</span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(siswa.nama || '')}</h5>
                            <p class="card-text">NIS: ${escapeHtml(siswa.nis || '-')} ${jurusanBadge}</p>
                            <p class="card-text"><small>${siswa.jk || ''}</small></p>
                            <div class="btn-group">
                                <button class="btn btn-outline-primary btn-sm" data-siswa-id="${sid}" data-action="detail">Detail</button>
                                <button class="btn btn-outline-warning btn-sm" data-siswa-id="${sid}" data-action="edit">Edit</button>
                                <button class="btn btn-outline-danger btn-sm" data-siswa-id="${sid}" data-action="delete">Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            })
            .join("");

        // Re-attach event listeners
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const id = btn.dataset.siswaId;
                if (action === 'detail') this.showDetail(id);
                else if (action === 'edit') this.editSiswa(id);
                else if (action === 'delete') this.deleteSiswa(id);
            });
        });
    }

    showDetail(id) {
        // Cari siswa di semua kelas
        let foundSiswa = null;
        
        for (let kelas = 1; kelas <= 6; kelas++) {
            const siswaKelas = this._getSiswaByKelas(kelas);
            const siswa = siswaKelas.find(s => String(s.id) === String(id));
            if (siswa) {
                foundSiswa = siswa;
                break;
            }
        }
        
        if (!foundSiswa) {
            this.showAlert('Data siswa tidak ditemukan', 'danger');
            return;
        }

        // Isi modal detail
        const nameEl = document.getElementById("detail-siswa-nama");
        const nisEl = document.getElementById("detail-siswa-nis");
        const kelasEl = document.getElementById("detail-siswa-kelas");
        const kelasTextEl = document.getElementById("detail-siswa-kelas-text");
        const jkEl = document.getElementById("detail-siswa-jk");
        const tempatLahirEl = document.getElementById("detail-siswa-tempat-lahir");
        const tglLahirEl = document.getElementById("detail-siswa-tgl-lahir");
        const agamaEl = document.getElementById("detail-siswa-agama");
        const alamatEl = document.getElementById("detail-siswa-alamat");
        const ayahEl = document.getElementById("detail-siswa-ayah");
        const ibuEl = document.getElementById("detail-siswa-ibu");
        const telEl = document.getElementById("detail-siswa-telepon");
        const emailEl = document.getElementById("detail-siswa-email");
        const catatanEl = document.getElementById("detail-siswa-catatan");
        const jurusanEl = document.getElementById("detail-siswa-jurusan");
        const jurusanBadgeEl = document.getElementById("detail-siswa-jurusan-badge");
        const jurusanContainer = document.getElementById("detail-jurusan-container");
        const fotoEl = document.getElementById("detail-siswa-foto");

        if (nameEl) nameEl.textContent = foundSiswa.nama || '-';
        if (nisEl) nisEl.textContent = foundSiswa.nis || '-';
        if (kelasEl) kelasEl.textContent = foundSiswa.kelas || '-';
        if (kelasTextEl) kelasTextEl.textContent = foundSiswa.kelas ? `Kelas ${foundSiswa.kelas}` : '-';
        if (jkEl) jkEl.textContent = foundSiswa.jk || '-';
        if (tempatLahirEl) tempatLahirEl.textContent = foundSiswa.tempatLahir || '-';
        if (tglLahirEl) tglLahirEl.textContent = foundSiswa.tglLahir || '-';
        if (agamaEl) agamaEl.textContent = foundSiswa.agama || '-';
        if (alamatEl) alamatEl.textContent = foundSiswa.alamat || '-';
        if (ayahEl) ayahEl.textContent = foundSiswa.ayah || '-';
        if (ibuEl) ibuEl.textContent = foundSiswa.ibu || '-';
        if (telEl) telEl.textContent = foundSiswa.telepon || '-';
        if (emailEl) emailEl.textContent = foundSiswa.email || '-';
        if (catatanEl) catatanEl.innerHTML = (foundSiswa.catatan || '').replace(/\n/g, '<br>');
        
        // Handle jurusan untuk kelas 4-6
        if (foundSiswa.kelas >= 4 && foundSiswa.kelas <= 6 && foundSiswa.jurusan) {
            if (jurusanEl) jurusanEl.textContent = foundSiswa.jurusan || '-';
            if (jurusanBadgeEl) {
                jurusanBadgeEl.textContent = foundSiswa.jurusan;
                jurusanBadgeEl.style.display = 'inline-block';
            }
            if (jurusanContainer) jurusanContainer.style.display = 'block';
        } else {
            if (jurusanBadgeEl) jurusanBadgeEl.style.display = 'none';
            if (jurusanContainer) jurusanContainer.style.display = 'none';
        }
        
        // Handle foto
        if (fotoEl) {
            fotoEl.src = foundSiswa.foto || 'assets/images/default-student.png';
            fotoEl.onerror = function() {
                this.src = 'assets/images/default-student.png';
            };
        }

        const detailModal = document.getElementById("detailSiswaModal");
        if (detailModal) new bootstrap.Modal(detailModal).show();
    }

    // Method untuk mencatat aktivitas
    recordActivity(type, activityType, message) {
        try {
            if (typeof dataStorage !== 'undefined' && typeof dataStorage.addActivity === 'function') {
                dataStorage.addActivity({ type: type, actor: 'Admin Web', message: message });
            } else if (typeof addAktivitas === 'function') {
                addAktivitas(activityType, message);
            } else {
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
            }
        } catch (error) {
            console.error('Error recording activity:', error);
        }
    }
}

// instantiate manager
const siswaManager = new SiswaManager();

/* =====================================
   Helper functions
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
        .kelas-filter-btn, #searchSiswa { width: 100% !important; margin-bottom: 10px; }
    }
    .animate-card { animation: fadeInUp 0.35s ease; }
    @keyframes fadeInUp { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    
    #fotoPreview { border: 2px solid #dee2e6; }
    #fotoPreview:not([src="#"]) { display: block !important; }
`;
document.head.appendChild(style);

// Di akhir fungsi saveSiswa() di siswa.js, tambahkan:
function triggerSiswaDataChanged() {
    const event = new Event('siswaDataChanged');
    document.dispatchEvent(event);
}

// Panggil setelah setiap perubahan data:
// Di saveSiswa(), deleteSiswa(), dll tambahkan:
triggerSiswaDataChanged();