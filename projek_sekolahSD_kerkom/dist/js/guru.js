// guru.js - Enhanced with CRUD functionality
class GuruManager {
  constructor() {
    this.currentEditId = null;
    this.init();
  }

  init() {
    this.renderGuru();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Form submission
    document.getElementById("guruForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveGuru();
    });

    // Search functionality
    document.getElementById("searchGuru").addEventListener("input", (e) => {
      this.searchGuru(e.target.value);
    });
  }

  renderGuru() {
    const guruData = dataStorage.getGuru();
    const container = document.getElementById("guru-container");

    container.innerHTML = guruData
      .map(
        (guru) => `
            <div class="col-md-4 mb-4">
                <div class="card siswa text-center">
                    <img src="${guru.foto}" class="card-img-top mx-auto mt-3" alt="Foto ${guru.nama}" style="width: 150px; height: 150px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${guru.nama}</h5>
                        <p class="card-text">NIP: ${guru.nip}</p>
                        <p class="card-text"><small class="text-muted">${guru.jabatan}</small></p>
                        <div class="btn-group">
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="guruManager.showDetail(${guru.id})">
                                Detail
                            </button>
                            <button type="button" class="btn btn-outline-warning btn-sm" onclick="guruManager.editGuru(${guru.id})">
                                Edit
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="guruManager.deleteGuru(${guru.id})">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  openAddModal() {
    this.currentEditId = null;
    document.getElementById("guruModalLabel").textContent = "Tambah Guru Baru";
    document.getElementById("guruForm").reset();
    new bootstrap.Modal(document.getElementById("guruModal")).show();
  }

  editGuru(id) {
    const guruData = dataStorage.getGuru();
    const guru = guruData.find((g) => g.id === id);

    if (guru) {
      this.currentEditId = id;
      document.getElementById("guruModalLabel").textContent = "Edit Data Guru";

      // Fill form with existing data
      document.getElementById("guru-nip").value = guru.nip;
      document.getElementById("guru-nama").value = guru.nama;
      document.getElementById("guru-jabatan").value = guru.jabatan;
      document.getElementById("guru-mapel").value = guru.mataPelajaran;
      document.getElementById("guru-pendidikan").value = guru.pendidikan;
      document.getElementById("guru-email").value = guru.email;
      document.getElementById("guru-telepon").value = guru.telepon;
      document.getElementById("guru-foto").value = guru.foto;
      document.getElementById("guru-riwayat").value = guru.riwayat;

      new bootstrap.Modal(document.getElementById("guruModal")).show();
    }
  }

  saveGuru() {
    const formData = {
      nip: document.getElementById("guru-nip").value,
      nama: document.getElementById("guru-nama").value,
      jabatan: document.getElementById("guru-jabatan").value,
      mataPelajaran: document.getElementById("guru-mapel").value,
      pendidikan: document.getElementById("guru-pendidikan").value,
      email: document.getElementById("guru-email").value,
      telepon: document.getElementById("guru-telepon").value,
      foto: document.getElementById("guru-foto").value,
      riwayat: document.getElementById("guru-riwayat").value,
    };

    let guruData = dataStorage.getGuru();

    if (this.currentEditId) {
      // Update existing
      const index = guruData.findIndex((g) => g.id === this.currentEditId);
      if (index !== -1) {
        guruData[index] = { ...guruData[index], ...formData };
      }
    } else {
      // Add new
      const newId = Math.max(...guruData.map((g) => g.id), 0) + 1;
      guruData.push({ id: newId, ...formData });
    }

    dataStorage.saveGuru(guruData);
    this.renderGuru();

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById("guruModal")).hide();

    // Show success message
    this.showAlert("Data guru berhasil disimpan!", "success");
  }

  deleteGuru(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data guru ini?")) {
      let guruData = dataStorage.getGuru();
      guruData = guruData.filter((g) => g.id !== id);
      dataStorage.saveGuru(guruData);
      this.renderGuru();
      this.showAlert("Data guru berhasil dihapus!", "success");
    }
  }

  searchGuru(keyword) {
    const guruData = dataStorage.getGuru();
    const filtered = guruData.filter(
      (guru) =>
        guru.nama.toLowerCase().includes(keyword.toLowerCase()) ||
        guru.nip.includes(keyword) ||
        guru.jabatan.toLowerCase().includes(keyword.toLowerCase())
    );

    const container = document.getElementById("guru-container");
    container.innerHTML = filtered
      .map(
        (guru) => `
            <div class="col-md-4 mb-4">
                <div class="card siswa text-center">
                    <img src="${guru.foto}" class="card-img-top mx-auto mt-3" alt="Foto ${guru.nama}" style="width: 150px; height: 150px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${guru.nama}</h5>
                        <p class="card-text">NIP: ${guru.nip}</p>
                        <p class="card-text"><small class="text-muted">${guru.jabatan}</small></p>
                        <div class="btn-group">
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="guruManager.showDetail(${guru.id})">
                                Detail
                            </button>
                            <button type="button" class="btn btn-outline-warning btn-sm" onclick="guruManager.editGuru(${guru.id})">
                                Edit
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="guruManager.deleteGuru(${guru.id})">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  showDetail(id) {
    const guruData = dataStorage.getGuru();
    const guru = guruData.find((g) => g.id === id);

    if (guru) {
      // Fill detail modal
      document.getElementById("detail-guru-nama").textContent = guru.nama;
      document.getElementById("detail-guru-nip").textContent = guru.nip;
      document.getElementById("detail-guru-jabatan").textContent = guru.jabatan;
      document.getElementById("detail-guru-mapel").textContent =
        guru.mataPelajaran;
      document.getElementById("detail-guru-pendidikan").textContent =
        guru.pendidikan;
      document.getElementById("detail-guru-email").textContent = guru.email;
      document.getElementById("detail-guru-telepon").textContent = guru.telepon;
      document.getElementById("detail-guru-riwayat").innerHTML =
        guru.riwayat.replace(/\n/g, "<br>");
      document.getElementById("detail-guru-foto").src = guru.foto;

      new bootstrap.Modal(document.getElementById("detailGuruModal")).show();
    }
  }

  showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document
      .querySelector(".container.mt-4")
      .insertBefore(
        alertDiv,
        document.querySelector(".d-flex.justify-content-between")
      );

    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  }
}

const guruManager = new GuruManager();
