// ==============================================
// SISTEM DISTRIBUSI SISWA - FIXED VERSION
// ==============================================

class DistribusiSiswa {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.chartColors = [
            '#007bff', '#28a745', '#17a2b8', 
            '#ffc107', '#dc3545', '#6c757d'
        ];
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        
        console.log('DistribusiSiswa constructor dipanggil');
        
        // Tunggu hingga DOM siap
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Memulai inisialisasi DistribusiSiswa...');
        
        // Tunggu sedikit untuk memastikan semua elemen sudah dimuat
        setTimeout(() => {
            try {
                this.initializeContainer();
                this.loadAndRender();
                this.setupEventListeners();
                
                // Setup mutation observer untuk mendeteksi perubahan DOM
                this.setupMutationObserver();
                
                // Cek ulang setelah 2 detik
                setTimeout(() => {
                    this.ensureContainerExists();
                }, 2000);
                
                this.isInitialized = true;
                console.log('DistribusiSiswa berhasil diinisialisasi');
            } catch (error) {
                console.error('Error saat inisialisasi:', error);
                this.retryInitialization();
            }
        }, 300);
    }

    retryInitialization() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Mencoba inisialisasi ulang (${this.retryCount}/${this.maxRetries})...`);
            
            setTimeout(() => {
                this.initializeContainer();
                if (document.getElementById('distribusi-siswa-container')) {
                    this.loadAndRender();
                } else {
                    this.retryInitialization();
                }
            }, 1000 * this.retryCount);
        } else {
            console.error('Gagal menginisialisasi setelah beberapa percobaan');
            this.showError('Gagal memuat distribusi siswa. Silakan refresh halaman.');
        }
    }

    initializeContainer() {
        console.log('Membuat container distribusi...');
        
        // Cek apakah sudah ada container
        let container = document.getElementById('distribusi-siswa-container');
        
        if (!container) {
            console.log('Container tidak ditemukan, membuat baru...');
            
            // Cari elemen target untuk menempatkan container
            let targetElement = null;
            
            // Coba beberapa lokasi berbeda
            const possibleTargets = [
                () => document.querySelector('.container.mt-4'),
                () => document.querySelector('main'),
                () => document.querySelector('#siswa-container').parentElement,
                () => document.querySelector('.breadcrumb').parentElement,
                () => document.body
            ];
            
            for (const getTarget of possibleTargets) {
                try {
                    const element = getTarget();
                    if (element) {
                        targetElement = element;
                        console.log('Target ditemukan:', element);
                        break;
                    }
                } catch (e) {
                    // Continue to next target
                }
            }
            
            if (!targetElement) {
                console.error('Tidak ada target element yang ditemukan');
                return false;
            }
            
            // Buat container baru
            container = document.createElement('div');
            container.id = 'distribusi-siswa-container';
            container.className = 'container mt-3 mb-4';
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Memuat distribusi siswa...</p>
                </div>
            `;
            
            // Sisipkan container di tempat yang tepat
            try {
                // Coba sisipkan setelah breadcrumb
                const breadcrumb = document.querySelector('.breadcrumb');
                if (breadcrumb && breadcrumb.parentElement) {
                    breadcrumb.parentElement.insertBefore(container, breadcrumb.nextElementSibling);
                    console.log('Container ditempatkan setelah breadcrumb');
                } 
                // Coba sisipkan sebelum tabel siswa
                else if (targetElement.querySelector('#siswa-container')) {
                    const siswaContainer = targetElement.querySelector('#siswa-container');
                    targetElement.insertBefore(container, siswaContainer);
                    console.log('Container ditempatkan sebelum tabel siswa');
                }
                // Coba sisipkan di awal main content
                else if (targetElement.classList.contains('container')) {
                    targetElement.insertBefore(container, targetElement.firstChild);
                    console.log('Container ditempatkan di awal content');
                }
                // Fallback: tambahkan di body
                else {
                    document.body.insertBefore(container, document.body.firstChild);
                    console.log('Container ditempatkan di body');
                }
            } catch (error) {
                console.error('Error menempatkan container:', error);
                document.body.appendChild(container);
            }
        }
        
        return true;
    }

    ensureContainerExists() {
        const container = document.getElementById('distribusi-siswa-container');
        if (!container) {
            console.warn('Container masih belum ada, membuat ulang...');
            this.initializeContainer();
            this.loadAndRender();
        } else if (container.innerHTML.includes('Memuat distribusi')) {
            console.warn('Container masih loading, render ulang...');
            this.loadAndRender();
        }
    }

    setupMutationObserver() {
        // Observer untuk mendeteksi perubahan pada DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Cek apakah container kita dihapus
                    if (!document.getElementById('distribusi-siswa-container')) {
                        console.log('Container dihapus, membuat ulang...');
                        setTimeout(() => {
                            this.initializeContainer();
                            this.loadAndRender();
                        }, 500);
                    }
                }
            });
        });
        
        // Mulai observe
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Fungsi untuk mendapatkan data dari localStorage
    getSiswaDataFromStorage() {
        console.log('Mengambil data siswa dari localStorage...');
        
        const allSiswa = [];
        
        // Method 1: Dari sistem yang sudah ada (siswaData_kelas1, siswaData_kelas2, ...)
        for (let kelas = 1; kelas <= 6; kelas++) {
            const key = `siswaData_kelas${kelas}`;
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(siswa => {
                            if (siswa && typeof siswa === 'object') {
                                siswa.kelas = siswa.kelas || kelas.toString();
                                allSiswa.push(siswa);
                            }
                        });
                        console.log(`Data Kelas ${kelas}: ${parsed.length} siswa`);
                    }
                }
            } catch (e) {
                console.warn(`Error parsing data kelas ${kelas}:`, e);
            }
        }
        
        // Method 2: Jika tidak ada data, buat data dummy untuk testing
        if (allSiswa.length === 0) {
            console.log('Membuat data dummy untuk testing...');
            
            // Buat data dummy untuk testing
            const dummyData = [];
            const names = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Joko'];
            const kelasList = ['1', '2', '3', '4', '5', '6'];
            
            kelasList.forEach(kelas => {
                const count = Math.floor(Math.random() * 5) + 3; // 3-7 siswa per kelas
                for (let i = 0; i < count; i++) {
                    dummyData.push({
                        id: `dummy-${kelas}-${i}`,
                        nis: `202400${kelas}${i}`,
                        nama: `${names[Math.floor(Math.random() * names.length)]} ${kelas}`,
                        kelas: kelas,
                        jk: Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan',
                        jurusan: parseInt(kelas) >= 4 ? (Math.random() > 0.5 ? 'IPA' : 'IPS') : ''
                    });
                }
            });
            
            // Simpan data dummy ke localStorage untuk testing
            try {
                localStorage.setItem('siswaData_dummy', JSON.stringify(dummyData));
            } catch (e) {
                console.warn('Tidak bisa menyimpan data dummy:', e);
            }
            
            return dummyData;
        }
        
        return allSiswa;
    }

    // Analisis data
    analyzeData(siswaData) {
        console.log(`Menganalisis ${siswaData.length} data siswa...`);
        
        const distribusi = {};
        const genderCount = { laki: 0, perempuan: 0 };
        
        // Inisialisasi semua kelas
        for (let i = 1; i <= 6; i++) {
            distribusi[`Kelas ${i}`] = {
                jumlah: 0,
                laki: 0,
                perempuan: 0
            };
        }
        
        // Hitung distribusi
        siswaData.forEach(siswa => {
            if (!siswa || !siswa.kelas) return;
            
            let kelas = siswa.kelas.toString().trim();
            
            // Normalisasi format kelas
            if (kelas.match(/^\d+$/)) {
                kelas = `Kelas ${kelas}`;
            } else if (!kelas.startsWith('Kelas')) {
                kelas = `Kelas ${kelas}`;
            }
            
            // Validasi kelas
            if (!distribusi[kelas]) {
                console.warn(`Kelas tidak valid: ${kelas}`);
                return;
            }
            
            distribusi[kelas].jumlah++;
            
            // Hitung gender
            const jk = siswa.jk || siswa.jenis_kelamin || '';
            const jkLower = jk.toString().toLowerCase();
            
            if (jkLower.includes('laki') || jk === 'L' || jkLower === 'l') {
                distribusi[kelas].laki++;
                genderCount.laki++;
            } else if (jkLower.includes('perempuan') || jk === 'P' || jkLower === 'p') {
                distribusi[kelas].perempuan++;
                genderCount.perempuan++;
            }
        });
        
        // Konversi ke array dan hitung persentase
        const totalSiswa = siswaData.length;
        const distribusiArray = [];
        
        Object.entries(distribusi).forEach(([kelas, data]) => {
            if (data.jumlah > 0) {
                distribusiArray.push({
                    kelas,
                    jumlah: data.jumlah,
                    laki: data.laki,
                    perempuan: data.perempuan,
                    persentase: totalSiswa > 0 ? ((data.jumlah / totalSiswa) * 100).toFixed(1) : 0
                });
            }
        });
        
        // Urutkan berdasarkan kelas
        distribusiArray.sort((a, b) => {
            const numA = parseInt(a.kelas.replace('Kelas ', ''));
            const numB = parseInt(b.kelas.replace('Kelas ', ''));
            return numA - numB;
        });
        
        // Hitung statistik
        let kelasTerbanyak = '-';
        let kelasTersedikit = '-';
        let maxJumlah = 0;
        let minJumlah = Infinity;
        
        distribusiArray.forEach(item => {
            if (item.jumlah > maxJumlah) {
                maxJumlah = item.jumlah;
                kelasTerbanyak = item.kelas;
            }
            if (item.jumlah < minJumlah) {
                minJumlah = item.jumlah;
                kelasTersedikit = item.kelas;
            }
        });
        
        return {
            total: totalSiswa,
            distribusi: distribusiArray,
            gender: {
                laki: genderCount.laki,
                perempuan: genderCount.perempuan
            },
            summary: {
                jumlahKelas: distribusiArray.length,
                rataPerKelas: distribusiArray.length > 0 ? (totalSiswa / distribusiArray.length).toFixed(1) : 0,
                kelasTerbanyak,
                kelasTersedikit
            },
            timestamp: new Date().toISOString()
        };
    }

    // Render distribusi ke HTML
    renderDistribusi(data) {
        const container = document.getElementById('distribusi-siswa-container');
        if (!container) {
            console.error('Container tidak ditemukan saat render');
            return;
        }
        
        console.log('Rendering distribusi...');
        
        this.currentData = data;
        
        // Render UI
        container.innerHTML = `
            <div class="card shadow border-0">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="fas fa-chart-pie me-2"></i>Distribusi Perserta Didik
                        </h5>
                        <div>
                            <span class="badge bg-light text-dark me-2">
                                Total: ${data.total} Perserta didik
                            </span>
                            <button class="btn btn-sm btn-light" onclick="window.distribusiSiswa.refresh()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${data.total === 0 ? this.renderNoData() : this.renderWithData(data)}
                </div>
            </div>
        `;
        
        // Jika ada data, render chart
        if (data.total > 0) {
            setTimeout(() => this.renderChart(data), 100);
        }
    }

    renderNoData() {
        return `
            <div class="text-center py-5">
                <i class="fas fa-database fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">Belum ada data anak</h5>
                <p class="text-muted">Tambah data siswa untuk melihat distribusi</p>
                <button class="btn btn-primary mt-2" onclick="siswaManager.openAddModal()">
                    <i class="fas fa-plus me-2"></i>Tambah Siswa
                </button>
            </div>
        `;
    }

    renderWithData(data) {
        return `
            <div class="row">
                <!-- Chart Section -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100 border-0">
                        <div class="card-body">
                            <h6 class="card-title text-center mb-3">
                                <i class="fas fa-chart-bar me-1"></i>Distribusi per Kelas
                            </h6>
                            <div style="height: 250px;">
                                <canvas id="distribusiChart"></canvas>
                            </div>
                            <div class="text-center mt-3">
                                <div class="d-flex justify-content-center flex-wrap gap-2">
                                    ${data.distribusi.map(item => `
                                        <span class="badge ${this.getBadgeColor(item.kelas)}">
                                            ${item.kelas}: ${item.jumlah}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Section -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100 border-0">
                        <div class="card-body">
                            <h6 class="card-title text-center mb-3">
                                <i class="fas fa-chart-pie me-1"></i>Statistik
                            </h6>
                            
                            <!-- Gender Stats -->
                            <div class="mb-4">
                                <h6 class="text-muted mb-3">Jenis Kelamin</h6>
                                <div class="row text-center">
                                    <div class="col-6">
                                        <div class="h3 text-primary">${data.gender.laki}</div>
                                        <div class="text-muted">Laki-laki</div>
                                        <div class="progress mt-2">
                                            <div class="progress-bar bg-primary" 
                                                 style="width: ${(data.gender.laki / data.total * 100) || 0}%"></div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="h3 text-danger">${data.gender.perempuan}</div>
                                        <div class="text-muted">Perempuan</div>
                                        <div class="progress mt-2">
                                            <div class="progress-bar bg-danger" 
                                                 style="width: ${(data.gender.perempuan / data.total * 100) || 0}%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Summary Stats -->
                            <div class="row">
                                <div class="col-6 mb-3">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body text-center py-2">
                                            <div class="text-muted small">Kelas Terbanyak</div>
                                            <div class="h5 mb-0 text-primary">${data.summary.kelasTerbanyak}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body text-center py-2">
                                            <div class="text-muted small">Kelas Tersedikit</div>
                                            <div class="h5 mb-0 text-warning">${data.summary.kelasTersedikit}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body text-center py-2">
                                            <div class="text-muted small">Rata-rata per Kelas</div>
                                            <div class="h5 mb-0 text-success">${data.summary.rataPerKelas}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body text-center py-2">
                                            <div class="text-muted small">Update</div>
                                            <div class="small">
                                                <i class="fas fa-clock"></i> 
                                                ${new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detail Table -->
            <div class="card border-0 mt-3">
                <div class="card-body">
                    <h6 class="card-title mb-3">
                        <i class="fas fa-table me-1"></i>Detail per Kelas
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Kelas</th>
                                    <th>Total</th>
                                    <th>Laki-laki</th>
                                    <th>Perempuan</th>
                                    <th>Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.distribusi.map(item => `
                                    <tr>
                                        <td><strong>${item.kelas}</strong></td>
                                        <td>${item.jumlah}</td>
                                        <td><span class="badge bg-primary">${item.laki}</span></td>
                                        <td><span class="badge bg-danger">${item.perempuan}</span></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                                    <div class="progress-bar bg-info" style="width: ${item.persentase}%"></div>
                                                </div>
                                                <span class="small">${item.persentase}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // Render chart
    renderChart(data) {
        const canvas = document.getElementById('distribusiChart');
        if (!canvas) {
            console.error('Canvas chart tidak ditemukan');
            return;
        }
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const labels = data.distribusi.map(item => item.kelas);
        const chartData = data.distribusi.map(item => item.jumlah);
        const backgroundColors = labels.map((_, i) => this.chartColors[i % this.chartColors.length]);
        
        try {
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Jumlah Siswa',
                        data: chartData,
                        backgroundColor: backgroundColors,
                        borderColor: backgroundColors.map(c => this.darkenColor(c, 20)),
                        borderWidth: 2,
                        borderRadius: 5,
                        hoverBackgroundColor: backgroundColors.map(c => this.lightenColor(c, 20))
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.raw;
                                    const index = context.dataIndex;
                                    const kelasData = data.distribusi[index];
                                    const percentage = ((value / data.total) * 100).toFixed(1);
                                    return [
                                        `${context.label}: ${value} siswa`,
                                        `Laki-laki: ${kelasData.laki}`,
                                        `Perempuan: ${kelasData.perempuan}`,
                                        `${percentage}% dari total`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                }
                            },
                            title: {
                                display: true,
                                text: 'Jumlah Perserta Didik'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Kelas'
                            }
                        }
                    }
                }
            });
            
            console.log('Chart berhasil dirender');
        } catch (error) {
            console.error('Error rendering chart:', error);
            
            // Fallback untuk jika Chart.js error
            canvas.parentElement.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Chart tidak dapat ditampilkan.
                    <br><small>${error.message}</small>
                </div>
                <div class="text-center mt-3">
                    ${labels.map((label, i) => `
                        <div class="d-inline-block text-center mx-2">
                            <div class="badge" style="background-color:${this.chartColors[i % this.chartColors.length]}; padding: 10px; margin: 2px;">
                                ${label}<br>
                                <strong>${chartData[i]}</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // Helper untuk warna
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
                      (G > 255 ? 255 : G) * 0x100 +
                      (B > 255 ? 255 : B)).toString(16).slice(1);
    }

    getBadgeColor(kelas) {
        const kelasNum = kelas.replace('Kelas ', '');
        const colorMap = {
            '1': 'bg-primary',
            '2': 'bg-success',
            '3': 'bg-info',
            '4': 'bg-warning',
            '5': 'bg-danger',
            '6': 'bg-secondary'
        };
        return colorMap[kelasNum] || 'bg-dark';
    }

    // Load dan render data
    loadAndRender() {
        console.log('loadAndRender dipanggil');
        
        const container = document.getElementById('distribusi-siswa-container');
        if (!container) {
            console.warn('Container tidak ditemukan di loadAndRender');
            this.initializeContainer();
        }
        
        // Ambil data
        const siswaData = this.getSiswaDataFromStorage();
        
        // Analisis data
        const analyzedData = this.analyzeData(siswaData);
        
        // Render
        this.renderDistribusi(analyzedData);
        
        console.log('Data berhasil dirender:', analyzedData);
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen untuk perubahan data dari sistem siswa
        if (typeof siswaManager !== 'undefined') {
            // Hook ke fungsi save siswa
            const originalSave = siswaManager.saveSiswa;
            if (originalSave) {
                siswaManager.saveSiswa = function(...args) {
                    const result = originalSave.apply(this, args);
                    setTimeout(() => window.distribusiSiswa.refresh(), 1000);
                    return result;
                };
            }
            
            // Hook ke fungsi delete siswa
            const originalDelete = siswaManager.deleteSiswa;
            if (originalDelete) {
                siswaManager.deleteSiswa = function(...args) {
                    const result = originalDelete.apply(this, args);
                    setTimeout(() => window.distribusiSiswa.refresh(), 1000);
                    return result;
                };
            }
        }
        
        // Custom event untuk update distribusi
        document.addEventListener('updateDistribusiSiswa', () => {
            this.refresh();
        });
    }

    // Public methods
    refresh() {
        console.log('Refresh distribusi...');
        this.loadAndRender();
        this.showNotification('Distribusi diperbarui', 'success');
    }

    showError(message) {
        const container = document.getElementById('distribusi-siswa-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <br><small>
                        <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.distribusiSiswa.refresh()">
                            <i class="fas fa-redo me-1"></i>Coba Lagi
                        </button>
                    </small>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Cek apakah ada sistem notifikasi yang sudah ada
        if (typeof showAnimatedAlert === 'function') {
            showAnimatedAlert(message, type);
            return;
        }
        
        // Buat notifikasi sederhana
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 250px;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// ==============================================
// INISIALISASI DAN GLOBAL ACCESS
// ==============================================

// Pastikan Chart.js sudah dimuat
function initializeDistribusiSiswa() {
    console.log('Memulai inisialisasi sistem distribusi...');
    
    // Tunggu hingga DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startDistribusiSystem();
        });
    } else {
        startDistribusiSystem();
    }
    
    function startDistribusiSystem() {
        // Tunggu sedikit untuk memastikan semua elemen sudah dimuat
        setTimeout(() => {
            // Cek apakah Chart.js sudah dimuat
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js belum dimuat, loading...');
                
                // Load Chart.js secara dinamis
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.onload = () => {
                    console.log('Chart.js berhasil dimuat');
                    window.distribusiSiswa = new DistribusiSiswa();
                };
                script.onerror = () => {
                    console.error('Gagal memuat Chart.js, menggunakan fallback');
                    window.distribusiSiswa = new DistribusiSiswa();
                };
                document.head.appendChild(script);
            } else {
                console.log('Chart.js sudah dimuat');
                window.distribusiSiswa = new DistribusiSiswa();
            }
        }, 500);
    }
}

// Auto-initialize
initializeDistribusiSiswa();

// Global function untuk manual initialization
window.initDistribusiSiswa = function() {
    console.log('Manual initialization dipanggil');
    if (!window.distribusiSiswa || !window.distribusiSiswa.isInitialized) {
        window.distribusiSiswa = new DistribusiSiswa();
    } else {
        window.distribusiSiswa.refresh();
    }
};

// Export untuk debugging
window.DistribusiSiswa = DistribusiSiswa;

// CSS inline
const style = document.createElement('style');
style.textContent = `
    #distribusi-siswa-container {
        animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .card-header.bg-primary {
        background: linear-gradient(135deg, #800000 0%, #800000 100%);
    }
    
    .table-sm th {
        background-color: #f8f9fa;
        font-weight: 600;
    }
    
    .badge {
        transition: all 0.2s;
    }
    
    .badge:hover {
        transform: translateY(-2px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    }
    
    .progress {
        height: 8px;
    }
    
    @media (max-width: 768px) {
        #distribusi-siswa-container {
            margin: 0 -15px;
        }
        
        .card-body {
            padding: 1rem;
        }
        
        .table-responsive {
            font-size: 0.85rem;
        }
    }
`;

document.head.appendChild(style);