// kelas.js - Enhanced with CRUD functionality
class KelasManager {
  constructor() {
    this.currentKelas = this.getCurrentKelas();
    this.currentEditId = null;
    this.init();
  }

  getCurrentKelas() {
    const path = window.location.pathname;
    const match = path.match(/kelas(\d+)\.html/);
    return match ? `kelas${match[1]}` : "kelas1";
  }

  init() {
    this.renderSiswa();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("siswaForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSiswa();
    });
  }

  renderSiswa() {
    const siswaData = dataStorage.getSiswa(this.currentKelas);
    const container = document.getElementById("siswa-container");

    container.innerHTML = siswaData
      .map(
        (siswa) => `
            <div class="col-md-3 mb-3">
                <div class="card siswa text-center">
                    <img src="${
                      siswa.foto
                    }" class="card-img-top mx-auto mt-3" alt="Foto ${
          siswa.nama
        }" style="width: 150px; height: 150px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${siswa.nama}</h5>
                        <p class="card-text">NIS: ${siswa.nis}</p>
                        <p class="card-text"><small class="text-muted">Siswa ${this.currentKelas.replace(
                          "kelas",
                          "Kelas "
                        )}</small></p>
                        <div class="btn-group">
                            <button type="button" class="btn btn-outline-warning btn-sm" onclick="kelasManager.editSiswa(${
                              siswa.id
                            })">
                                Edit
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="kelasManager.deleteSiswa(${
                              siswa.id
                            })">
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
    document.getElementById("siswaModalLabel").textContent =
      "Tambah Siswa Baru";
    document.getElementById("siswaForm").reset();
    new bootstrap.Modal(document.getElementById("siswaModal")).show();
  }

  editSiswa(id) {
    const siswaData = dataStorage.getSiswa(this.currentKelas);
    const siswa = siswaData.find((s) => s.id === id);

    if (siswa) {
      this.currentEditId = id;
      document.getElementById("siswaModalLabel").textContent =
        "Edit Data Siswa";

      document.getElementById("siswa-nis").value = siswa.nis;
      document.getElementById("siswa-nama").value = siswa.nama;
      document.getElementById("siswa-foto").value = siswa.foto;

      new bootstrap.Modal(document.getElementById("siswaModal")).show();
    }
  }

  saveSiswa() {
    const formData = {
      nis: document.getElementById("siswa-nis").value,
      nama: document.getElementById("siswa-nama").value,
      foto: document.getElementById("siswa-foto").value,
    };

    let siswaData = dataStorage.getSiswa(this.currentKelas);

    if (this.currentEditId) {
      // Update existing
      const index = siswaData.findIndex((s) => s.id === this.currentEditId);
      if (index !== -1) {
        siswaData[index] = { ...siswaData[index], ...formData };
      }
    } else {
      // Add new
      const newId = Math.max(...siswaData.map((s) => s.id), 0) + 1;
      siswaData.push({ id: newId, ...formData });
    }

    dataStorage.saveSiswa(this.currentKelas, siswaData);
    this.renderSiswa();

    bootstrap.Modal.getInstance(document.getElementById("siswaModal")).hide();
    this.showAlert("Data siswa berhasil disimpan!", "success");
  }

  deleteSiswa(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) {
      let siswaData = dataStorage.getSiswa(this.currentKelas);
      siswaData = siswaData.filter((s) => s.id !== id);
      dataStorage.saveSiswa(this.currentKelas, siswaData);
      this.renderSiswa();
      this.showAlert("Data siswa berhasil dihapus!", "success");
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

const kelasManager = new KelasManager();
